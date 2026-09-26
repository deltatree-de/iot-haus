# iot-haus – API-Verträge

**Stand:** 2026-09-26 · Quelle: `server.js`, `src/hooks/useWebSocketMqtt.ts`, `src/app/api/health/route.ts`, `src/types/index.ts`

## 1. HTTP

### `GET /api/health`
- Datei: `src/app/api/health/route.ts:3-10`
- Antwort `200 application/json`:
```json
{ "status": "healthy", "timestamp": "2026-09-26T10:00:00.000Z", "service": "iot-haus", "version": "1.0.0" }
```
- Hinweise: prüft weder Broker- noch Proxy-Zustand. `version` stammt aus `npm_package_version`, das beim Start via
  `node server.js` (supervisord) nicht gesetzt ist → immer Fallback `"1.0.0"` (package.json: `0.1.0`).

Alle übrigen HTTP-Pfade bedient Next.js (Seite `/`, Assets `/_next/*`, `public/*`).

## 2. WebSocket `/mqtt` (Eigenprotokoll)

- Endpunkt: `ws(s)://<host>:<port>/mqtt`, gleicher Port wie HTTP (`server.js:22-25`).
- Keine Authentifizierung, keine Origin-Prüfung, keine Subprotokolle. Alle Frames sind JSON-Text.

### 2.1 Client → Server

| `type` | Felder | Verhalten (`server.js`) |
|---|---|---|
| `subscribe` | `topic: string` (Wildcards `+`/`#` erlaubt) | Topic wird im Client-Set vermerkt; wenn Broker bereit: `mqttClient.subscribe(topic)` → `subscribed`; sonst `error` (Abo bleibt vermerkt, wird aber nie beim Broker nachgeholt) (`:89-120`) |
| `unsubscribe` | `topic` | entfernt aus Client-Set; Broker-Unsubscribe nur, wenn kein anderer Client das Topic hält → `unsubscribed` (`:122-135`) |
| `publish` | `topic`, `payload: string` | wenn Broker bereit: `mqttClient.publish(topic, payload)` (QoS 0, retain=false) → `published`; sonst `error` (`:137-166`) |
| sonst | – | `error` "Unknown message type" |

Beispiel:
```json
{"type":"publish","topic":"smarthome/room_1_left/light","payload":"{\"roomId\":\"room_1_left\",\"isOn\":true,\"timestamp\":1790000000000,\"clientId\":\"client_ab12cd34e_1790000000000\"}"}
```

### 2.2 Server → Client

| `type` | Felder | Auslöser |
|---|---|---|
| `connected` | `message` | direkt nach WS-Verbindungsaufbau (`:197-200`) |
| `subscribed` | `topic` | erfolgreiches Broker-Abo |
| `unsubscribed` | `topic` | nach `unsubscribe` |
| `published` | `topic` | erfolgreicher Publish |
| `message` | `topic`, `payload: string`, `timestamp: number` | jede MQTT-Nachricht, deren Topic auf ein Abo des Clients passt — auch eigene (`:58-77`) |
| `error` | `message`, `error?`, `receivedType?` | Broker nicht bereit, Subscribe/Publish-Fehler, ungültiges JSON, unbekannter Typ |

Topic-Matching: `topicMatch()` (`server.js:211-224`) unterstützt `+` und `#`.

## 3. MQTT-Topics und Payload

| Topic | Richtung | Payload (`LightState`, JSON-String) | QoS / Retain |
|---|---|---|---|
| `smarthome/room_1_left/light` (Wohnzimmer, EG) | pub+sub | `{roomId, isOn, timestamp, clientId?}` | 0 / nein |
| `smarthome/room_1_right/light` (Küche, EG) | pub+sub | dto. | 0 / nein |
| `smarthome/room_2_left/light` (Schlafzimmer, OG) | pub+sub | dto. | 0 / nein |
| `smarthome/room_2_right/light` (Badezimmer, OG) | pub+sub | dto. | 0 / nein |

- `timestamp`: ms seit Epoch (Client-Uhr), wird beim Empfang **nicht** ausgewertet (keine Last-Write-Wins-Logik).
- `clientId`: wird gesendet, aber nirgends ausgewertet.
- Ein Client, der sich neu verbindet, erhält **keinen** aktuellen Zustand (keine retained Messages).

## 4. Bekannte Vertragsschwächen

- Keine Schema-Validierung von `topic`/`payload`, keine Größenbegrenzung (ws-Default `maxPayload` 100 MiB).
- Publish/Subscribe auf beliebige Topics inkl. `#` möglich (Informationsabfluss, Fremdsteuerung).
- Fehlerantworten tragen keine Korrelation zur Anfrage (keine Request-ID).
- Bestandsdoku `API.md` (Root) beschreibt dasselbe Protokoll, ist aber nicht mit dem Code synchronisiert gepflegt.
