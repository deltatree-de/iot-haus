# IoT-Haus 2.1 – Dokumentationsindex

**Stand:** 2.1.0 (2026-09-27)
**Typ:** Monolith, ein Container (Next.js-Seite + Node-Server + Mosquitto)
**Sprache:** TypeScript (Browser, Server und gemeinsame Domäne)

## Überblick

Simuliertes Zuhause mit 29 Geräten in 6 Räumen und einem Carport. Der Hausverbrauch wird live in Watt und Euro angezeigt, dazu
kommen Szenen, Grundlastschutz und Auto-Aus. Seit 2.1: Elektroauto mit Wallbox (Laden, Wegfahren, Zurückkommen), Solaranlage mit
Sonnenwahl und Netzbilanz (Netzbezug, Einspeisung, Ertrag). Der Server ist die einzige Quelle der Wahrheit und speichert den Zustand retained im eingebetteten
Mosquitto. Auslieferung als gehärtetes Multi-Arch-Image `ghcr.io/deltatree-de/iot-haus` über einen GitHub-Actions-Workflow.

## Schnellreferenz

- **Stack:** Next.js 15.5.25, React 19.1.9, TypeScript 5, Tailwind 4, ws 8, mqtt.js 5, Mosquitto, supervisord, Node 22 Alpine;
  Tests mit Vitest 5, jsdom, Testing Library, axe-core, aedes
- **Einstieg:** `server/index.ts` (kompiliert `dist/server/index.js`); UI `src/components/App.tsx`
- **Muster:** Server-autoritativer Zustand, Befehle/Ereignisse über WebSocket, gemeinsames Domänenmodul `src/domain/`
- **Persistenz:** retained MQTT-Nachrichten `iot-haus/v2/…` (Geräte, Auto, Sonne, Energie `v: 2`) im Volume `mosquitto-data`
- **Auslieferung:** `.github/workflows/ci-release.yml`; Push auf `main` = Produktion (`:latest`)

## Dokumente in `docs/`

- [Projektüberblick](./project-overview.md) – Zweck, Funktionen, Kennzahlen
- [Architektur](./architecture.md) – Laufzeit, Datenfluss, Grenzen (Kurzfassung)
- [Quellbaum](./source-tree-analysis.md) – annotierte Verzeichnisstruktur
- [Komponenteninventar](./component-inventory.md) – Komponenten, Hooks, Client-Module
- [API-Verträge](./api-contracts.md) – Kurzfassung, Details in [API.md](../API.md)
- [Datenmodelle](./data-models.md) – Katalog, Elektroauto, Solaranlage, Zustand, Energie, Netzbilanz, Persistenz
- [Entwicklung](./development-guide.md) – Setup, Scripts, Tests
- [Deployment](./deployment-guide.md) – Image, Compose, Kubernetes, CI/CD
- [Beiträge](./contribution-guide.md) – Ablauf und Regeln
- [Abnahme 2.1](./abnahme-2.1.md) – Abnahme Elektroauto & Solaranlage mit Screenshots (NFR-10)
- [Abnahme 2.0](./abnahme-2.0.md) – Browser-Abnahme mit Screenshots (NFR-10)

## Dokumente im Repository-Root

| Datei | Inhalt |
|---|---|
| [README.md](../README.md) | Funktionen, Gerätekatalog, Konfiguration, Betrieb, Update (inkl. Upgrade 2.1.0), Entwicklung, CI/CD |
| [.github/release-hinweise/v2.1.0.md](../.github/release-hinweise/v2.1.0.md) | Release-Text 2.1.0 |
| [API.md](../API.md) | `/api/health`, WebSocket-Protokoll, MQTT-Topic-Schema |
| [DOCKER-SETUP.md](../DOCKER-SETUP.md) | Image, Härtung, Healthcheck, Compose, Reverse-Proxy, Fehlersuche |
| [KUBERNETES.md](../KUBERNETES.md) | Manifeste, Probes, warum genau eine Replik |
| [GITHUB-ACTIONS.md](../GITHUB-ACTIONS.md) | Workflow `ci-release.yml`, Image-Tags, Release-Ablauf |
| [.github/copilot-instructions.md](../.github/copilot-instructions.md) | Regeln und Struktur für KI-Assistenten |

## Planungsartefakte (BMAD)

- [PRD](../_bmad-output/planning-artifacts/prd.md) mit [Addendum](../_bmad-output/planning-artifacts/prd-addendum.md) und
  [Entscheidungslog](../_bmad-output/planning-artifacts/prd-decision-log.md)
- [Architektur-Entscheidungsdokument](../_bmad-output/planning-artifacts/architecture.md) – verbindliche Details
- [UX-Spezifikation](../_bmad-output/planning-artifacts/ux-design-specification.md)
- [Epics und Stories](../_bmad-output/planning-artifacts/epics.md)
- [Sprint Change Proposal 2.1](../_bmad-output/planning-artifacts/sprint-change-proposal-2026-09-27.md) – Elektroauto & Solaranlage:
  Fachmodell, Protokoll, Akzeptanzkriterien, Entscheidungen E-01 bis E-36
- [Analysebefunde 1.x](../_bmad-output/planning-artifacts/01-analyse-befunde.md) – Ausgangslage vor 2.0
