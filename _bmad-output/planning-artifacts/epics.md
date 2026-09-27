---
stepsCompleted: [1, 2, 3, 4]
status: final
created: 2026-09-26
updated: 2026-09-27
author: 'John (BMAD PM), headless'
inputDocuments:
  - _bmad-output/planning-artifacts/00-auftrag.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/prd-addendum.md
  - _bmad-output/planning-artifacts/prd-decision-log.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/ux-designs/ux-iot-haus-2026-09-26/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-iot-haus-2026-09-26/EXPERIENCE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-iot-haus-2026-09-26/.decision-log.md
  - _bmad-output/planning-artifacts/00-auftrag-2.1.md
  - _bmad-output/planning-artifacts/sprint-change-proposal-2026-09-27.md
bindingResolutions: _bmad-output/planning-artifacts/implementation-readiness-report-2026-09-26.md#konfliktauflösung
---

# iot-haus - Epic Breakdown

## Overview

Dieses Dokument zerlegt PRD (FR-1 bis FR-35, NFR-1 bis NFR-10), Architektur (AD-01 bis AD-22) und UX-Spezifikation (DESIGN.md, EXPERIENCE.md, UX-01 bis UX-30) von IoT-Haus 2.0 in umsetzbare Epics und Stories. Die Reihenfolge der Epics und Stories folgt der Umsetzungsreihenfolge aus Architektur §3.11 (Domäne → Werkzeuge → Server → Container → Client → CI → Aufräumen/Doku).

**Headless-Lauf:** Der Stakeholder steht nicht zur Verfügung. Alle Menüs des Workflows wurden mit **[C]** beantwortet; Advanced Elicitation und Party Mode wurden nicht gestartet. Nichts ist vertagt; jede Story gehört zu Release 2.0.0.

**Verbindliche Konfliktauflösung:** Wo PRD, Architektur und UX sich widersprechen, gilt die Konfliktauflösung K-01 bis K-30 im Readiness-Report (`implementation-readiness-report-2026-09-26.md`, Abschnitt „Konfliktauflösung“). Die Akzeptanzkriterien unten sind bereits nach diesen Entscheidungen formuliert (Verweise als „K-nn“). Kurzregel: **PRD > Architektur (Dateien, Namen, Technik) > UX (Aussehen, Verhalten, Texte)**; UX-Werte (Farben, Texte, Verhalten) gelten überall dort, wo die Architektur nichts festlegt.

**Fortschreibung 2.1.0 (2026-09-27):** Mit dem Sprint Change Proposal `sprint-change-proposal-2026-09-27.md` (Auftrag `00-auftrag-2.1.md`) kommt **Epic 8 „Elektroauto & Solaranlage“** hinzu (FR-36 bis FR-44, AD-23 bis AD-27, K-31). Epics 1–7 sind mit Release 2.0.0 abgeschlossen und werden nicht wieder geöffnet; wo ihre Akzeptanzkriterien feste Zahlen nennen (28 Geräte, 6 Räume, 75 W, 10,3 W, 12.978 W), werden die zugehörigen Tests in Story 8.1 auf die Kontrollsummen 2.1 umgestellt (29 Geräte, 7 Räume, 78 W, 13,3 W, 23.978 W). Maßgeblich für 2.1 sind PRD §4.7/§4.8 und die geänderten FR, Architektur §3.12 und die UX-Spines in der Fassung 2.1.

**Parallelbetrieb:** Die Umsetzung hat bereits begonnen (`src/domain/*`, `server/*`, `tsconfig.server.json`, `vitest.config.mts`). Bereits vorhandener Code gilt als Teilumsetzung der jeweiligen Story und wird gegen deren Akzeptanzkriterien geprüft, nicht neu geschrieben.

## Requirements Inventory

### Functional Requirements

FR-1: Hausmodell mit 2 Etagen und 6 Räumen (EG: `wohnzimmer`, `kueche`, `hwr`; OG: `schlafzimmer`, `bad`, `arbeitszimmer`), jeder Raum ≥ 3 Geräte.
FR-2: Gerätekatalog mit genau 28 Geräten aus Anhang A (ID, Name, Raum, Kategorie, Symbol, Betriebs-/Standby-Leistung, Grundlast, Auto-Aus); Betrieb > 0, 0 ≤ Standby < Betrieb; eine Quelldatei für Server und Client; Test gegen Geräte-ID-Literale außerhalb der Domäne; 7 Kategorien.
FR-3: Jedes Gerät per Tipp/Klick/Taste zwischen *An* und *Aus* schalten; *An* zählt mit Betriebs-, *Aus* mit Standby-Leistung; ein Befehl ändert genau ein Gerät.
FR-4: Grundlastgeräte (Kühlschrank, Gefrierschrank, Router): Ausgangszustand nur Grundlast *An* (75 W); Ausschalten nur nach Dialog „‹Gerät› wirklich ausschalten? Es ist ein Grundlastgerät und läuft normalerweise dauerhaft.“ mit „Ausschalten“/„Abbrechen“ (Abbrechen vorausgewählt, Escape bricht ab); Einschalten ohne Dialog; Szenen und „Raum ausschalten“ ändern Grundlast nie.
FR-5: Auto-Aus für Wasserkocher und Mikrowelle nach 180 s (± 1 s) serverseitig; Restzeit „noch m:ss“ sekündlich, in allen Clients gleich; Wiederaufnahme nach Neustart; Szene lässt laufende Restzeit weiterlaufen; Änderungsmeldung „−2.200 W · Wasserkocher (Küche) automatisch ausgeschaltet“.
FR-6: Hausverbrauch in W im sticky Kopfbereich (fest sichtbar nur Hausverbrauch, Laststufe, Kosten/h, Verbindungsstatus); Summe aller 28 Geräte gerundet; Zählanimation 600 ms (ohne bei reduzierter Bewegung); ≤ 1 s nach Serverbestätigung aktualisiert.
FR-7: Raumverbrauch und Anzahl eingeschalteter Geräte in Hausansicht und Raumkarte; Liste „Verbrauch nach Raum“ absteigend mit Balken und Prozenttext; Summe der Räume = Hausverbrauch (±1 W je Raum).
FR-8: Geräteleistung je Zeile: *An* „1.200 W“; *Aus* mit Standby „Standby 1,5 W“ (zurückgenommen, ≥ 4,5:1); *Aus* ohne Standby „aus“.
FR-9: Kosten pro Stunde = W/1000 × Strompreis („1,96 €/h“); Strompreis Standard 0,35 €/kWh, Env `STROMPREIS_EUR_PRO_KWH` (ungültig/negativ/fehlend → 0,35 + Warnung); Strompreis im Snapshot und als „Strompreis 0,35 €/kWh“ angezeigt.
FR-10: Tagesverbrauch (kWh) und Tageskosten serverseitig integriert (bei jeder Änderung und ≥ alle 60 s), Reset 00:00 Europe/Berlin inkl. DST, Persistenz ≥ alle 60 s und bei SIGTERM, Ausfallzeiten zählen nicht, Anzeige „Heute 3,42 kWh · 1,20 €“ ohne lokale Hochrechnung, Info-Hinweis „Schätzung auf Basis typischer Geräteleistungen, gezählt seit 00:00 Uhr.“
FR-11: Änderungsmeldung in allen Clients mit Vorzeichen, Differenz (gerundet neu − gerundet alt) und Auslöser („+1.199 W · Mikrowelle (Küche)“, „+124 W · Filmabend aktiviert“, „−‹x› W · Küche ausgeschaltet“); 4 s sichtbar, max. 3 gestapelt, Escape/Schließen; `aria-live="polite"` „‹Gerät› an. Hausverbrauch 1.274 Watt.“; innerhalb 2 s nur die letzte Ansage.
FR-12: Laststufe aus gerundetem Hausverbrauch: < 500 „niedrig“, 500–1.999 „mittel“, ≥ 2.000 „hoch“; Text immer sichtbar.
FR-13: „davon Standby ‹x› W“ mit einer Nachkommastelle im Übersichtsbereich (Ausgangszustand 10,3 W).
FR-14: Serverzustand ist autoritativ; kein Gerätezustand im Browser-Speicher; Altschlüssel `smart-home-state` wird gelöscht; ein verbindender Client sendet nichts.
FR-15: Snapshot (28 Zustände, Einschaltzeitpunkte, Tagesverbrauch, Strompreis) ≤ 1 s nach Verbindungsaufbau; bis dahin Skeleton, Schalter nicht bedienbar.
FR-16: Jede Änderung an alle Clients inkl. Auslöser; p95 ≤ 250 ms über ≥ 100 Befehle mit 3 Clients; Szene/Raum ausschalten als eine Änderung.
FR-17: Zustand übersteht Neustarts (Volume `mosquitto-data`), auch direkt nach einer Änderung; fehlender Zustand → Ausgangszustand; unbekannte IDs ignoriert, neue Geräte im Ausgangszustand.
FR-18: Nur gültige Befehle (schalten, szene, raumAus); ungültige/zu große (> 4 KB)/altes Protokoll → Fehlerantwort, Zustand unverändert, kein Absturz; keine beliebigen MQTT-Topics; Grundlast-Ausschalten per Einzelbefehl erlaubt; Versionsabgleich mit Banner „Neue Version verfügbar“ + „Neu laden“, Schalter gesperrt.
FR-19: Befehle strikt sequenziell, letzter gewinnt; 3 Clients × 200 Zufallsbefehle → 100 % konsistent; Einzelbefehl ohne Änderung bestätigt ohne Meldung.
FR-20: Verbindungsstatus „Verbunden“/„Verbinde …“/„Getrennt“ mit Symbol + Text; Banner „Verbindung getrennt – Schalter sind gesperrt, bis die Verbindung wieder steht.“; Steuerung `aria-disabled`; Backoff 1/2/4/8 s, dann alle 10 s; „Jetzt neu verbinden“; neuer Snapshot ersetzt alles; keine Offline-Warteschlange.
FR-21: Schalter zeigt ≤ 100 ms den Zielzustand mit „wird geschaltet“ (`aria-busy`); Werte und Meldung erst mit Bestätigung; nach 5 s ohne Bestätigung oder bei Fehler zurück + „‹Gerät› konnte nicht geschaltet werden. Bitte erneut versuchen.“
FR-22: Szene mit einem Tipp, serverseitig als eine Änderung; nicht genannte Geräte unverändert (außer Alles aus/Gute Nacht); idempotent; ohne Änderung Hinweis „‹Szene›: keine Änderung nötig“ nur im auslösenden Client; keine „aktiv“-Markierung.
FR-23: Genau vier Szenen `alles-aus`, `filmabend`, `morgenroutine`, `gute-nacht` mit definierter Wirkung; Morgenroutine aus Ausgangszustand +5.532 W und startet Auto-Aus Wasserkocher.
FR-24: Keine Szene ändert ein Grundlastgerät; „Alles aus“ aus „alles an“ → 75 W.
FR-25: Eine Seite: Kopfbereich, Szenenleiste, Hausansicht, Raumkarten, „Verbrauch nach Raum“; 360 px einspaltig ohne horizontales Scrollen, Kopf ≤ 30 % Höhe bei 640 px; ≥ 1024 px zweispaltig; Sprunglink „Zu den Räumen springen“ als erstes fokussierbares Element; alte Deko entfällt.
FR-26: Hausansicht 2 × 3 Räume mit Name, Raumverbrauch, Anzahl an; Raum leuchtet warm, wenn ein Licht *An*; Aktivierung scrollt zur Raumkarte und fokussiert deren Überschrift; zugänglicher Name „Hausansicht“ und je Raum „‹Raum›, ‹x› W, ‹n› Geräte an – zur Raumkarte“.
FR-27: Raumkarte mit Gerätezeilen (Symbol, Name, Leistung, Schalter) und „Raum ausschalten“; `role="switch"`, `aria-checked`, Name „‹Gerät›, ‹Raum›“, Leistung per `aria-describedby`; ganze Zeile ≥ 44 × 44 px; Kennzeichen „Grundlast“/„Auto-Aus 3 min“; „Raum ausschalten“ deaktiviert ohne eingeschaltetes Nicht-Grundlastgerät; *An* ohne Farbe erkennbar.
FR-28: Darstellung System/Hell/Dunkel, Standard System, gespeichert, ohne Aufblitzen; Kontraste in beiden Themes; `theme-color` passt sich an.
FR-29: Deutsche Oberfläche, de-DE-Formate, kaufmännische Rundung nur bei Anzeige; „1.200 W“, „0,5 W“, „1,96 €/h“, „1,20 €“, „3,42 kWh“; `<html lang="de">`, Titel „IoT-Haus – Energie & Steuerung“; kein englischer Resttext.
FR-30: `GET /api/health`: 200 `{status:"ok", mqtt:"verbunden", version}` bzw. 503 `{status:"fehler", mqtt:"getrennt"}`; Version aus `package.json`.
FR-31: Container-Healthcheck ohne curl/wget per Node; Compose nutzt denselben Befehl oder erbt; healthy ≤ 60 s; kein curl/wget/npm im Runtime-Image.
FR-32: CI auf PR und Push main: `npm ci`, Lint (0/0), Typecheck, Tests, `next build`, `npm audit --omit=dev --audit-level=high`; Fehler → kein Image; Tests ohne externe Dienste außer in der CI gestartetem Broker.
FR-33: Version 2.0.0; Push main → `:latest` (amd64+arm64); Job erzeugt Tag `v‹version›`, GitHub Release mit Änderungsliste und Upgrade-Hinweis und Image `:‹version›`, falls Tag fehlt; nur Tags `:latest`, `:‹version›`, `:sha-‹kurz›`; kein Tag-getriggerter Build ohne CI-Gate.
FR-34: Doku auf Stand 2.0.0: README (Deutsch, Funktionen, Katalog, Strompreis, Betrieb, Update, Entwicklung, Reverse-Proxy-Empfehlung), API.md (WS-Protokoll, Topics), DOCKER-SETUP.md/KUBERNETES.md (Healthcheck ohne curl, Probes), veraltete Dokus entfernt, copilot-instructions/GITHUB-ACTIONS aktualisiert.
FR-35: `useMockMqtt`, `shouldUseMock`, `test-container-*.js`, `test-multi-device.js` entfernt; keine `console.log` im Browser (ESLint `no-console`, Ausnahme `console.error`); Server loggt je Befehl höchstens eine Zeile ohne Nutzdaten.


**Neu mit 2.1.0 (Epic 8; Details PRD §4.7/§4.8, Proposal §5.2):**

FR-36: Carport und Wallbox – Raum `carport` („Carport“, Etage „Außen“, letzter Raum), Gerät `carport.wallbox` (Wallbox, Kategorie Mobilität, Betrieb 11.000 W, Standby 3 W, kein Grundlastgerät, kein Auto-Aus); 29 Geräte, 7 Räume.
FR-37: Genau ein Elektroauto, Akku 60.000 Wh, Ausgangszustand zu Hause mit 30.000 Wh (50 %); Anzeige Ort, Akku in ganzen Prozent (abgerundet), beim Laden „voll in ‹h› h ‹m› min“.
FR-38: Laden = Wallbox *An*, nur zu Hause und Akku < 60.000 Wh (sonst gesperrt mit Grund bzw. `NICHT_MOEGLICH`); serverseitige Akku-Integration mit 11.000 W; bei 100 % schaltet der Server aus (Ursache „Akku voll“); Ausfallzeit lädt nicht; Restore erzwingt Laderegeln.
FR-39: „Wegfahren“ (nur ab 9.000 Wh) setzt unterwegs und beendet Laden in derselben Änderung; „Zurückkommen“ zieht 9.000 Wh ab (min. 0); keine optimistische Anzeige.
FR-40: Solaranlage 9.800 W Spitzenleistung; Sonnenlage in 5 Stufen (Nacht 0, Bedeckt 0,10, Wolkig 0,35, Heiter 0,65, Sonnig 0,85); gemeinsamer, gespeicherter Serverzustand; Start „Nacht“.
FR-41: Netzbilanz live im Kopf: „Solar ‹x› W · Netzbezug ‹y› W“ bzw. „· Einspeisung ‹y› W“; Kosten/h aus Netzbezug, bei Einspeisung „Ertrag ‹x› €/h“ (Einspeisevergütung Standard 0,08 €/kWh, `EINSPEISEVERGUETUNG_EUR_PRO_KWH`); Rechnung aus gerundeten Anzeigewerten.
FR-42: Tagesbilanz – Server integriert Verbrauch, Bezug und Einspeisung; Übersicht „Heute ‹kWh› · ‹netto› €“ bzw. „Ertrag“, „Netz heute: Bezug … · Einspeisung …“; Solaranlage „Heute erzeugt ‹x› kWh“.
FR-43: Darstellung – Bereich „Solaranlage“ mit Sonnenwahl nach den Szenen, Hausansicht mit Dach-Solar und Zeile „Außen“ (Carport-Fläche), Carport-Raumkarte mit Elektroauto-Bereich; Tastatur und Screenreader vollständig.
FR-44: Release 2.1.0 – `package.json` 2.1.0, alte Tabs zeigen Versionsbanner, kein manueller Upgrade-Schritt, `docs/abnahme-2.1.md` ausgefüllt eingecheckt.

Geänderte FR mit 2.1.0 (Konsequenzen, siehe PRD): FR-1, FR-2, FR-4, FR-6, FR-9, FR-10, FR-11, FR-15, FR-17, FR-18, FR-23/24, FR-25, FR-26, FR-27, FR-30, FR-33, FR-34, NFR-7, NFR-10 – umgesetzt ausschließlich über Epic 8.

### NonFunctional Requirements

NFR-1 Performance: Schalter-Reaktion ≤ 100 ms; Verteilung ≤ 1 s p95 (Heimnetz), ≤ 250 ms p95 (lokaler Test); Snapshot ≤ 1 s; First Load JS ≤ 200 kB per CI-Prüfung; Animationen nur `transform`/`opacity`/Zahleninterpolation, CLS ≤ 0,1.
NFR-2 Barrierefreiheit WCAG 2.2 AA: vollständig per Tastatur, Fokusrahmen ≥ 3:1, keine Tastaturfallen; Text ≥ 4,5:1, UI ≥ 3:1 in Hell und Dunkel; Zoom 200 % (keine Zoom-Sperre); Trefferflächen ≥ 44 px; `prefers-reduced-motion`; nie nur Farbe; axe 0 Verstöße in Hell und Dunkel; Kontrast-Unit-Test über alle Token-Paare; manuelle Prüfungen in der Abnahme-Checkliste.
NFR-3 Responsivität: 360/768/1024/1440 px ohne horizontales Scrollen, Hoch- und Querformat; Nachweis über Abnahme-Checkliste.
NFR-4 Sicherheit: Härtung aus PR #1/#2 unverändert (Node 22, `USER 1000:1000`, kein npm/npx/corepack/yarn/apk/wget/curl/nc, App-Code nur lesbar); Broker nur 127.0.0.1; Befehls-Whitelist + 4 KB; Origin-Prüfung beim WS-Upgrade (sonst 403); `npm audit` ohne ≥ high; keine neuen Laufzeitabhängigkeiten.
NFR-5 Zuverlässigkeit: ungültige Eingaben nie Absturz; Broker-Verlust → selbständige Wiederverbindung, währenddessen 503; nach Broker-Neustart Zustand wiederhergestellt.
NFR-6 Wartbarkeit: Lint/Typecheck ohne Befunde; ≥ 90 % Zeilenabdeckung Domänenlogik; Komponententests Kopfbereich, Raumkarte, Schalter, Dialog, Verbindungsbanner; Mehrclient-Integrationstests gegen echten Server; ein gemeinsamer Katalog.
NFR-7 Beobachtbarkeit: Serverlog mit Start, Broker-Wechseln, abgelehnten Befehlen (ohne Nutzdaten), Auto-Aus, Strompreis-Warnung; eine Zeile je Ereignis.
NFR-8 Browserunterstützung: aktuelle zwei Hauptversionen Chrome/Edge, Firefox, Safari (macOS, iOS).
NFR-9 Betriebskompatibilität: Port 3000, Imagename, `PORT`, `HOSTNAME`, `MQTT_BROKER_HOST`, `MQTT_BROKER_PORT`, Volume `mosquitto-data` bleiben; `NEXT_PUBLIC_MQTT_BROKER_URL` ignoriert; Upgrade-Hinweis 2.0.0 (alter curl-Healthcheck in Host-Compose) in README und Release-Notes.
NFR-10 Abnahme-Checkliste: `docs/abnahme-2.0.md` mit Breiten 360/768/1024/1440 in Hell/Dunkel (Screenshots), Tastaturdurchlauf UJ-4, VoiceOver-Ansagen, Zoom 200 %, reduzierte Bewegung, Zwei-Geräte-Sync; vor Release vollständig ausgefüllt eingecheckt.

### Additional Requirements

Aus `architecture.md` (Brownfield, **kein Starter-Template**; erster Umsetzungsschritt ist das Domänenmodul):

- AR-1 (AD-01): Server in TypeScript `server/*.ts` ersetzt `server.js`; Kompilat per `tsc -p tsconfig.server.json` nach `dist/` (CommonJS); Runtime `node dist/server/index.js`; kein `tsx`/`ts-node` im Image.
- AR-2 (AD-02): `src/domain/` (katalog, szenen, verbrauch, energie, befehle, protokoll, format) ohne React/Next/Node-Imports, nur relative endungslose Imports; einzige Quelle für Katalog und Logik.
- AR-3 (AD-04): Topics `iot-haus/v2/geraet/<id>/zustand` und `iot-haus/v2/energie/heute`, retained, QoS 1, Feld `v: 1`; Restore mit 500-ms-Fenster nach SUBACK, dann unsubscribe; Normalisierung durch Neu-Publizieren; keine Befehls-Topics; alte `smarthome/…`-Topics unbenutzt.
- AR-4 (AD-05): WS-Protokoll `/mqtt` nach §3.5 (Befehl, ServerNachricht, FehlerCode) inkl. `bestaetigt.geaendert`, `energie.serverZeit`; strikte Feldprüfung; Befehls-ID `/^[A-Za-z0-9_-]{1,64}$/`, kein `crypto.randomUUID` (AD-16).
- AR-5 (AD-06): Broker-Ausfall → WS-Verbindungen mit Code 1013 schließen, Upgrades 503, nach Rückkehr Speicherzustand neu publizieren.
- AR-6 (AD-07): Origin = Host oder erster `X-Forwarded-Host`, sonst 403; `maxPayload` 64 KiB hart, 4 KB fachlich mit Fehlerantwort; nur Upgrade-Pfad `/mqtt`, in Dev andere Upgrades an Next-HMR.
- AR-7 (AD-08/09): Energie-Tick `min(60 s, Mitternacht Berlin)`, Intl-basierte Berlin-Zeit; Auto-Aus als Server-Timer über denselben Änderungspfad `fuehreAus`; SIGTERM-Flush mit PUBACK (max. 2 s), WS-Close 1012.
- AR-8 (AD-10): Vitest + jsdom + Testing Library + axe-core; aedes in-process als Test-Broker; Coverage-Schwelle 90 % Zeilen auf `src/domain/**` und `server/zustandsdienst.ts`; Testlaufzeit ≤ 60 s.
- AR-9 (AD-11): Client-Zustand per `useReducer` + Context (`HausProvider`), reiner Reducer `src/client/hausReducer.ts`, framework-freie Transportklasse `src/client/verbindung.ts`.
- AR-10 (AD-12): Hausansicht als HTML-Raster mit `<button>`-Räumen, Dach als dekoratives Inline-SVG.
- AR-11 (AD-13): Ein Workflow `.github/workflows/ci-release.yml` mit Jobs `qualitaet` → `container` → `image` → `release`; ersetzt `docker-publish.yml` und `release.yml`; Least Privilege; Actions per Hauptversions-Tag (AD-18).
- AR-12 (AD-14/17): `HEALTHCHECK` im Dockerfile (10 s/5 s/20 s/3), Health 200 nur bei verbunden **und** bereit; Compose erbt; `src/app/api/health/route.ts` entfällt.
- AR-13 (AD-15): Farb-Tokens in TS (`src/ui/farbtokens.ts`), CSS-Variablen per `<style>` im Layout, Theme-Inline-Skript vor Paint (`src/ui/themeSkript.ts`).
- AR-14 (AD-19): Security-Header `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`; keine CSP.
- AR-15 (AD-20): kein Rate-Limit je Verbindung.
- AR-16 (AD-21): `scripts/dev-broker.mjs` (aedes auf :1883) für lokale Entwicklung.
- AR-17 (AD-22): `eslint.ignoreDuringBuilds: true` in `next.config.ts`.
- AR-18: Laufzeitabhängigkeiten exakt `next`, `react`, `react-dom`, `mqtt`, `ws`; neue devDeps nur `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `axe-core`, `aedes`; `@types/ws` → dev, `@types/mqtt` entfernen, `@types/node ^22`.
- AR-19: npm-Scripts nach Architektur §7 (`dev`, `dev:broker`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`); `docker:*`/`compose:*` bleiben.
- AR-20: Logformat eine Zeile `‹ISO-Zeit› ‹INFO|WARN|FEHLER› ‹ereignis› schluessel=wert`; `console.*` im Server nur in `server/log.ts`.
- AR-21: Datei-für-Datei-Änderungsliste §8 (Löschen/Ändern/Neu) ist verbindlich; Zielstruktur §5.1.
- AR-22: Container-Smoke `scripts/smoke-container.mjs` (Modi `schalten`, `pruefen`), JS-Budget `scripts/pruefe-js-budget.mjs`.
- AR-23: Architekturtests unter `tests/architektur/` (Geräte-ID-Literale, englische Resttexte, Kontraste, Aufgeräumt).

### UX Design Requirements

Aus `DESIGN.md` und `EXPERIENCE.md` (Dateinamen nach Konfliktauflösung K-06):

UX-DR1: Farb-Tokens exakt nach DESIGN.md-Frontmatter (Hell + Dunkel, 34 Rollen: bg, surface, surface-raised, surface-sunken, border, ink, ink-secondary, ink-muted, on, on-contrast, on-soft, switch-off, focus, primary, primary-contrast, danger, danger-contrast, status-ok, load-low/-bg, load-mid/-bg, load-high/-bg, delta-up, delta-down, banner-warn-bg/-ink, banner-info-bg/-ink, room-off, room-lit, house-roof, theme-color) in `src/ui/farbtokens.ts`; CSS-Variablen `--c-‹rolle›`; Tailwind-Mapping `@theme inline`; Kontrast-Unit-Test über mindestens alle Paare der DESIGN.md-Kontrasttabellen (K-01, K-03, K-05).
UX-DR2: Typografie: Geist Sans (next/font), Tokens display-sm 40/44, display-lg 56/60, display-compact 28/32, title 18/24, card-title 17/24, body 16/24, body-strong, meta 14/20, label 13/16; alle Zahlen `tabular-nums`; Basisschrift 16 px ohne Verkleinerung; Geist Mono und Arial-Override entfallen; `hyphens: auto` für lange Raumnamen.
UX-DR3: Raster 4 px, Rundungen sm 6/md 10/lg 16/full, Seitenrand 16/24 px, Container max. 1280 px, Kopfhöhe 116/88/64 px, Gerätezeile ≥ 56 px, Trefferfläche ≥ 44 px, Ebenen/Schatten laut DESIGN.md „Elevation“.
UX-DR4: Motion-Tokens als CSS-Variablen `--m-*` (schnell 150 ms, basis 250 ms, zaehlen 600 ms, chip 1.200 ms, impuls 800 ms, puls 1.600 ms); nur transform/opacity; globale Regel für `prefers-reduced-motion` setzt Dauern auf 0 ms (ersetzt alte `!important`-Regel); JS-Animationen beobachten `matchMedia` live.
UX-DR5: Sticky Kopfbereich (`<header>`, h1 „IoT-Haus“, Hausverbrauch, Laststufen-Pille, Kosten/h, Statusanzeige; keine Bedienelemente), mobil zweizeilig, ab 1024 px einzeilig, kompakt bei Höhe ≤ 500 px; Kopfhöhe als `--kopf-h` per `ResizeObserver`; `scroll-padding-top: calc(var(--kopf-h) + 16px)`.
UX-DR6: Hero-Zahl mit sr-only Zielwert „Hausverbrauch ‹x› Watt“ und `aria-hidden` animierter Zahl, Mindestbreite 7ch, Einheit kleiner in `ink-secondary`.
UX-DR7: Delta-Chip im Kopf (`aria-hidden`), „+1.199 W“/„−2.200 W“, 1,2 s, bei jeder bestätigten Änderung ≠ 0 (auch fremde), ersetzt vorherigen; keine Layoutverschiebung.
UX-DR8: Laststufen-Pille mit Signalbalken-Symbol (1/2/3 Balken) + Text + Farbe; wechselt sofort mit dem Zielwert.
UX-DR9: Statusanzeige mit Symbol + Text (Punkt `status-ok` / drehender Ring / durchgestrichenes WLAN `danger`), nicht live.
UX-DR10: Übersichtsbereich (sr-only h2 „Übersicht“) mit „davon Standby“, „Heute … · … €“, Info-Disclosure (inline, `aria-expanded`, Escape schließt), „Strompreis …“, Theme-Wahl als `<fieldset>` „Darstellung“ mit drei nativen Radios System/Hell/Dunkel (Segment-Optik).
UX-DR11: Szenen-Schaltflächen mit Symbol (Power, Filmklappe, Sonnenaufgang, Mond), Name und Untertitel (UX-24), `aria-describedby` für Untertitel, `aria-busy` + „Wird ausgeführt …“, keine optimistische Geräteänderung, keine Aktiv-Markierung, Wiederholaktivierung während busy ignoriert; Raster 2 × 2 mobil, 1 × 4 ab 768 px.
UX-DR12: Hausansicht: `<section>` mit h2 „Hausansicht“, `div role="group" aria-label="Hausansicht"`, Etagengruppen „Obergeschoss“/„Erdgeschoss“, 3 `<button>`-Räume je Etage (OG zuerst), Name/Raumverbrauch/„n an“/bis 3 Mini-Symbole; leuchtend = `room-lit` + 2-px-Rand `on` + Glühbirne; Lichtimpuls bei Änderung; Legende „Warm leuchtend: Licht ist an.“; Sprung per `scrollIntoView` + Fokus auf h3 + 800-ms-Hervorhebung; offline bedienbar (K-10).
UX-DR13: Raumkarte `<section aria-labelledby>`, h3 mit `tabindex="-1"` und `id="raum-‹id›"`, Meta „EG · n von m an“ (Grundlast zählt mit), Raumverbrauch ohne Zählanimation, Geräteliste `<ul>` in Katalogreihenfolge, Fuß „Raum ausschalten“ (volle Breite mobil, rechtsbündig ab 768 px).
UX-DR14: Gerätezeile = ein `<button role="switch" aria-checked>` über die ganze Zeile (≥ 56 px), `aria-label` „‹Gerät›, ‹Raum›“, `aria-describedby` auf sr-only-Beschreibung mit ausgeschriebenen Einheiten + Kennzeichen + Restzeit; sichtbare Leistungszeile `aria-hidden`; Symbolkreis, Badges, visueller Schalter (Spur 44 × 26, Häkchen im Knopf bei *An*); Zeile leuchtet 800 ms in `on-soft` bei Änderung (K-07).
UX-DR15: Schalt-Ablauf Einzelgerät (EXPERIENCE „Schalt-Ablauf“, Schritte 1–8), inkl. sofortiges Zurücksetzen bei Verbindungsabbruch (UX-12) und Ignorieren von Aktivierungen während busy (UX-11).
UX-DR16: Auto-Aus-Anzeige „noch m:ss“ aus `seit + 180 000 − (Date.now() + uhrVersatz)`, ein gemeinsamer Sekundentakt für die Seite, „schaltet aus …“ bei ≤ 0, 2-px-Fortschrittslinie per `scaleX`, läuft offline weiter.
UX-DR17: Grundlast-Dialog als natives `<dialog>` mit `showModal()`, Titel „‹Gerät› wirklich ausschalten?“, Text „Es ist ein Grundlastgerät und läuft normalerweise dauerhaft.“, Abbrechen zuerst und autofokussiert, Escape/Backdrop/Abbrechen ohne Befehl, Fokusrückgabe auf Zeile, schließt sich bei externem Ausschalten, offline „Ausschalten“ `aria-disabled` + Hinweis.
UX-DR18: „Raum ausschalten“ `aria-disabled` (fokussierbar) mit Beschreibung „Keine Geräte zum Ausschalten an“, Name „‹Raum› ausschalten“, busy „Wird ausgeschaltet …“, keine optimistische Änderung, keine Bestätigung.
UX-DR19: Verbrauch nach Raum als `<ol>` absteigend (Gleichstand Katalogreihenfolge), Prozent ganzzahlig als Text, Balken `role="presentation"` per `scaleX`, 250 ms Gleiten, nicht interaktiv.
UX-DR20: Toast-Stapel unten (mobil zentriert, ab 768 px rechts), max. 3, 4 s, Pause bei Hover/Fokus, Schließen-Knopf „Meldung schließen“, Escape-Priorität Dialog > Disclosure > neueste Meldung, nie Fokus-Diebstahl; Symbole Pfeil hoch/runter/Info/Warnung; „±0 W“ bei gerundeter Differenz 0 (UX-15).
UX-DR21: Eine sr-only Live-Region `aria-live="polite" aria-atomic="true"`; Änderungsansagen mit 2-s-Sammelfenster, nur die letzte (K-09); Fehler, „keine Änderung nötig“, „Verbindung wiederhergestellt.“ sofort.
UX-DR22: Banner fest unten (`role="status"`, max. eines, Version vor Getrennt), Getrennt mit Countdown „Nächster Versuch in n s“ und „Jetzt neu verbinden“, Version mit „Neu laden“ (`location.reload()`), kein Schließen-Knopf, `<main>` erhält unten Innenabstand.
UX-DR23: Verbindungs-Zustandsautomat mit 7 Zuständen (Initial-Verbinde, Erstfehler, Verbunden, Getrennt, Wiederverbinde, Wieder verbunden, Veraltet) inkl. Erstfehler-Hinweisfeld nach 5 s ohne Snapshot und stiller Snapshot-Ersetzung ohne Animation/Toasts (K-16).
UX-DR24: Ladezustand: Katalogstruktur sofort, Werte und Schalter als Skeleton (`aria-hidden`-Platzhalter), `<main aria-busy="true">` + sr-only „Hauszustand wird geladen …“, Puls 1,6 s (statisch bei reduzierter Bewegung).
UX-DR25: Sprunglink „Zu den Räumen springen“ als erstes Element, nur bei Fokus sichtbar, Ziel h2 „Räume“ (`#raeume`, `tabindex="-1"`).
UX-DR26: Fußzeile mit „Alle Leistungs- und Kostenwerte sind Schätzungen auf Basis typischer Geräteleistungen.“ und „IoT-Haus ‹version›“ (Client-Build-Version).
UX-DR27: Symbol-Komponente: Inline-SVG 24 × 24, `stroke="currentColor"`, 1,75, `aria-hidden`/`focusable="false"`; Gerätesymbole für alle `SymbolName`-Werte des Katalogs (K-11) + UI-Symbole (haus, verbunden, verbinde, getrennt, info, schliessen, pfeil-hoch, pfeil-runter, warnung, uhr, schild, power, film, sonnenaufgang, mond, sonne, monitor-system, laststufe-1/2/3, haekchen); keine Emojis.
UX-DR28: Microcopy-Katalog vollständig in `src/ui/texte.ts` (Schlüssel aus EXPERIENCE.md), Katalognamen aus dem Katalog; Screenreader-Texte mit ausgeschriebenen Einheiten (K-13).
UX-DR29: Responsive: 360–767 einspaltig; 768–1023 Szenen 1 × 4, Raumkarten 2 Spalten; ≥ 1024 zwei Spalten 5/12 + 7/12; ≥ 1280 Raumkarten 2 Spalten; linke Spalte sticky ab 1024 × 860; `min-width: 0` statt `overflow-x: hidden`; `env(safe-area-inset-*)`; Hover nur bei `(hover: hover)`; `touch-action: manipulation`.
UX-DR30: Tastatur: Tab-Reihenfolge laut EXPERIENCE „Interaction Primitives“, keine globalen Tastenkürzel; gesperrt immer `aria-disabled` statt `disabled`; Fokusrahmen `2px solid var(--c-focus)` offset 2 px (Gerätezeile −2 px).
UX-DR31: Metadaten: Titel, Beschreibung, `appleWebApp.title: "IoT-Haus"`, `viewport` ohne Zoom-Sperre und ohne `themeColor` (setzt das Skript); `theme-color` hell `#FFFFFF`, dunkel `#131C2E`; kaputter `apple-touch-icon.png`-Link entfällt (K-12).

### FR Coverage Map

| FR | Epic | Stories |
|---|---|---|
| FR-1 | Epic 1, Epic 5 | 1.1, 5.6 |
| FR-2 | Epic 1 | 1.1, 1.6 |
| FR-3 | Epic 1, Epic 2, Epic 5 | 1.3, 2.3, 5.1 |
| FR-4 | Epic 1, Epic 5 | 1.1, 1.3, 5.3 |
| FR-5 | Epic 2, Epic 5 | 2.3, 5.2 |
| FR-6 | Epic 1, Epic 4 | 1.2, 4.4 |
| FR-7 | Epic 1, Epic 5 | 1.2, 5.1, 5.6 |
| FR-8 | Epic 5 | 5.1 |
| FR-9 | Epic 1, Epic 2, Epic 4 | 1.2, 2.1, 4.4 |
| FR-10 | Epic 1, Epic 2, Epic 4 | 1.4, 2.3, 4.4 |
| FR-11 | Epic 4 | 4.2, 4.5 |
| FR-12 | Epic 1, Epic 4 | 1.2, 4.4 |
| FR-13 | Epic 1, Epic 4 | 1.2, 4.4 |
| FR-14 | Epic 2, Epic 4 | 2.4, 4.1, 4.2 |
| FR-15 | Epic 2, Epic 4 | 2.4, 4.3 |
| FR-16 | Epic 2 | 2.4, 2.6 |
| FR-17 | Epic 2, Epic 3 | 2.2, 2.6, 3.1, 3.3 |
| FR-18 | Epic 1, Epic 2, Epic 4 | 1.3, 2.4, 4.6 |
| FR-19 | Epic 2 | 2.3, 2.6 |
| FR-20 | Epic 4 | 4.2, 4.6 |
| FR-21 | Epic 4, Epic 5 | 4.2, 5.1 |
| FR-22 | Epic 1, Epic 5 | 1.3, 5.5 |
| FR-23 | Epic 1, Epic 5 | 1.3, 5.5 |
| FR-24 | Epic 1 | 1.3 |
| FR-25 | Epic 4, Epic 5 | 4.3, 5.6 |
| FR-26 | Epic 5 | 5.6 |
| FR-27 | Epic 5 | 5.1, 5.4 |
| FR-28 | Epic 4 | 4.1, 4.4 |
| FR-29 | Epic 1, Epic 4, Epic 7 | 1.5, 4.1, 4.3, 7.1 |
| FR-30 | Epic 2 | 2.5 |
| FR-31 | Epic 3 | 3.2 |
| FR-32 | Epic 6 | 6.1 |
| FR-33 | Epic 1, Epic 6 | 1.6, 6.3 |
| FR-34 | Epic 7 | 7.2 |
| FR-35 | Epic 1, Epic 2, Epic 4, Epic 7 | 1.6, 2.1, 4.3, 7.1 |
| FR-36 | Epic 8 | 8.1, 8.6 |
| FR-37 | Epic 8 | 8.1, 8.2, 8.6 |
| FR-38 | Epic 8 | 8.1, 8.2, 8.3, 8.6 |
| FR-39 | Epic 8 | 8.1, 8.2, 8.3, 8.6 |
| FR-40 | Epic 8 | 8.1, 8.2, 8.5 |
| FR-41 | Epic 8 | 8.1, 8.4 |
| FR-42 | Epic 8 | 8.1, 8.2, 8.4, 8.5 |
| FR-43 | Epic 8 | 8.4, 8.5, 8.6 |
| FR-44 | Epic 8 | 8.3, 8.7 |
| Geänderte FR 2.1 (FR-1 … FR-34, NFR-7, NFR-10) | Epic 8 | 8.1 (Kontrollsummen), 8.2 (Snapshot, Persistenz, Befehle), 8.4–8.6 (Darstellung), 8.7 (Version, Doku, Abnahme) |

| NFR | Stories |
|---|---|
| NFR-1 | 2.6 (p95), 4.4 (Zählanimation, CLS), 5.1 (≤ 100 ms), 6.1 (JS-Budget) |
| NFR-2 | 4.1 (Tokens, Kontrasttest, Zoom), 4.3–5.6 (ARIA je Baustein), 5.7 (axe, Tastatur) , 7.3 (manuell) |
| NFR-3 | 5.6 (Layout), 5.7, 7.3 |
| NFR-4 | 2.4 (Whitelist, 4 KB, Origin), 3.1 (Härtung), 6.1 (audit), 6.2 (Härtungsprüfung), 1.6 (keine neuen Laufzeitabhängigkeiten) |
| NFR-5 | 2.5, 2.6 |
| NFR-6 | 1.1–1.6 (Domäne, Coverage), 2.6, 4.x/5.x (Komponententests), 6.1 |
| NFR-7 | 2.1, 2.3, 2.4 |
| NFR-8 | 4.2 (kein `randomUUID`), 5.3 (natives `<dialog>`), 7.3 |
| NFR-9 | 2.1, 3.1, 3.2, 6.3, 7.2 |
| NFR-10 | 7.3 |

| UX-DR | Stories |
|---|---|
| UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR31 | 4.1 |
| UX-DR24, UX-DR25, UX-DR26, UX-DR27, UX-DR28 | 4.3 |
| UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR10 | 4.4 |
| UX-DR20, UX-DR21 | 4.5 |
| UX-DR22, UX-DR23 | 4.2, 4.6 |
| UX-DR13, UX-DR14, UX-DR15 | 5.1 |
| UX-DR16 | 5.2 |
| UX-DR17 | 5.3 |
| UX-DR18 | 5.4 |
| UX-DR11 | 5.5 |
| UX-DR12, UX-DR19, UX-DR29 | 5.6 |
| UX-DR30 | 5.7 (querschnittlich in allen UI-Stories) |

## Epic List

### Epic 1: Ein gemeinsames Hausmodell – Katalog, Szenen und Verbrauchsrechnung
Server und Client kennen dasselbe Haus mit 6 Räumen, 28 Geräten und 4 Szenen und rechnen Verbrauch, Kosten, Laststufe, Tagesenergie und Befehle identisch und getestet. Danach ist jede Zahl, die Nutzende später sehen, fachlich richtig (SM-5). Enthält die Werkzeugkette (Vitest, Server-tsconfig, Scripts, ESLint, Version 2.0.0).
**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-6, FR-7, FR-9, FR-10, FR-12, FR-13, FR-18, FR-22, FR-23, FR-24, FR-29, FR-33 (Version), FR-35 (Lint-Regel)

### Epic 2: Ein Hauszustand für alle Geräte – autoritativer Zustandsdienst
Alle Browser sehen jederzeit denselben, vom Server gehaltenen Zustand; ein neu geöffneter Tab überschreibt nichts mehr; Auto-Aus, Tagesenergie und Persistenz laufen serverseitig; ungültige Befehle bringen nichts durcheinander. Behebt den Kernfehler der Vorversion (UJ-2, UJ-5, SM-1).
**FRs covered:** FR-3, FR-5, FR-9, FR-10, FR-14, FR-15, FR-16, FR-17, FR-18, FR-19, FR-30, FR-35 (Serverlog)

### Epic 3: Betrieb im gehärteten Container
Der Betreiber startet das gehärtete Image wie bisher; es läuft mit dem neuen Server, meldet sich ohne curl als `healthy` und behält Zustand und Tagesverbrauch über Neustarts (UJ-5).
**FRs covered:** FR-17, FR-31

### Epic 4: Live-Verbrauch auf einen Blick
Nutzende öffnen die App und sehen sofort und live, was das Haus verbraucht und kostet, wie die Verbindung steht und jede Änderung (auch von anderen Geräten) als Meldung und Ansage – in Hell oder Dunkel, ohne Aufblitzen (UJ-1, UJ-3, UJ-4).
**FRs covered:** FR-6, FR-9, FR-10, FR-11, FR-12, FR-13, FR-14, FR-15, FR-18, FR-20, FR-21 (Client-Logik), FR-25, FR-28, FR-29, FR-35 (alte UI entfernt)

### Epic 5: Geräte, Räume und Szenen bedienen
Nutzende schalten jedes der 28 Geräte, ganze Räume und vier Szenen – per Touch, Maus, Tastatur und Screenreader –, sehen Auto-Aus-Restzeiten, werden bei Grundlastgeräten gefragt und finden jeden Raum über die leuchtende Hausansicht (UJ-1 bis UJ-4).
**FRs covered:** FR-1, FR-3, FR-4, FR-5, FR-7, FR-8, FR-21, FR-22, FR-23, FR-25, FR-26, FR-27

### Epic 6: Automatisch geprüft und ausgeliefert
Jeder PR und jeder Push auf main wird geprüft; nur grüne Stände werden als Multi-Arch-Image veröffentlicht; Tag, Release und Versions-Image `2.0.0` entstehen ohne Handarbeit (UJ-5, SM-3).
**FRs covered:** FR-32, FR-33

### Epic 7: Aufgeräumt, dokumentiert, abgenommen
Betreiber und Entwickelnde finden eine aktuelle deutsche Doku ohne toten Code; die Abnahme-Checkliste belegt Responsivität, Tastatur, Screenreader und Zwei-Geräte-Sync vor dem Release.
**FRs covered:** FR-29 (Resttext-Test), FR-34, FR-35

### Epic 8: Elektroauto & Solaranlage (Release 2.1.0)
Ein Elektroauto im Carport lädt an der Wallbox, fährt weg und kommt zurück; eine Solaranlage erzeugt je nach gewählter Sonnenlage; Kopf und Tageswerte zeigen Netzbezug, Einspeisung, Kosten und Ertrag (UJ-6). Reihenfolge wie Architektur §3.11: Domäne → Server → Client-Zustand → UI → Doku/Release.
**FRs covered:** FR-36, FR-37, FR-38, FR-39, FR-40, FR-41, FR-42, FR-43, FR-44 sowie die mit 2.1 geänderten FR-1, FR-2, FR-4, FR-6, FR-9, FR-10, FR-11, FR-15, FR-17, FR-18, FR-23/24, FR-25, FR-26, FR-27, FR-30, FR-33, FR-34, NFR-7, NFR-10

**Epic-Schnitt (Datei-Churn geprüft):** Epics 4 und 5 berühren beide `src/components/`, aber disjunkte Dateien (Kopf/Übersicht/Meldungen/Banner vs. Raumkarte/Szenen/Hausansicht); die Trennung bildet eine echte Risikogrenze (erst Anzeige und Verbindung stabil, dann Bedienung). Epics 3 und 6 teilen nur `Dockerfile`-Wissen, nicht Dateien. Keine weitere Konsolidierung nötig.

---

## Epic 1: Ein gemeinsames Hausmodell – Katalog, Szenen und Verbrauchsrechnung

Server und Client importieren ein Domänenmodul `src/domain/` (reines TypeScript, keine React/Next/Node-Imports, nur relative endungslose Imports), das den Gerätekatalog, die Szenen und alle Rechen- und Prüffunktionen enthält. Abschluss mit der Werkzeugkette aus Architektur §3.11 Schritt 2.

### Story 1.1: Gerätekatalog und Hausmodell

As a Bewohnerin des simulierten Hauses,
I want dass es genau 6 Räume mit 28 realistisch bemessenen Geräten gibt,
So that alle Anzeigen und Schaltungen auf einem einzigen, verlässlichen Hausmodell beruhen.

**Acceptance Criteria:**

**Given** `src/domain/katalog.ts`
**When** der Katalog geladen wird
**Then** enthält `RAEUME` genau `wohnzimmer`, `kueche`, `hwr` (EG) und `schlafzimmer`, `bad`, `arbeitszimmer` (OG) mit den Anzeigenamen aus PRD FR-1, und `GERAETE` genau die 28 Geräte aus PRD Anhang A (ID `‹raum›.‹geraet›`, Name, Raum, Kategorie, `symbol: SymbolName`, `betriebW`, `standbyW`, `grundlast`, `autoAusS: 180 | null`)
**And** `katalog.test.ts` vergleicht jeden Eintrag mit einer Anhang-A-Fixture (28 Geräte, IDs eindeutig, alle Werte identisch), prüft Betrieb > 0, 0 ≤ Standby < Betrieb, jeder Raum ≥ 3 Geräte, Raumzählung 5/7/4/3/4/5 und die 7 Kategorien Licht, Küche, Unterhaltung, Haushalt, Körperpflege, Heizung, IT

**Given** kein gespeicherter Zustand
**When** `ausgangszustand(jetzt)` aufgerufen wird
**Then** sind genau `kueche.kuehlschrank`, `hwr.gefrierschrank`, `arbeitszimmer.router` *An* (`seit = jetzt`), alle anderen *Aus*
**And** nur diese drei Geräte haben `grundlast: true`, nur `kueche.wasserkocher` und `kueche.mikrowelle` haben `autoAusS: 180`

**Given** das Repo ohne Test-Runner
**When** diese Story abgeschlossen ist
**Then** existieren `vitest.config.mts` und `vitest.setup.ts` gemäß Architektur §3.10 (Include-Muster, `@`-Alias, Coverage-Provider v8) und `npx vitest run src/domain` ist grün

### Story 1.2: Verbrauchs-, Kosten- und Laststufenrechnung

As a Bewohner,
I want dass Haus-, Raum-, Standby- und Kostenwerte exakt aus dem Katalog berechnet werden,
So that die angezeigten Zahlen stimmen und in allen Clients identisch sind.

**Acceptance Criteria:**

**Given** `src/domain/verbrauch.ts` mit `geraeteleistung`, `hausverbrauch`, `raumverbrauch`, `standbyAnteil`, `anzahlAn`, `laststufe`, `kostenProStunde`
**When** der Ausgangszustand berechnet wird
**Then** ist `hausverbrauch` = 75,3 W, `standbyAnteil` = 10,3 W, „alles an“ = 12.978 W, und alle Summen nutzen ungerundete Katalogwerte (FR-29)
**And** die Summe aller `raumverbrauch` ist gleich `hausverbrauch` (FR-7)

**Given** gerundete Anzeigewerte 499, 500, 1.999, 2.000 W
**When** `laststufe(w)` aufgerufen wird
**Then** liefert sie `niedrig`, `mittel`, `mittel`, `hoch` (FR-12)

**Given** 5.607 W und Strompreis 0,35
**When** `kostenProStunde` berechnet wird
**Then** ergibt sich 1,96245 €/h (Anzeige später „1,96 €/h“, FR-9)
**And** `anzahlAn(zustand, raum)` zählt Grundlastgeräte mit (K-25)
**And** die Zeilenabdeckung von `verbrauch.ts` ist ≥ 90 %

### Story 1.3: Szenen, Befehlsprüfung und Protokollvertrag

As a Bewohnerin,
I want dass Szenen, Einzelschaltungen und „Raum ausschalten“ nach festen Regeln wirken und ungültige Befehle abgewiesen werden,
So that Grundlastgeräte geschützt bleiben und der Zustand nie inkonsistent wird.

**Acceptance Criteria:**

**Given** `src/domain/protokoll.ts`
**When** es importiert wird
**Then** exportiert es die Typen `Befehl`, `ServerNachricht`, `FehlerCode`, `GeraeteZustand`, `HausZustand`, `Energie` und die Grenze `MAX_NACHRICHT_BYTES = 4096` exakt nach Architektur §3.4/§3.5

**Given** `src/domain/szenen.ts` mit den Szenen `alles-aus`, `filmabend`, `morgenroutine`, `gute-nacht` (Name, Wirkung nach FR-23)
**When** jede Szene auf den Ausgangszustand und auf „alles an“ angewandt wird
**Then** entspricht der Ergebniszustand FR-23, kein Grundlastgerät ändert sich (FR-24), „Alles aus“ aus „alles an“ ergibt 75 W, „Morgenroutine“ aus dem Ausgangszustand ergibt eine gerundete Differenz von +5.532 W
**And** zweimaliges Anwenden ergibt denselben Zustand und beim zweiten Mal eine leere Änderungsliste (Idempotenz, FR-22)

**Given** `befehle.ts` mit `pruefeBefehl(json)` und `wendeAn(zustand, befehl, jetzt)`
**When** gültige Befehle `schalten`, `szene`, `raumAus` geprüft werden
**Then** werden sie akzeptiert; `wendeAn` liefert `{ zustand, geaendert: GeraetId[] }`, ändert beim Schalten genau ein Gerät (FR-3), erlaubt das Ausschalten eines Grundlastgeräts per Einzelbefehl (FR-18) und lässt bei `raumAus` Grundlastgeräte unberührt
**And** ein bereits eingeschaltetes Auto-Aus-Gerät behält bei Szene/Schalten auf *An* sein `seit` (FR-5)

**Given** eine Testmatrix aus unbekannten IDs, falschen Typen, fehlenden Feldern, Zusatzfeldern, ungültiger Befehls-ID und Feld `type`
**When** `pruefeBefehl` sie prüft
**Then** liefert es den passenden `FehlerCode` (`UNGUELTIGER_BEFEHL`, `UNBEKANNTES_GERAET`, `UNBEKANNTE_SZENE`, `UNBEKANNTER_RAUM`, `ALTES_PROTOKOLL`) und die `befehlId`, sofern `id` gültig war
**And** die Zeilenabdeckung von `szenen.ts` und `befehle.ts` ist ≥ 90 %

### Story 1.4: Tagesenergie-Integration mit Berliner Mitternacht

As a Bewohner,
I want dass der Tagesverbrauch korrekt seit 00:00 Uhr Berliner Zeit gezählt wird,
So that „Heute ‹x› kWh · ‹y› €“ auch an Tagen mit Zeitumstellung stimmt.

**Acceptance Criteria:**

**Given** `src/domain/energie.ts` mit `berlinDatum(ms)`, `naechsteMitternachtBerlin(ms)`, `integriere(energie, leistungW, vonMs, bisMs)`
**When** 2.000 W über 30 min integriert werden
**Then** ist `wh` = 1.000 (± 10) (FR-10)

**Given** ein Intervall, das Mitternacht Europe/Berlin überschreitet
**When** integriert wird
**Then** beginnt ein neuer Tag mit `datum` = neuer Berliner Tag und `wh` = nur der Anteil nach Mitternacht (Vortag verworfen)
**And** Tests für 2026-03-29 (23-h-Tag) und 2026-10-25 (25-h-Tag) sind grün, ohne Zusatzbibliothek (nur `Intl`)
**And** die Zeilenabdeckung von `energie.ts` ist ≥ 90 %

### Story 1.5: Deutsche Zahlen- und Zeitformate

As a Bewohnerin,
I want alle Werte im gewohnten deutschen Format,
So that ich Zahlen ohne Nachdenken lesen kann und Screenreader sie richtig vorlesen.

**Acceptance Criteria:**

**Given** `src/domain/format.ts` auf Basis `Intl.NumberFormat('de-DE', { roundingMode: 'halfExpand' })`
**When** die Formatierer aufgerufen werden
**Then** gilt `watt(1200)` → „1.200 W“, `watt(1273.8)` → „1.274 W“, `standby(0.5)` → „0,5 W“, `euroProStunde(1.96245)` → „1,96 €/h“, `euro(1.197)` → „1,20 €“, `kwh(3420)` (Wh) → „3,42 kWh“, `prozent(0.788)` → „79 %“, `wattGesprochen(1274)` → „1.274 Watt“, `restzeit(168)` → „noch 2:48“, `delta(+1199)` → „+1.199 W“, `delta(−2200)` → „−2.200 W“ (U+2212), `delta(0)` → „±0 W“
**And** zwischen Zahl und Einheit steht ein geschütztes schmales Leerzeichen (U+202F), in Tests explizit geprüft
**And** kaufmännisch gerundet wird ausschließlich hier (FR-29); ein Test belegt 0,5 → 1 und 2,5 → 3

### Story 1.6: Werkzeugkette, Version 2.0.0 und Katalog-Wächter

As a Entwickler im BMAD-Team,
I want eine vollständige, einheitliche Werkzeugkette für App, Server, Domäne und Tests,
So that jede folgende Story mit `lint`, `typecheck`, `test` und `build` geprüft werden kann.

**Acceptance Criteria:**

**Given** `package.json`
**When** die Story abgeschlossen ist
**Then** ist `version` = `2.0.0`, die Scripts entsprechen Architektur §7 (`dev`, `dev:broker`, `build` = `next build && tsc -p tsconfig.server.json`, `start`, `lint` = `eslint . --max-warnings=0`, `typecheck`, `test`, `test:watch`; `docker:*`/`compose:*` bleiben)
**And** Laufzeitabhängigkeiten sind exakt `next`, `react`, `react-dom`, `mqtt`, `ws`; devDeps um genau `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `axe-core`, `aedes` ergänzt; `@types/ws` in devDeps, `@types/mqtt` entfernt, `@types/node ^22`; `overrides` unverändert

**Given** `tsconfig.server.json` und Root-`tsconfig.json`
**When** `npm run typecheck` und `npx tsc -p tsconfig.server.json` laufen
**Then** sind beide fehlerfrei; Root hat `target: ES2022` und `exclude: ["node_modules","dist"]`; das Kompilat liegt unter `dist/server/**` und `dist/src/domain/**`

**Given** `eslint.config.mjs`
**When** `npm run lint` läuft
**Then** ignoriert es `dist/**`, `coverage/**`, erzwingt `no-console` (nur `console.error` erlaubt) für `src/**` und `server/**` außer `server/log.ts`, kennt Node-Globals für `scripts/**/*.mjs` und endet mit 0 Fehlern und 0 Warnungen (FR-35)

**Given** `tests/architektur/geraete-ids.test.ts`
**When** er läuft
**Then** findet er außerhalb von `src/domain/`, Tests und `scripts/` kein Geräte-ID-Literal (FR-2)
**And** `npm test -- --coverage` erreicht ≥ 90 % Zeilen auf `src/domain/**` (NFR-6); `.gitignore` enthält `/dist` und `build.log`

---

## Epic 2: Ein Hauszustand für alle Geräte – autoritativer Zustandsdienst

`server/*.ts` ersetzt `server.js`: Konfiguration, Logger, MQTT-Speicher, Zustandsdienst, WebSocket-Schicht, Health und Einstieg, in der Reihenfolge aus Architektur §3.11 Schritt 3. Browser sprechen nur noch das Befehls-/Ereignisprotokoll.

### Story 2.1: Serverkonfiguration, Logger und Version

As a Betreiber,
I want einen Server, der seine Einstellungen robust aus der Umgebung liest und je Ereignis genau eine verständliche Logzeile schreibt,
So that ich Strompreis und Broker einstellen und Probleme im Log erkennen kann.

**Acceptance Criteria:**

**Given** `server/konfig.ts`
**When** `STROMPREIS_EUR_PRO_KWH` = `0.32`, `0`, leer, `-1`, `abc` oder `0,32` ist
**Then** gilt 0,32 bzw. 0 (gültig); negativ, `abc` und `0,32` (Komma) → 0,35 mit genau einer Logzeile `WARN strompreis_ungueltig`; nicht gesetzt oder leer → 0,35 mit einer `INFO strompreis quelle=standard`-Zeile (Standardfall, keine Warnung, K-27) (FR-9)
**And** `PORT` (3000), `HOSTNAME` (0.0.0.0), `MQTT_BROKER_HOST` (127.0.0.1), `MQTT_BROKER_PORT` (1883) haben die Defaults aus Architektur §7; `NEXT_PUBLIC_MQTT_BROKER_URL` wird ignoriert (NFR-9)

**Given** `server/log.ts` als einzige Stelle mit `console.*` im Server
**When** ein Ereignis geloggt wird
**Then** entsteht genau eine Zeile `‹ISO-Zeit› ‹INFO|WARN|FEHLER› ‹ereignis› schluessel=wert …` ohne Nutzdaten (NFR-7, FR-35)

**Given** `server/version.ts`
**When** die Version gelesen wird
**Then** stammt sie aus `package.json` (Pfad relativ zum Kompilat funktioniert in `dist/` und im Test), nicht fest verdrahtet (FR-30)
**And** `konfig.test.ts` deckt alle Strompreis-Fälle ab

### Story 2.2: Persistenz im Broker – MQTT-Speicher mit Wiederherstellung

As a Bewohnerin,
I want dass der Hauszustand und der Tagesverbrauch einen Neustart überstehen,
So that nach einem Update oder Stromausfall alles so ist wie vorher.

**Acceptance Criteria:**

**Given** `server/mqtt-speicher.ts` und ein Broker mit retained Nachrichten unter `iot-haus/v2/#`
**When** der Speicher startet
**Then** verbindet er sich mit `clientId: "iot-haus-server"`, abonniert `iot-haus/v2/#` (QoS 1), sammelt nach SUBACK ein Ruhefenster (Default 500 ms, konfigurierbar `restoreFensterMs`) und meldet danach ab
**And** gültige Payloads (`v === 1`, Typen korrekt, ID im Katalog) werden übernommen; ungültige/unbekannte → ignoriert mit Logzeile `restore_ignoriert topic=…`; fehlende Geräte → Ausgangszustand (FR-17)

**Given** ein Energie-Topic mit `datum` = heutiger Berliner Tag
**When** wiederhergestellt wird
**Then** wird `wh` übernommen, sonst `{ datum: heute, wh: 0 }`; `energieStand = jetzt` (Ausfallzeit zählt nicht, FR-10)

**Given** geänderte Geräte oder ein Energie-Update
**When** der Speicher publiziert
**Then** schreibt er retained, QoS 1 auf `iot-haus/v2/geraet/<id>/zustand` `{ v:1, an, seit }` bzw. `iot-haus/v2/energie/heute` `{ v:1, datum, wh, stand }`
**And** es gibt eine Funktion zum vollständigen Neu-Publizieren (28 Geräte + Energie) und einen `flush` mit PUBACK-Wartezeit ≤ 2 s
**And** Tests gegen aedes in-process belegen Restore, Ignorieren unbekannter IDs und Ausgangszustand

### Story 2.3: Zustandsdienst mit Auto-Aus und Tagesenergie

As a Bewohner,
I want dass der Server jede Änderung in einem einzigen, strikt sequenziellen Pfad ausführt, Wasserkocher und Mikrowelle selbst abschaltet und den Tagesverbrauch zählt,
So that der Zustand immer eindeutig ist und nichts heiß weiterläuft.

**Acceptance Criteria:**

**Given** `server/zustandsdienst.ts` mit injizierter Uhr `jetzt: () => number`
**When** ein Befehl über `fuehreAus(befehl, ursache)` ausgeführt wird
**Then** wird die Energie bis `jetzt` mit der **alten** Leistung integriert, der neue Zustand übernommen, Auto-Aus-Timer gepflegt, genau **eine** `aenderung` erzeugt und der Retained-Publish ausgelöst (Architektur §4.4)
**And** ein Befehl ohne Änderung erzeugt keine `aenderung`, aber `bestaetigt { geaendert: false }` (FR-19)

**Given** Fake-Timer und Mikrowelle *Aus → An*
**When** 180 s vergehen
**Then** wird sie mit Ursache `{ art: 'autoAus', ref: 'kueche.mikrowelle', befehlId: null }` ausgeschaltet und `auto_aus geraet=kueche.mikrowelle` geloggt (FR-5)
**And** *An → Aus → An* startet die 180 s neu; eine Szene, die sie erneut auf *An* setzt, lässt `seit` und Timer unverändert

**Given** ein wiederhergestellter Zustand mit Wasserkocher *An* seit 100 s
**When** der Dienst startet
**Then** schaltet er nach 80 s aus; war die Restzeit bereits abgelaufen, sofort (FR-5)

**Given** der Energie-Tick
**When** `min(jetzt + 60 000, naechsteMitternachtBerlin(jetzt))` erreicht ist
**Then** wird integriert, retained publiziert, eine `energie`-Nachricht mit `serverZeit` an alle erzeugt und neu geplant; um 00:00 Berlin beginnt der Tag bei 0 (FR-10)
**And** Zeilenabdeckung von `zustandsdienst.ts` ≥ 90 %

### Story 2.4: WebSocket-Protokoll – Snapshot, Befehle, Verteilung

As a Bewohnerin mit mehreren Geräten,
I want dass jeder Browser beim Öffnen den aktuellen Zustand bekommt und jede Änderung sofort überall sichtbar wird,
So that Handy und Laptop nie Unterschiedliches zeigen und ein neuer Tab nichts überschreibt.

**Acceptance Criteria:**

**Given** `server/ws-verbindungen.ts` und `server/ursprung.ts`
**When** ein Upgrade auf `/mqtt` ankommt
**Then** wird es angenommen, wenn `Origin` fehlt oder `new URL(origin).host` gleich `Host` oder erstem `X-Forwarded-Host` ist und der Dienst bereit ist; sonst `403` (Origin, Log `ws_abgelehnt grund=origin`) bzw. `503` (nicht bereit); andere Pfade werden in Produktion zerstört (NFR-4)
**And** `ursprung.test.ts` deckt fehlend, gleich, X-Forwarded-Host, fremd und ungültige URL ab

**Given** eine angenommene Verbindung
**When** sie offen ist
**Then** sendet der Server sofort `snapshot` mit `version`, allen 28 Zuständen inkl. `seit`, `energie`, `strompreis`, `serverZeit` (FR-15) und der Client muss nichts senden (FR-14)

**Given** eingehende Nachrichten
**When** sie > 4.096 Byte sind, kein JSON sind, ein Feld `type` haben oder `pruefeBefehl` scheitert
**Then** erhält nur der Absender `fehler` mit `ZU_GROSS`/`UNGUELTIGES_JSON`/`ALTES_PROTOKOLL`/passendem Code, der Zustand bleibt unverändert, der Handler ist per `try/catch` gegen Absturz geschützt, `maxPayload` = 64 KiB (FR-18, AR-6)

**Given** ein gültiger Befehl mit Änderung
**When** er verarbeitet ist
**Then** erhalten **alle** Clients die `aenderung` (Szene/Raum als eine Nachricht, FR-16) und danach der Absender `bestaetigt { befehlId, geaendert }`
**And** der Server pingt alle 30 s und beendet Verbindungen ohne Pong; je Befehl höchstens eine Logzeile `befehl typ=… ergebnis=…` (FR-35)

### Story 2.5: Server-Einstieg, Health-Endpunkt und Broker-Ausfall

As a Betreiber,
I want einen Server, der Next ausliefert, seinen Zustand über `/api/health` ehrlich meldet und einen Broker-Ausfall selbst übersteht,
So that Docker und ich jederzeit wissen, ob das Haus bedienbar ist.

**Acceptance Criteria:**

**Given** `server/app.ts` mit `erstelleServer(opts)` (Signatur Architektur §3.10) und `server/index.ts`
**When** `npm run build && npm start` läuft
**Then** startet `node dist/server/index.js` Next (dev/prod nach `NODE_ENV`), bedient HTTP und WS auf `PORT` und loggt `start` und `bereit`; `server.js` und `src/app/api/health/route.ts` sind gelöscht

**Given** Broker verbunden und Restore abgeschlossen
**When** `GET /api/health`
**Then** kommt `200 { "status":"ok", "mqtt":"verbunden", "version":"2.0.0" }` mit `Cache-Control: no-store`; sonst `503 { status:"fehler", mqtt:"getrennt"|"verbunden", version }` (FR-30, AR-12)

**Given** der Broker fällt aus
**When** MQTT `offline`/`close` meldet
**Then** werden alle WS-Verbindungen mit Code 1013 geschlossen, neue Upgrades mit 503 abgelehnt, Health liefert 503, Timer laufen weiter; nach Wiederverbindung wird der Speicherzustand vollständig neu publiziert und der Dienst ist wieder bereit (NFR-5, AR-5)

**Given** SIGTERM oder SIGINT
**When** der Prozess beendet wird
**Then** integriert er Energie, publiziert sie und wartet auf PUBACK (≤ 2 s), schließt WS mit 1012, HTTP und MQTT und endet mit Exit 0 (FR-10)
**And** `next.config.ts` setzt `env.NEXT_PUBLIC_APP_VERSION` aus `package.json`, die drei Security-Header (AR-14) und `eslint.ignoreDuringBuilds: true`; `scripts/dev-broker.mjs` startet aedes auf :1883 (AR-16)

### Story 2.6: Mehrclient-Integrationstests gegen den echten Server

As a Betreiber,
I want automatisch belegt haben, dass alle Clients konsistent bleiben,
So that der Kernfehler der Vorversion nie zurückkommt (SM-1, SM-2).

**Acceptance Criteria:**

**Given** `tests/integration/*.test.ts` mit `erstelleServer({ port: 0, mqttUrl: aedes, restoreFensterMs: 50 })` und echten `ws`-Clients
**When** ein Client verbindet
**Then** liegt der Snapshot in ≤ 1 s vor und das Verbinden erzeugt 0 Zustandsänderungen (FR-14, FR-15)

**Given** 3 Clients
**When** ≥ 100 Befehle von Client A gesendet werden
**Then** ist die p95-Verteilzeit an alle ≤ 250 ms (FR-16, NFR-1)
**And** nach 200 Zufallsbefehlen von allen drei Clients ohne Pause sind alle Client-Zustände zu 100 % identisch mit dem Serverzustand (FR-19)

**Given** ungültiges JSON, > 4 KB, `{ "type": "publish" }`, unbekannte IDs, fremde Origin
**When** sie gesendet werden
**Then** folgen Fehlerantworten bzw. 403, kein Absturz, Zustand unverändert (FR-18, NFR-4)

**Given** ein Server-Neustart gegen dieselbe aedes-Instanz bzw. ein Broker-Ausfall
**When** der Server wieder bereit ist
**Then** ist der Zustand identisch (FR-17); während des Ausfalls sind WS geschlossen und Health = 503 (NFR-5)
**And** die gesamte Testsuite läuft ≤ 60 s (SM-C4)

---

## Epic 3: Betrieb im gehärteten Container

Dockerfile, supervisord, Mosquitto und Compose werden auf den neuen Server umgestellt, ohne die Härtung aus PR #1/#2 zurückzudrehen (Architektur §3.9, §3.11 Schritt 4).

### Story 3.1: Gehärtetes Image mit neuem Server und sofortiger Persistenz

As a Betreiber,
I want dass das Image den kompilierten Server startet und Mosquitto nach jeder Änderung speichert,
So that ich wie gewohnt deploye und kein Zustand bei einem Absturz verloren geht.

**Acceptance Criteria:**

**Given** das `Dockerfile`
**When** das Image gebaut wird
**Then** führt der Builder `npm run build` aus, die Runtime kopiert `dist/` statt `server.js`, `package.json` bleibt (Versionsquelle), `ENV NEXT_PUBLIC_MQTT_BROKER_URL` entfällt und `STROMPREIS_EUR_PRO_KWH` wird nicht vorbelegt
**And** unverändert bleiben Node 22 Alpine, Entfernen von npm/npx/corepack/yarn/apk/wget/curl/nc, `USER 1000:1000`, root-eigener nur lesbarer App-Code, `.next/cache` und `/var/lib/mosquitto` als einzige beschreibbare Orte (NFR-4)

**Given** `docker/supervisord.conf`, `docker/mosquitto.conf`, `docker/start.sh`
**When** der Container läuft
**Then** startet `nextjs-server` mit `node dist/server/index.js`, `stopsignal=TERM`, `stopwaitsecs=5`, ohne `NEXT_PUBLIC_…`; Mosquitto hat `stopwaitsecs=5`, `autosave_on_changes true`, `autosave_interval 1`, lauscht nur auf 127.0.0.1; `start.sh` zeigt „IoT-Haus 2.0“ (FR-17)

**Given** `.dockerignore` und `.gitignore`
**When** gebaut wird
**Then** sind `_bmad/`, `_bmad-output/`, `docs/`, `tests/`, `coverage/`, `dist/`, `scripts/`, `test-*.js` vom Build-Kontext ausgeschlossen

### Story 3.2: Healthcheck ohne curl und kompatible Compose-Dateien

As a Betreiber,
I want dass der Container sich ohne curl als `healthy` meldet und meine Compose-Konfiguration weiter gilt,
So that `docker ps` stimmt und das Update nur `pull && up -d` braucht.

**Acceptance Criteria:**

**Given** das `Dockerfile`
**When** es vor `USER` den `HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 CMD ["node","-e","fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]` enthält
**Then** ist der Container nach `docker compose up -d` in ≤ 60 s `healthy` (FR-31, AR-12)

**Given** `docker-compose.yml` und `docker-compose.prod.yml`
**When** sie geprüft werden
**Then** fehlt der `healthcheck`-Block (Image-Healthcheck wird geerbt), `mosquitto-logs` und `NEXT_PUBLIC_MQTT_BROKER_URL` sind entfernt, `STROMPREIS_EUR_PRO_KWH` steht als auskommentiertes Beispiel
**And** Port 3000, Containername, Image `ghcr.io/deltatree-de/iot-haus:latest` und Volume `mosquitto-data` bleiben (NFR-9)

### Story 3.3: Container-Smoke mit Neustart-Persistenz

As a Betreiber,
I want einen reproduzierbaren Smoke-Test gegen das gebaute Image,
So that ich vor jeder Auslieferung weiß, dass Schalten und Persistenz im echten Container funktionieren.

**Acceptance Criteria:**

**Given** `scripts/smoke-container.mjs` (nur Node 22 + `ws`)
**When** es im Modus `schalten` gegen einen laufenden Container läuft
**Then** prüft es `/api/health` = 200, empfängt einen Snapshot mit 28 Geräten und `version` = `package.json`-Version, sendet `schalten arbeitszimmer.pc an` und erhält `bestaetigt`

**Given** `docker restart` des Containers mit gleichem Volume
**When** das Skript im Modus `pruefen` läuft
**Then** meldet der Snapshot `arbeitszimmer.pc` *An* (FR-17); jeder Fehler endet mit Exitcode 1
**And** der Ablauf (build, run, healthy, schalten, restart, pruefen) ist in `DOCKER-SETUP.md` oder der Story-Datei als lokaler Befehl dokumentiert

---

## Epic 4: Live-Verbrauch auf einen Blick

Client-Fundament und Anzeige in der Reihenfolge aus Architektur §3.11 Schritt 5: Tokens/Theme/Layout → Verbindung + Reducer → Provider/Hooks → Blatt- und Container-Komponenten. Komponentennamen nach Architektur §5.1 (K-06), Aussehen/Verhalten/Texte nach UX.

### Story 4.1: Farb-Tokens, Theme ohne Aufblitzen und barrierefreies Grundlayout

As a Bewohner, der abends im Dunkelmodus aufs Handy schaut,
I want dass die App sofort im richtigen Theme erscheint, zoombar ist und überall ausreichend Kontrast hat,
So that nichts blendet und alles lesbar ist.

**Acceptance Criteria:**

**Given** `src/ui/farbtokens.ts`
**When** es importiert wird
**Then** exportiert es `TOKEN_NAMEN`, `HELL` und `DUNKEL` mit exakt den Hex-Werten aller 34 Rollen aus DESIGN.md-Frontmatter (K-01) und `KONTRAST_PAARE` mit mindestens allen Paaren der DESIGN.md-Kontrasttabellen samt Soll (4,5 bzw. 3) (K-05)
**And** `tests/architektur/kontrast.test.ts` berechnet jedes Paar in beiden Themes nach WCAG-Formel und ist grün (NFR-2)

**Given** `src/app/layout.tsx` und `src/app/globals.css`
**When** die Seite gerendert wird
**Then** erzeugt das Layout aus den Tokens ein `<style>` mit `:root[data-theme="hell"]{--c-‹rolle›:…}` und `:root[data-theme="dunkel"]{…}`; `globals.css` bildet sie per `@theme inline { --color-‹rolle›: var(--c-‹rolle›) }` ab und definiert `@custom-variant dark (&:where([data-theme=dunkel], [data-theme=dunkel] *))` (K-02, K-03)
**And** `globals.css` enthält die Motion-Variablen `--m-*` (UX-DR4) mit globaler `prefers-reduced-motion`-Regel (Dauern 0 ms), Fokusrahmen `outline: 2px solid var(--c-focus); outline-offset: 2px` über `:focus-visible`, Basisschrift 16 px, `tabular-nums`-Utility; alte Blobs, Verläufe, Arial-Override und Wurzelschrift-Verkleinerung sind entfernt

**Given** `src/ui/themeSkript.ts` als Inline-Skript im `<head>`
**When** die Seite lädt
**Then** liest es `localStorage["iot-haus.theme"]` (`system|hell|dunkel`, K-04) in `try/catch`, löst `system` per `matchMedia('(prefers-color-scheme: dark)')` auf, setzt `data-theme` auf `hell`/`dunkel` und `meta[name=theme-color]` auf `#FFFFFF`/`#131C2E` vor dem ersten Paint und entfernt `smart-home-state` (FR-14, FR-28)
**And** `<html lang="de" suppressHydrationWarning>`, Titel „IoT-Haus – Energie & Steuerung“, Beschreibung aus `texte.ts`-Wortlaut, `appleWebApp.title: "IoT-Haus"`, `viewport = { width: 'device-width', initialScale: 1 }` ohne `maximumScale`/`userScalable`/`themeColor`; manuelle `<meta>`-Duplikate und der `apple-touch-icon.png`-Link sind entfernt (FR-29, NFR-2, K-12)

**Given** `src/hooks/useTheme.ts` und `src/hooks/useReduzierteBewegung.ts`
**When** die Wahl wechselt oder das System-Theme sich ändert (bei „System“)
**Then** werden `data-theme`, `theme-color` und der Speicher sofort aktualisiert; ohne verfügbaren `localStorage` gilt „System“ ohne Fehlerhinweis

### Story 4.2: Verbindung und Client-Zustand

As a Bewohnerin,
I want dass die App sich selbst verbindet, bei Störungen ehrlich sperrt und neu verbindet und nur Serverbestätigtes als Wert zeigt,
So that ich mich auf jede Zahl und jeden Schalter verlassen kann.

**Acceptance Criteria:**

**Given** `src/client/verbindung.ts` (Klasse `HausVerbindung`, framework-frei)
**When** sie geöffnet wird
**Then** verbindet sie zu `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/mqtt`, sendet selbst nichts (FR-14) und bietet `sende(befehl)`, `jetztVerbinden()`, Ereignis-Callbacks und `naechsterVersuchUm` (ms) für den Countdown (K-28)
**And** Backoff 1/2/4/8 s, danach alle 10 s; 75 s ohne Nachricht → schließen und neu verbinden; `visibilitychange → visible` bei geschlossenem Socket → sofortiger Versuch; kommt nach dem Öffnen binnen 5 s kein Snapshot, schließt sie und gilt als getrennt (K-16)
**And** Befehls-IDs entstehen als `${Date.now().toString(36)}-${zaehler++}` (kein `crypto.randomUUID`, NFR-8)

**Given** `src/client/hausReducer.ts` mit `ClientZustand` nach Architektur §3.8
**When** `snapshot`, `aenderung`, `bestaetigt`, `fehler`, `energie`, Zeitüberschreitung und Verbindungswechsel verarbeitet werden
**Then** ersetzt `snapshot` `server` vollständig (ohne Meldungen, K-30), `aenderung` aktualisiert nur die genannten Geräte und erzeugt eine Meldung aus gerundetem alt/neu `hausverbrauch` + Ursache (FR-11), `bestaetigt` entfernt `ausstehend[id]` und liefert bei `geaendert: false` für Szene/Raum den lokalen Hinweis „‹Name›: keine Änderung nötig“ (FR-22), `fehler`/5 s/Verbindungsverlust entfernen offene Einträge sofort mit Fehlermeldung (FR-21, UX-12)
**And** Einträge in `ausstehend` für `szene`/`raumAus` haben ein leeres `ziel` (keine optimistische Anzeige, K-26); Anzeige-Selektor = Serverzustand überlagert mit `ziel`; Werte-Selektoren nutzen nur den Serverzustand
**And** `versionKonflikt = snapshot.version !== NEXT_PUBLIC_APP_VERSION` (FR-18); `bedienbar ⇔ verbindung === 'verbunden' && server !== null && !versionKonflikt`; `uhrVersatzMs = serverZeit − Date.now()` bei Snapshot und `energie`
**And** `verbindung.test.ts` und `hausReducer.test.ts` decken Backoff-Folge, Snapshot-Timeout, alle Nachrichtentypen, Timeout nach 5 s und Versionskonflikt ab

### Story 4.3: App-Gerüst, Ladezustand und Symbole

As a Bewohner,
I want beim Öffnen sofort die Struktur des Hauses und einen klaren Ladezustand sehen,
So that nichts springt und ich nie falsche Standardwerte sehe.

**Acceptance Criteria:**

**Given** `src/hooks/useHaus.tsx` (`HausProvider` + `useHaus`) und `src/components/App.tsx`
**When** `src/app/page.tsx` nur `<App />` rendert
**Then** stellt `useHaus()` Anzeige-Zustand, abgeleitete Werte (`hausW`, `raumW`, `standbyW`, `laststufe`, `kostenProStunde`, `kwhHeute`, `kostenHeute`) und Aktionen `schalten`, `szene`, `raumAus`, `neuVerbinden` bereit (Architektur §3.8)
**And** die DOM-Reihenfolge ist Sprunglink → `<header>` → `<main>` (Übersicht, Szenen, Hausansicht, Räume, Verbrauch nach Raum) → `<footer>` → Überlagerungen, gemäß EXPERIENCE „Information Architecture“ (FR-25)

**Given** `server === null`
**When** die Seite lädt
**Then** rendert `Skeleton` die Katalogstruktur (Raum-, Geräte-, Szenennamen, Symbole) sofort, alle Werte und Schalter als `aria-hidden`-Platzhalter, `<main aria-busy="true">` mit sr-only „Hauszustand wird geladen …“, Puls statisch bei reduzierter Bewegung (FR-15, UX-DR24)

**Given** `Sprunglink.tsx`, `Fusszeile.tsx`, `Symbol.tsx`, `src/ui/texte.ts`
**When** sie gerendert werden
**Then** ist „Zu den Räumen springen“ das erste fokussierbare Element (nur bei Fokus sichtbar, Ziel `#raeume` mit Fokus auf die h2), die Fußzeile zeigt „Alle Leistungs- und Kostenwerte sind Schätzungen auf Basis typischer Geräteleistungen.“ und „IoT-Haus ‹version›“ (K-06)
**And** `Symbol` rendert für jeden `SymbolName` des Katalogs und jedes UI-Symbol aus UX-DR27 ein Inline-SVG mit `aria-hidden="true" focusable="false"` (K-11); `texte.ts` enthält den vollständigen Microcopy-Katalog aus EXPERIENCE.md (K-13)
**And** `ControlPanel.tsx`, `HouseVisualization.tsx`, `RoomComponent.tsx`, `useMqtt.ts`, `useMockMqtt.ts`, `useWebSocketMqtt.ts`, `src/types/index.ts` sind gelöscht; `npm run lint`, `typecheck`, `build` sind grün (FR-35)

### Story 4.4: Kopfbereich mit Live-Verbrauch und Übersicht

As a Bewohnerin in der Küche,
I want ganz oben immer sehen, wie viel das Haus gerade zieht, was es kostet und ob ich verbunden bin, und darunter die Tageswerte,
So that ich beim Einschalten der Mikrowelle den Sprung sofort sehe (Aha-Moment, SM-2).

**Acceptance Criteria:**

**Given** `Kopfbereich.tsx` mit `Zaehler`, `DeltaChip`, `LaststufePille`, Kosten und `VerbindungsStatus`
**When** der Snapshot vorliegt
**Then** zeigt der sticky `<header>` h1 „IoT-Haus“, „Hausverbrauch“, die Zahl (z. B. „75 W“), die Pille „niedrig“ mit 1-Balken-Symbol und „0,03 €/h“, sowie „Verbunden“ mit Punkt; weitere Werte oder Bedienelemente enthält er nicht (FR-6, FR-9, FR-12, K-19)
**And** bei 360 × 640 ist der Kopf ≤ 116 px hoch (≤ 30 %), ab 1024 px einzeilig 88 px, bei Höhe ≤ 500 px kompakt 64 px; die Höhe wird per `ResizeObserver` als `--kopf-h` gesetzt und `html { scroll-padding-top: calc(var(--kopf-h) + 16px) }` (FR-25, UX-DR5)

**Given** eine bestätigte Änderung von 75 auf 1.274 W
**When** sie eintrifft
**Then** zählt `Zaehler` (über `useHochzaehlen(ziel, 600)`, rAF, ease-out `cubic-bezier(0.22,1,0.36,1)`, Start = aktuell angezeigter Wert) in 600 ms hoch; der sr-only Text trägt sofort „Hausverbrauch 1.274 Watt“; Pille und Kosten springen sofort auf den Zielwert; `DeltaChip` zeigt 1,2 s „+1.199 W“ (`aria-hidden`); bei reduzierter Bewegung springt die Zahl sofort (FR-6, UX-DR6/7)
**And** die Zahl hat Mindestbreite 7ch und `tabular-nums`; es entstehen keine Layoutverschiebungen (NFR-1)
**And** ein Snapshot-Ersatz (Wiederverbindung) animiert nicht und zeigt keinen Chip

**Given** `Uebersicht.tsx` mit `InfoHinweis.tsx` und `ThemeWahl.tsx`
**When** sie gerendert wird
**Then** zeigt sie unter sr-only h2 „Übersicht“: „davon Standby 10,3 W“ (FR-13), „Heute 3,42 kWh · 1,20 €“ aus dem Serverzustand ohne lokale Hochrechnung (FR-10), Info-Disclosure mit „Schätzung auf Basis typischer Geräteleistungen, gezählt seit 00:00 Uhr.“ (inline, `aria-expanded`, Escape schließt), „Strompreis 0,35 €/kWh“ (FR-9) und `<fieldset><legend>Darstellung</legend>` mit Radios System/Hell/Dunkel (FR-28)
**And** Komponententests für `Kopfbereich` (Werte, Laststufen-Wechsel, sr-Text) sind grün (NFR-6)

### Story 4.5: Änderungsmeldungen und Screenreader-Ansagen

As a Bewohner, der die App mit VoiceOver nutzt,
I want nach jeder Änderung – auch von anderen Geräten – eine kurze Meldung sehen und höflich angesagt bekommen,
So that ich weiß, was sich geändert hat und was das Haus jetzt verbraucht.

**Acceptance Criteria:**

**Given** `Meldungen.tsx` + `useMeldungen.ts`
**When** eine `aenderung` eintrifft
**Then** erscheint in **allen** Clients ein Toast nach Ursache: „+1.199 W · Mikrowelle (Küche)“, „+5.532 W · Morgenroutine aktiviert“, „−‹x› W · Küche ausgeschaltet“, „−2.200 W · Wasserkocher (Küche) automatisch ausgeschaltet“; bei gerundeter Differenz 0 „±0 W · …“ (FR-5, FR-11, UX-15)
**And** Fehler und „keine Änderung nötig“ erscheinen nur im auslösenden Client mit den Texten aus `texte.ts` (K-15); Servercodes werden nie angezeigt
**And** max. 3 sichtbar (die vierte verdrängt die älteste), je 4 s, Pause bei Hover/Fokus, Schließen-Knopf „Meldung schließen“, Escape schließt die neueste (Priorität Dialog > Disclosure > Meldung), kein Fokus-Diebstahl; Position unten (mobil zentriert, ab 768 px rechts)

**Given** `LiveRegion.tsx` + `useAnsage.ts` (genau eine sr-only `aria-live="polite" aria-atomic="true"`, beim ersten Rendern leer)
**When** Mikrowelle und Kaffeemaschine innerhalb von 2 s eingeschaltet werden
**Then** wird am Ende des 2-s-Fensters (ab der ersten Änderung) nur „Kaffeemaschine an. Hausverbrauch 2.573 Watt.“ angesagt (K-09, FR-11)
**And** eine einzelne Änderung wird nach Ablauf ihres 2-s-Fensters als „Mikrowelle an. Hausverbrauch 1.274 Watt.“ bzw. „‹Szene› aktiviert. …“, „‹Raum› ausgeschaltet. …“, „‹Gerät› automatisch ausgeschaltet. …“ angesagt; Fehler, „keine Änderung nötig“ und „Verbindung wiederhergestellt.“ werden sofort angesagt (leeren, im nächsten Frame setzen)
**And** Tests mit Fake-Timern belegen Stapelgrenze, 4-s-Ablauf, Escape und das Sammelfenster

### Story 4.6: Verbindungs- und Versionsbanner

As a Bewohnerin mit wackeligem WLAN,
I want klar sehen, wenn die Verbindung weg ist oder eine neue Version läuft, und mit einem Tipp neu verbinden oder neu laden können,
So that ich nie auf gesperrte Schalter tippe, ohne zu wissen warum.

**Acceptance Criteria:**

**Given** der Zustand „Getrennt“ nach vorherigem „Verbunden“
**When** er eintritt
**Then** zeigt `VerbindungsStatus` „Getrennt“ mit Symbol und `VerbindungsBanner` (fest unten, `role="status"`) „Verbindung getrennt – Schalter sind gesperrt, bis die Verbindung wieder steht.“ mit „Jetzt neu verbinden“ und sekündlichem „Nächster Versuch in n s“ (über `useSekundentakt`, K-08); alle Schalter, Szenen und „Raum ausschalten“ sind `aria-disabled` und zeigen den letzten Zustand (FR-20, UX-DR22)
**And** während eines Versuchs zeigen Status und Banner „Verbinde …“ und die Aktion ist `aria-disabled`; nach Wiederverbindung verschwindet das Banner, der Snapshot ersetzt still alle Werte und die Live-Region sagt „Verbindung wiederhergestellt.“ (UX-DR23)

**Given** der erste Aufbau scheitert oder binnen 5 s kein Snapshot kommt
**When** die App noch keinen Zustand hat
**Then** bleibt das Skeleton, darüber in `<main>` „Keine Verbindung zum Haus“ / „Die App versucht es automatisch erneut. Bitte prüfen, ob der Server läuft.“, dazu das Getrennt-Banner; beim normalen Start (≤ 1 s) erscheint kein Banner (K-16)

**Given** `snapshot.version` ≠ Client-Version
**When** der Snapshot eintrifft
**Then** zeigt `VersionsBanner` „Neue Version verfügbar“ / „Die App wurde aktualisiert. Bitte neu laden, um weiter zu schalten.“ mit „Neu laden“ (`location.reload()`); Schalter bleiben gesperrt; es ist höchstens ein Banner sichtbar und das Versions-Banner hat Vorrang (FR-18)
**And** `<main>` erhält unten Innenabstand in Bannerhöhe, Toasts sitzen 8 px darüber; Komponententest für `VerbindungsBanner` ist grün (NFR-6)

---

## Epic 5: Geräte, Räume und Szenen bedienen

Bedienung aller 28 Geräte, der Räume und Szenen, dazu Hausansicht und „Verbrauch nach Raum“. Baut ausschließlich auf Epic 4 auf.

### Story 5.1: Raumkarten mit schaltbaren Gerätezeilen

As a Jugendlicher im Wohnzimmer,
I want jedes Gerät mit einem Tipp auf die ganze Zeile schalten und sofort Rückmeldung bekommen,
So that ich die Konsole einschalte und mein Vater es sofort sieht (UJ-2).

**Acceptance Criteria:**

**Given** `Raumkarte.tsx` je Raum
**When** sie gerendert wird
**Then** ist sie `<section aria-labelledby="raum-‹id›-titel">` mit h3 (`tabindex="-1"`, `id="raum-‹id›"`), Meta „EG · 2 von 5 an“ (Grundlast zählt mit, K-25), Raumverbrauch „271 W“ ohne Zählanimation und einer `<ul>` der Geräte in Katalogreihenfolge; die Liste „Räume“ hat die h2 `id="raeume"` (FR-7, FR-27)

**Given** `GeraeteZeile.tsx` mit visuellem `Schalter.tsx`
**When** sie gerendert wird
**Then** ist die ganze Zeile ein `<button role="switch" aria-checked>` (≥ 56 px hoch, K-07) mit `aria-label` „Mikrowelle, Küche“ und `aria-describedby` auf sr-only „Standby 1,5 Watt, schaltet nach 3 Minuten automatisch aus“; sichtbar sind Symbolkreis, Name, Badges „Grundlast“/„Auto-Aus 3 min“ und die `aria-hidden` Leistungszeile „1.200 W“ / „Standby 1,5 W“ (`ink-muted`) / „aus“ (FR-8, FR-27)
**And** `Schalter` ist `aria-hidden`, zeigt *An* mit Knopf rechts + Häkchen, *Aus* mit Knopf links + Rand, sodass der Zustand ohne Farbe erkennbar ist

**Given** eine verbundene App und ein Nicht-Grundlastgerät
**When** die Zeile per Tipp, Klick, Leertaste oder Enter aktiviert wird
**Then** zeigt sie in ≤ 100 ms den Zielzustand mit `aria-busy="true"` und „wird geschaltet …“, sendet `schalten`; Hausverbrauch, Raumwerte und Meldungen ändern sich erst mit der Serveränderung; danach leuchtet die Zeile 800 ms in `on-soft` auf (FR-3, FR-21, NFR-1)
**And** Aktivierungen während `aria-busy` werden ignoriert; bei Fehler/5 s/Verbindungsabbruch kehrt sie zum Serverzustand zurück und „‹Gerät› konnte nicht geschaltet werden. Bitte erneut versuchen.“ erscheint; offline/veraltet ist sie `aria-disabled` (nicht `disabled`)
**And** Komponententests für `Raumkarte` und Schalter-Semantik (`role`, `aria-checked`, Name, Beschreibung, busy, disabled) sind grün (NFR-6)

### Story 5.2: Auto-Aus-Restzeit an Wasserkocher und Mikrowelle

As a Bewohnerin,
I want sehen, wie lange der Wasserkocher noch läuft,
So that ich weiß, dass er sich selbst abschaltet.

**Acceptance Criteria:**

**Given** ein Auto-Aus-Gerät *An* mit `seit`
**When** die Gerätezeile gerendert wird
**Then** zeigt sie „2.200 W · noch 2:59“ (Uhrsymbol), berechnet mit `useRestzeit(seit, 180)` aus `seit + 180 000 − (Date.now() + uhrVersatzMs)`; alle Zeilen teilen einen gemeinsamen `useSekundentakt`, der nur läuft, solange ein Auto-Aus-Gerät *An* ist (FR-5, K-08)
**And** eine 2-px-Linie am Zeilenunterrand zeigt den Restanteil per `transform: scaleX` (bei reduzierter Bewegung sekündliche Sprünge)
**And** bei Restzeit ≤ 0 steht „schaltet aus …“, bis die Serveränderung eintrifft; offline läuft die Restzeit weiter
**And** die sr-Beschreibung enthält „noch 2 Minuten 48 Sekunden“ ohne Live-Ansage; ein Test mit Fake-Timern und Uhrversatz belegt ± 1 s Übereinstimmung

### Story 5.3: Grundlast-Dialog

As a Bewohner auf dem Sofa,
I want gefragt werden, bevor ich den Kühlschrank ausschalte,
So that ich ihn nicht versehentlich abschalte (UJ-3 Randfall).

**Acceptance Criteria:**

**Given** ein Grundlastgerät *An*
**When** seine Zeile aktiviert wird
**Then** öffnet `GrundlastDialog.tsx` ein natives `<dialog>` per `showModal()` mit Titel „Kühlschrank wirklich ausschalten?“, Text „Es ist ein Grundlastgerät und läuft normalerweise dauerhaft.“, Aktionen „Abbrechen“ (zuerst im DOM, autofokussiert) und „Ausschalten“ (`button-danger`), `aria-labelledby`/`aria-describedby` gesetzt (FR-4)
**And** „Abbrechen“, Escape oder Klick auf den Hintergrund schließen ohne Befehl; „Ausschalten“ schließt und startet den Schalt-Ablauf mit Ziel *Aus*; danach liegt der Fokus wieder auf der Gerätezeile (NFR-2)

**Given** ein Grundlastgerät *Aus*
**When** es eingeschaltet wird
**Then** erscheint kein Dialog (FR-4)

**Given** ein offener Dialog
**When** das Gerät anderweitig *Aus* wird bzw. die Verbindung abbricht
**Then** schließt sich der Dialog mit Fokusrückgabe bzw. „Ausschalten“ wird `aria-disabled` mit Hinweis „Verbindung getrennt – Ausschalten ist gerade nicht möglich.“
**And** Komponententest (Fokus beim Öffnen, Escape, Fokusrückgabe) mit `showModal`-Stub aus `vitest.setup.ts` ist grün (NFR-6)

### Story 5.4: Raum ausschalten

As a Bewohnerin, die die Küche verlässt,
I want alle Geräte eines Raums mit einem Tipp ausschalten,
So that nichts unnötig weiterläuft – ohne den Kühlschrank zu erwischen.

**Acceptance Criteria:**

**Given** `RaumAusKnopf.tsx` im Fuß jeder Raumkarte
**When** mindestens ein Nicht-Grundlastgerät des Raums *An* ist
**Then** ist „Raum ausschalten“ (zugänglicher Name „Küche ausschalten“, Power-Symbol, volle Breite mobil, rechtsbündig ab 768 px) bedienbar; Aktivierung sendet `raumAus`, zeigt `aria-busy` + „Wird ausgeschaltet …“ ohne optimistische Geräteänderung und ohne Bestätigungsdialog (FR-27, UX-25)
**And** die Serveränderung schaltet alle Nicht-Grundlastgeräte als **eine** Änderung aus (FR-16) mit Toast „−‹x› W · Küche ausgeschaltet“; Fehler/5 s → „Küche konnte nicht ausgeschaltet werden. Bitte erneut versuchen.“

**Given** kein Nicht-Grundlastgerät *An* oder offline/veraltet
**When** der Knopf fokussiert wird
**Then** ist er `aria-disabled="true"`, bleibt fokussierbar und hat die Beschreibung „Keine Geräte zum Ausschalten an“ (bei fehlenden Geräten); Aktivierung ist wirkungslos

### Story 5.5: Szenenleiste

As a Bewohner am Morgen,
I want „Morgenroutine“, „Filmabend“, „Gute Nacht“ und „Alles aus“ mit einem Tipp auslösen,
So that mehrere Geräte auf einmal richtig stehen (UJ-1, UJ-3).

**Acceptance Criteria:**

**Given** `Szenenleiste.tsx` (h2 „Szenen“) mit 4 `SzenenKnopf.tsx`
**When** sie gerendert wird
**Then** zeigt jede Schaltfläche Symbol (Power/Filmklappe/Sonnenaufgang/Mond), Name und Untertitel („Grundlast bleibt an“, „Stehlampe, Fernseher, Soundbar“, „Kaffee, Wasserkocher, Bad warm“, „Nur Nachttischlampe bleibt an“, per `aria-describedby`); Raster 2 × 2 unter 768 px, 1 × 4 darüber; es gibt nie eine „aktiv“-Markierung (FR-22, UX-DR11)

**Given** eine verbundene App im Ausgangszustand
**When** „Morgenroutine“ aktiviert wird
**Then** sendet sie `szene`, zeigt „Wird ausgeführt …“ mit `aria-busy` nur an dieser Schaltfläche (andere bleiben bedienbar, Wiederholung wird ignoriert), und nach der Serveränderung erscheinen in allen Clients „+5.532 W · Morgenroutine aktiviert“, 5.607 W, Laststufe „hoch“, 1,96 €/h und die Wasserkocher-Restzeit (FR-22, FR-23)
**And** eine zweite Ausführung ohne Änderung zeigt nur im auslösenden Client „Morgenroutine: keine Änderung nötig“; Fehler/5 s → „Morgenroutine konnte nicht ausgeführt werden. Bitte erneut versuchen.“; offline/veraltet `aria-disabled`

### Story 5.6: Hausansicht, Verbrauch nach Raum und zweispaltiges Layout

As a Vater am Laptop,
I want im Haus sehen, wo Licht brennt und welcher Raum am meisten zieht, und mit einem Klick zum Raum springen,
So that ich auf einen Blick weiß, was im Haus los ist (UJ-2).

**Acceptance Criteria:**

**Given** `Hausansicht.tsx` mit 6 `RaumFlaeche.tsx`
**When** sie gerendert wird
**Then** ist sie eine `<section>` mit h2 „Hausansicht“, darin `div role="group" aria-label="Hausansicht"`, dekoratives Dach-SVG (`aria-hidden`), Etagengruppen „Obergeschoss“ (Schlafzimmer, Badezimmer, Arbeitszimmer) vor „Erdgeschoss“ (Wohnzimmer, Küche, Hauswirtschaftsraum) mit sichtbarer `aria-hidden`-Beschriftung „OG“/„EG“ (FR-1, FR-26, K-10)
**And** jeder Raum ist ein `<button>` mit Name, Raumverbrauch, „n an“ und bis zu 3 Mini-Symbolen; zugänglicher Name „Wohnzimmer, 271 W, 2 Geräte an – zur Raumkarte“ (bei n = 1 „1 Gerät an“, K-22)
**And** ist mindestens ein Gerät der Kategorie Licht *An*, leuchtet der Raum (`room-lit` + 2-px-Rand `on` + Glühbirnen-Symbol); keine abgestufte Füllung nach Verbrauch; Legende „Warm leuchtend: Licht ist an.“; bei jeder bestätigten Änderung im Raum ein 800-ms-Lichtimpuls (nicht bei reduzierter Bewegung)

**Given** ein Raum der Hausansicht
**When** er per Tipp, Klick, Enter oder Leertaste aktiviert wird (auch offline)
**Then** scrollt die Raumkarte in Sicht (glatt, bei reduzierter Bewegung sofort), der Fokus liegt auf ihrer h3 und sie zeigt 800 ms die Fokus-Hervorhebung; der sticky Kopf verdeckt sie nicht (FR-26)

**Given** `VerbrauchNachRaum.tsx`
**When** sich Werte ändern
**Then** listet ein `<ol>` alle 6 Räume absteigend nach Raumverbrauch (Gleichstand Katalogreihenfolge) mit „1.236 W“, ganzzahligem Prozenttext und Balken (`role="presentation"`, `scaleX`, 250 ms) (FR-7)

**Given** Breiten 360, 768, 1024, 1280, 1440 px
**When** die Seite angezeigt wird
**Then** gilt das Raster aus UX-DR29: einspaltig < 1024 px (Raumkarten 2-spaltig ab 768), ab 1024 px links 5/12 Hausansicht + Verbrauch nach Raum, rechts 7/12 Raumkarten (2-spaltig ab 1280), linke Spalte sticky ab 1024 × 860; kein horizontales Scrollen, `min-width: 0` in Grid-Zellen statt `overflow-x: hidden` (FR-25, NFR-3)

### Story 5.7: Barrierefreiheit der ganzen Seite automatisiert absichern

As a blinde Nutzerin mit Tastatur und VoiceOver,
I want dass die ganze Seite ohne Maus bedienbar und für Screenreader korrekt ausgezeichnet ist,
So that ich jede Funktion wie alle anderen nutzen kann (UJ-4).

**Acceptance Criteria:**

**Given** die vollständige Seite mit `tests/fixtures/snapshot.ts`
**When** axe-core in jsdom mit `data-theme="hell"` und `data-theme="dunkel"` läuft (Regel `color-contrast` deaktiviert)
**Then** meldet es 0 Verstöße in beiden Themes (NFR-2, SM-4)

**Given** die Seite im verbundenen Zustand
**When** ein Test die Tab-Reihenfolge prüft
**Then** folgt sie Sprunglink → Info-Schaltfläche → Theme-Radios (eine Station) → 4 Szenen → 6 Räume der Hausansicht → je Raumkarte Gerätezeilen, dann „Raum ausschalten“ (UX-DR30); es gibt keine globalen Tastenkürzel und alle gesperrten Elemente nutzen `aria-disabled` statt `disabled`
**And** Landmarken `<header>`, `<main>`, `<footer>` und Überschriften h1 „IoT-Haus“, h2 „Übersicht“ (sr-only), „Szenen“, „Hausansicht“, „Räume“, „Verbrauch nach Raum“, h3 je Raum sind vorhanden
**And** ein Test mit `matchMedia('(prefers-reduced-motion: reduce)')` = true belegt: Zahl springt ohne Animation, keine Impulse, Delta-Chip ohne Bewegung

---

## Epic 6: Automatisch geprüft und ausgeliefert

Ein Workflow `.github/workflows/ci-release.yml` mit Jobs `qualitaet` → `container` → `image` → `release` (Architektur §3.9, §3.11 Schritt 6).

### Story 6.1: Qualitätsgate für jeden PR und Push

As a Betreiber,
I want dass jeder PR und jeder Push auf main vollständig geprüft wird,
So that nur fehlerfreier Code ins Image kommt.

**Acceptance Criteria:**

**Given** `ci-release.yml` mit Trigger `pull_request` (main) und `push` (main), ohne Tag-Trigger, `permissions: contents: read`, `concurrency` (Abbruch nur bei PRs)
**When** der Job `qualitaet` läuft
**Then** führt er auf Node 22 (npm-Cache) aus: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test -- --coverage`, `npm run build 2>&1 | tee build.log`, `node scripts/pruefe-js-budget.mjs build.log`, `npm audit --omit=dev --audit-level=high` (FR-32, NFR-4)
**And** jeder fehlschlagende Schritt beendet den Job rot

**Given** `scripts/pruefe-js-budget.mjs`
**When** die Zeile der Route `/` in `build.log` fehlt oder „First Load JS“ > 200 kB ist (kB/MB umgerechnet)
**Then** endet es mit Exitcode 1, sonst 0 (NFR-1)
**And** die Tests laufen ohne externe Dienste (aedes in-process, K-21)

### Story 6.2: Container-Prüfung in der CI

As a Betreiber,
I want dass das gebaute Image in der CI gestartet, geschaltet, neu gestartet und auf Härtung geprüft wird,
So that ein kaputtes oder aufgeweichtes Image nie veröffentlicht wird.

**Acceptance Criteria:**

**Given** der Job `container` mit `needs: qualitaet`
**When** er läuft
**Then** baut er mit Standard-BuildKit (nicht `moby/buildkit:master`) `linux/amd64` mit `load: true` als `iot-haus:ci` (Cache `type=gha`), startet es mit Volume, wartet auf `healthy` (max. 60 s, sonst rot, FR-31), führt `smoke-container.mjs schalten` aus, startet neu, wartet auf `healthy` und führt `smoke-container.mjs pruefen` aus (FR-17)
**And** die Härtungsprüfung `for b in curl wget npm npx corepack yarn apk nc; do command -v $b && exit 1; done; [ "$(id -u)" = 1000 ]` ist grün (NFR-4)

### Story 6.3: Image-Veröffentlichung und automatisches Release 2.0.0

As a Betreiber,
I want dass nach grüner CI auf main `:latest` für amd64 und arm64 erscheint und für neue Versionen Tag, Release und Versions-Image automatisch entstehen,
So that ich nur `docker compose pull && docker compose up -d` ausführen muss (UJ-5, SM-3).

**Acceptance Criteria:**

**Given** der Job `image` (`needs: [qualitaet, container]`, nur bei `push`, `packages: write`)
**When** er läuft
**Then** meldet er sich bei GHCR an und baut/pusht `linux/amd64,linux/arm64` mit genau den Tags `:latest` und `:sha-‹kurz›` (metadata-action `type=raw,value=latest`, `type=sha,format=short,prefix=sha-`) und gibt den `digest` aus; keine Tags `:main`, `:2.0`, `:2` (FR-33)

**Given** der Job `release` (`needs: image`, nur bei `push`, `contents: write`, `packages: write`, `fetch-depth: 0`)
**When** der Tag `v‹version›` aus `package.json` noch nicht existiert
**Then** erzeugt er in dieser Reihenfolge `:‹version›` per `docker buildx imagetools create` aus dem Digest, den Git-Tag `v‹version›` und `gh release create v‹version› --generate-notes --notes-file .github/release-hinweise/v‹version›.md`; existiert der Tag, schreibt er „Version existiert bereits“ in die Zusammenfassung (idempotent)
**And** `.github/release-hinweise/v2.0.0.md` enthält den „Upgrade-Hinweis 2.0.0“ (alten curl-Healthcheck aus der Host-Compose-Datei entfernen oder ersetzen, NFR-9)
**And** `.github/workflows/docker-publish.yml` und `release.yml` sind gelöscht; ein manuell gepushter Tag `v*` löst keinen Build aus; Actions per Hauptversions-Tag (AD-18)

---

## Epic 7: Aufgeräumt, dokumentiert, abgenommen

Abschluss nach Architektur §3.11 Schritt 7.

### Story 7.1: Toten Code und Altlasten entfernen

As a Entwicklerin,
I want ein Repo ohne tote Dateien, Debug-Ausgaben und englische Resttexte,
So that ich mich schnell zurechtfinde und nichts Veraltetes versehentlich weiterlebt.

**Acceptance Criteria:**

**Given** die Löschliste aus Architektur §8.1
**When** die Story abgeschlossen ist
**Then** existieren `test-container-mqtt.js`, `test-container-mqtt-detailed.js`, `test-container-publish.js`, `test-multi-device.js`, `public/window.svg`, `MOBILE-OPTIMIZATION.md`, `BUILD-OPTIMIZATION.md` nicht mehr, ebenso keine Referenz auf `useMockMqtt` oder `shouldUseMock` (FR-35)
**And** `tests/architektur/aufgeraeumt.test.ts` prüft das Fehlen dieser Dateien und Bezeichner

**Given** `tests/architektur/texte.test.ts`
**When** er `src/` durchsucht
**Then** findet er keine bekannten englischen Resttexte („Smart Home Control“, „Control System“, „Loading“, „Connected“, „Disconnected“ u. a.) in UI-Code (FR-29)
**And** `npm run lint` meldet 0 Warnungen; im Produktions-Build entstehen im Browser keine `console.log`-Ausgaben

### Story 7.2: Dokumentation auf Stand 2.0.0

As a Betreiber,
I want eine aktuelle deutsche Dokumentation zu Funktionen, Betrieb, Update und Entwicklung,
So that ich IoT-Haus 2.0 ohne Rückfragen betreiben und aktualisieren kann.

**Acceptance Criteria:**

**Given** `README.md`
**When** es gelesen wird
**Then** beschreibt es auf Deutsch Funktionen, Gerätekatalog (Verweis auf `src/domain/katalog.ts`/PRD Anhang A), `STROMPREIS_EUR_PRO_KWH`, Betrieb, Update inkl. „Upgrade-Hinweis 2.0.0“, Entwicklung (`dev:broker`, `dev`, Tests, Lint) und empfiehlt für Internetzugriff einen Reverse-Proxy mit Anmeldung; keine Aussagen über „nur Licht“, 4 Räume oder localStorage-Persistenz (FR-34, NFR-9)

**Given** `API.md`, `DOCKER-SETUP.md`, `KUBERNETES.md`, `GITHUB-ACTIONS.md`, `.github/copilot-instructions.md`, `docs/*`
**When** sie gelesen werden
**Then** beschreibt `API.md` das WS-Protokoll (Befehle, Snapshot, Änderung, Bestätigung, Fehlercodes, Energie) und das Topic-Schema; DOCKER-SETUP/KUBERNETES zeigen den Healthcheck ohne curl und Probes auf `/api/health` ohne Verweise auf Nichtexistentes; GITHUB-ACTIONS und copilot-instructions beschreiben `ci-release.yml` und die neue Struktur; die `docs/*`-Dateien aus Architektur §8.2 sind auf 2.0 gebracht (FR-34)

### Story 7.3: Abnahme-Checkliste 2.0

As a Betreiber und Qualitätsverantwortlicher,
I want eine ausgefüllte, eingecheckte Abnahme-Checkliste,
So that belegt ist, dass die manuell zu prüfenden Qualitäten vor dem Release geprüft wurden.

**Acceptance Criteria:**

**Given** `docs/abnahme-2.0.md`
**When** sie vor dem Release eingecheckt wird
**Then** enthält sie abhakbare, vollständig ausgefüllte Prüfungen: Breiten 360/768/1024/1440 px in Hell und Dunkel mit Screenshots (unter `docs/abnahme-2.0/`), Hoch- und Querformat (NFR-3), Tastaturdurchlauf UJ-4, VoiceOver-Ansagen aus FR-11, Zoom 200 %, `prefers-reduced-motion`, Zwei-Geräte-Sync ≤ 1 s (SM-2), Browser-Matrix Chrome/Edge, Firefox, Safari macOS/iOS (NFR-8) (NFR-10)
**And** jeder Punkt nennt Datum, Prüfer/in und Ergebnis; ein nicht bestandener Punkt blockiert den Release, bis er behoben und erneut geprüft ist

---

## Epic 8: Elektroauto & Solaranlage (Release 2.1.0)

Quelle: `sprint-change-proposal-2026-09-27.md` §4–§7 (Akzeptanzkriterien AC-01 … AC-25, Tests T-01 … T-24). Reihenfolge 8.1 → 8.2 → 8.3 → (8.4 ∥ 8.5 ∥ 8.6) → 8.7. Code-Review (`bmad-code-review`) nach Story 8.6, Re-Review nach Korrekturen – wie bei 2.0. Vor dem Merge auf main holt der Entwickler per Dialog die Zustimmung des Stakeholders ein (`00-auftrag-2.1.md`).

**Kontrollsummen 2.1 (verbindlich für alle Tests):** 29 Geräte / 7 Räume (6 im Haus + Carport); Standby 13,3 W; Ausgangszustand 78,3 W → „78 W“, 0,03 €/h; „Alles an“ 23.978 W; „Alles aus“ aus „alles an“ → 78 W; „Gute Nacht“ 83 W; Morgenroutine +5.532 W; Laden aus Ausgangszustand bei Nacht → 11.075 W, „hoch“, 3,88 €/h; Laden bei „Sonnig“ → Netzbezug 2.745 W, 0,96 €/h; Ausgangszustand „Sonnig“ → Einspeisung 8.252 W, Ertrag 0,66 €/h; Erzeugung je Stufe 0 · 980 · 3.430 · 6.370 · 8.330 W; Laden 50 % → 100 % = 9.818 s („voll in 2 h 44 min“).

### Story 8.1: Domäne – Carport, Elektroauto, Solaranlage, Netzbilanz

As a Entwicklerin,
I want Carport, Wallbox, Elektroauto, Sonnenlage und Netzbilanz als reine, getestete Domänenfunktionen,
So that Server und Client dieselben Zahlen rechnen und alle Anzeigen fachlich stimmen.

**Acceptance Criteria:**

**Given** `src/domain/katalog.ts`
**When** der Katalog geladen wird
**Then** gibt es `Etage = 'EG' | 'OG' | 'Außen'`, Kategorie `mobilitaet` („Mobilität“), Symbol `wallbox`, als letzten Raum `carport` (Carport, Außen) mit genau dem Gerät `carport.wallbox` (11.000 W, Standby 3 W, `grundlast: false`, `autoAusS: null`) und `HAUS_ETAGEN = ['OG', 'EG']`
**And** `katalog.test.ts` prüft 29 Geräte, 7 Räume, Carport 1 Gerät, Hausräume ≥ 3 (T-01)

**Given** die neuen Module `src/domain/elektroauto.ts` und `src/domain/solar.ts` (Architektur §3.12)
**When** ihre Tests laufen
**Then** gelten `akkuWhBei` (lädt/nicht, unterwegs, Deckel 60.000), `akkuProzent` (abgerundet, 100 nur voll), `restLadezeitMs` (9.818.182 ms ab 50 %), `darfLaden`, `darfWegfahren` (Grenze 9.000 Wh), `nachRueckkehr` sowie Erzeugung je Stufe 0/980/3.430/6.370/8.330 W und `istSonnenStufe` (T-03, T-04)

**Given** `verbrauch.ts` und `energie.ts`
**When** 2.000 W Verbrauch bei „Wolkig“ 30 min integriert werden
**Then** sind Verbrauch 1.000 Wh, Bezug 0 Wh, Einspeisung 715 Wh, Erzeugung 1.715 Wh und die Tageskosten −0,06 € (AC-17); `netzbilanz` liefert aus gerundeten Werten genau einen positiven Wert oder 0/0; Kontrollsummen 78,3 / 13,3 / 23.978 W (T-02, T-05)

**Given** `befehle.ts` und `protokoll.ts`
**When** Befehle `sonne` und `auto` geprüft werden
**Then** gelten exakte Feldmengen (`['typ','id','stufe']`, `['typ','id','zuhause']`), unbekannte Stufen → `UNGUELTIGER_BEFEHL`; `pruefeRegel` liefert `NICHT_MOEGLICH` für Laden unterwegs/voll und Wegfahren < 15 %; `erzwingeLadeRegeln` schaltet die Wallbox bei unterwegs/voll aus; „Alles aus“ und „Gute Nacht“ schalten die Wallbox aus, keine Szene schaltet sie ein (AC-09, T-06)
**And** `format.ts` hat `akku` („64 %“) und `kwp` („9,8 kWp“); Bestandstests sind auf die Kontrollsummen 2.1 umgestellt; `ausgangszustand` liefert Auto zu Hause 50 %, Sonne „Nacht“, 78 W (AC-01, Domänenteil); Coverage ≥ 90 % auch für die neuen Module

### Story 8.2: Server – Zustandsdienst, Persistenz, Konfiguration

As a Bewohner mit mehreren Geräten,
I want dass Auto, Akku und Sonnenlage vom Server gehalten, verteilt und gespeichert werden,
So that alle Clients dasselbe sehen und nach einem Neustart nichts verloren ist.

**Acceptance Criteria:**

**Given** der Zustandsdienst mit `auto`, `sonne` und einem Änderungspfad `aendere` (AD-23)
**When** „Wegfahren“ bei laufender Wallbox ausgeführt wird
**Then** entsteht genau eine `aenderung` mit Auto unterwegs und Wallbox *Aus*; der Akku bleibt auf dem Wert bei Abfahrt (AC-06); „Zurückkommen“ zieht 9.000 Wh ab (AC-07, Serverteil)

**Given** die Wallbox lädt ab 50 %
**When** 9.818 s (± 1 s, Fake-Timer) vergehen
**Then** schaltet der Akku-voll-Timer die Wallbox aus (Ursache `akkuVoll`), der Akku steht auf 60.000 Wh, Log `akku_voll` (AC-04, AD-25); der 60-s-Energie-Takt integriert Energie und Akku gemeinsam und sendet `energie` mit `auto` (AD-24)

**Given** ein unzulässiger Befehl (Laden unterwegs/voll, Wegfahren < 15 %)
**When** er eintrifft
**Then** antwortet der Server mit `fehler NICHT_MOEGLICH` samt `befehlId`, der Zustand bleibt unverändert (AC-05, AC-08, AD-27)

**Given** retained Topics `iot-haus/v2/auto/zustand`, `iot-haus/v2/solar/sonne` und Energie `v: 2`
**When** der Server neu startet
**Then** sind Sonnenlage, Auto und Wallbox wiederhergestellt (AC-15), die Ausfallzeit lädt nicht (AC-10), ein inkonsistenter Zustand (unterwegs + Wallbox *An*) wird auf *Aus* korrigiert und gespeichert (AC-11), und ein Energie-Payload `v: 1` wird als `bezugWh = wh`, `einspeisungWh = 0` übernommen (AC-18, AD-26)

**Given** `EINSPEISEVERGUETUNG_EUR_PRO_KWH=abc`
**When** der Server startet
**Then** gilt 0,08 und es gibt genau eine Logzeile `einspeiseverguetung_ungueltig` (AC-19); der Snapshot enthält `auto`, `sonne`, `einspeiseverguetung` und die Energie mit Bezug/Einspeisung
**And** Tests T-07 … T-11 sind grün; Härtung und Rate-Limit sind unverändert

### Story 8.3: Client-Zustand, Meldungen und Ansagen

As a Nutzerin,
I want dass meine Oberfläche Sonnenlage, Auto und Akku aus dem Server übernimmt und jede Änderung verständlich meldet,
So that ich sehe und höre, was passiert ist – auch wenn es jemand anderes ausgelöst hat.

**Acceptance Criteria:**

**Given** `hausReducer.ts` und `useHaus.tsx`
**When** ein Snapshot ohne die neuen Felder eintrifft
**Then** gelten die Defaults (`ausgangsAuto`, „Nacht“, 0,08, `bezugWh = wh`, `einspeisungWh = 0`); `aenderung` nur mit `sonne` oder `auto` wird verarbeitet; `energie` übernimmt `auto`; `sonne()` ist optimistisch mit Rücksprung nach Fehler/5 s, `auto()` nicht optimistisch (T-12)

**Given** Ursachen `sonne`, `auto`, `akkuVoll` und `geraet` Wallbox
**When** sie eintreffen
**Then** entstehen Toasts und Ansagen exakt nach EXPERIENCE.md (z. B. „Sonne: Sonnig · Solar 8.330 W“ ohne Delta-Chip, „−10.997 W · Elektroauto weggefahren, Laden beendet“, „Wallbox an. Hausverbrauch 11.075 Watt.“) im 2-s-Sammelfenster (AC-25)
**And** die Microcopy steht in `src/ui/texte.ts`; ein 2.0-Client mit 2.1-Snapshot zeigt den Versionskonflikt ohne Ausnahme (AC-23, T-24)

### Story 8.4: Kopf und Übersicht mit Netzbilanz

As a Bewohner,
I want im Kopf neben dem Hausverbrauch sehen, was die Sonne liefert und ob Strom aus dem Netz kommt oder hineinfließt,
So that ich Kosten und Ertrag sofort einschätzen kann.

**Acceptance Criteria:**

**Given** Ausgangszustand und Sonne „Sonnig“
**When** der Kopf angezeigt wird
**Then** zeigt die Netz-Zeile „Solar 8.330 W · Einspeisung 8.252 W“ und statt der Kosten „Ertrag 0,66 €/h“; Hausverbrauch „78 W“ ohne Zählanimation und ohne Delta-Chip (AC-12); bei Laden: „Netzbezug 2.745 W“, „0,96 €/h“, Laststufe „hoch“ (AC-13); bei „Nacht“ rechnet alles wie 2.0 (AC-14)

**Given** 360 × 640 px
**When** die Seite gerendert wird
**Then** ist der Kopf ≤ 136 px hoch, die Netz-Zeile bricht nicht um, und es gibt kein horizontales Scrollen (auch 768/1024/1440, hell/dunkel) (AC-20)

**Given** die Übersicht
**When** sie angezeigt wird
**Then** zeigt sie „Heute ‹kWh› · ‹netto› €“ bzw. „· Ertrag ‹x› €“, „Netz heute: Bezug … · Einspeisung …“ und „Strompreis 0,35 €/kWh · Einspeisevergütung 0,08 €/kWh“ samt neuem Info-Text
**And** die Tokens `solar`/`solar-soft` (36 Rollen je Theme) und alle neuen Kontrastpaare sind in `farbtokens.ts` und `globals.css`; der Kontrasttest besteht (T-14)

### Story 8.5: Bereich Solaranlage mit Sonnenwahl

As a Nina (UJ-6),
I want einstellen, wie viel Sonne gerade scheint,
So that ich sehe, wie sich Erzeugung, Netzbezug und Kosten verändern.

**Acceptance Criteria:**

**Given** der Bereich „Solaranlage“ (h2) nach der Szenenleiste
**When** er angezeigt wird
**Then** zeigt er Erzeugung, „9,8 kWp“, „Heute erzeugt ‹x› kWh“ und die Sonnenwahl als `<fieldset>` mit Legende „Sonne gerade“ und 5 nativen Radios (Name z. B. „Sonnig, 8.330 Watt“)

**Given** eine gewählte Stufe
**When** keine Bestätigung binnen 5 s kommt oder ein Fehler eintrifft
**Then** springt die Auswahl auf den Serverwert zurück und es erscheint „Sonne konnte nicht eingestellt werden. Bitte erneut versuchen.“ (AC-16); während des Wartens `aria-busy` und „wird eingestellt …“; offline `aria-disabled`

**Given** Tastatur
**When** nach den Szenen Tab gedrückt wird
**Then** erreicht man die Sonnenwahl mit einem Tab und wechselt die Stufe mit Pfeiltasten (AC-21, Teil)

### Story 8.6: Carport – Raumkarte, Elektroauto, Hausansicht

As a Bewohnerin,
I want das Auto im Carport laden, wegfahren und zurückkommen lassen und es in der Hausansicht sehen,
So that ich das Elektroauto wie jedes andere Gerät im Haus im Blick habe.

**Acceptance Criteria:**

**Given** Auto zu Hause mit 50 %
**When** die Wallbox eingeschaltet wird
**Then** zeigen alle Clients ≤ 1 s später 11.075 W, „hoch“, „3,88 €/h“, „+10.997 W · Wallbox (Carport)“ und am Auto „lädt · voll in 2 h 44 min“ (AC-02); nach Reload während des Ladens zeigt jeder Client denselben abgerundeten Akkustand (AC-03)

**Given** die Carport-Raumkarte (h3 „Carport“, letzte Karte)
**When** sie angezeigt wird
**Then** enthält sie oben den Elektroauto-Bereich (Status, Akku-Balken, „Wegfahren“/„Zurückkommen“) und darunter die Wallbox-Zeile, aber kein „Raum ausschalten“ (E-12); unterwegs oder voll ist die Wallbox `aria-disabled` mit Grund „nicht verfügbar: Elektroauto ist unterwegs“ bzw. „Akku voll“ (AC-05); bei < 15 % ist „Wegfahren“ gesperrt mit „Akku zu leer zum Wegfahren (mindestens 15 %).“ (AC-08); „Zurückkommen“ mit 64 % ergibt 49 % (AC-07)

**Given** die Hausansicht
**When** sie angezeigt wird
**Then** zeigt das Dach Solarmodule und „☀ Solar ‹x› W“, die Zeile „Außen“ eine Carport-Fläche („Auto lädt 64 %“ / „Auto zu Hause 50 %“ / „Auto unterwegs“), die per Enter zur Carport-Karte springt und deren h3 fokussiert (AC-21, Teil); „Verbrauch nach Raum“ hat 7 Einträge
**And** axe meldet mit der Fixture „Auto lädt, Sonne Heiter“ in Hell und Dunkel 0 Verstöße (AC-22, T-13)

### Story 8.7: Doku, Abnahme und Release 2.1.0

As a Betreiber,
I want eine aktualisierte Doku, eine ausgefüllte Abnahme und ein automatisches Release 2.1.0,
So that ich ohne manuellen Schritt aktualisieren kann und belegt ist, dass alles geprüft wurde.

**Acceptance Criteria:**

**Given** `package.json` 2.1.0 und `.github/release-hinweise/v2.1.0.md` (Pflicht, sonst bricht der Release-Job ab)
**When** nach Stakeholder-Zustimmung auf main gemergt wird
**Then** erzeugt `ci-release.yml` Tag `v2.1.0`, Image `:2.1.0`/`:latest` und das GitHub Release mit den Hinweisen; `/api/health` meldet `"version": "2.1.0"` (AC-24, FR-44)

**Given** README, API.md, DOCKER-SETUP.md, KUBERNETES.md, Compose-Dateien und `docs/*`
**When** sie gelesen werden
**Then** beschreiben sie Elektroauto, Solaranlage, Netzbilanz, neue Befehle, Felder, Ursachen, Fehlercode, Topics inkl. `v: 2`-Migration und `EINSPEISEVERGUETUNG_EUR_PRO_KWH`, sowie „Upgrade 2.1.0: kein manueller Schritt“ (FR-34)

**Given** `docs/abnahme-2.1.md`
**When** sie vor dem Release eingecheckt wird
**Then** enthält sie Screenshots (360/768/1024/1440, hell/dunkel), Tastaturdurchlauf AC-21, VoiceOver AC-25, Zwei-Geräte-Sync der Sonnenlage und den gemessenen JS-Budget-Wert (Erwartung ≤ 126 kB, Gate 200 kB) (NFR-10)
**And** `sprint-status.yaml` führt Epic 8 und die Stories 8-1 … 8-7 mit aktuellem Status

---

## Final Validation (Step 4)

- **FR-Abdeckung:** FR-1 bis FR-35 sind jeweils mindestens einer Story mit prüfbaren Akzeptanzkriterien zugeordnet (Coverage Map oben). ✔
- **NFR-/UX-DR-Abdeckung:** NFR-1 bis NFR-10 und UX-DR1 bis UX-DR31 sind Stories zugeordnet. ✔
- **Starter-Template:** Architektur §2 verneint ein Starter-Template (Brownfield); Story 1.1 beginnt mit dem Domänenmodul wie verlangt. ✔
- **Entitäten/Persistenz:** Keine Datenbank; Topics entstehen erst in Story 2.2, Protokolltypen in Story 1.3 vor ihrer ersten Nutzung. ✔
- **Abhängigkeiten:** Keine Vorwärtsabhängigkeiten. Jede Story nutzt nur Ergebnisse früherer Stories (z. B. 4.6 nutzt `useSekundentakt` erstmals und legt ihn an; 5.2 verwendet ihn wieder; 4.5 legt die Live-Region an, die 4.6 für „Verbindung wiederhergestellt.“ nutzt). ✔
- **Epic-Unabhängigkeit:** Epic N funktioniert mit den Epics 1…N−1. Hinweis zum Übergang: Ab Story 2.5 spricht der Server nur noch das neue Protokoll; die alte Oberfläche ist bis Story 4.3 funktionslos. Das ist akzeptiert, weil zwischen diesen Stories kein Release erfolgt (Auslieferung nur über Epic 6). ✔
- **Story-Größe:** Jede Story ist für eine Dev-Agent-Sitzung geschnitten; die größten (2.4, 4.2, 5.1) sind durch Architektur §3.5/§3.8 und EXPERIENCE vollständig vorgegeben. ✔
- **Fortschreibung 2.1.0 (2026-09-27):** FR-36 bis FR-44 und die mit 2.1 geänderten FR sind Epic 8 zugeordnet (Coverage Map). Epic 8 hängt nur von den abgeschlossenen Epics 1–7 ab; innerhalb gilt 8.1 → 8.2 → 8.3 → (8.4 ∥ 8.5 ∥ 8.6) → 8.7 ohne Vorwärtsabhängigkeit. ✔
