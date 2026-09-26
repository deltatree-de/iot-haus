# iot-haus – Leitfaden für Beiträge

**Stand:** 2026-09-26 · Abgeleitet aus `README.md` (Abschnitt Contributing), `.github/copilot-instructions.md` und der Git-Historie.

## Ablauf

1. Branch von `main` anlegen (`feature/...`, `fix/...`, `security/...` wie in PR #2).
2. Änderungen committen — beobachtete Konvention: Conventional Commits mit deutscher Beschreibung,
   z. B. `fix(docker): numerische Benutzerkennung für runAsNonRoot`.
3. Pull Request gegen `main`; CI baut das Image (amd64) ohne Push.
4. Merge auf `main` veröffentlicht `:latest` (= Produktion).

## Regeln

- TypeScript strict, kein `any`; Funktionskomponenten mit Hooks; Tailwind mobile-first.
- MQTT-Payload-Format einhalten (`src/types/index.ts`, [api-contracts.md](./api-contracts.md)).
- UI-Sprache Deutsch.
- Sicherheitshärtung im Dockerfile (Node 22, `USER 1000:1000`, keine Paketmanager/Download-Tools im Runtime-Image) nicht zurückdrehen.
- Vor dem PR: `npm run lint`, `npx tsc --noEmit`, `npm run build`, Container lokal starten (`npm run compose:up`).

## Fehlend (Ist)

Kein `CONTRIBUTING.md`, keine PR-/Issue-Templates, keine `LICENSE`-Datei (README verweist auf MIT und `LICENSE`), keine
automatisierten Tests als Merge-Voraussetzung, kein Branch-Schutz im Repo dokumentiert.
