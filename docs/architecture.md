# iot-haus – Architektur (Ist-Zustand)

**Stand:** 2026-09-26 · Monolith, ein Teil (`main`) · Muster: Next.js-Fullstack mit Custom Server + eingebettetem Pub/Sub-Broker

## 1. Zusammenfassung

Die Anwendung besteht aus drei Prozessen in **einem** Container:

1. **Mosquitto** (MQTT-Broker, nur `127.0.0.1:1883`, anonym).
2. **Node-Server `server.js`**: bedient Next.js (SSR/Assets/API) und öffnet auf demselben Port einen WebSocket-Endpunkt
   `/mqtt`, der ein eigenes JSON-Protokoll in MQTT-Operationen übersetzt (ein gemeinsamer MQTT-Client für alle Browser).
3. **supervisord** als PID 1-Nachfolger, der beide Prozesse startet/neu startet.

Der Browser hält den kompletten Hauszustand selbst (React-State + `localStorage`). MQTT dient ausschließlich als
Broadcast-Kanal für Schaltereignisse; es gibt keinen autoritativen Zustand auf Server- oder Broker-Seite.

```
Browser A ─┐                      ┌──────────────── Container (Node 22 Alpine, UID 1000) ───────────────┐
Browser B ─┼── HTTP  :3000 ──────►│ server.js ── Next.js Request Handler (SSR, /_next, /api/health)     │
Browser C ─┘── WS    :3000/mqtt ─►│ server.js ── WebSocket.Server(path:/mqtt)                           │
                                  │                 │  JSON {type: subscribe|unsubscribe|publish}       │
                                  │                 ▼                                                    │
                                  │            mqtt.js-Client (1 Instanz, clean session)                 │
                                  │                 │ TCP 127.0.0.1:1883                                 │
                                  │            Mosquitto (persistence an, keine retained Messages genutzt)│
                                  │ supervisord: startet mosquitto (prio 100), node server.js (prio 200)│
                                  └──────────────────────────────────────────────────────────────────────┘
```

## 2. Technologie-Stack

| Kategorie | Technologie | Version (Lockfile) | Begründung / Rolle |
|---|---|---|---|
| Runtime | Node.js | 22 (Alpine) | gehärtetes Basis-Image (PR #1/#2) |
| Web-Framework | Next.js (App Router) | 15.5.25 | SSR + Client-Komponenten, API-Route |
| UI | React / React DOM | 19.1.9 | Hooks-basierter Zustand |
| Sprache | TypeScript | 5.9.2 | `strict: true`, Alias `@/*` |
| Styling | Tailwind CSS | 4.1.12 | Utility-Klassen, `@theme inline` |
| Echtzeit (Server) | ws | 8.21.3 | WebSocket-Server am HTTP-Server |
| MQTT-Client | mqtt (mqtt.js) | 5.15.2 | Verbindung Proxy → Broker |
| Broker | Mosquitto | Alpine-Paket (unversioniert) | Pub/Sub intern |
| Prozess-Manager | supervisord | Alpine-Paket | 2 Programme in einem Container |
| Lint | ESLint 9 + eslint-config-next | 9.34.0 / 15.5.25 | nicht in CI eingebunden |
| CI/CD | GitHub Actions, Buildx, GHCR | – | Multi-Arch amd64/arm64 |

## 3. Architekturmuster

- **Frontend:** Single Page mit einer zentralen Container-Komponente (`page.tsx`) und drei reinen Präsentationskomponenten
  (Props-down / Callbacks-up). Kein globaler Store, kein Context.
- **Echtzeit:** Publish/Subscribe über MQTT, im Browser jedoch nicht über MQTT-over-WebSocket, sondern über ein
  eigenes JSON-Protokoll, das `server.js` übersetzt (siehe [api-contracts.md](./api-contracts.md)).
- **Zustandsmodell:** "Client-owned state, event broadcast": Jeder Client ist Eigentümer seiner Kopie; Ereignisse werden
  per Broadcast verteilt; beim Verbinden ist (laut Absicht des Codes) ein Voll-Publish des lokalen Zustands vorgesehen.

## 4. Datenfluss

### 4.1 Licht schalten
1. Klick auf Raum (SVG-Hitbox in `RoomComponent`) oder Toggle (`ControlPanel`) → `handleLightToggle(roomId)` (`page.tsx:151`).
2. Optimistisches Update des React-States → `useEffect` schreibt `localStorage['smart-home-state']` (`page.tsx:56-60`).
3. `publishMessage('smarthome/<roomId>/light', {roomId,isOn,timestamp,clientId})` → WS-Frame `{type:'publish',topic,payload}`.
4. `server.js` publiziert auf MQTT (QoS 0, nicht retained) und antwortet `{type:'published'}`.
5. Mosquitto verteilt an den Proxy-Client (ein Abo je Topic) → `server.js` sendet `{type:'message',topic,payload,timestamp}`
   an alle WS-Clients mit passendem Abo — **auch an den Absender**.
6. Jeder Client parst `payload` als `LightState` und setzt `lightOn` des Raums (`page.tsx:66-89`).

### 4.2 Verbindungsaufbau
1. `useWebSocketMqtt` öffnet `ws(s)://<host>/mqtt` (URL-Ermittlung in `page.tsx:92-109`).
2. `onopen` → Status `connected`, `subscribe` für die 4 Topics.
3. `page.tsx:122-148` will nach 100 ms den lokalen Zustand aller Räume publizieren ("Initial-Sync"). Durch das
   Effekt-Cleanup beim unmittelbar folgenden Re-Render wird der Timer jedoch gelöscht (siehe Befund B-03 in
   `_bmad-output/planning-artifacts/01-analyse-befunde.md`) — faktisch findet kein Abgleich statt.
4. Bei `onclose`: Status `disconnected`, einmaliger Reconnect nach 2 s (weitere Versuche bleiben aus, Befund B-02).

### 4.3 Parallel laufender Mock
`useMqtt` ruft `useMockMqtt` unbedingt auf; dessen Effekt meldet nach 1 s `connected` an denselben Status-Setter — unabhängig
vom realen WebSocket (Befund B-01).

## 5. Datenarchitektur

Keine Datenbank. Datenmodelle und Persistenzorte: siehe [data-models.md](./data-models.md). Kurz: `House → Floor[] → Room[]`
mit `lightOn:boolean`; Persistenz nur in `localStorage` des jeweiligen Browsers; Mosquitto-Persistenz ist aktiv, speichert
aber mangels retained Messages/persistenter Sessions faktisch nichts Relevantes.

## 6. API-Design

- HTTP: `GET /api/health` (statisch `healthy`, ohne Broker-Prüfung).
- WebSocket `/mqtt`: JSON-Protokoll mit `subscribe|unsubscribe|publish` (Client→Server) und
  `connected|subscribed|unsubscribed|published|message|error` (Server→Client). Details: [api-contracts.md](./api-contracts.md).
- MQTT-Topics: `smarthome/<roomId>/light`.

## 7. Komponentenübersicht

Siehe [component-inventory.md](./component-inventory.md). Hierarchie:
`RootLayout → Home(page) → { HouseVisualization → RoomComponent×4, ControlPanel }` + Hooks `useMqtt → {useMockMqtt, useWebSocketMqtt}`.

## 8. Sicherheit

- Container gehärtet (Node 22, UID 1000, keine Paketmanager/Download-Tools, Code root-owned) — **darf nicht zurückgedreht werden**.
- Broker nur auf Loopback, aber der WS-Proxy ist **ohne Authentifizierung, ohne Origin-Prüfung, ohne Topic-Whitelist**
  (Wildcard-Abos `#` und Publish auf beliebige Topics möglich), `ws` mit Default-`maxPayload` (100 MiB), kein Rate-Limit.
- Keine Security-Header (`next.config.ts` leer), `user-scalable=no` im Viewport.

## 9. Deployment-Architektur

Push auf `main` → `docker-publish.yml` baut `linux/amd64,linux/arm64` und pusht `ghcr.io/deltatree-de/iot-haus:latest` (+ `main`,
Semver-Tags bei `v*`). Produktion zieht `:latest` per `docker-compose.prod.yml`. Kein automatisierter Rollout, kein Smoke-Test.
Details: [deployment-guide.md](./deployment-guide.md).

## 10. Teststrategie (Ist)

Keine Unit-/Komponenten-/E2E-Tests, kein Test-Script in `package.json`. Vier manuelle Skripte (`test-*.js`) benötigen einen
laufenden Server auf `localhost:3000`. `npx eslint .` meldet 9 Fehler/7 Warnungen (u. a. `require` in `server.js`); `tsc --noEmit` ist grün.

## 11. Architektur-Schwachstellen (Kurzliste)

1. Kein autoritativer Zustand (weder Server noch retained Topics) → Clients driften auseinander.
2. Verbindungsstatus wird vom Mock verfälscht; Reconnect bricht nach einem Fehlversuch ab.
3. Protokoll ist ein Eigenbau-Proxy ohne Schutz; Topics/Payloads unvalidiert.
4. Domänenmodell hart auf "ein Licht pro Raum" zugeschnitten (`Room.lightOn`, Topic `.../light`, SVG-Koordinaten fest).
5. Betriebsartefakte (Healthcheck, Doku) passen nicht zum gehärteten Image.
