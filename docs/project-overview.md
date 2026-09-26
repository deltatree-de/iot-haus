# iot-haus – Projektüberblick

**Stand:** 2026-09-26 · **Erzeugt durch:** BMAD `document-project` (Exhaustive Scan, Initial Scan) · **Sprache:** Deutsch

## Zweck

`iot-haus` ist eine Smart-Home-Demo-Anwendung: Ein stilisiertes, zweistöckiges Haus (SVG) mit vier Räumen, deren Licht per Klick
ein- und ausgeschaltet werden kann. Der Schaltzustand wird über MQTT (Mosquitto) an alle geöffneten Browser verteilt
("Multi-Device-Synchronisation"). Die Anwendung läuft als **ein einziger Container** (Next.js-Server + WebSocket→MQTT-Proxy +
Mosquitto, orchestriert von supervisord) und wird per GitHub Actions als Multi-Arch-Image nach
`ghcr.io/deltatree-de/iot-haus` veröffentlicht.

## Kurzfakten

| Merkmal | Wert |
|---|---|
| Repository-Typ | Monolith (ein Teil, `part_id: main`) |
| Projekttyp (BMAD-Klassifikation) | `web` (Next.js-Fullstack mit Custom Server) |
| Primärsprache | TypeScript (Frontend), JavaScript/CommonJS (`server.js`, Testskripte) |
| Framework | Next.js 15.5.25 (App Router), React 19.1.9 |
| Styling | Tailwind CSS 4.1 (via `@tailwindcss/postcss`), eigene CSS-Animationen in `src/app/globals.css` |
| Echtzeit | WebSocket (`ws` 8.21) → MQTT (`mqtt` 5.15) → Mosquitto (Alpine-Paket) |
| Persistenz | keine serverseitige; Zustand je Browser in `localStorage` (`smart-home-state`) |
| Datenbank | keine |
| Tests | keine automatisierten Tests; 4 manuelle Node-Skripte (`test-*.js`) gegen laufenden Container |
| CI/CD | GitHub Actions: `docker-publish.yml` (PR-Build amd64, Push-Build amd64+arm64 nach GHCR), `release.yml` (GitHub Release bei `v*`-Tag) |
| Laufzeit | Node 22 Alpine, `USER 1000:1000`, ohne npm/npx/wget/apk im Runtime-Image |
| Einstiegspunkt | `server.js` (HTTP + WS-Proxy), UI: `src/app/page.tsx` |
| Umfang Quellcode | ca. 1.825 Zeilen in `src/` + 224 Zeilen `server.js` |

## Funktionsumfang (Ist)

- Hausvisualisierung als SVG (`HouseVisualization`, `RoomComponent`): Landschaft, Dach, Kamin mit Rauchanimation, 4 Räume
  (EG: Wohnzimmer, Küche; OG: Schlafzimmer, Badezimmer). Klick auf einen Raum schaltet dessen Licht.
- Bedienfeld (`ControlPanel`): Liste der Räume mit Toggle-Schaltern und Verbindungsstatus.
- Fußbereich "System-Information": Anzahl Stockwerke/Zimmer (hart codiert), Broker-URL, Verbindungsstatus.
- Synchronisation: Jeder Schaltvorgang wird als JSON auf `smarthome/<roomId>/light` publiziert; alle Clients abonnieren die vier Topics.
- Health-Endpoint `GET /api/health` (liefert immer `healthy`).

## Nicht vorhanden (Ist)

- Keine anderen Geräte als je ein Licht pro Raum; kein Energie-/Verbrauchsmodell.
- Kein autoritativer Serverzustand, keine retained MQTT-Nachrichten, keine Historie.
- Keine Authentifizierung/Autorisierung, keine Tests, kein Lint/Typecheck in CI.

## Architektur in einem Satz

Browser (React-Client) ⇄ WebSocket `/mqtt` ⇄ `server.js` (Proxy, ein gemeinsamer MQTT-Client) ⇄ Mosquitto `127.0.0.1:1883`,
alles in einem Container; Details siehe [architecture.md](./architecture.md).

## Weiterführend

- [Architektur](./architecture.md) · [Quellbaum](./source-tree-analysis.md) · [Komponenten](./component-inventory.md)
- [API-Verträge](./api-contracts.md) · [Datenmodelle](./data-models.md)
- [Entwicklung](./development-guide.md) · [Deployment](./deployment-guide.md) · [Mitwirken](./contribution-guide.md)
- Analysebefunde (priorisiert): `_bmad-output/planning-artifacts/01-analyse-befunde.md`
