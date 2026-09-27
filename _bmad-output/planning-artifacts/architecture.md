---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-09-26'
inputDocuments:
  - _bmad-output/planning-artifacts/00-auftrag.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/prd-addendum.md
  - _bmad-output/planning-artifacts/prd-decision-log.md
  - _bmad-output/planning-artifacts/01-analyse-befunde.md
  - docs/architecture.md
  - Code-Stand c837822 (server.js, src/, Dockerfile, docker/, .github/workflows/, package.json, docker-compose*.yml, eslint.config.mjs, tsconfig.json, next.config.ts, .dockerignore)
workflowType: 'architecture'
project_name: 'iot-haus'
user_name: 'Deltatree'
date: '2026-09-26'
author: 'Winston (BMAD Architect), headless'
version: '2.1.0'
updated: '2026-09-27'
changeProposal: _bmad-output/planning-artifacts/sprint-change-proposal-2026-09-27.md
---

# Architektur-Entscheidungsdokument – IoT-Haus 2.0 / 2.1

> **Stand 2.1.0 (2026-09-27):** Erweiterung um Elektroauto, Solaranlage und Netzbilanz gemäß `sprint-change-proposal-2026-09-27.md`. Details in **§3.12**, Entscheidungen **AD-23 … AD-27** (§9), Dateiliste **§8.4**. Wo Kapitel 1–8 Zahlen des Stands 2.0 nennen (28 Geräte, 6 Räume, 75,3 W, 12.978 W), gelten für 2.1 die Werte aus §3.12 (29 Geräte, 7 Räume inkl. Carport, 78,3 W, 23.978 W).

Dieses Dokument ist die verbindliche technische Grundlage für die Umsetzung von PRD `prd.md` (FR-1 bis FR-35, NFR-1 bis NFR-10). Es wurde headless erstellt: Der Stakeholder steht nicht zur Verfügung, alle Fragen hat der Architekt entschieden und in §9 (AD-01 ff.) protokolliert. Nichts wird vertagt; was nicht gebaut wird, steht im PRD §6. Leitlinie: **langweilig und schlank** – keine neue Laufzeitabhängigkeit, keine neue Infrastruktur, ein Container wie bisher.

Alle Workflow-Menüs (A/P/C) wurden mit **[C] Fortfahren** beantwortet; Advanced Elicitation und Party Mode wurden nicht gestartet, weil PRD, Addendum und Entscheidungsprotokoll bereits ein Review-Gate durchlaufen haben.

---

## 1. Projektkontext

### 1.1 Anforderungen im Überblick

**Funktional (35 FR, 6 Feature-Gruppen) – architektonische Bedeutung:**

| Gruppe | FR | Architektonische Konsequenz |
|---|---|---|
| Haus & Katalog | FR-1…5 | Ein gemeinsamer, typisierter Katalog (6 Räume, 28 Geräte, 4 Szenen; **2.1: 7 Räume inkl. Carport, 29 Geräte**) für Server und Client; Auto-Aus als Server-Timer mit Wiederaufnahme nach Neustart. |
| Live-Verbrauch | FR-6…13 | Reine Rechenfunktionen (Summen, Laststufe, Standby, Kosten) im Domänenmodul, im Client auf den Serverzustand angewandt; Tagesenergie wird **nur** im Server integriert (Zeitzone Europe/Berlin). |
| Echtzeit & Autorität | FR-14…21 | `server.js` wird vom offenen MQTT-Proxy zum **Zustandsdienst**: Befehle rein, Änderungen raus, retained Persistenz im Broker, Snapshot beim Verbinden, strikt sequenzielle Verarbeitung, Whitelist. |
| Szenen | FR-22…24 | Szenen als Daten im Katalog, serverseitig als *eine* Änderung angewandt. |
| Bedienoberfläche | FR-25…29 | Neuaufbau der Komponenten (einseitig, Kopfbereich sticky, Hausansicht, Raumkarten), Theme ohne Aufblitzen, de-DE-Formatierung. |
| Betrieb & Auslieferung | FR-30…35 | Health im Node-Server, Healthcheck per `node -e fetch`, CI mit Qualitätsgate, Release aus einem Workflow, Aufräumen. |

**Nicht-funktional – architekturtreibend:** NFR-1 (≤ 250 ms p95 Verteilung, JS ≤ 200 kB), NFR-2 (WCAG 2.2 AA, axe + Kontrasttest), NFR-4 (Härtung unverändert, Origin-Prüfung, 4 KB, keine neuen Laufzeitabhängigkeiten), NFR-5 (Broker-Ausfall, Wiederverbindung), NFR-6 (≥ 90 % Abdeckung Domäne, Integrationstests gegen echten Server), NFR-7 (eine Logzeile je Ereignis), NFR-9 (Port, Image, Env, Volume bleiben).

### 1.2 Umfang und Komplexität

- Primärdomäne: Web-Fullstack (Next.js + Custom Node-Server + eingebetteter MQTT-Broker), Echtzeit.
- Komplexität: **mittel** (Echtzeit-Konsistenz, Zeitzonen-Integration, A11y), keine Datenbank, kein Mandantenbetrieb, keine Auth.
- Architekturkomponenten: 5 (Domänenmodul, Zustandsdienst, WS-Protokollschicht, MQTT-Speicher, Client-App) + Build/CI.

### 1.3 Technische Randbedingungen

- Node 22 (Alpine), `USER 1000:1000`, kein npm/npx/corepack/yarn/apk/wget/curl/nc im Runtime-Image, App-Code root-owned und nur lesbar (NFR-4).
- Mosquitto im selben Container, nur `127.0.0.1:1883`, gestartet von supervisord (bleibt).
- Next.js 15.5.25, React 19.1.9, Tailwind 4, TypeScript 5.9 (Lockfile-Stand, bleibt).
- Laufzeitabhängigkeiten bleiben exakt: `next`, `react`, `react-dom`, `mqtt`, `ws` (keine neuen).
- Pfad `/mqtt` für den WebSocket bleibt (Reverse-Proxy-Konfigurationen der Betreiber).

### 1.4 Querschnittsthemen

Gemeinsamer Katalog/Domänenlogik · Zeit (Server-Uhr, Client-Uhrversatz, Europe/Berlin, Fake-Timer in Tests) · Fehlerbehandlung ohne Absturz · Barrierefreiheit · de-DE-Formatierung · Logging ohne Nutzdaten · Versionsabgleich Client/Server.

---

## 2. Starter-Template-Bewertung

Brownfield-Projekt. Kein Starter-Template; die bestehende Next.js-15-App (App Router, TS strict, Tailwind 4, ESLint 9 Flat Config) bleibt die Basis. Kein Upgrade von Next/React in diesem Release (Risiko ohne Nutzen für das PRD; die Versionen aus PR #1/#2 sind sicherheitsgeprüft). **Erster Umsetzungsschritt** ist daher kein `create-*`-Befehl, sondern das Anlegen des Domänenmoduls (§8.3).

---

## 3. Kernentscheidungen

### 3.1 Priorisierung

**Kritisch (blockieren Umsetzung):** AD-01 Server in TypeScript mit `tsc`-Kompilat · AD-02 Domänenmodul `src/domain/` als einzige Quelle · AD-04 Topic-/Payload-Vertrag · AD-05 WebSocket-Protokoll · AD-08 Tagesintegration · AD-10 Testwerkzeuge · AD-13 CI/Release-Workflow.

**Wichtig (formen die Architektur):** AD-06 Broker-Ausfall = WS-Verbindungen schließen · AD-07 Origin-Prüfung · AD-09 Auto-Aus · AD-11 Client-Zustand per Reducer + Context · AD-12 Hausansicht als HTML-Raster · AD-14 Healthcheck · AD-15 Farb-Tokens in TS.

**Vertagt:** keine (Spielregel „nichts wird vertagt“).

### 3.2 Laufzeitarchitektur

```
Browser (Next-Client, React 19)                         Container node:22-alpine, UID 1000, supervisord
┌──────────────────────────────┐    HTTP :3000     ┌───────────────────────────────────────────────────────┐
│ App ─ HausProvider (Reducer) │ ────────────────► │ dist/server/index.js                                  │
│   └ Verbindung (WS, Backoff) │    WS /mqtt       │  ├ GET /api/health  (health.ts)                       │
│      sendet nur Befehle      │ ◄═══════════════► │  ├ Next Request-Handler (SSR/Assets)                  │
│      empfängt snapshot,      │   JSON ≤ 4 KB     │  ├ WS-Schicht (ws-verbindungen.ts): Upgrade, Origin,   │
│      aenderung, bestaetigt,  │                   │  │   Parse/Whitelist, Broadcast, Heartbeat             │
│      fehler, energie         │                   │  ├ Zustandsdienst (zustandsdienst.ts) ← src/domain     │
└──────────────────────────────┘                   │  │   Zustand, Energie, Auto-Aus-Timer, Tages-Timer     │
                                                   │  └ MQTT-Speicher (mqtt-speicher.ts)                   │
                                                   │        │ retained, QoS 1, nur 127.0.0.1:1883           │
                                                   │  Mosquitto  ─ Volume mosquitto-data (autosave je Änderung)│
                                                   └───────────────────────────────────────────────────────┘
```

Der Node-Server ist der **einzige** MQTT-Client. Browser sprechen nie MQTT, sondern ausschließlich das Befehls-/Ereignisprotokoll aus §3.5.

### 3.3 Code-Teilung Server ↔ Client (AD-01, AD-02)

- **`src/domain/*.ts`**: reines TypeScript, keine Imports von React, Next, Node-Modulen (`fs`, `http` …) oder `@/`-Alias; nur relative Imports ohne Dateiendung. Enthält Katalog, Szenen, Rechenfunktionen, Energieintegration, Befehlsprüfung, Protokolltypen, Formatierer.
- **Client** importiert `@/domain/...` direkt (Next/Webpack kompiliert TS).
- **Server** wird in TypeScript geschrieben (`server/*.ts`, ersetzt `server.js`) und im Builder-Stage mit `tsc -p tsconfig.server.json` nach `dist/` kompiliert (CommonJS). Das Kompilat enthält `dist/server/**` und `dist/src/domain/**`. Im Runtime-Image läuft `node dist/server/index.js` – kein `tsx`/`ts-node` (NFR-4).
- Begründung: Eine Quelle für Katalog **und** Logik (FR-2, NFR-6), volle Typsicherheit, `tsc` ist bereits devDependency. Die Variante „JSON/CJS-Datei für beide“ wurde verworfen, weil sie nur die Daten teilt, nicht die Logik (Szenenanwendung, Befehlsprüfung, Integration), die sonst doppelt gepflegt würde.

`tsconfig.server.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "nodenext", "moduleResolution": "nodenext",
    "outDir": "dist", "rootDir": ".", "strict": true, "esModuleInterop": true,
    "skipLibCheck": true, "noEmit": false, "incremental": false, "sourceMap": false,
    "types": ["node"]
  },
  "include": ["server/**/*.ts", "src/domain/**/*.ts"],
  "exclude": ["**/*.test.ts"]
}
```
(`package.json` hat kein `"type"` → Ausgabe CommonJS; `nodenext` erlaubt dort endungslose relative Imports.) Root-`tsconfig.json` bekommt `"exclude": ["node_modules", "dist"]` und `"target": "ES2022"`; `npm run typecheck` = `tsc --noEmit` prüft App, Server, Domäne und Tests gemeinsam.

### 3.4 Daten- und Persistenzarchitektur (AD-04)

**Serverzustand (im Speicher, autoritativ):**
```ts
type GeraeteZustand = { an: boolean; seit: number };           // seit = ms epoch der letzten Zustandsänderung
type HausZustand   = Record<GeraetId, GeraeteZustand>;          // immer alle Geräte (2.0: 28, 2.1: 29)
type Energie       = { datum: string; wh: number };             // datum 'YYYY-MM-DD' (Europe/Berlin), wh ungerundet
// intern zusätzlich: energieStand: number (ms, bis wohin integriert wurde)
```

**MQTT-Topics (nur intern, nur der Server schreibt und liest):**

| Topic | retained | QoS | Payload (JSON) |
|---|---|---|---|
| `iot-haus/v2/geraet/<geraet-id>/zustand` | ja | 1 | `{ "v": 1, "an": true, "seit": 1758900000000 }` |
| `iot-haus/v2/energie/heute` | ja | 1 | `{ "v": 1, "datum": "2026-09-26", "wh": 3420.51, "stand": 1758900000000 }` |

Es gibt **keine** Befehls-Topics (Befehle nur über WebSocket, PRD §6). Alte Topics `smarthome/…` werden weder gelesen noch geschrieben.

**Wann wird geschrieben:**
- Geräte-Topic: für jedes in einer Änderung geänderte Gerät, direkt nach der Anwendung.
- Energie-Topic: bei jeder Änderung (nach Integration), bei jedem Energie-Tick (≤ 60 s, §3.7), beim Tageswechsel und beim SIGTERM-Flush.
- Nach Broker-Wiederverbindung (Server lief weiter): alle 28 Geräte-Topics + Energie-Topic werden aus dem Speicher neu publiziert (Speicher ist aktueller als der Broker).

**Start/Wiederherstellung (FR-17):**
1. MQTT verbinden (`clientId: "iot-haus-server"`, `clean: true`, `reconnectPeriod: 1000`).
2. `subscribe("iot-haus/v2/#", { qos: 1 })`; nach SUBACK 500 ms Ruhefenster sammeln (retained Nachrichten kommen unmittelbar nach SUBACK), danach `unsubscribe`.
3. Payloads prüfen: gültiges JSON, `v === 1`, Typen korrekt, Geräte-ID im Katalog → übernehmen; sonst ignorieren und eine Logzeile `restore_ignoriert topic=…` schreiben. Fehlende Geräte → Ausgangszustand (FR-4: nur Grundlast *An*, `seit = jetzt`).
4. Energie: `datum === berlinDatum(jetzt)` → `wh` übernehmen, sonst `{ datum: heute, wh: 0 }`. `energieStand = jetzt` (Ausfallzeit zählt nicht, FR-10).
5. Auto-Aus-Timer für eingeschaltete Auto-Aus-Geräte anlegen (Restzeit `seit + 180 000 − jetzt`, ≤ 0 → sofort ausschalten, Ursache `autoAus`).
6. Vollständigen Zustand einmal retained publizieren (normalisiert Altbestand) → Dienst ist **bereit**.

**Mosquitto-Persistenz:** `autosave_on_changes true`, `autosave_interval 1` (Speichern nach jeder Änderung; bei ≤ 1 Nachricht/s unkritisch). Volume `mosquitto-data` bleibt.

**Browser:** speichert keinen Gerätezustand. Einziger localStorage-Schlüssel: `iot-haus.theme` (`system|hell|dunkel`). Beim ersten Laden wird `smart-home-state` entfernt (FR-14).

### 3.5 WebSocket-Protokoll (AD-05)

Pfad `/mqtt`, JSON-Textframes, Feldnamen deutsch in camelCase, Diskriminator `typ`. Typen liegen in `src/domain/protokoll.ts` und werden von Server und Client genutzt.

**Client → Server (einzige erlaubte Nachrichten):**
```ts
type Befehl =
  | { typ: 'schalten'; id: string; geraet: GeraetId; an: boolean }
  | { typ: 'szene';    id: string; szene: SzeneId }
  | { typ: 'raumAus';  id: string; raum: RaumId };
// id: /^[A-Za-z0-9_-]{1,64}$/, vom Client erzeugt: `${Date.now().toString(36)}-${zaehler++}`
// (kein crypto.randomUUID – im Heimnetz per http ist das kein Secure Context)
```

**Server → Client:**
```ts
type ServerNachricht =
  | { typ: 'snapshot'; version: string; zustand: HausZustand; energie: Energie;
      strompreis: number; serverZeit: number }
  | { typ: 'aenderung'; ursache: { art: 'geraet' | 'szene' | 'raumAus' | 'autoAus'; ref: string; befehlId: string | null };
      geraete: Partial<HausZustand>;   // nur geänderte Geräte, vollständiger neuer Zustand je Gerät
      energie: Energie }
  | { typ: 'bestaetigt'; befehlId: string; geaendert: boolean }
  | { typ: 'fehler'; befehlId: string | null; code: FehlerCode; meldung: string }
  | { typ: 'energie'; energie: Energie; serverZeit: number };

type FehlerCode = 'UNGUELTIGES_JSON' | 'ZU_GROSS' | 'UNGUELTIGER_BEFEHL' | 'UNBEKANNTES_GERAET'
                | 'UNBEKANNTE_SZENE' | 'UNBEKANNTER_RAUM' | 'ALTES_PROTOKOLL';
```

**Ablauf je Befehl (strikt sequenziell, synchron im Event-Loop, FR-19):**
1. Rohlänge > 4 096 Byte → `fehler ZU_GROSS` (`befehlId: null`).
2. `JSON.parse` scheitert → `UNGUELTIGES_JSON`.
3. Objekt hat Feld `type` → `ALTES_PROTOKOLL` (FR-18, alte Tabs).
4. `pruefeBefehl(json)` (Domäne): exakt die Felder des jeweiligen Typs, keine Zusatzfelder, Typen korrekt, IDs im Katalog → sonst passender Code; `befehlId` wird mitgegeben, sofern `id` gültig war.
5. `wendeAn(zustand, befehl, jetzt)` → `{ zustand, geaendert: GeraetId[] }`.
6. Bei Änderung: Energie bis `jetzt` mit **alter** Leistung integrieren → Zustand übernehmen → Auto-Aus-Timer pflegen → `aenderung` an **alle** Clients → Retained publizieren (fire-and-forget, QoS 1).
7. `bestaetigt { befehlId, geaendert }` an den Absender (nach der `aenderung`, damit der Client beim Bestätigen den neuen Zustand schon hat).

**Verbindungsaufbau:** Upgrade nur, wenn Pfad `/mqtt`, Origin gültig (§3.6) und Dienst bereit; sonst HTTP 403 bzw. 503 und Socket schließen. Nach dem Upgrade sendet der Server sofort `snapshot` (FR-15, ≤ 1 s). Der Client sendet von sich aus nichts (FR-14).

**Heartbeat:** Server pingt alle 30 s, beendet (`terminate`) Verbindungen ohne Pong. Der Client wertet die spätestens alle 60 s eintreffende `energie`-Nachricht als Lebenszeichen: 75 s ohne Nachricht → Socket schließen und Wiederverbindung. Bei `visibilitychange → visible` und nicht offenem Socket → sofortiger Versuch.

**Version (FR-18):** `version` im Snapshot = `package.json`-Version des Servers. Client-Version = `process.env.NEXT_PUBLIC_APP_VERSION` (in `next.config.ts` aus `package.json` eingebettet). Abweichung → Banner „Neue Version verfügbar“ + „Neu laden“, Schalter gesperrt.

### 3.6 Sicherheit (AD-06, AD-07)

- **Keine Authentifizierung** (D-20); README empfiehlt Reverse-Proxy mit Anmeldung.
- **Origin-Prüfung** (`server/ursprung.ts`, reine Funktion): erlaubt, wenn `Origin` fehlt, oder `new URL(origin).host` gleich `Host`-Header oder gleich dem ersten Wert von `X-Forwarded-Host` ist; ungültige Origin-URL → abgelehnt. Antwort bei Ablehnung: `HTTP/1.1 403 Forbidden`, Socket zerstören. (`X-Forwarded-Host` ist für Browser nicht setzbar, schwächt den Schutz vor Cross-Site-WebSocket-Hijacking also nicht, macht aber Reverse-Proxys ohne `Host`-Weitergabe kompatibel.)
- **Größen:** `new WebSocketServer({ noServer: true, maxPayload: 65536 })` als harte Grenze gegen Speichermissbrauch; die fachliche 4-KB-Grenze prüft der Handler selbst, damit der Client eine Fehlerantwort statt eines Verbindungsabbruchs erhält (FR-18).
- **Whitelist:** Es gibt keinen generischen Publish/Subscribe mehr; der Handler kennt nur die drei Befehle (FR-18).
- **Upgrades:** nur `/mqtt`; im Dev-Modus werden andere Upgrades (Next-HMR) an `app.getUpgradeHandler()` weitergereicht, in Produktion wird der Socket zerstört.
- **Security-Header** (`next.config.ts → headers()`): `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`. Eine CSP wird nicht gesetzt (Next-Inline-Skripte bräuchten Nonces; kein PRD-Bestandteil, AD-19).
- **Logs** ohne Nutzdaten (NFR-7, FR-35).
- Härtung des Images bleibt unverändert (§3.9).

### 3.7 Energie, Zeit und Auto-Aus (AD-08, AD-09)

**Rechenfunktionen (`src/domain/verbrauch.ts`), alle mit ungerundeten Katalogwerten (FR-29):**
- `geraeteleistung(geraet, an) = an ? betriebW : standbyW`
- `hausverbrauch(zustand)`, `raumverbrauch(zustand, raum)`, `standbyAnteil(zustand)`, `anzahlAn(zustand, raum)`
- `laststufe(wGerundet)`: `< 500 → 'niedrig'`, `< 2000 → 'mittel'`, sonst `'hoch'` (Eingabe ist der **gerundete** Anzeigewert, FR-12).
- `kostenProStunde(w, preis) = w / 1000 * preis`

**Tagesintegration (`src/domain/energie.ts`, nur im Server aufgerufen):**
```ts
berlinDatum(ms): string                    // Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' })
naechsteMitternachtBerlin(ms): number      // UTC-Mitternacht des Folgetags minus Berlin-Offset an diesem Zeitpunkt
                                           // (Offset per Intl formatToParts; DST-Wechsel liegen um 02/03 Uhr, nie um 0 Uhr)
integriere(e: Energie, leistungW: number, vonMs: number, bisMs: number): Energie
  // liegt bisMs hinter naechsteMitternachtBerlin(vonMs): neuer Tag,
  //   wh = leistungW * (bisMs - letzteMitternacht) / 3_600_000 (Vortag verworfen, keine Historie)
  // sonst wh += leistungW * (bisMs - vonMs) / 3_600_000
```
- **Energie-Tick** im Server: ein einzelner `setTimeout` auf `min(jetzt + 60 000, naechsteMitternachtBerlin(jetzt))`; beim Feuern integrieren, retained publizieren, `energie` an alle senden, neu planen. Damit ist der Reset genau um 00:00 und der Verlust bei Absturz ≤ 60 s (FR-10).
- **SIGTERM/SIGINT:** integrieren → Energie-Topic publizieren und auf PUBACK warten (max. 2 s) → WS-Verbindungen mit Code 1012 schließen → HTTP schließen → MQTT `end()` → `process.exit(0)`.
- Tests: 2 000 W × 30 min = 1,00 kWh; Tageswechsel am 2026-03-29 (23-h-Tag) und 2026-10-25 (25-h-Tag); Integration über Mitternacht.

**Auto-Aus (`server/zustandsdienst.ts`):**
- Katalogfeld `autoAusS: 180 | null`. Beim Übergang *Aus → An* `setTimeout(autoAusS * 1000)` je Gerät (Map `GeraetId → Timer`); beim Übergang *An → Aus* Timer löschen. Setzt eine Szene ein bereits eingeschaltetes Gerät auf *An*, ändert sich nichts (`seit` bleibt, Timer läuft weiter, FR-5).
- Ablauf → interner Befehl mit Ursache `{ art: 'autoAus', ref: geraetId, befehlId: null }`, gleicher Weg wie Nutzerbefehle (eine Änderung, Broadcast, Persistenz), Logzeile `auto_aus geraet=…`.
- Client-Restzeit: `offset = snapshot.serverZeit − Date.now()` beim Snapshot (bei jeder `energie`-Nachricht aktualisiert); `rest = seit + autoAusS*1000 − (Date.now() + offset)`, Anzeige „noch m:ss“, sekündlicher Takt nur solange ein Auto-Aus-Gerät *An* ist.

**Uhr als Abhängigkeit:** Zustandsdienst erhält `jetzt: () => number` und nutzt globale `setTimeout`; Tests steuern beides über `vi.useFakeTimers()` + `vi.setSystemTime()`.

### 3.8 Frontend-Architektur (AD-11, AD-12, AD-15)

**Zustand im Client:** ein `useReducer` in `HausProvider` (React Context), keine Store-Bibliothek.
```ts
type ClientZustand = {
  verbindung: 'verbinde' | 'verbunden' | 'getrennt';
  server: { zustand: HausZustand; energie: Energie; strompreis: number; version: string } | null; // null = Skeleton
  uhrVersatzMs: number;
  ausstehend: Record<string /*befehlId*/, { art: 'geraet' | 'szene' | 'raumAus'; ref: string; ziel: Partial<Record<GeraetId, boolean>> }>;
  versionKonflikt: boolean;
};
```
- **Anzeige-Zustand** = `server.zustand` überlagert mit `ausstehend[*].ziel` (nur für Schalterstellung + `aria-busy`); Hausverbrauch und Meldungen nutzen **nur** den Serverzustand (FR-21).
- `aenderung` → Serverzustand aktualisieren; Meldung aus `hausverbrauch` alt/neu (jeweils gerundet) + Ursache (Katalog-Namen) im Client erzeugen (FR-11).
- `bestaetigt` → Eintrag aus `ausstehend` entfernen; `geaendert: false` bei Szene/Raum → Hinweis „‹Szene›: keine Änderung nötig“ nur hier (FR-22).
- `fehler` mit `befehlId`, 5-s-Zeitüberschreitung oder Verbindungsverlust mit offenem Eintrag → Eintrag entfernen, Fehlermeldung „‹Gerät› konnte nicht geschaltet werden. Bitte erneut versuchen.“ (FR-21).
- `snapshot` → ersetzt `server` vollständig, `verbindung = 'verbunden'` (FR-20).
- Reducer ist eine reine Funktion in `src/client/hausReducer.ts` (unit-getestet).

**Transport:** `src/client/verbindung.ts` – framework-freie Klasse `HausVerbindung` (öffnen, `sende(befehl)`, Backoff 1/2/4/8 s, danach alle 10 s, `jetztVerbinden()`, Lebenszeichen-Überwachung 75 s, `visibilitychange`). URL: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/mqtt` (NFR-9: `NEXT_PUBLIC_MQTT_BROKER_URL` wird ignoriert). Befehle werden nur gesendet, wenn `verbunden` und kein Versionskonflikt; sonst sind die Bedienelemente `aria-disabled` (keine Warteschlange, FR-20).

**Hooks (`src/hooks/`):**

| Hook | Aufgabe |
|---|---|
| `useHaus()` | Liest den Context: Anzeige-Zustand, abgeleitete Werte (`hausW`, `raumW`, `standbyW`, `laststufe`, `kostenProStunde`, `kwhHeute`, `kostenHeute`) und Aktionen `schalten(id, an)`, `szene(id)`, `raumAus(id)`, `neuVerbinden()`. |
| `useHochzaehlen(ziel, 600)` | Zahl-Interpolation mit `requestAnimationFrame`, ease-out; bei `prefers-reduced-motion` sofort (FR-6). |
| `useRestzeit(seit, dauerS)` | Sekundentakt + Uhrversatz → „noch m:ss“ (FR-5). |
| `useMeldungen()` | Toast-Stapel (max. 3, 4 s, Escape/Schließen) (FR-11). |
| `useAnsage()` | `aria-live="polite"`-Text; erste Änderung sofort, weitere innerhalb von 2 s ersetzen einen ausstehenden Eintrag, der am Fensterende angesagt wird (FR-11). |
| `useTheme()` | `system|hell|dunkel`, localStorage `iot-haus.theme`, setzt `data-theme` und `meta[name=theme-color]` (FR-28). |
| `useReduzierteBewegung()` | `matchMedia('(prefers-reduced-motion: reduce)')`. |

**Komponentenbaum:**
```
app/layout.tsx (Server)       <html lang="de" data-theme>, Theme-Inline-Skript vor Paint, Token-<style>, export const viewport
└ app/page.tsx (Server)       rendert nur <App/>
  └ App ('use client')        HausProvider
    ├ Sprunglink                      „Zu den Räumen springen“ (erstes fokussierbares Element)
    ├ VersionsBanner | VerbindungsBanner
    ├ Kopfbereich (sticky)            Hausverbrauch(Zaehler) · LaststufePille · KostenProStunde · VerbindungsStatus
    ├ Uebersicht                      StandbyAnteil · Tageswerte(+InfoHinweis) · Strompreis · ThemeWahl
    ├ Szenenleiste                    SzenenKnopf ×4
    ├ Layout-Raster (≥1024 px zweispaltig)
    │  ├ links:  Hausansicht → RaumFlaeche ×6 (Buttons) ; VerbrauchNachRaum
    │  └ rechts: Raumkarte ×6 → GeraeteZeile ×n → Schalter ; RaumAusKnopf
    ├ GrundlastDialog                 natives <dialog> mit showModal(), „Abbrechen“ autofokussiert
    ├ Meldungen                       Toasts
    ├ LiveRegion                      aria-live="polite"
    └ Symbol                          ~20 Inline-SVG-Icons, aria-hidden
```
Solange `server === null`: `Skeleton` anstelle von Kopfwerten/Raumkarten, Schalter nicht bedienbar (FR-15).

**Regeln:** Container-Komponenten (`Kopfbereich`, `Uebersicht`, `Szenenleiste`, `Hausansicht`, `Raumkarte`, `VerbrauchNachRaum`) lesen `useHaus()`; Blattkomponenten (`Schalter`, `GeraeteZeile`, `LaststufePille`, `Zaehler`, `RaumFlaeche`, `SzenenKnopf`) bekommen ausschließlich Props (testbar ohne Provider).

**Hausansicht (AD-12):** HTML-Raster 2 × 3 aus `<button>`-Elementen in einem `<section aria-label="Hausansicht">` mit dekorativem Dach als Inline-SVG (`aria-hidden`). Ersetzt das 497-Zeilen-SVG; löst Hitbox-, ID- und A11y-Befunde (U-01, U-02, B-09) ohne Sonderlogik. Raum leuchtet warm, wenn ein Gerät der Kategorie Licht *An* ist (FR-26).

**Theme (AD-15):** `src/ui/farbtokens.ts` exportiert `{ hell: {...}, dunkel: {...} }` und die Liste der zu prüfenden Paare. `layout.tsx` erzeugt daraus ein `<style>` mit `:root[data-theme="hell"]{--…}` / `[data-theme="dunkel"]`; `globals.css` bildet sie per `@theme inline` auf Tailwind-Farben ab und definiert `@custom-variant dark (&:where([data-theme=dunkel], [data-theme=dunkel] *))`. Das Inline-Skript (`src/ui/themeSkript.ts`, als String) liest `iot-haus.theme`, löst `system` per `matchMedia` auf, setzt `data-theme` und `theme-color` vor dem ersten Paint und entfernt `smart-home-state`. `<html suppressHydrationWarning>`.

**Formatierung (`src/domain/format.ts`):** `Intl.NumberFormat('de-DE', { roundingMode: 'halfExpand' })`: `watt(1200) → "1.200 W"`, `standby(0.5) → "0,5 W"`, `euroProStunde → "1,96 €/h"`, `euro → "1,20 €"`, `kwh → "3,42 kWh"`, `wattGesprochen → "1.274 Watt"`, `restzeit(168) → "noch 2:48"`.

**Layout-Metadaten:** `export const viewport = { width: 'device-width', initialScale: 1 }` (ohne Zoom-Sperre, NFR-2), Titel „IoT-Haus – Energie & Steuerung“, manuelle `<meta>`-Duplikate und der kaputte `apple-touch-icon.png`-Link entfallen.

### 3.9 Infrastruktur und Auslieferung (AD-13, AD-14)

**Dockerfile (Änderungen, Härtung unverändert):**
- `builder`: `RUN npm run build` (= `next build && tsc -p tsconfig.server.json`).
- `runtime`: `COPY --from=builder /app/dist ./dist` statt `COPY server.js`; `package.json` bleibt (Versionsquelle für Health/Snapshot, gelesen über `path.join(__dirname, '../../package.json')`).
- `ENV NEXT_PUBLIC_MQTT_BROKER_URL` entfällt; `STROMPREIS_EUR_PRO_KWH` wird nicht vorbelegt (Default im Code 0,35).
- Neu, vor `USER`:
  ```dockerfile
  HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
  ```
  (10-s-Intervall statt 30 s aus dem Addendum, damit „healthy ≤ 60 s“ sicher gilt; AD-14.)
- Unverändert: Node 22 Alpine, Entfernen von npm/npx/corepack/yarn/apk/wget/nc, `USER 1000:1000`, `.next/cache` + `/var/lib/mosquitto` als einzige beschreibbare Orte.

**supervisord:** Programm `nextjs-server`: `command=node dist/server/index.js`, `stopsignal=TERM`, `stopwaitsecs=5`, `environment=NODE_ENV="production"` (ohne `NEXT_PUBLIC_…`). `mosquitto`: `stopwaitsecs=5`. Stoppreihenfolge (umgekehrte Priorität) stoppt Node vor Mosquitto → SIGTERM-Flush erreicht den Broker.

**Compose (`docker-compose.yml`, `docker-compose.prod.yml`):** `healthcheck`-Block entfernt (Image-Healthcheck wird geerbt), Volume `mosquitto-logs` und `NEXT_PUBLIC_MQTT_BROKER_URL` entfernt, `STROMPREIS_EUR_PRO_KWH` als auskommentiertes Beispiel. Volume `mosquitto-data`, Port, Containername, Image bleiben (NFR-9).

**Health (`server/health.ts`, vor dem Next-Handler):** `GET /api/health` → `200 { status: 'ok', mqtt: 'verbunden', version }` wenn MQTT verbunden **und** Dienst bereit; sonst `503 { status: 'fehler', mqtt: 'verbunden' | 'getrennt', version }`. `Cache-Control: no-store`. `src/app/api/health/route.ts` entfällt.

**Broker-Ausfall (AD-06, NFR-5):** MQTT `offline`/`close` → Dienst „nicht bereit“, Health 503, **alle WS-Verbindungen mit Code 1013 schließen**, neue Upgrades mit 503 ablehnen. Clients zeigen „Getrennt“ und verbinden sich mit Backoff neu. Timer (Auto-Aus, Energie) laufen im Speicher weiter. Bei `connect` nach vorherigem Bereitsein: kompletten Speicherzustand retained publizieren → bereit. So existiert kein Zustand, der angezeigt, aber nicht persistierbar ist.

**CI/Release – ein Workflow `.github/workflows/ci-release.yml` (ersetzt `docker-publish.yml` und `release.yml`):**

```yaml
on:
  pull_request: { branches: [main] }
  push:         { branches: [main] }       # kein Tag-Trigger (FR-33)
permissions: { contents: read }
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
env: { REGISTRY: ghcr.io, IMAGE_NAME: deltatree-de/iot-haus }
```

| Job | needs / if | Schritte |
|---|---|---|
| `qualitaet` | immer | checkout · setup-node 22 (cache npm) · `npm ci` · `npm run lint` · `npm run typecheck` · `npm test -- --coverage` · `npm run build 2>&1 \| tee build.log` · `node scripts/pruefe-js-budget.mjs build.log` · `npm audit --omit=dev --audit-level=high` |
| `container` | `needs: qualitaet` | buildx (Standard-BuildKit, **nicht** `moby/buildkit:master`) · `linux/amd64` mit `load: true`, Tag `iot-haus:ci`, Cache `type=gha` · `docker run -d --name ci -p 3000:3000 -v ci-data:/var/lib/mosquitto iot-haus:ci` · warten bis `docker inspect -f '{{.State.Health.Status}}'` = `healthy` (max. 60 s, sonst Fehler, FR-31) · `node scripts/smoke-container.mjs schalten` · `docker restart ci` · warten auf healthy · `node scripts/smoke-container.mjs pruefen` (Zustand überlebt Neustart, FR-17) · Härtungsprüfung: `docker run --rm --entrypoint /bin/sh iot-haus:ci -c 'for b in curl wget npm npx corepack yarn apk nc; do command -v $b && exit 1; done; [ "$(id -u)" = 1000 ]'` |
| `image` | `needs: [qualitaet, container]`, `if: github.event_name == 'push'` | `permissions: packages: write` · login GHCR · metadata-action mit genau `type=raw,value=latest` und `type=sha,format=short,prefix=sha-` · build-push `linux/amd64,linux/arm64`, Cache gha · Output `digest` |
| `release` | `needs: image`, `if: github.event_name == 'push'` | `permissions: contents: write, packages: write` · checkout `fetch-depth: 0` · `V=$(node -p "require('./package.json').version")` · wenn `git ls-remote --tags origin "refs/tags/v$V"` leer: (1) `docker buildx imagetools create -t $REGISTRY/$IMAGE_NAME:$V $REGISTRY/$IMAGE_NAME@${{ needs.image.outputs.digest }}` (2) `git tag v$V $GITHUB_SHA && git push origin v$V` (3) `gh release create v$V --title "v$V" --generate-notes --notes-file .github/release-hinweise/v$V.md` (Datei Pflicht, enthält den Upgrade-Hinweis 2.0.0, NFR-9); sonst Schritt-Zusammenfassung „Version existiert bereits“ |

- Reihenfolge Image-Tag → Git-Tag → Release: Ein Tag existiert nur, wenn das Versions-Image existiert. Der Job ist idempotent.
- PRs bauen nur amd64 und pushen nichts; `packages: write` gibt es nur in `image`/`release` (Least Privilege).
- Actions über Hauptversions-Tags (`actions/checkout@v4`, `actions/setup-node@v4`, `docker/*@v3/@v5/@v6`); keine SHA-Pins (AD-18).

**JS-Budget (`scripts/pruefe-js-budget.mjs`):** liest `build.log`, sucht die Zeile der Route `/` in der Next-Build-Tabelle (`/^[┌├└]\s+[○●ƒ]\s+\/\s/`), nimmt den letzten Größenwert (`First Load JS`), rechnet `kB`/`MB` um, bricht bei > 200 kB **oder** wenn die Zeile fehlt mit Exitcode 1 ab.

**Container-Smoke (`scripts/smoke-container.mjs`, nur Node 22 + `ws` aus devDeps):** Modus `schalten`: `/api/health` = 200, WS verbinden, Snapshot mit 28 Geräten und `version` = `package.json`, `schalten arbeitszimmer.pc an` → `bestaetigt`. Modus `pruefen`: Snapshot zeigt `arbeitszimmer.pc` *An*. (Script liegt unter `scripts/` und ist von der Geräte-ID-Literal-Prüfung ausgenommen.)

### 3.10 Testarchitektur (AD-10)

**Runner: Vitest** (eine Konfiguration für Server, Domäne und Komponenten; TS/TSX ohne Babel). `node:test` verworfen: kein TSX, keine jsdom-Integration, keine Coverage-Schwellen ohne Zusatzwerkzeuge.

**Neue devDependencies (nur diese):** `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `axe-core`, `aedes`. Außerdem Korrektur: `@types/ws` → devDependencies, `@types/mqtt` entfernen (mqtt bringt Typen mit), `@types/node` → `^22`. Versionen werden bei Installation auf die aktuelle Hauptversion gesetzt und im Lockfile fixiert (Stand heute: vitest 5.0, jsdom 30, @testing-library/react 16.3, axe-core 4.13, aedes 1.2). Laufzeitabhängigkeiten unverändert.

**Broker in Tests: `aedes` in-process** (ephemerer Port, `127.0.0.1`) statt Service-Container. Begründung: läuft lokal und in CI identisch ohne Docker, deterministisch, erfüllt FR-32 („in der CI gestarteter Broker“ – er wird im Testprozess gestartet). Echtes Mosquitto-Verhalten (Persistenz, Konfiguration) prüft der Job `container` am gebauten Image.

**`vitest.config.mts`:**
```ts
export default defineConfig({
  esbuild: { jsx: 'automatic' },                        // tsconfig hat jsx: preserve (Next)
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'node',                                // Komponententests: Docblock `// @vitest-environment jsdom`
    setupFiles: ['vitest.setup.ts'],                    // jsdom: HTMLDialogElement.showModal/close-Stub, matchMedia-Stub
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts', 'tests/**/*.test.ts'],
    testTimeout: 10_000,
    coverage: { provider: 'v8', include: ['src/domain/**', 'server/zustandsdienst.ts'],
                exclude: ['**/*.test.*'], thresholds: { lines: 90 } },
  },
});
```

**Testebenen:**

| Ebene | Ort | Inhalt (Auszug, FR/NFR) |
|---|---|---|
| Domäne (Unit) | `src/domain/*.test.ts` | Katalog = Anhang A (Tabelle als Fixture im Test), Invarianten, 6 Räume/28 Geräte (FR-1/2) · Summen 75,3 W / 10,3 W / 12 978 W, Laststufen 499/500/1 999/2 000 (FR-6/12/13) · Szenen aus Ausgangs- und Alles-an-Zustand, +5 532 W, Grundlast unberührt, Idempotenz (FR-22–24) · Befehlsprüfung-Matrix (FR-18) · Integration 2 kW × 30 min, DST 2026-03-29/2026-10-25, Mitternacht (FR-10) · Formatierer (FR-29) |
| Server (Unit) | `server/*.test.ts` | Zustandsdienst mit Fake-Timern: Auto-Aus 180 s, Neustart mit Restzeit/abgelaufen, Szene lässt `seit` (FR-5) · Restore ignoriert unbekannte IDs (FR-17) · Strompreis-Parsing inkl. Warnung (FR-9) · Origin-Prüfung (NFR-4) |
| Integration | `tests/integration/*.test.ts` | `erstelleServer({ ohneNext: true, port: 0, mqttUrl: aedes })` + echte `ws`-Clients: Snapshot ≤ 1 s, Verbinden ändert nichts (FR-14/15) · 3 Clients, p95 ≤ 250 ms über 100 Befehle (FR-16) · 200 Zufallsbefehle → 100 % konsistent (FR-19) · ungültiges JSON, > 4 KB, `type: publish`, unbekannte IDs → Fehler, kein Absturz (FR-18) · Origin fremd → 403 · Health 200/503 · Server-Neustart gegen dieselbe aedes-Instanz → identischer Zustand (FR-17) · Broker weg → WS geschlossen, Health 503, Broker zurück → bereit (NFR-5) |
| Komponenten | `src/components/*.test.tsx` (jsdom) | Kopfbereich, Raumkarte, Schalter (role/aria), GrundlastDialog (Fokus, Escape), VerbindungsBanner (NFR-6) · Seite mit Snapshot-Fixture in `data-theme=hell` und `dunkel`: axe 0 Verstöße (Regel `color-contrast` deaktiviert) (NFR-2) |
| Architektur | `tests/architektur/*.test.ts` | keine Geräte-ID-Literale außerhalb `src/domain/` (ohne Tests/`scripts/`) (FR-2) · keine englischen Resttexte (FR-29) · Kontraste aller Token-Paare nach WCAG-Formel (NFR-2) · `useMockMqtt`/`test-*.js` existieren nicht (FR-35) |
| Container | CI-Job `container` | healthy ≤ 60 s, Smoke, Persistenz über Neustart, Härtung (FR-17/31, NFR-4) |

Gesamtlaufzeit Ziel ≤ 60 s (SM-C4): Integrationstests nutzen kurze Timeouts (Server-Option `restoreFensterMs: 50`).

**Testbarkeit des Servers:** `server/app.ts` exportiert
```ts
erstelleServer(opts: {
  port: number; mqttUrl: string; strompreis: number; version: string;
  requestHandler?: (req, res) => void;        // Next; fehlt im Test → 404
  upgradeHandler?: (req, socket, head) => void; // nur Dev (HMR)
  restoreFensterMs?: number;                  // Default 500
  jetzt?: () => number;
}): Promise<{ port: number; schliessen(): Promise<void> }>;
```
`server/index.ts` liest nur Env, startet Next (`next({ dev })`, `app.prepare()`) und ruft `erstelleServer` auf.

### 3.11 Umsetzungsreihenfolge und Abhängigkeiten

1. Domänenmodul + Unit-Tests (Katalog, Szenen, Verbrauch, Energie, Befehle, Protokoll, Format).
2. Tooling: `tsconfig.server.json`, Vitest-Konfiguration, Scripts, ESLint-Anpassung, package.json 2.0.0.
3. Server: konfig/log/version → mqtt-speicher → zustandsdienst → ws-verbindungen/ursprung → health → app/index; Integrationstests.
4. Docker/Mosquitto/supervisord/Compose; lokaler Container-Smoke.
5. Client: farbtokens/themeSkript/layout → verbindung + hausReducer → HausProvider/Hooks → Blattkomponenten → Container-Komponenten → App; Komponenten- und axe-Tests.
6. CI-Workflow, Release-Hinweis, Budget-/Smoke-Skripte; alte Workflows löschen.
7. Aufräumen (FR-35) und Doku (FR-34), `docs/abnahme-2.0.md` (NFR-10).

Abhängigkeiten: Protokolltypen (1) sind Vertrag für 3 und 5; Farb-Tokens (5) sind Voraussetzung für den Kontrasttest; CI (6) setzt die npm-Scripts aus 2 voraus.

### 3.12 Elektroauto, Solaranlage, Netzbilanz (2.1)

Quelle: `sprint-change-proposal-2026-09-27.md` §5.3. Leitlinie bleibt: langweilig und schlank, **ein Änderungspfad**, keine neue Laufzeitabhängigkeit, keine neue Infrastruktur.

**Kennzahlen 2.1:** 29 Geräte / 7 Räume (6 im Haus + Carport) · Standby-Anteil Ausgangszustand 13,3 W · Hausverbrauch Ausgangszustand 78,3 W („78 W“) · „Alles an“ 23.978 W · Solar-Erzeugung je Stufe 0 / 980 / 3.430 / 6.370 / 8.330 W · Laden 50 % → 100 % = 9.818 s.

#### 3.12.1 Domänenmodell (exakt)

`src/domain/katalog.ts`
```ts
export type Etage = 'EG' | 'OG' | 'Außen';
export type Kategorie = … | 'mobilitaet';               // KATEGORIE_NAMEN.mobilitaet = 'Mobilität'
export type SymbolName = … | 'wallbox';
RAEUME += { id: 'carport', name: 'Carport', etage: 'Außen' }            // als letzter Eintrag
GERAETE += { id: 'carport.wallbox', name: 'Wallbox', raum: 'carport', kategorie: 'mobilitaet',
             symbol: 'wallbox', betriebW: 11000, standbyW: 3, grundlast: false, autoAusS: null }  // letzter Eintrag
export const HAUS_ETAGEN = ['OG', 'EG'] as const;        // Hausansicht-Raster; 'Außen' separat
```

`src/domain/elektroauto.ts` (neu, rein, ohne Imports außer `./katalog`)
```ts
export const ELEKTROAUTO = {
  name: 'Elektroauto',
  kapazitaetWh: 60_000,
  fahrtWh: 9_000,            // pauschal je Fahrt, abgezogen bei Rückkehr; zugleich Mindeststand zum Wegfahren
  startAkkuWh: 30_000,
  ladegeraet: 'carport.wallbox' as GeraetId,
} as const;

export interface AutoZustand {
  zuhause: boolean;
  akkuWh: number;            // Akkustand in Wh zum Zeitpunkt `stand` (ungerundet, 0 … kapazitaetWh)
  stand: number;             // ms epoch, bis wann akkuWh integriert ist
}

export function ladeleistungW(): number;                                      // = betriebW der Wallbox
export function akkuWhBei(auto: AutoZustand, laedt: boolean, jetzt: number): number;
  // laedt && zuhause ? min(kap, akkuWh + P·max(0, jetzt − stand)/3_600_000) : akkuWh
export function akkuProzent(wh: number): number;                              // Math.floor(wh / kap * 100 + 1e-9), 0…100
export function restLadezeitMs(auto: AutoZustand, laedt: boolean, jetzt: number): number | null;
export function darfLaden(auto: AutoZustand, jetzt: number): boolean;         // zuhause && akkuWhBei(auto,false,jetzt) < kap − 0,5
export function darfWegfahren(auto: AutoZustand, laedt: boolean, jetzt: number): boolean; // zuhause && akku ≥ fahrtWh
export function nachRueckkehr(akkuWh: number): number;                        // max(0, akkuWh − fahrtWh)
export function ausgangsAuto(jetzt: number): AutoZustand;                     // { zuhause: true, akkuWh: 30_000, stand: jetzt }
```

`src/domain/solar.ts` (neu)
```ts
export const SOLARANLAGE = { spitzenleistungW: 9_800 } as const;
export const SONNENSTUFEN = [
  { id: 'nacht',   name: 'Nacht',   anteil: 0 },
  { id: 'bedeckt', name: 'Bedeckt', anteil: 0.10 },
  { id: 'wolkig',  name: 'Wolkig',  anteil: 0.35 },
  { id: 'heiter',  name: 'Heiter',  anteil: 0.65 },
  { id: 'sonnig',  name: 'Sonnig',  anteil: 0.85 },
] as const;
export type SonnenStufe = (typeof SONNENSTUFEN)[number]['id'];
export interface SonnenZustand { stufe: SonnenStufe; seit: number }
export function istSonnenStufe(w: unknown): w is SonnenStufe;
export function sonnenstufeById(id: SonnenStufe): { id; name; anteil };
export function erzeugung(stufe: SonnenStufe): number;          // 9_800 × anteil (ungerundet)
export function ausgangsSonne(jetzt: number): SonnenZustand;    // { stufe: 'nacht', seit: jetzt }
```

`src/domain/verbrauch.ts` (Ergänzungen, Bestehendes unverändert)
```ts
export interface Netzbilanz { verbrauchW: number; erzeugungW: number; bezugW: number; einspeisungW: number }
/** Aus gerundeten Anzeigewerten (FR-41): genau einer von bezugW/einspeisungW ist > 0 oder beide 0. */
export function netzbilanz(verbrauchGerundet: number, erzeugungGerundet: number): Netzbilanz;
export function ertragProStunde(einspeisungW: number, verguetung: number): number;
export function tagesKosten(e: Energie, strompreis: number, verguetung: number): number; // bezug×preis − einsp×verg (darf < 0)
export function tagesErzeugungWh(e: Energie): number;                                 // wh − bezugWh + einspeisungWh
```

- `src/domain/energie.ts`: `integriere(e, verbrauchW, erzeugungW, vonMs, bisMs): Energie` integriert **drei** Reihen (`wh += v·dt`; `bezugWh += max(0, v−e)·dt`; `einspeisungWh += max(0, e−v)·dt`), Tageswechsel wie bisher für alle drei. Ungerundete Werte.
- `src/domain/befehle.ts`: `FELDER` + `sonne: ['typ','id','stufe']`, `auto: ['typ','id','zuhause']`. `pruefeBefehl` prüft `stufe` via `istSonnenStufe` (sonst `UNGUELTIGER_BEFEHL`) und `zuhause` als boolean. Neu (rein): `pruefeRegel(zustand, auto, befehl, jetzt): 'NICHT_MOEGLICH' | null` – Wallbox-Einschalten ohne `darfLaden`, `auto zuhause:false` ohne `darfWegfahren` (nur wenn aktuell zu Hause). `ausgangszustand()` bleibt (Wallbox *Aus*). Neu `erzwingeLadeRegeln(zustand, auto, jetzt)`: setzt das Wallbox-Ziel *Aus*, wenn das Auto unterwegs oder der Akku voll ist (für Restore und Wegfahren).
- `src/domain/szenen.ts`: keine Logikänderung. Die Wallbox ist Nicht-Grundlast → „Alles aus“/„Gute Nacht“ beenden das Laden; keine Szene startet es; Szenen ändern weder Sonnenlage noch Ort des Autos.
- `src/domain/format.ts`: `akku(prozent) → „64 %“`, `kwp(w) → „9,8 kWp“`.

#### 3.12.2 WebSocket-Protokoll (`src/domain/protokoll.ts`)

```ts
export interface Energie { datum: string; wh: number; bezugWh: number; einspeisungWh: number }

export type Befehl =
  | { typ: 'schalten'; id: string; geraet: GeraetId; an: boolean }
  | { typ: 'szene'; id: string; szene: SzeneId }
  | { typ: 'raumAus'; id: string; raum: RaumId }
  | { typ: 'sonne'; id: string; stufe: SonnenStufe }        // neu 2.1
  | { typ: 'auto'; id: string; zuhause: boolean };          // neu 2.1

export type UrsachenArt = 'geraet' | 'szene' | 'raumAus' | 'autoAus' | 'sonne' | 'auto' | 'akkuVoll';
// ref: sonne → Stufe; auto → 'weg' | 'zurueck'; akkuVoll → Geräte-ID der Wallbox

export type FehlerCode = … | 'NICHT_MOEGLICH';   // Meldung: „Aktion ist im aktuellen Zustand nicht möglich.“

export type ServerNachricht =
  | { typ: 'snapshot'; version; zustand: HausZustand; auto: AutoZustand; sonne: SonnenZustand;
      energie: Energie; strompreis: number; einspeiseverguetung: number; serverZeit: number }
  | { typ: 'aenderung'; ursache: Ursache; geraete: Partial<HausZustand>;   // darf {} sein
      auto?: AutoZustand; sonne?: SonnenZustand; energie: Energie }        // Felder nur bei Änderung
  | { typ: 'bestaetigt'; befehlId: string; geaendert: boolean }
  | { typ: 'fehler'; befehlId: string | null; code: FehlerCode; meldung: string }
  | { typ: 'energie'; energie: Energie; auto: AutoZustand; serverZeit: number };
```

**Kompatibilitätsregeln:**
1. Serverversion 2.1.0 ≠ Client 2.0.0 → alter Tab zeigt „Neue Version verfügbar“, verarbeitet nur noch Snapshots, sendet nichts (bestehend, FR-18). Der 2.0-Reducer ignoriert unbekannte Felder und die Zusatz-ID `carport.wallbox` ohne Absturz (er iteriert über seinen eigenen Katalog) – abgesichert per Test mit 2.0-Fixture (T-24).
2. Der 2.1-Client liest fehlende Felder defensiv: `auto` fehlt → `ausgangsAuto`, `sonne` fehlt → `nacht`, `einspeiseverguetung` fehlt → 0,08, `bezugWh` fehlt → `wh`, `einspeisungWh` fehlt → 0.
3. Keine neuen Nachrichtentypen; nur neue Befehle, Felder, Ursachen und ein Fehlercode (Ausnahme in §4.4 vermerkt).
4. Grenzen unverändert: 4-KB-Limit, `maxPayload` 64 KiB, Token-Bucket 100 / 20 pro s je Verbindung, 200 Ablehnungen in Folge → Trennung, max. 100 Verbindungen, Origin-/Host-Prüfung.

**Ablauf je Befehl (Ergänzung zu §3.5 Schritt 4/5):** nach `pruefeBefehl` → `pruefeRegel` (Zustand jetzt) → bei Verstoß `fehler NICHT_MOEGLICH` mit `befehlId`, Log `befehl typ=… ergebnis=NICHT_MOEGLICH` (gedrosselt wie bisher), Zustand unverändert.

#### 3.12.3 Zustandsdienst (`server/zustandsdienst.ts`)

- Zusätzliche Felder `auto: AutoZustand`, `sonne: SonnenZustand`, `akkuVollTimer`.
- **Ein Änderungspfad bleibt:** `aendere(aenderung: { ziele?: Partial<Record<GeraetId, boolean>>; auto?: (a: AutoZustand) => AutoZustand; sonne?: SonnenStufe }, ursache)`. Ablauf: `integriereBis(jetzt)` (Energie **und** Akku) → Geräteziele + Auto + Sonne anwenden → `erzwingeLadeRegeln` → Diff bilden → ohne Änderung `false` → **eine** `aenderung` (nur geänderte Teile) → Persistenz der geänderten Teile → Akku-voll-Timer neu planen oder löschen.
- `fuehreAus(befehl)` liefert `{ ok: true; geaendert: boolean } | { ok: false; code: 'NICHT_MOEGLICH' }`.
- **`integriereBis(jetzt)`:** wie bisher `von = max(stand, jetzt − MAX_INTEGRATION_MS)`; Energie mit `hausverbrauch` und `erzeugung(sonne.stufe)`; Akku: wenn Wallbox *An* und Auto zu Hause, `akkuWh = min(kap, akkuWh + 11.000 · (jetzt − von) / 3.600.000)`, `auto.stand = jetzt`. Die geladene Energie entspricht damit exakt der für die Wallbox integrierten Energie.
- **Akku-voll-Timer** (analog Auto-Aus, AD-09/AD-25): bei Wallbox *An* `setTimeout((kap − akkuWh) / P · 3.600.000)`; beim Feuern `aendere({ ziele: { wallbox: false } }, { art: 'akkuVoll', ref: wallbox, befehlId: null })`, danach `akkuWh = kap` (Rest ≤ 0,5 Wh wird auf `kap` gesetzt), Logzeile `akku_voll`. Neu geplant nach jedem Energie-Takt.
- **Energie-Takt (60 s):** integriert (Energie + Akku), persistiert Energie **und** Auto, sendet `energie` inkl. `auto`.
- **Start/Restore:** `auto.stand = jetzt` (Ausfallzeit lädt nicht, wie FR-10); `erzwingeLadeRegeln` (Wallbox aus, wenn unterwegs oder voll) vor `speichereAlles()`; Akku-voll-Timer planen.
- **Stopp (SIGTERM):** integrieren, Energie und Auto persistieren (bestehendes 2-s-Fenster).
- `server/ws-verbindungen.ts`: `MELDUNGEN.NICHT_MOEGLICH`, Auswertung des `fuehreAus`-Ergebnisses.

#### 3.12.4 MQTT-Topics (retained, QoS 1, nur der Server)

| Topic | Payload | Geschrieben |
|---|---|---|
| `iot-haus/v2/geraet/carport.wallbox/zustand` | `{ "v": 1, "an": false, "seit": … }` (bestehendes Schema) | wie alle Geräte |
| `iot-haus/v2/auto/zustand` **(neu)** | `{ "v": 1, "zuhause": true, "akkuWh": 30000, "stand": 1790000000000 }` | bei Änderung, jedem Energie-Takt, Stopp, `speichereAlles` |
| `iot-haus/v2/solar/sonne` **(neu)** | `{ "v": 1, "stufe": "nacht", "seit": 1790000000000 }` | bei Änderung, `speichereAlles` |
| `iot-haus/v2/energie/heute` **(v: 2)** | `{ "v": 2, "datum": "2026-09-27", "wh": 3420.5, "bezugWh": 2100.2, "einspeisungWh": 4300.9, "stand": … }` | wie bisher |

**Validierung beim Restore** (`uebernimmGespeichert` in `server/mqtt-speicher.ts`): Auto – `zuhause` boolean, `akkuWh`/`stand` endlich ≥ 0, `akkuWh` auf `[0, kap]` begrenzt; Sonne – bekannte Stufe, `seit` endlich ≥ 0; Energie – `v: 1` (nur `wh`) wird als `bezugWh = wh, einspeisungWh = 0` übernommen (2.0 hatte keine Solaranlage), `v: 2` verlangt alle drei Werte endlich ≥ 0. Sonst `restore_ignoriert topic=…` und Ausgangswert. Präfix `iot-haus/v2` bleibt (kein Schemabruch). Neue Funktionen `speichereAuto`, `speichereSonne`; Typ `Gespeichert` erweitert.

#### 3.12.5 Konfiguration

- `server/konfig.ts`: `leseStrompreis` wird zu `leseEuroProKwh(name, wert, standard, log)` verallgemeinert; `leseStrompreis`/`leseEinspeiseverguetung` sind dünne Aufrufe. **`EINSPEISEVERGUETUNG_EUR_PRO_KWH`**, Standard `0.08`, Regeln wie der Strompreis (leer → INFO `einspeiseverguetung quelle=standard`, ungültig/negativ → WARN `einspeiseverguetung_ungueltig`, `0` gültig).
- `server/index.ts` / `server/app.ts`: Option `einspeiseverguetung` an `erstelleServer`; der Snapshot enthält sie.
- Spitzenleistung, Akku und Wallbox sind Katalogwerte, **keine** Umgebungsvariablen.

#### 3.12.6 Client (`src/client/hausReducer.ts`, `src/hooks/useHaus.tsx`)

- `ServerDaten` + `auto`, `sonne`, `einspeiseverguetung`; `snapshot` setzt sie (defensiv, Regel 2 in §3.12.2).
- `aenderung`: Geräte wie bisher; `auto`/`sonne` übernehmen; die Frühausstiegsregel „keine Geräte → nur Energie“ gilt nur, wenn **auch** `auto` und `sonne` fehlen. Ursachen-Whitelist um `sonne`, `auto`, `akkuVoll` erweitert.
- `energie`: übernimmt `energie` und `auto`.
- `Ausstehend.art` + `'sonne' | 'auto'`; `sonne` mit `zielStufe` (optimistische Auswahl wie Einzelschalter, FR-21), `auto` ohne optimistische Anzeige (wie Szene).
- Neue Selektoren: `anzeigeSonne(z) → { stufe, beschaeftigt }`, `akkuJetzt(z, jetzt)` (über `akkuWhBei` + `uhrVersatzMs`, dieselbe Domänenfunktion wie im Server – AD-24).
- `MeldungsArt` + `'solar'` (Symbol Sonne, Farbe `solar`).
- `HausKontext` + `sonne(stufe)`, `auto(zuhause)`; `sende` unverändert (Sperre bei nicht bedienbar/beschäftigt).
- `fehlerMeldung` + Texte für `sonne`/`auto`; `NICHT_MOEGLICH` nutzt denselben Weg wie jeder `fehler` mit `befehlId`.

#### 3.12.7 Umsetzungsreihenfolge 2.1

Epic 8: Domäne (8.1) → Server (8.2) → Client-Zustand (8.3) → UI (8.4 ∥ 8.5 ∥ 8.6) → Doku/Release 2.1.0 (8.7), analog §3.11. JS-Budget-Erwartung ≤ 126 kB, harte Grenze 200 kB unverändert.

---

## 4. Umsetzungsmuster und Konsistenzregeln

### 4.1 Benennung

- **Sprache:** Fachbegriffe im Code deutsch wie im Glossar (`geraet`, `raum`, `szene`, `hausverbrauch`, `zustand`, `energie`), ohne Umlaute/ß in Bezeichnern (`kueche`, `geraeteZustand`, `groesse`). Technische Standardbegriffe dürfen englisch bleiben (`props`, `handler`, `ref`, `id`).
- **IDs:** Räume/Szenen `kebab-case` bzw. einzelnes Wort (`wohnzimmer`, `gute-nacht`); Geräte `‹raum›.‹geraet›` (`kueche.mikrowelle`) – exakt Anhang A.
- **Dateien:** Komponenten `PascalCase.tsx`, Hooks `useXyz.ts`, sonst `kebab-case.ts`/`camelCase.ts` wie oben festgelegt; Tests co-lokalisiert `*.test.ts(x)`, Integration/Architektur unter `tests/`.
- **Protokoll:** Feldnamen camelCase deutsch, Diskriminator `typ`, Fehlercodes `SCREAMING_SNAKE` deutsch.
- **Topics:** `iot-haus/v2/…`, Kleinbuchstaben, Segmente deutsch.
- **Env:** bestehende Namen + `STROMPREIS_EUR_PRO_KWH`.

### 4.2 Struktur

- `src/domain/` kennt nichts außerhalb von sich selbst. `server/` importiert `../src/domain/…`, nie `src/components` oder `src/client`. `src/client/` ist framework-frei (kein React). React nur in `src/components/`, `src/hooks/`, `src/app/`.
- Katalogwerte (Namen, Leistungen, IDs) nur in `src/domain/katalog.ts`/`szenen.ts`; UI-Texte, die Katalognamen enthalten, werden aus dem Katalog zusammengesetzt.
- Zeitabhängiger Code nimmt `jetzt` als Parameter (Domäne) oder injizierte Funktion (Server).

### 4.3 Formate

- Zeitpunkte als **ms seit Epoch (number)**, Datumsangaben als `YYYY-MM-DD` (Berlin). Keine ISO-Strings im Protokoll.
- Leistung in W, Energie in **Wh** (ungerundet) im Protokoll/MQTT; Umrechnung in kWh und Rundung ausschließlich beim Anzeigen (FR-29).
- Strompreis als number (€/kWh).
- Booleans als `true/false`; keine `null`-Werte außer `befehlId`.

### 4.4 Kommunikation und Zustand

- Zustand wird immutabel aktualisiert (Domäne gibt neue Objekte zurück; Reducer ebenso).
- Jede Zustandsänderung – egal ob Nutzer, Szene, Raum oder Auto-Aus – läuft durch **eine** Funktion `fuehreAus(befehl, ursache)` im Zustandsdienst (ein Pfad für Integration, Timer, Broadcast, Persistenz).
- Eine Änderung = genau eine `aenderung`-Nachricht (FR-16).
- Keine weiteren WS-Nachrichtentypen ohne Änderung dieses Dokuments.
- **Ausnahme 2.1 (dokumentiert, §3.12.2):** neue Befehle `sonne` und `auto`, optionale Felder `auto`/`sonne` in `aenderung`, `auto` in `energie`, `auto`/`sonne`/`einspeiseverguetung` im Snapshot, Ursachen `sonne`/`auto`/`akkuVoll` und Fehlercode `NICHT_MOEGLICH` – **keine** neuen Nachrichtentypen. Auch Auto- und Sonnenänderungen laufen über denselben Änderungspfad (`aendere`); Wegfahren inkl. Laden-Ende ist genau eine `aenderung` (AD-23).

### 4.5 Fehlerbehandlung und Logging

- Server: Jeder WS-Nachrichtenhandler ist in `try/catch` gekapselt; unerwartete Fehler → `fehler UNGUELTIGER_BEFEHL` + `log.fehler`, niemals Prozessabbruch. `process.on('uncaughtException')` loggt und beendet mit Exit 1 (supervisord startet neu).
- Log-Format (`server/log.ts`, einzige Stelle mit `console.*` im Server): eine Zeile `‹ISO-Zeit› ‹INFO|WARN|FEHLER› ‹ereignis› schluessel=wert …`. Ereignisse: `start`, `bereit`, `mqtt_verbunden`, `mqtt_getrennt`, `befehl typ=… ergebnis=ok|keine_aenderung|‹code›`, `auto_aus geraet=…`, `restore_ignoriert`, `strompreis_ungueltig`, `ws_abgelehnt grund=origin|nicht_bereit`, `stopp`. Keine Payloads.
- Client: `console.*` verboten außer `console.error` bei echten Fehlern (ESLint `no-console: ['warn', { allow: ['error'] }]` für `src/`, mit `--max-warnings=0` faktisch Fehler). Nutzerfehler nur als deutsche Meldungen (Toast/Banner).

### 4.6 Lade- und Verbindungszustände

- `verbindung` ist die einzige Quelle für „bedienbar“: bedienbar ⇔ `verbindung === 'verbunden' && server !== null && !versionKonflikt`.
- Ladezustand = `server === null` → Skeleton. Nach Wiederverbindung bleibt der letzte bekannte Zustand sichtbar (gesperrt) bis zum neuen Snapshot.
- Ausstehende Befehle sind lokal pro Gerät/Befehl, keine globale Ladeanzeige.

### 4.7 Durchsetzung

`npm run lint` (0 Warnungen), `npm run typecheck`, Architekturtests (§3.10) und Coverage-Schwelle in CI. ESLint-Konfiguration: `ignores` um `dist/**`, `coverage/**` ergänzen; `no-console` für `src/**`; für `server/**` erlaubt nur in `server/log.ts`.

---

## 5. Projektstruktur und Grenzen

### 5.1 Zielstruktur (nach Umsetzung)

```
iot-haus/
├── .github/
│   ├── workflows/ci-release.yml            NEU (ersetzt docker-publish.yml, release.yml)
│   ├── release-hinweise/v2.0.0.md          NEU (Upgrade-Hinweis 2.0.0)
│   ├── release-hinweise/v2.1.0.md          NEU 2.1 (Pflicht für den Release-Job)
│   └── copilot-instructions.md             AKTUALISIERT
├── docker/
│   ├── mosquitto.conf                      GEÄNDERT (autosave)
│   ├── supervisord.conf                    GEÄNDERT (dist, stop*)
│   └── start.sh                            GEÄNDERT (nur Texte „IoT-Haus“)
├── docs/                                   AKTUALISIERT auf 2.0 + abnahme-2.0.md NEU
├── public/                                 apple-touch-icon.svg bleibt; window.svg GELÖSCHT
├── scripts/
│   ├── pruefe-js-budget.mjs                NEU
│   ├── smoke-container.mjs                 NEU
│   └── dev-broker.mjs                      NEU (aedes auf :1883 für lokale Entwicklung)
├── server/
│   ├── index.ts                            Einstieg: Env, Next, erstelleServer, Signale
│   ├── app.ts                              HTTP-Server, Health, Upgrade, Verdrahtung
│   ├── zustandsdienst.ts (+ .test.ts)      Zustand, fuehreAus, Energie-Tick, Auto-Aus
│   ├── mqtt-speicher.ts                    Verbinden, Restore, retained Publish, Flush
│   ├── ws-verbindungen.ts                  Clients, Parse, Broadcast, Heartbeat
│   ├── ursprung.ts (+ .test.ts)            Origin-Prüfung
│   ├── health.ts                           /api/health
│   ├── konfig.ts (+ .test.ts)              Env-Parsing (Port, Broker, Strompreis, 2.1: Einspeisevergütung)
│   ├── version.ts                          package.json-Version
│   └── log.ts                              Einzeilen-Logger
├── src/
│   ├── domain/
│   │   ├── katalog.ts                      RAEUME, GERAETE, KATEGORIEN, Typen, geraetById
│   │   ├── szenen.ts                       SZENEN (Daten), wendeSzeneAn
│   │   ├── verbrauch.ts                    Summen, Laststufe, Kosten
│   │   ├── energie.ts                      berlinDatum, naechsteMitternachtBerlin, integriere
│   │   ├── befehle.ts                      pruefeBefehl, wendeAn, ausgangszustand
│   │   ├── protokoll.ts                    Befehl, ServerNachricht, FehlerCode, Grenzen (4096)
│   │   ├── format.ts                       de-DE-Formatierer (2.1: + akku, kwp)
│   │   ├── elektroauto.ts (+ .test.ts)     NEU 2.1: ELEKTROAUTO, AutoZustand, Akku-/Laderegeln
│   │   ├── solar.ts (+ .test.ts)           NEU 2.1: SOLARANLAGE, SONNENSTUFEN, erzeugung
│   │   └── *.test.ts
│   ├── client/
│   │   ├── verbindung.ts (+ .test.ts)      HausVerbindung (WS, Backoff, Lebenszeichen)
│   │   └── hausReducer.ts (+ .test.ts)     ClientZustand, Aktionen, Anzeige-Selektoren
│   ├── hooks/
│   │   ├── useHaus.tsx                     HausProvider + useHaus
│   │   ├── useHochzaehlen.ts, useRestzeit.ts, useMeldungen.ts,
│   │   ├── useAnsage.ts, useTheme.ts, useReduzierteBewegung.ts
│   ├── components/
│   │   ├── App.tsx, Sprunglink.tsx, VersionsBanner.tsx, VerbindungsBanner.tsx
│   │   ├── Kopfbereich.tsx, Zaehler.tsx, LaststufePille.tsx, VerbindungsStatus.tsx
│   │   ├── Uebersicht.tsx, ThemeWahl.tsx, InfoHinweis.tsx
│   │   ├── Szenenleiste.tsx, SzenenKnopf.tsx
│   │   ├── Hausansicht.tsx, RaumFlaeche.tsx, VerbrauchNachRaum.tsx
│   │   ├── Raumkarte.tsx, GeraeteZeile.tsx, Schalter.tsx, RaumAusKnopf.tsx
│   │   ├── GrundlastDialog.tsx, Meldungen.tsx, LiveRegion.tsx, Skeleton.tsx, Symbol.tsx
│   │   ├── NetzZeile.tsx, Solaranlage.tsx, SonnenWahl.tsx, Elektroauto.tsx, CarportFlaeche.tsx   NEU 2.1
│   │   └── *.test.tsx
│   ├── ui/
│   │   ├── farbtokens.ts                   Tokens hell/dunkel + Prüfpaare
│   │   └── themeSkript.ts                  Inline-Skript (String)
│   └── app/
│       ├── layout.tsx                      GEÄNDERT
│       ├── page.tsx                        ERSETZT (rendert <App/>)
│       ├── globals.css                     ERSETZT (Tokens, dark-Variante, reduced motion)
│       └── favicon.ico
├── tests/
│   ├── integration/protokoll.test.ts, persistenz.test.ts, broker-ausfall.test.ts, hilfen.ts
│   ├── architektur/geraete-ids.test.ts, texte.test.ts, kontrast.test.ts, aufgeraeumt.test.ts
│   └── fixtures/snapshot.ts
├── Dockerfile, docker-compose.yml, docker-compose.prod.yml, .dockerignore
├── package.json, package-lock.json, tsconfig.json, tsconfig.server.json
├── vitest.config.mts, vitest.setup.ts, eslint.config.mjs, next.config.ts, postcss.config.mjs
└── README.md, API.md, DOCKER-SETUP.md, KUBERNETES.md, GITHUB-ACTIONS.md
```

### 5.2 Grenzen

- **Extern:** HTTP `:3000` (Seiten, Assets, `/api/health`), WS `/mqtt`. Sonst nichts.
- **Intern:** Server ↔ Mosquitto über MQTT auf `127.0.0.1`; ausschließlich `iot-haus/v2/#`.
- **Daten:** Serverspeicher = Wahrheit; Broker = Persistenz; Browser = Anzeige + Theme-Präferenz.
- **Code:** Domäne ← Server, Domäne ← Client; Server und Client kennen einander nur über `src/domain/protokoll.ts`.

### 5.3 Datenfluss „Mikrowelle an“ (UJ-2/UJ-4)

1. `Schalter` → `useHaus().schalten('kueche.mikrowelle', true)` → Reducer: `ausstehend[id]` (Schalter zeigt *An* + `aria-busy`, ≤ 100 ms) → `HausVerbindung.sende({ typ: 'schalten', … })`.
2. Server: prüfen → integrieren → anwenden → Auto-Aus-Timer 180 s → `aenderung` an alle → publish retained → `bestaetigt` an Absender.
3. Alle Clients: Serverzustand aktualisieren → Zähler zählt 600 ms hoch → Meldung „+1.199 W · Mikrowelle (Küche)“ → Ansage „Mikrowelle an. Hausverbrauch 1.274 Watt.“; Absender entfernt `ausstehend`.
4. Nach 180 s: Server-Timer → `aenderung` mit `art: 'autoAus'` → „−1.199 W · Mikrowelle (Küche) automatisch ausgeschaltet“.

### 5.4 Anforderungen → Struktur

| Anforderungen | Orte |
|---|---|
| FR-1, FR-2, FR-4 (Daten) | `src/domain/katalog.ts`, `tests/architektur/geraete-ids.test.ts` |
| FR-3, FR-18, FR-19 | `src/domain/befehle.ts`, `src/domain/protokoll.ts`, `server/ws-verbindungen.ts`, `server/zustandsdienst.ts` |
| FR-4 (Dialog) | `src/components/GrundlastDialog.tsx`, `Raumkarte.tsx` |
| FR-5 | `server/zustandsdienst.ts`, `src/hooks/useRestzeit.ts`, `GeraeteZeile.tsx` |
| FR-6, FR-9, FR-12, FR-13 | `src/domain/verbrauch.ts`, `Kopfbereich.tsx`, `Zaehler.tsx`, `LaststufePille.tsx`, `Uebersicht.tsx`, `server/konfig.ts` |
| FR-7, FR-8, FR-26, FR-27 | `Hausansicht.tsx`, `RaumFlaeche.tsx`, `VerbrauchNachRaum.tsx`, `Raumkarte.tsx`, `GeraeteZeile.tsx`, `Schalter.tsx`, `RaumAusKnopf.tsx` |
| FR-10 | `src/domain/energie.ts`, `server/zustandsdienst.ts`, `server/mqtt-speicher.ts`, `InfoHinweis.tsx` |
| FR-11 | `src/client/hausReducer.ts`, `useMeldungen.ts`, `useAnsage.ts`, `Meldungen.tsx`, `LiveRegion.tsx` |
| FR-14, FR-15, FR-16, FR-17 | `server/*`, `src/client/*`, `docker/mosquitto.conf`, `themeSkript.ts` (Altschlüssel löschen), `Skeleton.tsx` |
| FR-20, FR-21 | `src/client/verbindung.ts`, `hausReducer.ts`, `VerbindungsBanner.tsx`, `VerbindungsStatus.tsx` |
| FR-22–24 | `src/domain/szenen.ts`, `Szenenleiste.tsx`, `SzenenKnopf.tsx` |
| FR-25, FR-28, FR-29 | `App.tsx`, `layout.tsx`, `globals.css`, `src/ui/*`, `useTheme.ts`, `ThemeWahl.tsx`, `src/domain/format.ts` |
| FR-30, FR-31 | `server/health.ts`, `Dockerfile`, Compose-Dateien |
| FR-32, FR-33 | `.github/workflows/ci-release.yml`, `scripts/*`, `.github/release-hinweise/v2.0.0.md`, `package.json` |
| FR-34 | README, API.md, DOCKER-SETUP.md, KUBERNETES.md, GITHUB-ACTIONS.md, copilot-instructions.md, `docs/*` |
| FR-35 | Löschungen §8, `eslint.config.mjs`, `server/log.ts`, `tests/architektur/aufgeraeumt.test.ts` |
| NFR-1 | `scripts/pruefe-js-budget.mjs`, Integrationstest p95, `useHochzaehlen` (nur transform/opacity + Zahl) |
| NFR-2 | `src/ui/farbtokens.ts`, `kontrast.test.ts`, axe-Tests, `layout.tsx` (viewport) |
| NFR-4 | `server/ursprung.ts`, `ws-verbindungen.ts`, Dockerfile, CI-Härtungsprüfung, `next.config.ts` (Header) |
| NFR-5 | `server/mqtt-speicher.ts`, `app.ts`, `broker-ausfall.test.ts` |
| NFR-6, NFR-7 | `vitest.config.mts`, Tests, `server/log.ts` |
| NFR-8, NFR-3 | nur Standard-Web-APIs (kein `randomUUID`, natives `<dialog>` in allen Zielbrowsern), Abnahme-Checkliste |
| NFR-9 | Compose-Dateien, `server/konfig.ts`, Release-Hinweis |
| NFR-10 | `docs/abnahme-2.0.md`, 2.1: `docs/abnahme-2.1.md` |
| FR-36 … FR-39 (2.1) | `src/domain/katalog.ts`, `elektroauto.ts`, `befehle.ts`, `server/zustandsdienst.ts`, `server/mqtt-speicher.ts`, `Elektroauto.tsx`, `Raumkarte.tsx`, `GeraeteZeile.tsx`, `CarportFlaeche.tsx` |
| FR-40 … FR-42 (2.1) | `src/domain/solar.ts`, `verbrauch.ts`, `energie.ts`, `server/zustandsdienst.ts`, `server/konfig.ts`, `NetzZeile.tsx`, `Kopfbereich.tsx`, `Uebersicht.tsx`, `Solaranlage.tsx`, `SonnenWahl.tsx` |
| FR-43, FR-44 (2.1) | `Hausansicht.tsx`, `App.tsx`, `src/ui/*`, `package.json`, `.github/release-hinweise/v2.1.0.md`, `docs/abnahme-2.1.md` |

---

## 6. Validierung

### 6.1 Kohärenz

- TS-Server-Kompilat + gemeinsames Domänenmodul passen zu Next (Bundler-Auflösung) und Node (CommonJS), weil die Domäne nur relative, endungslose Imports nutzt. ✔
- Retained Persistenz + autosave je Änderung + SIGTERM-Flush + 60-s-Tick erfüllen FR-10/FR-17 ohne Dateispeicher neben dem Broker. ✔
- Broker-Ausfall schließt WS-Verbindungen → UI kann nie einen nicht persistierbaren Zustand bedienen; passt zu D-17 (keine Offline-Warteschlange). ✔
- Aedes in Tests + Mosquitto im Container-Job decken Logik und echte Konfiguration getrennt ab. ✔
- Keine neue Laufzeitabhängigkeit; Healthcheck nur mit `node`; Härtung unverändert. ✔

### 6.2 Abdeckung

Alle 35 FR und 10 NFR sind in §5.4 einem Ort und in §3.10 einem Test oder einer Abnahmeprüfung zugeordnet. Die UX-Details (genaue Farben, Abstände, Icon-Formen, Texte des Skeleton) liegen beim UX-Spec (Sally) und berühren keine Architekturentscheidung; die Token-Struktur (`farbtokens.ts`) ist dafür vorbereitet.

### 6.3 Behobene Punkte während der Validierung

- Addendum-Healthcheck-Intervall 30 s hätte „healthy ≤ 60 s“ nur knapp erreicht → 10 s (AD-14).
- `ws`-`maxPayload: 4096` hätte statt Fehlerantwort die Verbindung getrennt → zweistufig (AD-07).
- `crypto.randomUUID` fehlt über http im LAN → eigene Befehls-ID.
- `next build` würde Tests typprüfen → devDependencies sind im Builder-Stage vorhanden (Stage `deps` installiert alle); `.dockerignore` schließt `tests/`, `coverage/`, `dist/`, `_bmad*/`, `docs/` trotzdem aus, `src/**/*.test.tsx` bleiben (co-lokalisiert) und werden von `tsconfig` erfasst – unkritisch.
- Next-Lint beim Build: `eslint.ignoreDuringBuilds: true` in `next.config.ts`, weil Lint ein eigener CI-Schritt ist (kein doppelter Lauf, schnellerer Docker-Build).

### 6.4 Checkliste

**Anforderungsanalyse** – [x] Kontext analysiert · [x] Umfang/Komplexität · [x] Randbedingungen · [x] Querschnittsthemen
**Entscheidungen** – [x] kritische Entscheidungen mit Versionen · [x] Stack vollständig · [x] Integrationsmuster · [x] Performance
**Muster** – [x] Benennung · [x] Struktur · [x] Kommunikation · [x] Prozesse
**Struktur** – [x] Verzeichnisbaum · [x] Komponentengrenzen · [x] Integrationspunkte · [x] Anforderungs-Mapping

**Status: READY FOR IMPLEMENTATION** · Konfidenz: hoch.

**Stärken:** eine Quelle für Katalog und Logik; ein Änderungspfad im Server; keine neue Laufzeitabhängigkeit; jede Anforderung hat einen automatisierten Nachweis oder einen Abnahmepunkt.

**Übergabe an Umsetzung:** Entscheidungen exakt befolgen; neue Nachrichtentypen, Topics oder Abhängigkeiten nur nach Änderung dieses Dokuments. Erster Schritt: `src/domain/katalog.ts` + `katalog.test.ts` aus Anhang A.

---

## 7. Konfiguration (vollständig)

| Variable | Default | Wirkung |
|---|---|---|
| `PORT` | `3000` | HTTP/WS-Port |
| `HOSTNAME` | `0.0.0.0` | Bind-Adresse |
| `MQTT_BROKER_HOST` / `MQTT_BROKER_PORT` | `127.0.0.1` / `1883` | Broker |
| `STROMPREIS_EUR_PRO_KWH` | `0.35` | Dezimalpunkt; ungültig/negativ/leer → 0,35 + Logzeile `strompreis_ungueltig` (FR-9). `0` ist gültig. |
| `EINSPEISEVERGUETUNG_EUR_PRO_KWH` (2.1) | `0.08` | Regeln wie Strompreis; leer → INFO `einspeiseverguetung quelle=standard`, ungültig/negativ → 0,08 + WARN `einspeiseverguetung_ungueltig`. `0` ist gültig. |
| `NODE_ENV` | `production` im Image | `!== 'production'` → Next-Dev-Modus |
| `NEXT_PUBLIC_MQTT_BROKER_URL` | – | wird ignoriert (NFR-9) |

`package.json`-Scripts:
```json
{
  "dev": "tsc -p tsconfig.server.json && node dist/server/index.js",
  "dev:broker": "node scripts/dev-broker.mjs",
  "build": "next build && tsc -p tsconfig.server.json",
  "start": "node dist/server/index.js",
  "lint": "eslint . --max-warnings=0",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
}
```
(`docker:*`/`compose:*`-Scripts bleiben.)

---

## 8. Änderungsliste Datei für Datei

### 8.1 Löschen

| Datei | Grund |
|---|---|
| `server.js` | ersetzt durch `server/*.ts` (AD-01) |
| `src/app/api/health/route.ts` | Health im Node-Server (FR-30) |
| `src/hooks/useMockMqtt.ts`, `useMqtt.ts`, `useWebSocketMqtt.ts` | toter Code / ersetzt (FR-35) |
| `src/components/ControlPanel.tsx`, `HouseVisualization.tsx`, `RoomComponent.tsx` | ersetzt durch neuen Komponentenbaum |
| `src/types/index.ts` | Typen wandern nach `src/domain/` |
| `test-container-mqtt.js`, `test-container-mqtt-detailed.js`, `test-container-publish.js`, `test-multi-device.js` | durch Tests ersetzt (FR-35) |
| `public/window.svg` | ungenutzt |
| `.github/workflows/docker-publish.yml`, `.github/workflows/release.yml` | ersetzt durch `ci-release.yml` (FR-33) |
| `MOBILE-OPTIMIZATION.md`, `BUILD-OPTIMIZATION.md` | Inhalte in README/DOCKER-SETUP (FR-34) |

### 8.2 Ändern

| Datei | Änderung |
|---|---|
| `package.json` | Version `2.0.0`; Scripts §7; devDeps §3.10; `@types/ws` → dev; `@types/mqtt` weg; `@types/node ^22`; `overrides` bleiben |
| `package-lock.json` | per `npm install` neu erzeugt |
| `tsconfig.json` | `target ES2022`, `exclude: ["node_modules","dist"]` |
| `eslint.config.mjs` | ignores `dist/**`, `coverage/**`; `no-console` (warn, allow error) für `src/**` und `server/**` außer `server/log.ts`; `scripts/**/*.mjs` als Node-Globals |
| `next.config.ts` | `env.NEXT_PUBLIC_APP_VERSION` aus package.json; `headers()` (§3.6); `eslint.ignoreDuringBuilds: true` |
| `src/app/layout.tsx` | `viewport`-Export ohne Zoom-Sperre, deutscher Titel/Beschreibung, Token-`<style>`, Theme-Inline-Skript, `suppressHydrationWarning`, keine `<meta>`-Duplikate, kein PNG-Icon-Link |
| `src/app/page.tsx` | nur `<App />` |
| `src/app/globals.css` | Tokens via `@theme inline`, `@custom-variant dark`, Fokusrahmen, `prefers-reduced-motion`, 44-px-Trefferflächen; alte Blobs/Animationen entfernen |
| `Dockerfile` | `dist` kopieren statt `server.js`, `HEALTHCHECK` (§3.9), `NEXT_PUBLIC_…`-ENV weg; Härtung unverändert |
| `docker/mosquitto.conf` | `autosave_interval 1`, `autosave_on_changes true` |
| `docker/supervisord.conf` | `node dist/server/index.js`, `stopsignal=TERM`, `stopwaitsecs=5` (beide Programme), Env ohne `NEXT_PUBLIC_…` |
| `docker/start.sh` | Starttext „IoT-Haus 2.0“ (keine funktionale Änderung) |
| `docker-compose.yml`, `docker-compose.prod.yml` | Healthcheck-Block, `mosquitto-logs`, `NEXT_PUBLIC_…` entfernen; Strompreis-Beispiel |
| `.dockerignore` | zusätzlich `_bmad/`, `_bmad-output/`, `docs/`, `tests/`, `coverage/`, `dist/`, `scripts/`, `test-*.js`; `Dockerfile`/`*.md`-Regeln bleiben |
| `.gitignore` | `/dist`, `build.log` |
| `.vscode/tasks.json` | unverändert (nutzt `npm run dev`) |
| `README.md` | FR-34 komplett neu (Deutsch, Funktionen, Katalog-Verweis, Strompreis, Betrieb, Update inkl. Upgrade-Hinweis 2.0.0, Entwicklung mit `dev:broker`, Reverse-Proxy-Empfehlung) |
| `API.md` | WS-Protokoll §3.5 + Topic-Schema §3.4 |
| `DOCKER-SETUP.md`, `KUBERNETES.md` | Healthcheck ohne curl, Probes auf `/api/health`, keine `k8s/`-Verweise auf Nichtexistentes |
| `GITHUB-ACTIONS.md`, `.github/copilot-instructions.md` | neue Pipeline und Struktur |
| `docs/architecture.md`, `api-contracts.md`, `data-models.md`, `component-inventory.md`, `source-tree-analysis.md`, `deployment-guide.md`, `development-guide.md`, `index.md` | auf Stand 2.0 bringen (Verweis auf dieses Dokument) |

### 8.3 Neu

`server/{index,app,zustandsdienst,mqtt-speicher,ws-verbindungen,ursprung,health,konfig,version,log}.ts` · `src/domain/{katalog,szenen,verbrauch,energie,befehle,protokoll,format}.ts` · `src/client/{verbindung,hausReducer}.ts` · `src/hooks/{useHaus.tsx,useHochzaehlen,useRestzeit,useMeldungen,useAnsage,useTheme,useReduzierteBewegung}.ts` · `src/components/*` (§5.1) · `src/ui/{farbtokens,themeSkript}.ts` · Tests (§3.10) · `tsconfig.server.json` · `vitest.config.mts` · `vitest.setup.ts` · `scripts/{pruefe-js-budget,smoke-container,dev-broker}.mjs` · `.github/workflows/ci-release.yml` · `.github/release-hinweise/v2.0.0.md` · `docs/abnahme-2.0.md`.

### 8.4 Änderungsliste 2.1.0 (Elektroauto & Solaranlage)

Quelle: `sprint-change-proposal-2026-09-27.md` §8.

**Neu**
- `src/domain/elektroauto.ts` (+ Test), `src/domain/solar.ts` (+ Test)
- `src/components/NetzZeile.tsx`, `Solaranlage.tsx`, `SonnenWahl.tsx`, `Elektroauto.tsx`, `CarportFlaeche.tsx`
- `server/mqtt-speicher.test.ts` (falls nicht vorhanden, sonst Erweiterung)
- `.github/release-hinweise/v2.1.0.md` (Pflicht), `docs/abnahme-2.1.md` + `docs/abnahme-2.1/*.png`

**Ändern – Domäne:** `katalog.ts` (Etage `Außen`, Kategorie `mobilitaet`, Symbol `wallbox`, Raum `carport`, Gerät `carport.wallbox`, `HAUS_ETAGEN`) · `protokoll.ts` (§3.12.2) · `befehle.ts` (`FELDER`, `pruefeBefehl`, `pruefeRegel`, `erzwingeLadeRegeln`) · `verbrauch.ts` (`netzbilanz`, `ertragProStunde`, `tagesKosten`, `tagesErzeugungWh`) · `energie.ts` (drei Reihen) · `format.ts` (`akku`, `kwp`) · `szenen.ts` (nur Kommentar) · Tests `katalog`, `verbrauch`, `befehle`, `energie-format`.

**Ändern – Server:** `zustandsdienst.ts` (Auto/Sonne, `aendere`-Signatur, `integriereBis` mit Akku, Akku-voll-Timer, Restore-Normalisierung, `fuehreAus`-Ergebnis, Snapshot/Energie-Nachricht) · `ws-verbindungen.ts` (`NICHT_MOEGLICH`) · `mqtt-speicher.ts` (Topics `auto/zustand`, `solar/sonne`, Energie `v: 2` + Migration) · `konfig.ts` (`leseEuroProKwh`, `leseEinspeiseverguetung`) · `app.ts`, `index.ts` (Option `einspeiseverguetung`) · Tests `zustandsdienst`, `konfig`, `tests/integration/{protokoll,persistenz}.test.ts`, `hilfen.ts`.

**Ändern – Client/UI:** `hausReducer.ts` (+ Test, §3.12.6) · `useHaus.tsx` (`sonne()`, `auto()`) · `src/ui/texte.ts` · `src/ui/farbtokens.ts` (Rollen `solar`, `solar-soft`, Paare) · `globals.css` (`@theme inline`) · `Kopfbereich.tsx` · `Uebersicht.tsx` · `App.tsx` (`<Solaranlage />` nach der Szenenleiste) · `Hausansicht.tsx` (Dach-Solar, Außen-Zeile) · `Raumkarte.tsx` (Carport: `Elektroauto`-Block, kein `RaumAusKnopf`, `sperrGrund`) · `GeraeteZeile.tsx` (`sperrGrund`) · `Meldungen.tsx` (Art `solar`) · `Symbol.tsx` (`auto`, `blitz`, `wallbox`, `solar`) · `VerbrauchNachRaum.tsx` (Skeleton aus `RAEUME.length`) · `App.test.tsx`, `tests/fixtures/snapshot.ts` (Version 2.1.0, neue Felder, Fixture „Auto lädt, Heiter“).

**Ändern – Betrieb/Doku:** `package.json`/`package-lock.json` (2.1.0) · README, API.md, DOCKER-SETUP.md, KUBERNETES.md, Compose-Dateien (auskommentierte Variable) · `docs/*` (api-contracts, data-models, architecture, component-inventory, project-overview, source-tree-analysis, development-guide, deployment-guide, index).

**Bewusst unverändert:** `server/ursprung.ts`, `server/log.ts`, `server/version.ts`, `src/client/verbindung.ts`, `Dockerfile`, `docker/*`, `.github/workflows/ci-release.yml`, `scripts/pruefe-js-budget.mjs`, `scripts/smoke-container.mjs`, Szenendefinitionen, Rate-Limit-Konstanten.

---

## 9. Entscheidungsprotokoll Architektur

| ID | Entscheidung | Begründung | Abweichung vom Addendum |
|---|---|---|---|
| AD-01 | Server in TypeScript (`server/*.ts`), Kompilat `dist/` per `tsc` im Builder | eine Sprache, Typen für Protokoll, kein Laufzeitwerkzeug | wählt Variante 1 aus A-4 |
| AD-02 | Domänenmodul `src/domain/` als einzige Quelle für Katalog **und** Logik | FR-2, NFR-6; JSON/CJS-Variante teilt nur Daten | – |
| AD-03 | Keine Next/React-Upgrades in 2.0 | sicherheitsgeprüfter Stand aus PR #1/#2, kein PRD-Nutzen | – |
| AD-04 | Topics `iot-haus/v2/geraet/<id>/zustand`, `iot-haus/v2/energie/heute`, retained, QoS 1, Feld `v: 1`; Restore mit 500-ms-Fenster nach SUBACK, dann unsubscribe; Normalisierung durch Neu-Publizieren | Versionierbarkeit, deterministischer Start | ergänzt `v`, Fensterlogik präzisiert |
| AD-05 | Protokoll nach A-3, plus `bestaetigt.geaendert` und `energie.serverZeit`; strikte Feldprüfung (keine Zusatzfelder) | FR-19/22 „keine Änderung nötig“ nur beim Absender; Uhrversatz nachführen | Erweiterung |
| AD-06 | Broker weg → alle WS mit 1013 schließen, Upgrades 503; nach Rückkehr Speicherzustand neu publizieren | nie ungesicherten Zustand bedienen; NFR-5 | präzisiert |
| AD-07 | Origin = Host oder X-Forwarded-Host; `maxPayload` 64 KiB hart, 4 KB fachlich mit Fehlerantwort | Reverse-Proxy-Kompatibilität; FR-18 verlangt Fehlerantwort | präzisiert |
| AD-08 | Tagesintegration nur im Server, ein Timer `min(60 s, Mitternacht)`, Intl-basierte Berlin-Zeit ohne Zusatzbibliothek | FR-10 exakt, keine Abhängigkeit | – |
| AD-09 | Auto-Aus als Server-Timer über denselben Änderungspfad (`fuehreAus`) | ein Pfad für Persistenz/Broadcast | – |
| AD-10 | Vitest 5 + jsdom + Testing Library + axe-core; **aedes** in-process statt Mosquitto-Service-Container; echter Mosquitto im Container-Job | lokal = CI, schnell, deterministisch; echte Config trotzdem geprüft | wählt aedes-Alternative aus A-5 |
| AD-11 | Client-Zustand per `useReducer` + Context, framework-freie Transportklasse | keine Store-Abhängigkeit, testbar | – |
| AD-12 | Hausansicht als HTML-Raster mit Buttons statt SVG | A11y ohne Sonderlogik, deutlich weniger Code | – |
| AD-13 | Ein Workflow `ci-release.yml` mit Jobs qualitaet → container → image → release; Release idempotent per `package.json`-Version | FR-32/33, D-32 | ergänzt Container-Smoke-Job |
| AD-14 | `HEALTHCHECK` im Dockerfile, Intervall 10 s, Start-Periode 20 s; Compose erbt (Block entfernt) | healthy ≤ 60 s sicher; keine Duplikate | Intervall 10 s statt 30 s |
| AD-15 | Farb-Tokens in TS, CSS-Variablen per `<style>` im Layout erzeugt; Theme-Skript inline vor Paint | Kontrasttest rechnet direkt auf Quelle; kein Aufblitzen | – |
| AD-16 | Befehls-ID ohne `crypto.randomUUID` | Heimnetz über http ist kein Secure Context | neu |
| AD-17 | Health antwortet 200 nur bei verbunden **und** bereit (Restore abgeschlossen) | Container erst healthy, wenn Zustand geladen | präzisiert |
| AD-18 | Actions per Hauptversions-Tag, kein `moby/buildkit:master`, keine SHA-Pins, kein Dependabot | stabil und schlank; ungepinnter Nightly war das eigentliche Risiko | – |
| AD-19 | Drei Security-Header ohne CSP | CSP mit Next-Inline-Skripten bräuchte Nonce-Infrastruktur; nicht im PRD | – |
| AD-20 | Kein Rate-Limit je Verbindung | FR-19-Test verlangt 200 Befehle ohne Pause; Heimnetz, 4-KB-Grenze + sequenzielle Verarbeitung genügen | – |
| AD-21 | `scripts/dev-broker.mjs` (aedes) für lokale Entwicklung ohne Docker | niedrige Einstiegshürde, keine neue Abhängigkeit (aedes ist ohnehin devDep) | neu |
| AD-22 | `eslint.ignoreDuringBuilds: true` | Lint läuft als eigener CI-Schritt; kein Doppellauf | neu |
| AD-23 | Auto und Sonne als eigene Serverzustände neben `HausZustand`, über denselben `aendere`-Pfad; eine Änderung = eine `aenderung` (auch Wegfahren + Laden-Ende) | ein Änderungspfad bleibt (§4.4), konsistenter Zustand (FR-16) | 2.1 |
| AD-24 | Akku wird im selben Integrationsschritt wie die Tagesenergie fortgeschrieben; Clients extrapolieren nur zur Anzeige mit derselben Domänenfunktion (`akkuWhBei`) | Server bleibt Autorität; geladene Energie = integrierte Wallbox-Energie; kein zusätzlicher Takt | 2.1 |
| AD-25 | Akku-voll als Server-Timer analog Auto-Aus (AD-09), Ursache `akkuVoll` | bewährter Mechanismus, exakter Abschaltzeitpunkt | 2.1 |
| AD-26 | Energie-Topic `v: 2` mit Lese-Migration von `v: 1` (`bezugWh = wh`, `einspeisungWh = 0`); neue Topics `auto/zustand`, `solar/sonne` mit `v: 1`, Präfix `iot-haus/v2` bleibt | Tageswert überlebt das Upgrade ohne Sprung; kein Schemabruch | 2.1 |
| AD-27 | Neuer Fehlercode `NICHT_MOEGLICH` für fachliche Regelverstöße (Laden unterwegs/voll, Wegfahren < 15 %) statt stiller `geaendert: false` | Rennen zwischen Clients sichtbar und testbar; UI sperrt zusätzlich mit Grund | 2.1 |
