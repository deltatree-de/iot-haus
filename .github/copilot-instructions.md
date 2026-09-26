# Hinweise für KI-Assistenten (IoT-Haus 2.0)

IoT-Haus ist ein simuliertes Smart Home: 28 Geräte in 6 Räumen, Live-Verbrauch in W und €, Szenen, Grundlastschutz, Auto-Aus.
Ein Node-Server hält den Zustand autoritativ, verteilt ihn per WebSocket an alle Browser und speichert ihn retained im
eingebetteten Mosquitto. Alles läuft in einem Container. Sprache von UI, Doku, Commits und Fachbezeichnern: **Deutsch**.

## Stack

Next.js 15.5 (App Router), React 19.1, TypeScript strict, Tailwind 4, `ws`, `mqtt` (mqtt.js), Mosquitto, supervisord,
Node 22 Alpine. Tests: Vitest 5, jsdom, Testing Library, axe-core, aedes (In-Process-Broker). Keine weiteren Bibliotheken ohne Grund
(Next/React-Versionen sind sicherheitsgeprüft und werden nicht nebenbei angehoben).

## Code-Struktur

```
src/domain/      reines TypeScript, von Server UND Browser genutzt
  katalog.ts     RAEUME, GERAETE (einzige Quelle für IDs, Leistungen, Grundlast, Auto-Aus)
  szenen.ts      SZENEN, szenenZiele
  verbrauch.ts   Haus-/Raumverbrauch, Standby, Laststufe, Kosten
  energie.ts     Tagesintegration, Mitternacht Europe/Berlin
  befehle.ts     pruefeBefehl, befehlsZiele, wendeAn, ausgangszustand
  protokoll.ts   Befehl, ServerNachricht, FehlerCode, MAX_NACHRICHT_BYTES (Vertrag Server ↔ Client)
  format.ts      de-DE-Formatierer (Rundung nur hier)
server/          Node-Server (TypeScript, per tsc nach dist/ kompiliert)
  index.ts       Einstieg: Env, Next, Signale
  app.ts         HTTP, /api/health, WebSocket-Upgrade, Verdrahtung
  zustandsdienst.ts  Zustand, fuehreAus, Energie-Takt, Auto-Aus-Timer
  mqtt-speicher.ts   einziger MQTT-Client: Restore, retained Publish
  ws-verbindungen.ts Parsen, Fehlerantworten, Broadcast, Heartbeat
  ursprung.ts, konfig.ts, version.ts, log.ts
src/client/      framework-frei: verbindung.ts (WS, Backoff), hausReducer.ts (Client-Zustand)
src/hooks/       React-Hooks (useHaus = HausProvider, useTheme, useHochzaehlen, useRestzeit, …)
src/components/  React-Komponenten, eine je Datei nach Architektur §5.1 (App, Kopfbereich, Zaehler, Szenenleiste,
                 Hausansicht, RaumFlaeche, Raeume, Raumkarte, GeraeteZeile, Schalter, GrundlastDialog, LiveRegion, …)
src/ui/          texte.ts (alle UI-Texte), farbtokens.ts (hell/dunkel), themeSkript.ts
src/app/         Next-Layout und Seite (rendert nur <App />)
tests/           integration/ (echte ws-Clients + aedes), architektur/ (Regeln, Kontraste), fixtures/
scripts/         dev-broker.mjs, pruefe-js-budget.mjs, smoke-container.mjs, warte-healthy.sh
docker/          mosquitto.conf, supervisord.conf, start.sh
```

Vollständige Entscheidungen: `_bmad-output/planning-artifacts/architecture.md`. Protokoll und Topics: `API.md`.

## Regeln (werden durch Tests, Lint und CI erzwungen)

- **Domäne ist rein:** `src/domain/` importiert nichts außerhalb von sich selbst (kein React, Next, Node-Modul, `@/`-Alias).
  `server/` importiert `../src/domain/…`, nie `src/components` oder `src/client`.
- **Geräte-IDs nur in `src/domain/`.** Namen, Leistungen und IDs kommen immer aus dem Katalog; nirgends sonst als Literal.
- **Ein Änderungspfad:** Jede Zustandsänderung (Gerät, Szene, Raum, Auto-Aus) läuft durch `Zustandsdienst.fuehreAus` bzw. dessen
  internen `aendere`-Pfad. Eine Änderung erzeugt genau eine `aenderung`-Nachricht.
- **Browser sprechen kein MQTT** und speichern keinen Gerätezustand. Einziger `localStorage`-Schlüssel: `iot-haus.theme`.
- **Protokoll:** nur die drei Befehle `schalten`, `szene`, `raumAus`; neue Nachrichtentypen nur mit Änderung von `protokoll.ts`,
  `API.md` und Architekturdokument. Feldnamen deutsch camelCase, Diskriminator `typ`.
- **Formate:** Zeit als ms seit Epoch, Datum `YYYY-MM-DD` (Berlin), Energie in Wh ungerundet; gerundet wird nur beim Anzeigen.
- **Texte:** Alle UI-Texte (Microcopy) stehen in `src/ui/texte.ts`, Zahlen immer über `src/domain/format.ts`. Zwischen Zahl und
  Einheit steht U+202F (schmales geschütztes Leerzeichen), Auslassung „…“ = U+2026, Minus = U+2212.
- **Server-Limits nicht aufweichen:** 4 KB fachlich / 64 KiB hart (Close 1009), 100 Befehle Vorrat + 20/s je Verbindung
  (`ZU_VIELE_BEFEHLE`), max. 100 Verbindungen, 1 MB Sendepuffer, optionale Host-Allowlist `ERLAUBTE_HOSTS`.
- **Persistenz:** Gerätezustände sofort bei jeder Änderung, Tagesenergie nur im 60-s-Takt und bei SIGTERM.
- **Benennung:** Fachbegriffe deutsch ohne Umlaute in Bezeichnern (`geraet`, `kueche`, `hausverbrauch`); Komponenten `PascalCase.tsx`,
  Hooks `useXyz`, Tests daneben als `*.test.ts(x)`.
- **Kein `console.*`** im Client und Server außer `console.error`; Serverlogs nur über `server/log.ts`
  (eine Zeile, `schluessel=wert`, keine Nutzdaten).
- **Zeit injizieren:** zeitabhängiger Code bekommt `jetzt` als Parameter bzw. Funktion (Tests mit Fake-Timern).
- **Barrierefreiheit:** Schalter mit `role="switch"`, sichtbarer Fokus, 44-px-Trefferflächen, Live-Region für Ansagen,
  `prefers-reduced-motion` beachten, keine Zoomsperre. axe muss in Hell und Dunkel 0 Verstöße melden; neue Farbpaare in
  `src/ui/farbtokens.ts` eintragen (Kontrasttest).
- **Image-Härtung nicht zurückdrehen:** Node 22, `USER 1000:1000`, kein npm/npx/corepack/yarn/apk/wget/nc/curl im Runtime-Image,
  Healthcheck per `node -e fetch(…)`.
- **Replik:** Der Zustand lebt im Pod/Container; nie mehr als eine Instanz betreiben.

## Befehle

```bash
npm ci
npm run dev:broker   # Terminal 1: aedes auf 127.0.0.1:1883
npm run dev          # Terminal 2: http://localhost:3000
npm run lint         # 0 Warnungen
npm run typecheck
npm test             # bzw. npm test -- --coverage (≥ 90 % Domäne + Zustandsdienst)
npm run build        # next build + tsc -p tsconfig.server.json
```

## CI/CD

Ein Workflow `.github/workflows/ci-release.yml`: `qualitaet` (Lint, Typecheck, Tests, Build, JS-Budget ≤ 200 kB, Audit) →
`container` (Härtung, healthy ≤ 60 s per `scripts/warte-healthy.sh`, Rauchtest, Persistenz nach Neustart) → `image` (nur `main`: `:latest`, `:sha-<kurz>`,
amd64 + arm64) → `release` (nur `main`, idempotent: fehlt das GitHub Release zur Version aus `package.json`, werden `:<version>`, Tag
`v<version>` und Release mit `.github/release-hinweise/v<version>.md` einzeln angelegt, soweit sie fehlen). Push auf `main` ist Produktion. Details: `GITHUB-ACTIONS.md`.

## Commits

Conventional Commits mit deutscher Beschreibung, z. B. `feat(server): Auto-Aus nach Neustart fortsetzen`.
