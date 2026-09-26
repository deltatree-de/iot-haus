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
