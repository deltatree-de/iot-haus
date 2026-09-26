# Code-Review IoT-Haus 2.0 (bmad-code-review, nicht-interaktiv)

- **Datum:** 2026-09-26
- **Diff:** `git diff c837822..HEAD -- . ':!_bmad' ':!_bmad-output' ':!.claude' ':!docs' ':!package-lock.json'` (99 Dateien, +5909/−2971)
- **Branch:** `feature/iot-haus-2-energie-geraete` (HEAD e284460)
- **Modus:** full
  - Spec: `prd.md` (FR-1..35, NFR-1..10), `architecture.md`, `ux-designs/ux-iot-haus-2026-09-26/{DESIGN,EXPERIENCE}.md`
  - Konfliktauflösungen K-xx aus `implementation-readiness-report-2026-09-26.md`
- **Layer:** Blind Hunter, Edge Case Hunter und Acceptance Auditor sind alle gelaufen. Kein Layer ist ausgefallen.

## Entscheidungen des Teams

Der Stakeholder ist nicht erreichbar. Diese Punkte hat das Team selbst entschieden:

- **Review-Ziel:** der im Auftrag genannte Commit-Bereich.
- **Chunking:** keins. Der Diff umfasst rund 9.700 Zeilen und wurde vollständig in drei parallelen Layern geprüft.
- **Umgang mit den Befunden:** Alle `patch`-Befunde bleiben als Aktionspunkte stehen. Das Review ändert keinen Code.
- **Offene Entscheidungen:** keine `decision-needed`-Punkte. Wo die Spezifikation eindeutig ist, gilt der Fix als klar.

## Verifikation

- **Statische Prüfungen:**
  - `npm run lint`: 0 Befunde.
  - `npm run typecheck`: 0 Befunde.
  - `npm test -- --coverage`: 242/242 grün, Zeilenabdeckung 100 %.
- **Build:** `npm run build` plus `scripts/pruefe-js-budget.mjs` ergeben 117 kB First Load JS. Das Budget liegt bei 200 kB, der Parser der Build-Ausgabe funktioniert.
- **Audit:** `npm audit --omit=dev --audit-level=high` meldet 0 Befunde.
- **Image:** lokal mit `docker build` gebaut und gestartet.
  - Healthy nach 6 s.
  - Rauchtest `schalten`: ok.
  - Nach `docker restart`: healthy, Rauchtest `pruefen` ok. Die Persistenz funktioniert.
  - Sauberer SIGTERM-Stopp in rund 1 s.
  - Die Härtung ist intakt: UID 1000, App-Code nicht beschreibbar.
- **Release-Befehle:** `gh release create` mit `--notes-file` und `--generate-notes` zusammen ist zulässig, die Notes werden vorangestellt. `--verify-tag` passt zum vorher gepushten Tag. `docker buildx imagetools create` mit dem Manifest-Digest aus dem Image-Job ist korrekt. Die Berechtigungen `contents: write` und `packages: write` sind vorhanden.
- **Laufender Server :3100:** Last-, Origin- und Rebinding-Versuche wurden per Skript nachgestellt. Der Zustand wurde danach zurückgesetzt.

## Befunde

### CR-01 · hoch · WebSocket-Flut ohne Ratenlimit und ohne Backpressure: Speicher-DoS und UI-Flut
- **Ort:**
  - `server/ws-verbindungen.ts:55-60` (`verteile`), `:112-124` (`fuehreAus`/`sende`)
  - `server/zustandsdienst.ts:101-102`
- **Szenario (verifiziert):** Ein anonymer Client pausiert das Lesen seines Sockets und sendet 60.000 abwechselnde `schalten`-Befehle. Der RSS des Servers steigt von 68,6 MB auf 301,9 MB, weil `bestaetigt`/`aenderung` ungebremst im Heap gepuffert werden. Jeder Befehl erzeugt außerdem zwei retained QoS-1-Publishes. Mit `autosave_on_changes`/`autosave_interval 1` schreibt Mosquitto danach jedes Mal die komplette DB (SD-Karten-Verschleiß). Alle anderen Nutzer bekommen je Änderung einen Toast und eine Screenreader-Ansage. Die Anzahl der Verbindungen ist nicht begrenzt.
- **Fix:**
  - Token-Bucket pro Verbindung (z. B. 20 Befehle/s, Überschuss → `fehler` bzw. Close 1008).
  - Vor jedem `send` prüfen: `bufferedAmount > 1 MB` → `terminate()`.
  - `WebSocketServer({ maxPayload: 4096 })`, siehe CR-09.
  - Energie nicht pro Befehl persistieren, sondern nur im 60-s-Takt und beim Stopp (`zustandsdienst.ts:102` streichen).
  - Maximal etwa 100 gleichzeitige Verbindungen.

### CR-02 · hoch · Release-Job ist nicht idempotent: Release fehlt dauerhaft und der Job bleibt grün
- **Ort:** `.github/workflows/ci-release.yml:214-226`
- **Szenario:**
  1. `git push origin v$V` gelingt, danach scheitert `gh release create` (API-Fehler, Rate-Limit, Tippfehler in der Hinweisdatei o. Ä.).
  2. Der Re-Run bzw. der nächste Push findet den Tag über `git ls-remote` und endet mit `exit 0` („existiert bereits“).
  3. Das GitHub Release v2.0.0 wird nie erzeugt, die CI zeigt trotzdem grün.
  4. Ebenso: Scheitert `imagetools create` nach dem Tag-Push nicht, aber der Release-Schritt, fehlt das Release.
- **Fix:**
  - Die Prüfung auf `gh release view "v$V" >/dev/null 2>&1 && exit 0` umstellen.
  - Den Tag nur pushen, wenn er fehlt (`git ls-remote` bleibt als Teilprüfung).
  - `imagetools create` idempotent vor der Release-Prüfung ausführen.
  - Alternativ `gh release create "v$V" --target "$GITHUB_SHA"` ohne manuellen Tag und ohne `--verify-tag` aufrufen.

### CR-03 · hoch · FR-34 (Dokumentation) im Commit nicht umgesetzt
- **Ort:**
  - `API.md:25-184`: noch `smarthome/{roomId}/light`, `type: "publish"`.
  - `DOCKER-SETUP.md`, `GITHUB-ACTIONS.md`, `KUBERNETES.md`: unverändert.
  - `.github/copilot-instructions.md:82,112,115`
  - `README.md` ist nur im Arbeitsverzeichnis geändert (uncommitted).
- **Szenario:** Ein Merge auf main geht sofort in Produktion. Die Doku beschreibt dann weiter das alte Protokoll, localStorage und alte Workflows. Das verletzt FR-34, NFR-9 (Upgrade-Hinweis in der README) und die Regel „nichts wird vertagt“.
- **Fix:** Folgende Dateien auf 2.0 umschreiben:
  - `API.md`: WS-Protokoll mit Befehlen, Snapshot, `aenderung`, `energie`, `fehler` und Codes; Topic-Schema `iot-haus/v2/...`
  - `DOCKER-SETUP.md`, `GITHUB-ACTIONS.md` (ci-release.yml), `KUBERNETES.md` (Healthcheck/Probe `/api/health`)
  - `copilot-instructions.md`

  Danach die README-Änderung committen.

### CR-04 · hoch · Abnahme-Checkliste `docs/abnahme-2.0.md` fehlt
- **Ort:** `docs/`. Dort liegen nur Screenshots unter `docs/abnahme/*.png`.
- **Szenario:** NFR-10 und die Auflage im Readiness-Report („Abnahme-Checkliste (Story 7.3) vor dem Merge auf main vollständig ausfüllen“) sind nicht erfüllt. Der Merge würde ohne dokumentierte Browser-Abnahme in Produktion gehen.
- **Fix:** `docs/abnahme-2.0.md` mit den abhakbaren Browser-Prüfungen aus NFR-10 anlegen, ausgefüllt, mit Verweis auf die Screenshots. Dann committen.

### CR-05 · mittel · `next.config.ts` fehlt im Runtime-Image, deshalb wird `poweredByHeader: false` ignoriert
- **Ort:** `Dockerfile:34-38`
  - Es kopiert `.next`, `public`, `dist` und `package.json`, aber keine `next.config.*`.
  - `server/index.ts:14`: `next({ dev:false })` lädt die Konfiguration zur Laufzeit.
- **Szenario (verifiziert):** `curl -I` gegen den laufenden Container liefert `X-Powered-By: Next.js`. Der lokale Server auf :3100 liefert diesen Header nicht. Die drei Security-Header kommen zwar über das `routes-manifest`, aber jede Laufzeit-Option aus `next.config.ts` fehlt im Image stillschweigend. Das betrifft Architektur §3.6 (Härtung/Header, NFR-4) und bricht künftige Laufzeit-Optionen.
- **Hinweis zur Frage im Auftrag:** Der Import von `package.json` in `next.config.ts` ist im Image unkritisch. Er wird nur beim Build ausgewertet (`NEXT_PUBLIC_APP_VERSION` wird eingebettet), und `package.json` liegt ohnehin in `/app`.
- **Fix:**
  - `next.config.ts` ins Runtime-Image kopieren. Next 15 transpiliert `.ts`-Konfigurationen mit dem eigenen SWC, ohne `typescript`. Den Laufzeitstart danach mit `curl -I` prüfen.
  - Alternativ in `server/app.ts` `res.removeHeader('X-Powered-By')` setzen.
  - Zusätzlich einen CI-Schritt im Container-Job ergänzen, der sicherstellt, dass der Header fehlt.

### CR-06 · mittel · Client stürzt bei Versionskonflikt ab, statt den Neu-laden-Banner zu zeigen
- **Ort:**
  - `src/client/hausReducer.ts:93-97` (`name()` → `szeneById(...).name`)
  - `:158-176` (`snapshot` wird trotz `versionKonflikt` übernommen)
  - `:256` (`anzeigeAn`: `z.server?.zustand[id].an`)
  - Es gibt keinen Error Boundary und keine `error.tsx`.
- **Szenario (verifiziert per Vitest):**
  1. Nach einem späteren Update (z. B. 2.1 mit neuer Szene oder neuem Gerät) verbindet sich ein offener 2.0-Tab neu.
  2. Er bekommt den Snapshot mit der neuen Version, `versionKonflikt` wird `true`.
  3. Er verarbeitet aber weiter `aenderung`-Nachrichten und fremde Zustände.
  4. Bei `ursache.ref = 'party'` (unbekannte Szene) oder einem fehlenden Gerät wirft der Reducer einen `TypeError`. Die App zeigt „Application error“ statt des Banners aus FR-18.
- **Fix:**
  - Bei `versionKonflikt` nur die Versionsinformation übernehmen und `aenderung`/`energie` ignorieren.
  - `name()` und `anzeigeAn` defensiv machen (`?.name ?? ref`, `zustand[id]?.an ?? false`).
  - Eine `src/app/error.tsx` mit „Neu laden“ ergänzen.

### CR-07 · mittel · Abweichung von den verbindlichen Auflösungen K-06, K-08 und K-13 (Dateischnitt, Microcopy-Katalog)
- **Ort:**
  - `src/components/*`: `GeraetSchalter`, `Icon`, `Ansager` und `Banner` statt `GeraeteZeile`+`Schalter`, `Symbol`, `LiveRegion` und `VerbindungsBanner`+`VersionsBanner`. Es fehlen `Sprunglink`, `Zaehler`, `DeltaChip.tsx`, `Fusszeile.tsx` und `useRestzeit.ts`.
  - `src/ui/texte.ts` fehlt ganz. Die Texte sind verteilt, z. B. `Banner.tsx:41-65`, `App.tsx:34-67`, `hausReducer.ts:114-153`.
  - `src/domain/format.ts:13-60` nutzt ein normales Leerzeichen statt U+202F vor den Einheiten.
  - Screenreader-Varianten wie `kopf.kosten` („Euro pro Stunde“) fehlen, siehe `Kopfbereich.tsx:130`.
- **Szenario:** Die Nachverfolgung Story → Datei ist gebrochen. Microcopy lässt sich nicht an einer Stelle prüfen. Zahl und Einheit können umbrechen („12,3 / W“).
- **Fix:**
  - Entweder die Dateien umbenennen bzw. aufteilen und `src/ui/texte.ts` mit dem Katalog aus EXPERIENCE.md anlegen.
  - Oder die Abweichung per `bmad-correct-course` dokumentieren.

  In jedem Fall U+202F in `format.ts` einsetzen.

### CR-08 · niedrig · Nachrichten über 64 KB beenden die Verbindung ohne Fehlerantwort (FR-18)
- **Ort:** `server/ws-verbindungen.ts:25` (`maxPayload: 65_536`) vor der 4-KB-Prüfung in `:94`
- **Szenario (verifiziert):** Eine 70-KB-Nachricht führt zu `CLOSE 1009` ohne `fehler`-Nachricht. Der Client fällt in „Getrennt“ und den Backoff. FR-18 verlangt „der sendende Client erhält eine Fehlerantwort“.
- **Fix:** Nachrichten zwischen 4 KB und 64 KB bekommen bereits `ZU_GROSS`. Für größere entweder in der Spezifikation festhalten, dass das Schließen mit 1009 zulässig ist, oder `maxPayload` auf 4 KB setzen und im Client bei Close 1009 eine Meldung zeigen. Zusammen mit CR-01 umsetzen.

### CR-09 · niedrig · Warten auf „healthy“ nach dem Neustart schlägt nie fehl
- **Ort:** `.github/workflows/ci-release.yml:118-124`
- **Szenario:** Wird der Container nach `docker restart` nicht healthy, endet die Schleife still nach 60 s, ohne `exit 1` und ohne Log. Danach scheitert der Rauchtest mit einem unklaren `fetch failed`, und die Ursache fehlt. Der Job wird zwar rot, aber schwer zu diagnostizieren.
- **Fix:** `warte_healthy` in eine gemeinsame Funktion bzw. ein Skript auslagern und auch nach dem Restart aufrufen. Bei Zeitüberschreitung `docker logs ci; exit 1`.

### CR-10 · niedrig · Origin-Prüfung ohne Host-Allowlist, damit anfällig für DNS-Rebinding
- **Ort:** `server/ursprung.ts:10-22`
- **Szenario (verifiziert gegen :3100):** Mit `Host: evil.example:3100` und `Origin: http://evil.example:3100` wird der Snapshot geliefert. Eine per DNS-Rebinding umgebundene Fremdseite kann im LAN über den Browser des Nutzers Geräte schalten. NFR-4 ist wörtlich erfüllt („Origin passt zum Host“), die Schutzabsicht aber nicht.
- **Fix:** Optionale Variable `ERLAUBTE_HOSTS`. Ist sie gesetzt, muss der Host darin stehen. Das in README und DOCKER-SETUP dokumentieren.

### CR-11 · niedrig · Restore übernimmt `wh: Infinity` und `seit` aus der Zukunft
- **Ort:** `server/mqtt-speicher.ts:34,41`
- **Szenario (verifiziert per Vitest):**
  - `{"wh":1e999}` besteht die Prüfung `!(wh >= 0)`. Der Tageszähler wird `Infinity`, und JSON liefert `null` an die Clients.
  - Ein `seit` in der Zukunft (etwa durch einen Uhrsprung) verzögert Auto-Aus. Der Client zeigt z. B. „noch 63:00“.
- **Fix:**
  - `Number.isFinite(daten.wh) && daten.wh >= 0`
  - Beim Restore `seit = Math.min(daten.seit, jetzt)`.

### CR-12 · niedrig · Uhrsprung erzeugt Phantomverbrauch
- **Ort:** `server/zustandsdienst.ts:106-108`, `src/domain/energie.ts:59-68`
- **Szenario (verifiziert):** Macht die Wanduhr einen Vorwärtssprung von 10 h (Host ohne RTC, NTP-Sync nach dem Boot), rechnet `integriere` bei 1 kW 10 kWh Tagesverbrauch ab.
- **Fix:** Das Integrationsintervall auf höchstens 2 × `ENERGIE_TAKT_MS` begrenzen und bei größerem Sprung eine Warnung loggen.

### CR-13 · niedrig · A11y: Auto-Aus-Restzeit fehlt in der Beschreibung, Text ist fest verdrahtet
- **Ort:** `src/components/GeraetSchalter.tsx:78,116,127-133`
- **Szenario:**
  - `aria-describedby` enthält nur Leistung und Kennzeichen. Die sichtbare Restzeit ist `aria-hidden`, Screenreader-Nutzer erfahren sie nicht (EXPERIENCE `geraet.restzeit`, NFR-2).
  - „3 Minuten“ und „Auto-Aus 3 min“ sind hartkodiert statt aus `geraet.autoAusS` berechnet. Das ist heute korrekt, bricht aber still, sobald sich `AUTO_AUS_S` ändert.
- **Fix:** Die Restzeit als sr-only-Text in die Beschreibung aufnehmen, z. B. „noch 2 Minuten 48 Sekunden“, grob aktualisiert. Den Text aus `autoAusS` formatieren.

### CR-14 · niedrig · A11y: DOM-Reihenfolge weicht auf schmalen Ansichten von der sichtbaren ab (WCAG 1.3.2)
- **Ort:** `src/components/App.tsx:56-62`
- **Szenario:** Bei 360 px steht „Verbrauch nach Raum“ per `order-last` visuell am Ende. Screenreader und Lesemodus lesen den Block aber vor „Räume“. Das weicht von FR-25 ab („einspaltig in der genannten Reihenfolge“).
- **Fix:** `VerbrauchNachRaum` im DOM nach `Raeume` rendern. Für das Desktop-Layout per CSS-Grid-Areas in die linke Spalte setzen, oder für schmal und breit je eine Instanz mit `hidden`/`lg:block` rendern (nur eine davon sichtbar und im Accessibility-Baum).

### CR-15 · niedrig · Healthcheck ist fest auf Port 3000 verdrahtet
- **Ort:** `Dockerfile:64-65`, dagegen `server/konfig.ts:33-35` (liest `PORT`)
- **Szenario:** Wer `PORT=8080` setzt, bekommt einen dauerhaft unhealthy Container (Restart-Schleifen je nach Orchestrierung).
- **Fix:** `fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health')`

### CR-16 · niedrig · Release-Hinweise versprechen Verhalten, das alte 0.1-Tabs nicht zeigen
- **Ort:** `.github/release-hinweise/v2.0.0.md`, letzter Absatz
- **Szenario:** Laut Text zeigen Tabs der Vorversion „Neue Version verfügbar“. Der Banner existiert aber nur im 2.0-Client. Alte Tabs bekommen `ALTES_PROTOKOLL` (`src/domain/befehle.ts:30`) ohne sichtbaren Hinweis.
- **Fix:** Text korrigieren: „Offene Tabs der Vorversion bitte neu laden.“

### CR-17 · niedrig · Neues Binär-Asset entgegen K-12, und uncommittete Änderungen im Arbeitsverzeichnis
- **Ort:**
  - `public/apple-touch-icon.png` (neu), `public/apple-touch-icon.svg` (gelöscht), `src/app/layout.tsx:20`
  - Arbeitsverzeichnis: `M README.md`, `M docker/mosquitto.conf` (`log_type information` entfernt)
- **Szenario:**
  - K-12 verlangt: kein neues Binär-Asset, die SVG bleibt. Funktional ist die Lösung besser (kein 404), aber die Abweichung ist nicht dokumentiert.
  - Die Mosquitto-Änderung fehlt in HEAD. Das Image aus main loggt deshalb bei jeder Speicherung eine Zeile, in Kombination mit CR-01 eine Log-Flut.
- **Fix:** Die Abweichung per `correct-course` festhalten. Beide Dateien aus dem Arbeitsverzeichnis committen.

## Verworfen

11 Befunde wurden verworfen, weil sie spekulativ, widerlegt oder Dubletten waren:

- **Restore-Fenster von 500 ms verliert Zustand:** Mosquitto liefert retained Nachrichten direkt nach dem SUBACK. Der Neustart-Test hat die Persistenz bestätigt.
- **Fehlgeschlagener Restore ohne Retry:** nur theoretisch.
- **Stopp-Fristen in supervisord:** Der gemessene Stopp dauerte rund 2 s.
- **`endAsync(true)` verwirft Publishes:** `stoppe()` wartet auf das PUBACK der Energie.
- **Weitere verworfene Punkte:**
  - Doppelklick-Race in `useHaus`
  - Timeout-Timer in `useHaus` (laufen folgenlos aus)
  - Toast-Fokusverlust (nicht nachgestellt)
  - Browser-Direktpublish auf MQTT (Broker nur auf 127.0.0.1, strenge Whitelist)
  - Sommerzeit-Mitternacht (getestet)
  - `gh`-Flags (`--notes-file` und `--generate-notes` zusammen sind gültig)
  - `imagetools`-Digest

## Zusammenfassung

0 decision-needed, 17 patch (4 hoch, 4 mittel, 9 niedrig), 0 defer, 11 verworfen.

**Empfehlung:** Vor dem Merge auf main CR-01 bis CR-06 beheben. Die übrigen Punkte gehören ebenfalls in diesen Release, weil nichts vertagt wird.

## Umsetzung der Befunde (Amelia, 2026-09-26)

| ID | Ergebnis | Umsetzung |
|---|---|---|
| CR-01 | behoben | Token-Bucket je Verbindung (100 am Stück, 20/s), neuer Fehlercode `ZU_VIELE_BEFEHLE` mit Befehlskennung; Verbindungen mit > 1 MB Sendepuffer werden getrennt; höchstens 100 WebSocket-Verbindungen (sonst 503); Tagesenergie nur noch im 60-s-Takt und beim Stopp persistiert. Tests: `protokoll.test.ts` (Ratenlimit), `zustandsdienst.test.ts`. |
| CR-02 | behoben | Release-Job prüft zuerst `gh release view`; Versions-Image, Tag und Release werden einzeln und idempotent ergänzt. |
| CR-03 | behoben | Doku durch Paige auf Stand 2.0 (README, API.md, DOCKER-SETUP, KUBERNETES, GITHUB-ACTIONS, copilot-instructions, docs/*). |
| CR-04 | behoben | `docs/abnahme-2.0.md` mit Screenshots; automatisiert/headless Geprüftes abgehakt, Prüfungen auf echten Geräten ehrlich als „nach Deploy“ offen. |
| CR-05 | behoben | `next.config.ts` → `next.config.mjs` (Runtime ohne TypeScript/npm – mit `.ts` crasht Next im gehärteten Image beim Versuch, TypeScript zu installieren) und ins Runtime-Image kopiert; Rauchtest prüft Security-Header und fehlendes `X-Powered-By`. |
| CR-06 | behoben | Reducer ignoriert Änderungen/Energie bei Versionskonflikt, unbekannte Kennungen fallen auf die Kennung zurück, unbekannte Ursachen erzeugen keine Meldung; `Fehlergrenze` um die App. Test in `hausReducer.test.ts`. |
| CR-07 | behoben | Dateischnitt nach Architektur §5.1/K-06 (inkl. `Zaehler`, `DeltaChip`, `Fusszeile`, `GeraeteZeile`+`Schalter`, `VerbindungsBanner`/`VersionsBanner`, `LiveRegion`, `Symbol`, `useRestzeit`), Microcopy-Katalog `src/ui/texte.ts`, U+202F vor Einheiten, Screenreader-Varianten („Euro pro Stunde“ usw.). Architekturtest prüft Dateien und U+202F. |
| CR-08 | Teamentscheidung | 4 KB–64 KiB → `ZU_GROSS`-Antwort (FR-18); > 64 KiB schließt mit 1009 als Schutz vor Speichermissbrauch. Der eigene Client sendet nie mehr als ~120 Byte. In API.md dokumentiert. |
| CR-09 | behoben | `scripts/warte-healthy.sh` für Start und Neustart, bricht mit Log und Exit 1 ab. |
| CR-10 | behoben | Optionale Host-Allowlist `ERLAUBTE_HOSTS` (Host und ggf. X-Forwarded-Host müssen passen, sonst 403). Standard bleibt offen, weil Heimnetz-Hostnamen/IPs je Betreiber verschieden sind; README empfiehlt das Setzen. |
| CR-11 | behoben | Restore verwirft nicht-endliche `wh` und negative `seit`; `seit` in der Zukunft wird auf jetzt begrenzt. |
| CR-12 | behoben | Integration je Schritt auf höchstens 2 min begrenzt (Takt integriert spätestens alle 60 s). |
| CR-13 | behoben | Beschreibung nennt die laufende Restzeit („noch 2 Minuten 48 Sekunden“), Minuten aus `autoAusS`. |
| CR-14 | Teamentscheidung | Schmal rückt „Verbrauch nach Raum“ per CSS `order` hinter die Räume (FR-25); das Element ist nicht interaktiv, die Fokusreihenfolge bleibt logisch, die Überschriftenfolge im DOM ist Haus → Verbrauch → Räume. So bleibt die sticky linke Spalte ab 1024 px (UX-07) ohne Duplikat erhalten. |
| CR-15 | behoben | Healthcheck nutzt `process.env.PORT`. |
| CR-16 | behoben | Release-Hinweis: Tabs der Vorversion einmal neu laden; Banner erst ab 2.0. |
| CR-17 | Teamentscheidung | Echte `apple-touch-icon.png` (180 × 180) + `icon.svg` + Favicon im neuen Design: UX-30 verlangt ein funktionierendes Icon, der 404 ist behoben, das Asset ist 8 KB groß. K-12 wollte nur die Bild-Pipeline vermeiden – die Icons sind statische Dateien. |

Nachweis nach Umsetzung: Lint 0, Typecheck 0, 258 Tests grün (Abdeckung Domäne 100 % Zeilen), Build 118 kB First Load JS, Docker-Image lokal: Härtung ok, healthy nach 5 s, Rauchtest inkl. Security-Header, Persistenz nach Neustart, keine „Saving“-Logflut; E2E mit zwei Browsern ohne Konsolenfehler.

## Re-Review (2026-09-26)

- **Ziel:** Fixes aus Commit 305ef39 prüfen und den neuen Diff `git diff e284460..305ef39 -- . ':!_bmad-output' ':!package-lock.json' ':!docs/abnahme'` (83 Dateien) auf Regressionen untersuchen (Blind Hunter + Edge Case Hunter).
- **Statische Prüfungen:** `npm run lint` 0, `npm run typecheck` 0, `npm test` 258/258 grün.
- **Live gegen :3100:**
  - 200 gültige No-op-Befehle am Stück ergeben 100 × `bestaetigt` und 100 × `ZU_VIELE_BEFEHLE`. 50 × ungültiges JSON ergeben 50 × `UNGUELTIGES_JSON`, ohne Ratenlimit.
  - Security-Header vorhanden, kein `X-Powered-By`.
  - Der Zustand wurde nicht verändert (nur Schaltbefehle auf den aktuellen Zustand).

### Urteile je Befund

| ID | Urteil | Begründung |
|---|---|---|
| CR-01 | bestätigt behoben | Token-Bucket, Grenze für den Sendepuffer (1 MB → `terminate`), max. 100 Verbindungen, Energie nur im Takt. Live nachgestellt. Rest siehe RR-01/RR-02 (niedrig). |
| CR-02 | bestätigt behoben | Early-Exit über `gh release view`, Image, Tag und Release werden einzeln idempotent ergänzt. Unter `set -euo pipefail` korrekt: Die Befehle stehen in `if`-Bedingungen, ein Fehler von `ls-remote` in `[ -z "$(…)" ]` endet spätestens beim `git push`, also laut. Rest siehe RR-03 (niedrig). |
| CR-03 | bestätigt behoben | API.md, DOCKER-SETUP, KUBERNETES, GITHUB-ACTIONS, README und copilot-instructions sind auf Stand 2.0. Alte Topics erscheinen nur noch als Upgrade-Hinweis. Die Doku zu Limits und Close-Codes stimmt mit dem Code überein (Ausnahme RR-04). |
| CR-04 | bestätigt behoben | `docs/abnahme-2.0.md` ist vorhanden. Prüfungen, die echte Geräte brauchen, sind nachvollziehbar als „nach Deploy“ offen markiert. |
| CR-05 | bestätigt behoben | `next.config.mjs` ist reines ESM, liest `package.json` per `readFileSync` und wird ins Image kopiert (`COPY package.json next.config.mjs ./`, Architekturtest). Der Rauchtest prüft `X-Frame-Options` und das fehlende `X-Powered-By`. |
| CR-06 | bestätigt behoben | `aenderung`/`energie` werden bei Versionskonflikt ignoriert, `name()`/`geraetMitRaum()` sind defensiv, unbekannte Ursachen erzeugen keinen Toast, die `Fehlergrenze` umschließt die App. Hinweis: Ein Snapshot eines künftigen Servers, der ein Gerät *entfernt*, wird weiter übernommen. `anzeigeAn`/`hausverbrauch` (`zustand[id].an`) werfen dann, und die Fehlergrenze zeigt „Neu laden“. Das Ergebnis entspricht dem Banner, deshalb kein Befund. |
| CR-07 | bestätigt behoben | Dateischnitt nach K-06, Katalog `src/ui/texte.ts` wird überall genutzt (keine hartkodierten Sätze mehr in `src/components`/`src/hooks` gefunden), U+202F in `format.ts`, Screenreader-Varianten vorhanden. |
| CR-08 | bestätigt (Teamentscheidung) | 1009 über 64 KiB ist in API.md §2.2 dokumentiert. |
| CR-09 | bestätigt behoben | `scripts/warte-healthy.sh` (ausführbar, `set -eu`, Log + `exit 1`) wird bei Start und Neustart aufgerufen. |
| CR-10 | bestätigt behoben | `hostErlaubt` verlangt, dass *alle* vorhandenen Werte (Host und XFH) in der Liste stehen, und lehnt ab, wenn keiner vorhanden ist. Ein gefälschter XFH kann die Liste nicht umgehen. Portangaben in der Liste schlagen geschlossen fehl. Standard ohne Liste bleibt offen (Teamentscheidung, dokumentiert). |
| CR-11 | bestätigt behoben | `Number.isFinite(wh)`, `seit < 0` werden verworfen, `seit` in der Zukunft wird im Konstruktor auf jetzt begrenzt. Getestet. |
| CR-12 | bestätigt behoben | `von = max(energieStand, jetzt − 120 s)`. Der Takt (≤ 60 s bzw. bis Mitternacht) liegt immer darunter, deshalb geht im Normalbetrieb kein Verbrauch verloren. Der Tageswechsel in `integriere` ist unverändert korrekt. |
| CR-13 | bestätigt behoben | Die sr-only-Beschreibung enthält „noch m Minuten s Sekunden“. Minuten und Badge werden aus `autoAusS` berechnet. |
| CR-14 | bestätigt (Teamentscheidung) | `order-last` bei nicht interaktivem Inhalt. Fokusreihenfolge und Überschriftenhierarchie bleiben logisch. Akzeptiert. |
| CR-15 | bestätigt behoben | Der Healthcheck nutzt `process.env.PORT`. |
| CR-16 | bestätigt behoben | Die Release-Hinweise verlangen, dass alte Tabs einmal neu geladen werden. Der Banner kommt erst ab 2.0. |
| CR-17 | bestätigt (Teamentscheidung) | Statische Icons (`icon.svg`, `apple-touch-icon.png` 7,8 KB). Das Arbeitsverzeichnis ist sauber. |

**Nicht behoben: keiner.**

### Neue Befunde

#### RR-01 · niedrig · Ratenlimit greift nur für gültige Befehle, deshalb Log-Flut möglich
- **Ort:** `server/ws-verbindungen.ts:114-125` (`darf()` erst nach `pruefeBefehl`), `:139` (`log.warn` je Fehlerantwort)
- **Szenario (live gegen :3100 verifiziert):** 50 × ungültiges JSON ergeben 50 × `fehler`, ohne jede Drosselung. Ein LAN-Client ohne Origin sendet ungebremst Müll oder gedrosselte gültige Befehle. Jede Nachricht erzeugt eine `warn`-Logzeile auf stdout. Mit dem Docker-Standardtreiber `json-file` ohne Rotation wächst das Log auf der SD-Karte unbegrenzt. Der Speicher im Server bleibt dagegen begrenzt: Der Sendepuffer ist gedeckelt, und andere Nutzer sehen keine Toasts. Das Hauptziel von CR-01 ist also erreicht.
- **Fix:**
  - Den Token-Bucket auf *jede* eingehende Nachricht anwenden, also `darf()` vor der Größen- und JSON-Prüfung aufrufen.
  - Bei dauerhaft leerem Vorrat (z. B. < −100) mit Close 1008 trennen.
  - `ZU_VIELE_BEFEHLE` höchstens einmal je Sekunde und Verbindung loggen.

#### RR-02 · niedrig · Token-Bucket nutzt die Wanduhr: Rückwärtssprung sperrt Verbindungen
- **Ort:** `server/ws-verbindungen.ts:81,100-110`
- **Szenario (am Code nachgerechnet):** Stellt NTP die Uhr um X s zurück, ergibt `jetzt − stand` einen negativen Wert. Der Vorrat sinkt dann auf `v − 20·X`, bei 1 h also etwa −72.000, und wird so gespeichert. Die Verbindung beantwortet danach rund X s lang jeden Befehl mit `ZU_VIELE_BEFEHLE`, und der Nutzer sieht nur „konnte nicht geschaltet werden“, bis er neu lädt.
- **Fix:** Eine monotone Uhr verwenden (`performance.now()`) oder die verstrichene Zeit mit `Math.max(0, jetzt − stand)` begrenzen.

#### RR-03 · niedrig · Teil-Wiederholung des Releases kann Versions-Image und Tag auf verschiedene Commits legen
- **Ort:** `.github/workflows/ci-release.yml:213-220`
- **Szenario:**
  1. Lauf A erzeugt `:V` aus Digest A, danach scheitert `git push` des Tags.
  2. Der nächste Push mit Commit B und unveränderter Version findet `:V` und überspringt es. Tag und Release entstehen dann auf B.
  3. Das Image `:V` enthält Commit A, das Release zeigt auf B.
  4. Umgekehrt gilt dasselbe, wenn der Tag bereits existiert und `:V` fehlt: `:V` wird aus dem aktuellen Digest B gebaut, der Tag zeigt auf A.
- **Fix:**
  - Existiert der Tag, das Versions-Image aus `:sha-$(git rev-parse --short "v$V")` erzeugen (dieses Tag schreibt der Image-Job bereits), nicht aus `$DIGEST`.
  - Existiert `:V` schon, dessen Revision prüfen (Label `org.opencontainers.image.revision`) und bei Abweichung mit Fehler abbrechen.

#### RR-04 · niedrig · Proxy-Doku: „oder X-Forwarded-Host“ passt nicht zu gesetztem `ERLAUBTE_HOSTS`
- **Orte:**
  - `README.md:140-143`
  - `DOCKER-SETUP.md:144-146`
  - `KUBERNETES.md:194-196`
- **Szenario (per Unit-Test belegt, `konfig.test.ts`: `{host:'intern:3000','x-forwarded-host':'haus.local'}` → `false`):**
  1. Die Doku sagt, der Proxy müsse `Host` durchreichen *oder* `X-Forwarded-Host` setzen, und empfiehlt zusätzlich `ERLAUBTE_HOSTS`.
  2. Ein Proxy, der nur XFH setzt, schickt z. B. `Host: 127.0.0.1:3000` (nginx-Standard ist `$proxy_host`).
  3. Mit `ERLAUBTE_HOSTS=haus.example.de` lehnt der Server dann jeden WebSocket mit 403 `grund=host` ab.
- **Fix:** In allen drei Dokumenten ergänzen: Mit `ERLAUBTE_HOSTS` muss der Proxy `Host` durchreichen, oder der interne Upstream-Name (z. B. `127.0.0.1`) gehört mit in die Liste.

### Ergebnis

Alle 17 CR-Befunde sind bestätigt behoben bzw. als Teamentscheidung tragfähig. Neu sind 4 Befunde, alle **niedrig**. Es bleibt kein Befund der Schwere mittel oder höher. **Freigegeben** für den Merge auf main. RR-01 bis RR-04 als Folgepunkte umsetzen.

### Umsetzung Re-Review (Amelia)

| ID | Ergebnis | Umsetzung |
|---|---|---|
| RR-01 | behoben | Token-Bucket gilt für jede eingehende Nachricht (auch ungültige); über 200 abgelehnte Nachrichten in Folge → Close 1008; Warnzeilen je Verbindung höchstens alle 10 s mit Zähler `unterdrueckt`. Test in `protokoll.test.ts`. |
| RR-02 | behoben | Token-Bucket nutzt `performance.now()` (monoton), vergangene Zeit ≥ 0. |
| RR-03 | behoben | Existiert der Tag, wird das Versions-Image aus `:sha-<Tag-Commit>` erzeugt, sonst aus dem eben gebauten Digest; Tag wird vor dem Versions-Image gesetzt. |
| RR-04 | behoben | README, DOCKER-SETUP, KUBERNETES: mit `ERLAUBTE_HOSTS` müssen Host **und** X-Forwarded-Host passen; interner Upstream-Name ggf. aufnehmen. |
