# iot-haus – Entwicklungsleitfaden

**Stand:** 2026-09-26

## Voraussetzungen

- Node.js 22 (wie im Container; `@types/node` ist noch `^20`)
- npm (Lockfile `package-lock.json` → `npm ci`)
- Ein MQTT-Broker auf `localhost:1883` für `npm run dev` (z. B. `brew install mosquitto && brew services start mosquitto`)
  **oder** Docker, um alles im Container zu betreiben.

## Einrichtung

```bash
npm ci
```

## Lokal starten

```bash
# Variante A: Dev-Server (Next.js im Dev-Modus + WS-Proxy), benötigt lokalen Mosquitto
npm run dev                 # = node server.js, NODE_ENV nicht gesetzt → dev
# → http://localhost:3000, WebSocket ws://localhost:3000/mqtt

# Variante B: kompletter Container (Broker inklusive)
npm run compose:up          # docker-compose up -d --build
npm run compose:logs
```

## Umgebungsvariablen

| Variable | Default | Wirkung |
|---|---|---|
| `PORT` | 3000 | HTTP/WS-Port (`server.js:9`) |
| `HOSTNAME` | `0.0.0.0` | Bind-Adresse |
| `MQTT_BROKER_HOST` / `MQTT_BROKER_PORT` | `localhost` / `1883` | Broker für den Proxy |
| `NEXT_PUBLIC_MQTT_BROKER_URL` | nicht gesetzt / `auto` | wird **zur Build-Zeit** eingebettet; nur Werte ohne `localhost` und ≠ `auto` überschreiben die automatische URL (`page.tsx:100-103`). Die Laufzeit-Angabe in `supervisord.conf:28` ist wirkungslos. |

## Build und Prüfungen

```bash
npm run build               # next build (lintet nur src/, bricht nicht bei Fehlern in server.js/test-*.js ab)
npm run lint                # eslint – aktuell 9 Fehler (require() in server.js und test-*.js), 7 Warnungen
npx tsc --noEmit            # aktuell fehlerfrei
```

## Tests

Es gibt **kein** `npm test`. Manuelle Integrationsskripte (Server muss laufen):

```bash
node test-container-mqtt.js
node test-container-mqtt-detailed.js
node test-container-publish.js
MQTT_URL=ws://localhost:3000/mqtt node test-multi-device.js
```

Sie prüfen per Log-Ausgabe, nicht per Assertion/Exit-Code; für CI ungeeignet.

## Debugging-Hinweise

- Browser-Konsole ist mit Emoji-Logs geflutet (`page.tsx`, `useWebSocketMqtt.ts`, `ControlPanel.tsx`, `RoomComponent.tsx`), der
  Server loggt jede Nachricht (`server.js:59`, `:72`, `:138`).
- Zustand zurücksetzen: `localStorage.removeItem('smart-home-state')` in der Browser-Konsole.
- Verbindungsanzeige ist nicht verlässlich (Mock meldet nach 1 s "Verbunden"), echten Zustand im Netzwerk-Tab (WS) prüfen.

## Konventionen (beobachtet)

- TypeScript strict, Funktionskomponenten, Pfadalias `@/`.
- UI-Texte deutsch, Code/Kommentare überwiegend englisch; Commit-Messages zuletzt deutsch mit Conventional-Commit-Präfix.
- Tailwind-Utilities direkt im JSX, keine CSS-Module.
