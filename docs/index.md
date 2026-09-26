# iot-haus – Dokumentationsindex

**Typ:** Monolith (1 Teil: `main`, Projekttyp `web`)
**Primärsprache:** TypeScript (UI), JavaScript (Server)
**Architektur:** Next.js-Fullstack mit Custom Node-Server, WebSocket→MQTT-Proxy und eingebettetem Mosquitto in einem Container
**Zuletzt aktualisiert:** 2026-09-26 (BMAD `document-project`, Exhaustive Scan)

## Projektüberblick

Smart-Home-Demo: SVG-Haus mit 2 Etagen × 2 Räumen, je ein schaltbares Licht, Echtzeit-Synchronisation zwischen Browsern über
MQTT. Auslieferung als gehärtetes Multi-Arch-Image `ghcr.io/deltatree-de/iot-haus:latest` via GitHub Actions.

## Schnellreferenz

- **Tech-Stack:** Next.js 15.5.25, React 19.1.9, TypeScript 5.9, Tailwind 4.1, ws 8.21, mqtt.js 5.15, Mosquitto, supervisord, Node 22 Alpine
- **Einstiegspunkt:** `server.js` (HTTP + WS `/mqtt`); UI `src/app/page.tsx`
- **Architekturmuster:** Client-owned State + Event-Broadcast über Pub/Sub; Container-Komponente + Präsentationskomponenten
- **Datenbank:** keine (Browser-`localStorage`)
- **Deployment:** Docker/Compose, GHCR, GitHub Actions (Push auf `main` = Produktion)

## Generierte Dokumentation

- [Projektüberblick](./project-overview.md) – Zweck, Kurzfakten, Funktionsumfang
- [Architektur](./architecture.md) – Prozesse, Datenfluss, Stack, Schwachstellen
- [Quellbaum-Analyse](./source-tree-analysis.md) – annotierte Verzeichnisstruktur, Einstiegspunkte
- [Komponenteninventar](./component-inventory.md) – Seiten, Komponenten, Hooks, Styles
- [API-Verträge](./api-contracts.md) – `/api/health`, WebSocket-Protokoll, MQTT-Topics
- [Datenmodelle](./data-models.md) – Typen, Stammdaten, Persistenzorte
- [Entwicklungsleitfaden](./development-guide.md) – Setup, Scripts, Env-Variablen, manuelle Tests
- [Deployment-Leitfaden](./deployment-guide.md) – Image, Compose, CI/CD, bekannte Betriebsdefekte
- [Beitragsleitfaden](./contribution-guide.md) – Branch-/Commit-Konventionen, Regeln
- [Scan-Status (maschinenlesbar)](./project-scan-report.json)

Ergänzend (Planungsartefakt): [Priorisierte Analysebefunde + Chancen](../_bmad-output/planning-artifacts/01-analyse-befunde.md)

## Vorhandene Bestandsdokumentation (Repository-Root)

| Datei | Inhalt | Aktualität |
|---|---|---|
| [README.md](../README.md) | Features, Schnellstart, Architektur, Topics, Roadmap | teilweise veraltet: Strukturbaum (`mosquitto.conf` im Root), Verweis auf fehlende `LICENSE`, Vercel/Netlify-Deployment (ohne Custom Server/WS nicht möglich), doppelte Abschnitte am Dateiende |
| [API.md](../API.md) | WebSocket-/MQTT-Protokoll | inhaltlich weitgehend passend |
| [DOCKER-SETUP.md](../DOCKER-SETUP.md) | Docker-Betrieb | veraltet: `wget` im Container (entfernt) |
| [GITHUB-ACTIONS.md](../GITHUB-ACTIONS.md) | CI/CD-Beschreibung | grob passend |
| [KUBERNETES.md](../KUBERNETES.md) | K8s-Manifeste als Beispiel | referenziert nicht vorhandenes `k8s/` |
| [BUILD-OPTIMIZATION.md](../BUILD-OPTIMIZATION.md) | Build-Optimierung | veraltet: `node:18-alpine` |
| [MOBILE-OPTIMIZATION.md](../MOBILE-OPTIMIZATION.md) | Mobile-UX-Maßnahmen | Stand Sept. 2025 |
| [.github/copilot-instructions.md](../.github/copilot-instructions.md) | KI-Kontext | teilweise veraltet (Mock "für Tests", Multi-User-Sync) |

## Erste Schritte

### Voraussetzungen
Node.js 22, npm, lokaler Mosquitto auf `localhost:1883` (für `npm run dev`) oder Docker.

### Einrichtung
```bash
npm ci
```

### Lokal ausführen
```bash
npm run dev            # Dev-Server + WS-Proxy (lokaler Broker nötig)
npm run compose:up     # alternativ: alles im Container
```

### Tests ausführen
```bash
# kein npm test vorhanden; manuelle Skripte gegen laufenden Server:
node test-container-mqtt.js
node test-multi-device.js
npm run lint && npx tsc --noEmit
```

## Für KI-gestützte Entwicklung

- **Nur UI:** `architecture.md`, `component-inventory.md`
- **Protokoll/Backend (`server.js`, Hooks):** `architecture.md`, `api-contracts.md`, `data-models.md`
- **Fullstack (z. B. Geräte + Energie):** alle Architektur-Dokumente + Befundliste
- **Deployment/CI:** `deployment-guide.md`

---

_Erzeugt mit dem BMAD-Method-Workflow `document-project`_
