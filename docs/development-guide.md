# IoT-Haus 2.1 – Entwicklung

## Voraussetzungen

Node.js 22 und npm. Docker nur für Container-Tests.

## Starten

```bash
npm ci
npm run dev:broker     # Terminal 1: aedes-Broker auf 127.0.0.1:1883 (Zustand nur im Speicher)
npm run dev            # Terminal 2: tsc für server/, dann node dist/server/index.js im Next-Dev-Modus
```

App: <http://localhost:3000>. Änderungen an `src/` lädt Next neu (HMR). Änderungen an `server/` oder `src/domain/`, die der Server nutzt,
brauchen einen Neustart von `npm run dev`. Nach einem Neustart des Entwicklungsbrokers beginnt das Haus im Ausgangszustand.

Alternativ läuft alles im Container: `npm run compose:up`.

## Scripts

| Script | Befehl |
|---|---|
| `dev` | `tsc -p tsconfig.server.json && node dist/server/index.js` |
| `dev:broker` | `node scripts/dev-broker.mjs` |
| `build` | `next build && tsc -p tsconfig.server.json` |
| `start` | `node dist/server/index.js` (mit `NODE_ENV=production` für den Produktionsmodus) |
| `lint` | `eslint . --max-warnings=0` |
| `typecheck` | `tsc --noEmit` |
| `test` / `test:watch` | `vitest run` / `vitest` |
| `docker:*`, `compose:*` | Image bauen und starten, siehe [DOCKER-SETUP.md](../DOCKER-SETUP.md) |

## Umgebungsvariablen

`PORT` (3000), `HOSTNAME` (0.0.0.0), `MQTT_BROKER_HOST` (127.0.0.1), `MQTT_BROKER_PORT` (1883), `STROMPREIS_EUR_PRO_KWH` (0.35),
`EINSPEISEVERGUETUNG_EUR_PRO_KWH` (0.08),
`ERLAUBTE_HOSTS` (leer = keine Host-Prüfung; lokal ggf. `localhost`), `NODE_ENV` (≠ `production` → Dev-Modus).

UI-Texte stehen zentral in `src/ui/texte.ts`; Zahlen immer über `src/domain/format.ts` formatieren (Einheit mit U+202F).
Geräte-IDs nur in `src/domain/`: Die Wallbox wird außerhalb über `ELEKTROAUTO.ladegeraet` angesprochen, nie als Literal
(Architekturtest). Fachregeln für Laden und Wegfahren gehören in `src/domain/befehle.ts` (`pruefeRegel`), nicht in Komponenten.

**Ausprobieren (2.1):** Unter „Solaranlage“ „Sonnig“ wählen → Kopf „Solar 8.330 W · Einspeisung 8.252 W“, „Ertrag 0,66 €/h“.
In der Carport-Karte die Wallbox einschalten → 11.075 W, „Netzbezug 2.745 W“, „0,96 €/h“, „voll in 2 h 44 min“. Laden von 50 % auf 100 %
dauert real 2 h 44 min; in Tests laufen Akku und Akku-voll-Timer deshalb nur mit Fake-Timern.

## Tests

```bash
npm test                   # alle Tests
npm test -- --coverage     # mit Abdeckung (Schwelle 90 % Zeilen: src/domain/**, server/zustandsdienst.ts; Stand 2.1: 338 Tests, 99 %)
npx vitest run server      # nur ein Bereich
```

| Ebene | Ort |
|---|---|
| Domäne | `src/domain/*.test.ts` (Katalog, Summen, Laststufen, Szenen, Befehlsprüfung und Regeln, Energie inkl. Zeitumstellung und Dreifach-Integration, Formatierer; `solar-auto.test.ts` für Solaranlage, Akku, Laden, Wegfahren) |
| Server | `server/*.test.ts` (Zustandsdienst mit Fake-Timern inkl. Akku voll, Wegfahren, Restore-Normalisierung; MQTT-Speicher mit Energie-Migration v1→v2; Konfiguration inkl. Einspeisevergütung) |
| Client | `src/client/*.test.ts` (Reducer, Verbindung) |
| Komponenten | `src/components/App.test.tsx` (jsdom, Testing Library, axe hell/dunkel) |
| Integration | `tests/integration/*.test.ts` (echter Server + aedes + `ws`-Clients: Snapshot, Mehrclient, Fehler inkl. `NICHT_MOEGLICH`, `sonne`/`auto` an mehrere Clients, Origin, Health, Persistenz von Auto/Sonne/Energie v1, Broker-Ausfall) |
| Architektur | `tests/architektur/*.test.ts` (Geräte-IDs nur in der Domäne, Domäne ohne Fremdimporte, keine englischen Resttexte, kein `console.log`, Dockerfile-Härtung, Kontraste) |

Komponententests setzen jsdom per Docblock `// @vitest-environment jsdom`; Standard ist `node`.

## Vor dem Pull Request

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

Regeln für Code und Struktur: [.github/copilot-instructions.md](../.github/copilot-instructions.md) und [contribution-guide.md](./contribution-guide.md).
