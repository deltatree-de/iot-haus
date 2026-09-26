# IoT-Haus 2.0 – Beiträge

## Ablauf

1. Branch von `main` anlegen: `feature/…`, `fix/…`, `security/…`, `docs/…`.
2. Commits als Conventional Commits mit deutscher Beschreibung, z. B. `feat(server): Auto-Aus nach Neustart fortsetzen`.
3. Lokal prüfen: `npm run lint && npm run typecheck && npm test && npm run build`.
4. Pull Request gegen `main`. Die Jobs `qualitaet` und `container` müssen grün sein; bei PRs wird nichts veröffentlicht.
5. Merge auf `main` veröffentlicht `:latest` und `:sha-<kurz>` (= Produktion).
6. Für ein Release: `version` in `package.json` hochsetzen und `.github/release-hinweise/v<version>.md` anlegen
   ([GITHUB-ACTIONS.md](../GITHUB-ACTIONS.md#ein-release-erstellen)).

## Regeln

- UI, Doku und Fachbezeichner auf Deutsch (Bezeichner ohne Umlaute).
- Geräte, Räume und Szenen nur in `src/domain/katalog.ts` bzw. `szenen.ts` ändern; nirgends sonst Geräte-IDs als Literal.
- `src/domain/` bleibt frei von React-, Next- und Node-Importen.
- Jede Zustandsänderung läuft über den Zustandsdienst; Browser senden nur die drei Befehle aus [API.md](../API.md).
- Protokolländerungen immer gemeinsam in `src/domain/protokoll.ts`, `API.md` und den Integrationstests.
- Kein `console.log`; Serverlogs nur über `server/log.ts`, ohne Nutzdaten.
- Neue Farben als Token in `src/ui/farbtokens.ts` mit Kontrastpaar; axe muss hell und dunkel 0 Verstöße melden.
- Image-Härtung (Node 22, `USER 1000:1000`, keine Paketmanager und Download-Werkzeuge, Healthcheck ohne curl) nicht zurückdrehen.
- Sichtbare Änderungen an der Oberfläche: betroffene Punkte der [Abnahme-Checkliste](./abnahme-2.0.md) erneut prüfen.

Ausführliche Regeln: [.github/copilot-instructions.md](../.github/copilot-instructions.md).

Das Repository enthält keine Lizenzdatei und keine PR-/Issue-Vorlagen.
