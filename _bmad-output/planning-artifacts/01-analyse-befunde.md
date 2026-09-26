# 01 – Analysebefunde und Chancen (Deep-Dive-Scan)

**Autorin:** Mary (BMAD Business Analyst) · **Datum:** 2026-09-26 · **Grundlage:** vollständiges Lesen aller Quelldateien
(`src/`, `server.js`, `docker/`, `.github/`, Compose, Dockerfile, `test-*.js`, Bestandsdoku), `npx eslint .`, `npx tsc --noEmit`.
Begleitende Projektdokumentation: `docs/index.md`.

**Priorität:** P0 = blockiert "beste UX"/Produktionsreife unmittelbar, P1 = hoch, P2 = mittel, P3 = Aufräumen.
**Evidenz:** *belegt* = direkt im Code/Tool-Output nachweisbar; *abgeleitet* = aus Code-Ablauf gefolgert, im Browser zu bestätigen.

> Entscheidungen der Analystin (Stakeholder nicht verfügbar): Die Befundliste ist bewusst lösungsneutral, enthält aber
> je Befund eine Empfehlung. Alles hier Genannte gilt als Input für PRD/Architektur **dieses** Releases; nichts wird vertagt.

---

## 1. Top-Befunde auf einen Blick

| # | Prio | Kategorie | Befund | Ort |
|---|---|---|---|---|
| B-01 | P0 | Bug | Mock-Hook läuft immer mit und meldet nach 1 s "Verbunden", auch wenn der WebSocket tot ist | `src/hooks/useMqtt.ts:17-21`, `src/hooks/useMockMqtt.ts:15-24` |
| B-02 | P0 | Bug | Auto-Reconnect bricht nach dem ersten Fehlversuch endgültig ab | `src/hooks/useWebSocketMqtt.ts:112-125` |
| B-03 | P0 | Bug/Architektur | Kein autoritativer Zustand: kein Server-State, keine retained Messages; Initial-Sync ist fehlerhaft | `src/app/page.tsx:119-148`, `server.js:150` |
| S-01 | P0 | Security | WS-Proxy ohne Auth, Origin-Check, Topic-Whitelist, Größenlimit | `server.js:22-25`, `:89-166` |
| O-01 | P0 | Betrieb | Healthcheck nutzt `curl` (nicht im Image) mit ungültiger CMD-Syntax → Container dauerhaft `unhealthy` | `docker-compose.prod.yml:21`, `docker-compose.yml:24` |
| C-01 | P0 | CI | Kein Lint/Typecheck/Test/Smoke-Test vor dem Push von `:latest` (= Prod) | `.github/workflows/docker-publish.yml:66-112` |
| U-01 | P1 | UX/Bug | SVG-Raumklick schaltet auch offline; große Teile der Raumfläche sind nicht klickbar | `src/components/RoomComponent.tsx:49-64`, `:107-226` |
| U-02 | P1 | A11y | Keine Tastaturbedienung/ARIA im SVG, Toggles ohne `aria-pressed`, Zoom gesperrt | `RoomComponent.tsx:49`, `ControlPanel.tsx:103-122`, `layout.tsx:20,45` |

---

## 2. Bugs (funktional)

### B-01 · P0 · Verbindungsstatus wird vom Mock verfälscht (*belegt*)
- `useMqtt` ruft `useMockMqtt(...)` **unbedingt** auf (`src/hooks/useMqtt.ts:17-21`), obwohl `shouldUseMock = false` (`:15`).
- Der Mock-Effekt (`useMockMqtt.ts:49-55`) ruft `onConnectionChange('connecting')` und nach 1 s `onConnectionChange('connected')`
  (`:15-24`) — gleicher Setter `setConnectionStatus` wie der echte Hook (`page.tsx:116`).
- Folge: Ist der Server/Broker nicht erreichbar, zeigt die UI nach 1 s "Verbunden", Toggles werden aktiv (`ControlPanel.tsx:108`),
  Publishes gehen still verloren (`useWebSocketMqtt.ts:165-167` nur `console.warn`).
- Empfehlung: Mock entfernen (toter Code) oder nur bedingt instanziieren; Status ausschließlich aus dem echten Transport.

### B-02 · P0 · Reconnect nur einmal (*abgeleitet, hohe Sicherheit*)
- `onclose` plant nur dann einen Reconnect, wenn `reconnectTimeoutRef.current` leer ist (`useWebSocketMqtt.ts:119`).
  Der Timer-Callback (`:120-123`) setzt die Ref **nicht** zurück; zurückgesetzt wird sie nur in `onopen` (`:50-53`).
- Scheitert der erste Versuch (z. B. Container-Neustart beim Deploy > 2 s), bleibt die Ref gesetzt → keine weiteren Versuche.
  Nutzer müssen die Seite neu laden. Gerade bei "Push auf main = Prod" trifft das jeden offenen Client bei jedem Release.
- Zusätzlich: `disconnect()` beim Unmount (`:170-184`) schließt den Socket, `onclose` plant danach erneut einen Reconnect
  (Ref wurde vorher geleert) → Geisterverbindungen, im Dev-Modus (React StrictMode, Doppel-Mount) doppelte Verbindungen.
- Empfehlung: Reconnect mit Exponential Backoff + Jitter, Flag "manuell getrennt", Ref im Callback leeren; Heartbeat (siehe B-06).

### B-03 · P0 · Kein autoritativer Zustand, Initial-Sync defekt (*belegt/abgeleitet*)
- Zustand liegt nur im Browser (`page.tsx:39-60`, `localStorage['smart-home-state']`). Server publiziert ohne `retain`
  (`server.js:150`), Mosquitto hält daher nichts vor. Ein neu verbundener Client kennt den aktuellen Hauszustand nicht.
- Absicht des Codes (`page.tsx:122-148`): Beim Verbinden publiziert **jeder** Client seinen lokalen Stand → überschreibt den
  Stand aller anderen (Stakeholder-Hinweis in `00-auftrag.md`).
- Tatsächliches Verhalten laut Ablauf: `setHasInitialSync(true)` (`:125`) löst sofort ein Re-Render aus; da `allRooms` jedes Render
  neu erzeugt wird (`:63`) und `hasInitialSync` in den Deps steht (`:148`), läuft das Cleanup `clearTimeout` (`:141`) **bevor** die
  100 ms um sind → der Initial-Sync publiziert nie. Ergebnis: Clients zeigen dauerhaft ihren veralteten localStorage-Stand, bis
  jemand schaltet. Beides (überschreibende Absicht und faktisch fehlender Abgleich) ist falsch.
- Empfehlung: Server (oder Broker per retained Messages) wird Single Source of Truth; Client sendet nur **Befehle**
  (`.../set`), Server/Gerät publiziert **Zustand** (`.../state`, retained); beim Connect liefert der Server einen Snapshot.
  localStorage höchstens als Offline-Cache, nie als Quelle für Publishes.

### B-04 · P1 · Hydration-Mismatch (*abgeleitet*)
- `page.tsx` ist Client Component, wird aber serverseitig vorgerendert. Der `useState`-Initializer liest `localStorage` nur im
  Browser (`:39-51`) → Server-HTML (alles aus) ≠ erster Client-Render (gespeicherter Stand) → React-Hydration-Warnung/Flackern.
- `getMqttBrokerUrl()` im Render (`:265`) liefert serverseitig `localhost:3000/mqtt`, clientseitig den echten Host → zweiter Mismatch.
- Empfehlung: Zustand nach Mount laden bzw. Server-Snapshot als Initialdaten; Broker-URL nur clientseitig nach Mount anzeigen.

### B-05 · P1 · Abos gehen verloren, wenn der Broker beim Verbinden nicht bereit ist (*belegt*)
- `server.js:91-102`: Topic wird im Client-Set vermerkt, bei `!mqttReady` aber nie beim Broker abonniert und später auch
  nicht nachgeholt. Der Client loggt nur den Fehler (`useWebSocketMqtt.ts:96-98`) und zeigt "Verbunden".
- Relevanz: supervisord startet Broker und Node parallel (`docker/supervisord.conf:10-28`) → nach jedem Container-Start möglich.
- Empfehlung: Proxy abonniert benötigte Topics selbst beim Broker-Connect; oder ausstehende Abos bei `connect` nachholen.

### B-06 · P2 · Keine Erkennung toter Verbindungen (*belegt*)
- Weder Server noch Client nutzen WS-Ping/Pong oder Heartbeats (`server.js` gesamt, `useWebSocketMqtt.ts`). Mobile Geräte nach
  Standby zeigen weiter "Verbunden".
- Empfehlung: Server-Ping alle 30 s + `terminate()` bei fehlendem Pong; Client-Resync bei `visibilitychange`.

### B-07 · P2 · Health-Endpoint ohne Aussagekraft (*belegt*)
- `src/app/api/health/route.ts:3-9` antwortet immer `healthy`, prüft nicht den Broker; `version` aus `npm_package_version`
  ist bei `node server.js` nie gesetzt → immer `1.0.0` (package.json: `0.1.0`, `package.json:3`).
- Empfehlung: Broker-Status aus `server.js` einbeziehen (`503` wenn MQTT getrennt), Version zur Build-Zeit einbetten.

### B-08 · P2 · Ungeprüfte Payloads und localStorage (*belegt*)
- `JSON.parse` ohne Validierung für localStorage (`page.tsx:44`) und MQTT-Payloads (`useWebSocketMqtt.ts:63`); ein Fremd-Publish
  mit falscher Struktur kann den UI-State korrumpieren. Kein Schema-Version-Feld für localStorage → Modellwechsel (Geräte!)
  bricht bestehende Browser-Stände.
- Empfehlung: Laufzeitvalidierung (z. B. zod) + versionierter Storage-Key.

### B-09 · P3 · Doppelte SVG-IDs (*belegt*)
- `<filter id="roomShadow">` in `HouseVisualization.tsx:49` **und** je Raum in `RoomComponent.tsx:87`, `lightGlow` 4× (`:90`) →
  ungültiges DOM, browserabhängige Darstellung. Empfehlung: Defs einmalig zentral, IDs mit `useId()`.

---

## 3. UX-Schwächen

| # | Prio | Befund | Ort | Empfehlung |
|---|---|---|---|---|
| U-01 | P1 | SVG-Raumklick ist nicht an den Verbindungsstatus gekoppelt (schaltet offline lokal, Publish verpufft) — inkonsistent zum Bedienfeld | `RoomComponent.tsx:56-59` vs. `ControlPanel.tsx:108` | einheitliche Schaltlogik mit Offline-Queue oder klar gesperrtem Zustand + Hinweis |
| U-01b | P1 | Transparente Hitbox liegt **unter** Fenster, Lampe, Strahlen, Label (`:107-226`, ohne `pointer-events-none`) → Klicks auf diese Flächen wirkungslos | `RoomComponent.tsx:49-64` | Hitbox zuletzt rendern oder alle Deko-Elemente `pointer-events: none` |
| U-02 | P1 | Barrierefreiheit: SVG-Räume ohne `role="button"`, `tabIndex`, `aria-label`, Tastatur-Handler; Toggle-Buttons ohne `aria-pressed`/`aria-label` (nur Emoji); `user-scalable=no, maximum-scale=1` sperrt Zoom (WCAG 1.4.4) | `RoomComponent.tsx:49`, `ControlPanel.tsx:103-130`, `layout.tsx:20,45` | Switch-Semantik (`role="switch"`, `aria-checked`), Fokus-Ringe, Zoom erlauben |
| U-03 | P1 | Kein Feedback bei Fehlern: Publish-Fehler/`error`-Frames nur in der Konsole | `useWebSocketMqtt.ts:96-98`, `:165-167` | Toasts, Offline-Banner, "Wird geschaltet…"-Zwischenzustand mit Rollback |
| U-04 | P2 | Informationsarchitektur überladen/doppelt: H1 "Smart Home" + H2 "Smart Home Control" + Untertitel + Footer-Kacheln mit hart codierten Zahlen ("2 Stockwerke", "4 Zimmer") und technischem Broker-Host | `page.tsx:201-213`, `:241-298`, `HouseVisualization.tsx:12-17` | Fokus auf Nutzwert (Verbrauch, aktive Geräte), Technikinfos in "Details" |
| U-05 | P2 | Unruhiges Layout: `hover:scale-105` auf ganzen Panels, `min-h-screen` in der Grid-Spalte, 3 animierte Blobs, `animate-ping` je aktivem Licht | `page.tsx:194-196`, `:220`, `:230`, `HouseVisualization.tsx:11`, `ControlPanel.tsx:81` | ruhige Karten, Motion nur für Zustandswechsel |
| U-06 | P2 | Legende "Licht an" grün, Visualisierung amber; Status-Punkt grün | `HouseVisualization.tsx:480`, `ControlPanel.tsx:137` | konsistente Farbsemantik (an = warm/amber) |
| U-07 | P2 | Sprachmix: "1F/2F", "Control System", "Smart Home Control Panel" in deutscher UI; Etagen besser "EG/OG" | `ControlPanel.tsx:56,92`, `HouseVisualization.tsx:217,228`, `page.tsx:208` | durchgängig Deutsch |
| U-08 | P2 | Dark Mode: CSS-Variablen vorhanden (`globals.css:15-20,181-186`), UI nutzt aber feste helle Verläufe → im Dark Mode Mischdarstellung | `globals.css`, alle Komponenten | echtes Theme oder bewusst nur Light |
| U-09 | P2 | Keine Sammelaktionen ("Alles aus", "Etage aus"), keine Anzeige "x von y an" | – | Schnellaktionen + Zusammenfassung |
| U-10 | P3 | `apple-touch-icon.png` referenziert, existiert nicht (nur `.svg`) → 404; kein Web-App-Manifest | `layout.tsx:51`, `public/` | PNG-Icon + `manifest.webmanifest` |
| U-11 | P3 | Raumnamen per festem Kürzel-Mapping (`RoomComponent.tsx:22-30`), 7-px-Schrift im SVG (`:232`) schwer lesbar | – | Größere Labels, datengetrieben |

---

## 4. Security

| # | Prio | Befund | Ort | Empfehlung |
|---|---|---|---|---|
| S-01 | P0 | WS-Proxy: keine Authentifizierung, keine Origin-Prüfung (Cross-Site-WebSocket-Hijacking), beliebige Topics inkl. `#` abonnier-/publizierbar | `server.js:22-25`, `:89-166` | Topic-Whitelist (`smarthome/…`), Payload-Schema, `verifyClient` mit Origin-Check; Entscheidung zu Auth (mind. optionales Shared Secret/Basic-Auth via Env) |
| S-02 | P1 | `ws` ohne `maxPayload` (Default 100 MiB), kein Rate-Limit, keine Obergrenze für Verbindungen → DoS | `server.js:22` | `maxPayload: 4 KiB`, Rate-Limit je Verbindung, Verbindungslimit |
| S-03 | P1 | Keine Security-Header (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`) | `next.config.ts:3-5` | `headers()` in next.config |
| S-04 | P2 | Broker anonym (`allow_anonymous true`) — akzeptabel, da nur `127.0.0.1` (`mosquitto.conf:16,22`); dokumentieren | `docker/mosquitto.conf` | so belassen, aber begründet dokumentieren |
| S-05 | P2 | Supply Chain in CI: Actions per Tag statt SHA, `moby/buildkit:master` (ungepinnter Nightly) baut das Prod-Image | `docker-publish.yml:35,80` | SHA-Pins, stabiles Buildkit, Dependabot |
| S-06 | P3 | Server loggt jede Nachricht inkl. Payload (`server.js:59,72,90,138`) | – | Log-Level per Env |
| — | Info | Härtung PR #1/#2 ist intakt: Node 22, `USER 1000:1000`, npm/npx/wget/apk entfernt (`Dockerfile:10-66`). **Nicht zurückdrehen.** | `Dockerfile` | — |

---

## 5. Betrieb / Deployment

| # | Prio | Befund | Ort | Empfehlung |
|---|---|---|---|---|
| O-01 | P0 | Healthcheck `["CMD","curl","-f","http://127.0.0.1:3000/api/health \|\| exit 1"]`: curl fehlt im gehärteten Image, `\|\| exit 1` wird in CMD-Form nicht von einer Shell interpretiert → dauerhaft `unhealthy` | `docker-compose.prod.yml:21`, `docker-compose.yml:24` | `node -e "fetch(...)"`-Healthcheck, zusätzlich `HEALTHCHECK` im Dockerfile |
| O-02 | P2 | Volume `mosquitto-logs:/var/log/mosquitto` ungenutzt (Broker loggt nach stdout) | Compose-Dateien `:17`/`:20` | entfernen |
| O-03 | P2 | `NEXT_PUBLIC_MQTT_BROKER_URL` zur Laufzeit gesetzt (`supervisord.conf:28`, Compose, Dockerfile `:59`), wirkt aber nur zur Build-Zeit | – | entfernen oder Laufzeit-Config-Endpunkt |
| O-04 | P2 | Mosquitto `autosave_interval 1800`, `autosave_on_changes false` (`mosquitto.conf:34-35`) — bei retained State gingen bis zu 30 min verloren | – | bei Einführung retained/Server-State: `autosave_on_changes true` oder Server-Persistenz auf Volume |
| O-05 | P3 | `.dockerignore` schließt `_bmad/`, `_bmad-output/`, `docs/`-Nicht-MD, `test-*.js` nicht aus → unnötige Cache-Invalidierung im Builder | `.dockerignore` | ergänzen |

---

## 6. CI/CD-Lücken

| # | Prio | Befund | Ort | Empfehlung |
|---|---|---|---|---|
| C-01 | P0 | Push auf `main` baut und pusht `:latest` (= Produktion) ohne vorgelagerte Qualitätsstufe (Lint, Typecheck, Unit-/Komponententests, Build) | `docker-publish.yml:66-112` | Job `quality` (npm ci, lint, tsc, test, build) als `needs:` für den Push-Job |
| C-02 | P0 | Kein Container-Smoke-Test (Start, `/api/health`, WS-Publish/Subscribe-Roundtrip) vor dem Push | – | Image amd64 laden, starten, Node-Smoke-Skript, erst dann Multi-Arch-Push |
| C-03 | P1 | Kein E2E-Test der Kernflüsse (Schalten, Multi-Client-Sync, Energieanzeige) | – | Playwright gegen den Container in CI |
| C-04 | P1 | Release-Workflow: Release-Tags `v*` entstehen nur manuell; Auftrag verlangt automatische Releases | `release.yml:3-6` | automatische Versionierung (z. B. Tag bei Push auf main nach grünem Build) |
| C-05 | P2 | `release.yml` kombiniert Eigen-Changelog **und** `generate_release_notes: true` (doppelt); `softprops/action-gh-release@v1` veraltet | `release.yml:40-45` | eine Quelle, aktuelle Action-Version |
| C-06 | P2 | PR-Job hat `packages: write` ohne Push; keine `concurrency`-Gruppe; kein Trivy/Grype-Scan | `docker-publish.yml:23-25` | Least Privilege, `concurrency`, Image-Scan |
| C-07 | P2 | `npm run lint` schlägt fehl (9 Fehler: `require()` in `server.js:1-5` und `test-*.js`) — Lint in CI würde sofort rot | ESLint-Output | Lint-Konfiguration für CJS-Dateien bzw. Skripte migrieren |

---

## 7. Technische Schulden

| # | Prio | Befund | Ort |
|---|---|---|---|
| T-01 | P1 | Domänenmodell hart auf "ein Licht pro Raum": `Room.lightOn`, Topic `…/light`, feste SVG-Koordinaten nur für `left/right` × Etage 1/2 | `src/types/index.ts:2-8`, `RoomComponent.tsx:16-17`, `page.tsx:10-35` |
| T-02 | P1 | Stammdaten mehrfach gepflegt (Räume, `MQTT_TOPICS`, Footer-Zahlen, Kurznamen, Test-Skripte) | `page.tsx:10-35,253,259`, `RoomComponent.tsx:22-30`, `test-*.js` |
| T-03 | P2 | Toter/auskommentierter Code: `useMockMqtt`, `shouldUseMock`, auskommentierte Duplikatfilter, `sentMessagesRef`, `clientId` ungenutzt, `MqttMessage`-Typ ungenutzt, `getStatusIcon` ungenutzt, `public/window.svg` | `useMqtt.ts:15`, `useWebSocketMqtt.ts:19,66-78,141-157`, `types/index.ts:26-30`, `ControlPanel.tsx:23` |
| T-04 | P2 | ~40 `console.log`-Aufrufe in Client und Server (Emoji-Debuglogs) | `page.tsx`, `useWebSocketMqtt.ts`, `ControlPanel.tsx:105`, `RoomComponent.tsx:57`, `server.js` |
| T-05 | P2 | `page.tsx` (303 Z.) mischt Zustand, Transport, Sync und Layout; `HouseVisualization.tsx` 497 Z. statisches SVG | – |
| T-06 | P2 | Veraltete Next-15-Metadaten: `viewport`/`themeColor` in `metadata` statt `export const viewport`; zusätzlich manuelle `<meta>`-Duplikate | `layout.tsx:20-21,44-51` |
| T-07 | P3 | `@types/mqtt` (veralteter Stub) und `@types/ws` in `dependencies` statt `devDependencies`; `@types/node ^20` bei Node 22 | `package.json:19-20,30` |
| T-08 | P3 | `String.prototype.substr` (deprecated) | `useWebSocketMqtt.ts:12` |
| T-09 | P3 | Keine Tests, kein Test-Runner, manuelle `test-*.js` ohne Assertions im Root | Root |

---

## 8. Doku-Drift

| # | Prio | Befund | Ort |
|---|---|---|---|
| D-01 | P1 | README beschreibt Features, die nicht zuverlässig funktionieren ("automatische Synchronisation", "Multi-User") | `README.md:13`, `.github/copilot-instructions.md:21` |
| D-02 | P2 | README-Strukturbaum: `mosquitto.conf` im Root (liegt in `docker/`) | `README.md:50` |
| D-03 | P2 | README empfiehlt Vercel/Netlify — Custom Server mit WebSocket und eingebettetem Broker dort nicht lauffähig; doppelter Abschnittsblock nach der Roadmap | `README.md:373`, `:500-543` |
| D-04 | P2 | Verweis auf nicht existierende `LICENSE` | `README.md:480` |
| D-05 | P2 | `DOCKER-SETUP.md` nutzt `wget` im Container (entfernt) | `DOCKER-SETUP.md:177` |
| D-06 | P2 | `BUILD-OPTIMIZATION.md` zeigt `node:18-alpine` | `BUILD-OPTIMIZATION.md:70,75` |
| D-07 | P3 | `KUBERNETES.md` wendet `k8s/` an, das nicht existiert | `KUBERNETES.md:149` |
| D-08 | P3 | README-Roadmap listet "Analytics: Energie-Verbrauchsanalyse" als offen — wird durch diesen Auftrag Kernfeature | `README.md:488-497` |

Neue, am Code verifizierte Doku liegt in `docs/` (index.md als Einstieg). Empfehlung: Root-Dokumente mit dem Release
konsolidieren (README kurz + Verweis auf `docs/`), veraltete Dateien aktualisieren oder entfernen.

---

## 9. Chancen – Energieverbrauch und Multi-Geräte-Haus

### 9.1 Produktvision (aus dem Auftrag)
"Beste User Experience": Man sieht jederzeit, **was das Haus gerade verbraucht**, und beim Einschalten eines Geräts sofort,
**wie stark** sich der Verbrauch ändert. Neben Lichtern gibt es realistische Haushaltsgeräte (Mikrowelle, Fernseher u. v. m.).

### 9.2 Typische Geräte eines deutschen Haushalts mit realistischen Leistungswerten

Werte = typische Leistungsaufnahme aus dem Netz (nicht Nennleistung der Funktion, z. B. Mikrowellen-"800 W" ≈ 1.200 W Aufnahme).
Standby = Bereitschaft/Uhr/Netzwerk-Standby. Quellen: übliche Herstellerangaben, EU-Ökodesign-Grenzwerte (Standby ≤ 0,5 W bzw.
≤ 1 W mit Anzeige, vernetzt ≤ 2 W), Verbraucherzentrale/co2online-Richtwerte. Für eine Simulation sind das plausible Defaults.

| Gerät | Typischer Raum | Aktiv (W) | Standby (W) | Verhalten / Besonderheit |
|---|---|---|---|---|
| LED-Deckenleuchte | jeder Raum | 8–15 (Default 10) | 0 (Smart-Lampe 0,3) | Dauerlast solange an |
| Stehlampe LED | Wohnzimmer | 6–10 | 0 | |
| Fernseher 55" LED | Wohnzimmer | 80–120 (Default 100) | 0,3–0,5 | klassischer Standby-Kandidat |
| Soundbar | Wohnzimmer | 20–40 | 0,5 | |
| Spielkonsole (z. B. PS5) | Wohnzimmer | 150–220 (Default 200) | 0,5 (Ruhemodus 1–3) | |
| WLAN-Router | Flur/Wohnzimmer | 8–15 (Default 10) | — | läuft 24/7 → Grundlast |
| Kühlschrank (A–C) | Küche | 70–150 Kompressor (Default 100) | — | zyklisch: ~30–40 % Laufzeit → Ø 25–40 W; 100–250 kWh/a |
| Gefrierschrank | Keller/Küche | 80–150 | — | zyklisch |
| Mikrowelle | Küche | 1.000–1.500 (Default 1.200) | 1–3 (Uhr) | kurze Laufzeiten |
| Wasserkocher | Küche | 2.000–3.000 (Default 2.200) | 0 | 2–4 min, schaltet selbst ab |
| Kaffeevollautomat | Küche | 1.200–1.500 Aufheizen | 1–5 (Warmhalten 30–50) | |
| Toaster | Küche | 800–1.000 | 0 | |
| Backofen | Küche | 2.000–3.500 (Default 3.000) | 1–2 (Uhr) | Aufheizen Volllast, danach taktend Ø ~1.000 |
| Kochfeld/Herd (Induktion, 4 Zonen) | Küche | je Zone 1.400–2.300, gesamt bis 7.400 | 0,5–1 | Drehstrom; Zonen einzeln schaltbar denkbar |
| Dunstabzugshaube | Küche | 100–250 | 0,5 | |
| Geschirrspüler | Küche | 1.800–2.400 Heizen, 100–200 Spülen | 0,5 | Programmphasen |
| Waschmaschine | Bad/Keller | 2.000–2.300 Heizen, 200–500 Waschen/Schleudern | 0,5–1 | Programmphasen |
| Wäschetrockner Wärmepumpe | Bad/Keller | 600–1.000 | 0,5 | |
| Wäschetrockner Kondens | Bad/Keller | 2.000–2.800 | 0,5 | |
| Föhn | Bad | 1.600–2.200 (Default 2.000) | 0 | |
| Elektrischer Heizlüfter | Bad/Schlafzimmer | 2.000 | 0 | hohe Last, Kostenfalle |
| Durchlauferhitzer (elektr.) | Bad | 18.000–24.000 | 0 | nur in Haushalten ohne zentrales Warmwasser; eindrucksvolle Spitzenlast |
| Desktop-PC | Arbeitszimmer | 80–300 (Gaming bis 500) | 1–2 | |
| Laptop + Monitor | Arbeitszimmer | 30–65 + 20–30 | 0,3–0,5 | |
| Staubsauger | mobil | 700–900 (EU-Grenze 900) | 0 | |
| Bügeleisen/Dampfstation | mobil | 2.000–2.400 | 0 | |
| Handy-Ladegerät | Schlafzimmer | 5–20 | 0,1 | |
| Wecker/Radio | Schlafzimmer | 2–5 | 1 | |

Kontextwerte für Anzeigen und Plausibilität:
- Grundlast eines typischen Haushalts (Router, Kühlgeräte, Standby): **ca. 50–150 W**.
- Jahresverbrauch: 1 Person ~1.500 kWh, 3 Personen ~3.000–3.500 kWh, 4 Personen ~3.500–4.000 kWh (ohne Wärmepumpe/E-Auto).
- Strompreis Haushalt Deutschland: **ca. 0,35–0,40 €/kWh**; Empfehlung: Default 0,37 €/kWh, in der UI einstellbar.
- Ein Schuko-Stromkreis mit 16-A-Sicherung trägt ~3.680 W (230 V × 16 A): Wasserkocher (2.200 W) + Föhn (2.000 W) im selben
  Kreis würden auslösen — attraktiver, realistischer "Aha"-Effekt.

### 9.3 Chancen für die "beste UX" (priorisiert, alle im selben Release lieferbar)

1. **Live-Leistungsanzeige als Hero-Element** (Chance hoch): große Kennzahl "Haus verbraucht gerade 1.482 W" mit animiertem
   Zähler; beim Schalten Delta-Feedback ("+1.200 W Mikrowelle") als Toast/Floating-Label am Gerät.
2. **Kosten in Euro statt nur Watt**: "≈ 0,55 €/h", "heute bisher 3,4 kWh ≈ 1,26 €" — Übersetzung in Alltagssprache.
3. **Aufschlüsselung** nach Raum und Gerät (Balken/Donut), Top-Verbraucher hervorgehoben; Raumfarbe im Haus nach Last (Heatmap).
4. **Standby-Radar**: Summe aller Standby-Verbräuche + Jahreskosten ("Standby kostet Sie ~38 €/Jahr"), "Alles in Standby aus".
5. **Verlauf**: Leistungskurve der letzten Minuten/Stunde (Sparkline), serverseitig als Ringpuffer; kWh-Integration serverseitig.
6. **Geräte mit Verhalten**: Kühlschrank taktet, Wasserkocher schaltet nach ~3 min selbst ab, Waschmaschine mit Programmphasen —
   macht die Simulation glaubwürdig und die Anzeige lebendig.
7. **Warnungen**: Lastspitze/Stromkreis-Überlast (> 3.680 W je Kreis bzw. konfigurierbare Hausgrenze), "Heizlüfter läuft seit 2 h".
8. **Schnellaktionen/Szenen**: "Alles aus (außer Kühlgeräte/Router)", "Etage aus", "Abwesend".
9. **Multi-Client-Konsistenz** als Fundament (B-03): Server hält Gerätestatus + Energie-Berechnung autoritativ und verteilt
   Snapshots → alle Geräte zeigen denselben Verbrauch.

### 9.4 Empfehlungen an PM/Architektur (Entscheidungen der Analystin, begründet)

- **Datenmodell:** generisches `Device { id, roomId, type, name, state: 'on'|'off'|'standby', powerActiveW, powerStandbyW,
  behavior? }`; Räume datengetrieben mit eigener Geometrie statt `left/right`. *Begründung:* T-01, Erweiterbarkeit.
- **Topics:** `smarthome/<roomId>/<deviceId>/set` (Befehl, Client→Server) und `…/state` (retained, Server→alle),
  `smarthome/energy/summary` (retained, periodisch). *Begründung:* B-03, klare Command/State-Trennung.
- **Energie serverseitig berechnen** (in `server.js`/Server-Modul), nicht je Browser — sonst divergieren Summen und kWh.
- **Geräteanzahl:** ca. 20–25 Geräte in 6–8 Räumen sind für ein Einfamilienhaus-Modell glaubwürdig und in einem Release
  vollständig lieferbar; Durchlauferhitzer optional als konfigurierbares Gerät (nicht jeder Haushalt hat ihn).
- **Hausmodell erweitern:** EG (Wohnzimmer, Küche, Flur/Eingang), OG (Schlafzimmer, Bad, Arbeits-/Kinderzimmer), optional
  Keller/Hauswirtschaftsraum (Waschmaschine, Trockner, Gefrierschrank).
- **Qualität als Teil des Scopes:** B-01, B-02, B-03, S-01, S-02, O-01, C-01, C-02 sind Voraussetzung für "100 % autonom bis
  Prod" und gehören in dasselbe Release.
- **Härtung bleibt:** keine neuen Laufzeit-Tools im Image; Healthcheck/Smoke-Tests nur mit `node`.
