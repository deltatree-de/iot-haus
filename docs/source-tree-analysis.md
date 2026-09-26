# iot-haus – Quellbaum-Analyse (annotiert)

**Stand:** 2026-09-26 · Monolith, ein Teil (`main`). Nicht versioniert/ignoriert: `node_modules/`, `.next/`, `_bmad/`, `_bmad-output/`, `.claude/`.

```
iot-haus/
├── server.js                    # ★ EINSTIEGSPUNKT: Custom HTTP-Server (Next.js-Handler) + WebSocket-Server auf /mqtt
│                                #   + gemeinsamer MQTT-Client zum Broker (Proxy-Logik, topicMatch-Helfer)
├── package.json                 # Scripts (dev/start = node server.js, build = next build, lint, docker:*, compose:*)
├── package-lock.json            # Lockfile (npm ci in Dockerfile)
├── next.config.ts               # Leer (keine Header, kein output: standalone)
├── tsconfig.json                # strict, Pfadalias @/* → src/*
├── eslint.config.mjs            # next/core-web-vitals + next/typescript (FlatCompat)
├── postcss.config.mjs           # Tailwind 4 PostCSS-Plugin
├── Dockerfile                   # 4 Stages (deps, prod-deps, builder, runtime); Runtime gehärtet, USER 1000:1000
├── .dockerignore                # schließt .git, .github, *.md, .claude/, Secrets aus (nicht: _bmad*, test-*.js)
├── docker-compose.yml           # lokaler Build; Healthcheck mit curl (im Image nicht vorhanden)
├── docker-compose.prod.yml      # GHCR-Image :latest; gleicher defekter Healthcheck
├── docker/
│   ├── mosquitto.conf           # Listener 127.0.0.1:1883, anonymous, Persistenz an, Logs nach stdout
│   ├── supervisord.conf         # startet mosquitto (prio 100) und node server.js (prio 200), Logs nach stdout
│   └── start.sh                 # exec supervisord
├── .github/
│   ├── workflows/
│   │   ├── docker-publish.yml   # PR: Build amd64 ohne Push; Push main/master/v*: Build amd64+arm64, Push nach GHCR
│   │   └── release.yml          # v*-Tag: Changelog + GitHub Release (softprops/action-gh-release@v1)
│   └── copilot-instructions.md  # KI-Kontext für Copilot (teilweise veraltet)
├── .vscode/tasks.json           # Task "Development Server" (npm run dev)
├── public/
│   ├── apple-touch-icon.svg     # Icon (layout.tsx referenziert jedoch /apple-touch-icon.png → 404)
│   └── window.svg               # Create-Next-App-Überbleibsel, ungenutzt
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Root-Layout, Metadaten, Geist-Fonts, doppelte <meta>-Tags im <head>
│   │   ├── page.tsx             # ★ UI-EINSTIEG ('use client'): Hauszustand, localStorage, MQTT-Hook, Initial-Sync, Layout
│   │   ├── globals.css          # Tailwind-Import, Theme-Variablen, Blob-Animation, Mobile-/A11y-Media-Queries
│   │   ├── favicon.ico
│   │   └── api/health/route.ts  # GET /api/health → {status:'healthy', ...} (statisch)
│   ├── components/
│   │   ├── HouseVisualization.tsx  # SVG-Szene (Himmel, Garten, Dach, Kamin, Fenster, Tür) + rendert RoomComponent
│   │   ├── RoomComponent.tsx       # SVG-Gruppe je Raum: Hitbox, Fenster, Lampe mit Strahlen, Label
│   │   └── ControlPanel.tsx        # Liste der Räume mit Toggle-Buttons + Verbindungsstatus
│   ├── hooks/
│   │   ├── useMqtt.ts           # Fassade: instanziiert IMMER Mock- UND WebSocket-Hook (shouldUseMock=false)
│   │   ├── useWebSocketMqtt.ts  # ★ WS-Client-Protokoll: connect/subscribe/publish/reconnect
│   │   └── useMockMqtt.ts       # Mock (toter Code, läuft aber mit und meldet nach 1 s "connected")
│   └── types/index.ts           # Room, Floor, House, LightState, MqttMessage
├── test-multi-device.js         # Manuelles Skript: simuliert mehrere Geräte gegen ws://localhost:3000/mqtt
├── test-container-mqtt.js       # Manuelles Skript: Subscribe + Publish gegen Container
├── test-container-mqtt-detailed.js  # dto., ausführlicher
├── test-container-publish.js    # dto., nur Publish
└── *.md (README, API, DOCKER-SETUP, GITHUB-ACTIONS, KUBERNETES, BUILD-OPTIMIZATION, MOBILE-OPTIMIZATION)
                                 # Bestandsdoku im Root, teilweise veraltet (siehe index.md)
```

## Kritische Ordner

| Ordner/Datei | Zweck | Integrationspunkte |
|---|---|---|
| `server.js` | Laufzeit-Einstieg, WS↔MQTT-Brücke | Mosquitto (TCP 1883), Browser (WS `/mqtt`), Next.js-Handler |
| `src/app/` | Seiten, Layout, API-Route | `page.tsx` nutzt `hooks/` und `components/` |
| `src/hooks/` | Verbindungs- und Protokolllogik im Browser | spricht WS-Protokoll aus [api-contracts.md](./api-contracts.md) |
| `src/components/` | Präsentation (reine Props-Komponenten) | Callbacks `onLightToggle(roomId)` |
| `src/types/` | gemeinsame Typen | Payload-Format `LightState` |
| `docker/` | Container-Prozesse und Broker | supervisord startet Broker + Node |
| `.github/workflows/` | Build/Publish/Release | GHCR, GitHub Releases |

## Einstiegspunkte

1. **Laufzeit:** `node server.js` (supervisord `program:nextjs-server`, bzw. `npm run dev`/`npm start`).
2. **UI:** `src/app/page.tsx` (Client-Komponente, wird dennoch serverseitig vorgerendert).
3. **HTTP-API:** `src/app/api/health/route.ts`.
4. **Container:** `/start.sh` → `supervisord`.
