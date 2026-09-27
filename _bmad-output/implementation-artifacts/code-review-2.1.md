# Code-Review IoT-Haus 2.1 (BMAD `bmad-code-review`)

- **Datum:** 2026-09-27
- **Umfang:** `git diff 033c290..HEAD -- . ':!_bmad-output' ':!package-lock.json'`: 47 Dateien, +1866/−191, HEAD `e3d326e`
- **Modus:** full, gegen `_bmad-output/planning-artifacts/sprint-change-proposal-2026-09-27.md` (AC-01 bis AC-25, E-01 bis E-36)
- **Ebenen:** Blind Hunter (nur der Diff), Edge Case Hunter (Diff und Projektzugriff), Acceptance Auditor (Diff und Spezifikation). Alle drei Ebenen sind gelaufen, keine ist ausgefallen.
- **Gates:** `npm run typecheck` ok, `npm run lint` ok (0 Warnungen), `npm test` ok (15 Dateien, 338 Tests).
- **Live-Prüfung:** Server auf `ws://localhost:3100/mqtt`. Danach wurde der Zustand zurückgesetzt: Sonne `nacht`, Auto zu Hause, Wallbox aus. Die Sonne stand vor der Prüfung auf `sonnig` und steht jetzt auf `nacht`, wie im Auftrag vorgegeben.

## Ergebnis

| Schweregrad | Anzahl |
|---|---|
| kritisch | 0 |
| hoch | 0 |
| mittel | 1 (CR21-01) |
| niedrig | 11 (CR21-02 bis CR21-12) |

Verworfen wurden 4 Befunde (Begründung am Ende).

**Nicht freigegeben**, solange CR21-01 offen ist. Die Fehlerbehebung ist klein: 1 Zeile im Server und 1 Test.

Der Kern ist korrekt, das ist verifiziert:
- Energie und Akku werden im selben Schritt mit derselben Obergrenze integriert.
- Der Akku-voll-Timer plant sich bei jeder Änderung und bei jedem Takt neu und wird beim Stoppen gelöscht.
- Wegfahren beendet das Laden in derselben `aenderung` (E-06).
- Die Normalisierung beim Restore (AC-11) greift.
- Energie wird von v1 nach v2 migriert (AC-18). Auto und Sonne werden beim Restore streng validiert: Werte zwischen 0 und Kapazität, nur endliche Zahlen.
- `NICHT_MOEGLICH` wird für die Wallbox bei Auto unterwegs bzw. Akku voll und für Wegfahren unter 15 % erzwungen. Szenen schalten die Wallbox nie ein.
- Alle Zahlen der Prüfsummen stimmen mit der Spezifikation überein:
  - Wallbox 11.000/3 W, Ausgangszustand 78 W, „Alles an“ 23.978 W
  - Akku 60.000/30.000/9.000 Wh, Solar 9.800 W mit den Anteilen 0/0,1/0,35/0,65/0,85
  - Bilanzbeispiele 11.075 W (3,88 €/h), 8.252 W Einspeisung (0,66 €/h), Einspeisevergütung 0,08 €
  - Texte in §5.4.5 wörtlich

## Befunde

### CR21-01 – mittel – `aenderung` beim Schalten der Wallbox enthält kein `auto`; Clients rechnen mit einem bis zu 60 s alten Akkustand weiter
- **Ort:** `server/zustandsdienst.ts:162-174` und `:190`
- **Ursache:**
  - `integriereBis()` ersetzt `this.auto` vor `const auto = aenderung.auto ? … : this.auto`.
  - Damit ist `autoGeaendert` bei jedem reinen Geräte-Befehl `false`, und `auto` (mit neuem `stand`) wird nicht verteilt.
  - Die Persistenz sichert das Auto zwar bei `geaendert.includes(WALLBOX)` (Z. 196), die Nachricht an die Clients aber nicht.
  - Der Client (`Elektroauto.tsx:25`, `CarportFlaeche.tsx:29`, `Raumkarte.tsx` `sperrGrund`) rechnet mit `akkuWhBei(auto, laedt, jetzt)` ab dem alten `stand` des letzten `energie`-Takts.
- **Verifiziertes Szenario:**
  - Live: `schalten carport.wallbox an:true` → `{"typ":"aenderung",…,"geraete":{"carport.wallbox":…},"energie":…}` ohne `auto`.
  - Testlauf des Edge Case Hunters, Einschalten 50 s nach dem Takt: Der Client zeigt 30.152 Wh, der Server hat 30.000 Wh. Der Client zählt also 50 s Laden, die es nie gab.
  - Ausschalten: Der Client fällt auf 30.030 Wh zurück, der Server hat 30.201 Wh. Die Anzeige springt um bis zu 1 % zurück, bis der nächste Takt kommt.
- **Folgen:**
  - Akku-% ist nicht monoton und weicht zwischen den Ansichten vom Server ab (AC-03).
  - „voll in …“ ist bis zu 1 min zu kurz.
  - An der 15-%-Grenze bzw. bei 100 % sperrt oder entsperrt der Client „Wegfahren“ bzw. die Wallbox falsch. Der Server bleibt dabei Autorität, der Nutzer bekommt dann `NICHT_MOEGLICH`.
- **Fix:**
  - In `aendere` setzen: `const autoGeaendert = auto !== this.auto || geaendert.includes(WALLBOX);`. So wird `auto` mit `stand: jetzt` immer mitgesendet, wenn sich die Wallbox ändert. Persistenzbedingung Z. 196 entsprechend vereinfachen.
  - Test in `zustandsdienst.test.ts`: Wallbox an bzw. aus → `aenderung.auto.stand === jetzt`.

### CR21-02 – niedrig – Ein 2.1-Tab stürzt ab, wenn der Server auf 2.0 zurückgesetzt wird (Snapshot ohne `carport.wallbox`)
- **Ort:** `src/client/hausReducer.ts:245`
- **Ursache:** `zustand: n.zustand` wird ungeprüft übernommen. `auto` und `sonne` werden zwar ergänzt (§5.3.2 Regel 2), die Katalogeinträge aber nicht.
- **Szenario:** Testlauf mit einem Snapshot ohne `carport.wallbox`. Danach werfen `hausverbrauch()` und `zustand['carport.wallbox'].an` einen TypeError (`verbrauch.ts:13`, `Elektroauto.tsx:18`). Die Oberfläche bricht ab, bevor das Versionsbanner erscheint. Ein Neuladen hilft.
- **Fix:** `zustand: { ...ausgangszustand(n.serverZeit), ...n.zustand }` (Wallbox dann „aus“).

### CR21-03 – niedrig – Die Carport-Fläche in der Hausansicht läuft beim Laden nicht mit
- **Ort:** `src/components/CarportFlaeche.tsx:29`
- **Ursache:** `Date.now()` wird beim Rendern gelesen, es gibt aber keinen Takt. `Elektroauto.tsx` nutzt `useSekundentakt`.
- **Szenario:** Bei 11 kW steigt der Akku alle ca. 33 s um 1 %. Die Fläche aktualisiert sich nur bei einem fremden Re-Render (spätestens beim `energie`-Takt, 60 s). Carport-Karte und Fläche zeigen dann für bis zu 60 s verschiedene Prozente (AC-03).
- **Fix:** Wie in `Elektroauto`: `useSekundentakt(laedt)` in `CarportFlaeche` (sowie für `sperrGrund` in `Raumkarte`).

### CR21-04 – niedrig – Sonnenwahl per Pfeiltasten: Fokus und Auswahl laufen auseinander
- **Ort:** `src/components/SonnenWahl.tsx:41-43` zusammen mit `src/hooks/useHaus.tsx` (eine offene `sonne` je Art)
- **Ursache:** Bei nativen Radios löst jede Pfeiltaste `change` aus. Solange die Stufe „beschäftigt“ ist, werden weitere Tasten verworfen, der Fokus wandert aber weiter. Der fokussierte Radio ist dann nicht ausgewählt.
- **Szenario:** Das ist ein Code-Trace. Bei „Nacht“ 4× schnell → drücken: Nur „Bedeckt“ wird gesendet, der Fokus steht auf „Sonnig“. Der Screenreader sagt „Sonnig, nicht ausgewählt“. Lokal fällt das kaum auf, weil die Bestätigung nach wenigen Millisekunden kommt. Über das Netz ist es spürbar.
- **Fix:** Während `beschaeftigt` die zuletzt gewählte Stufe merken und sie nach `bestaetigt` senden. Alternativ die Auswahl erst nach Bestätigung auf den Fokus synchronisieren.

### CR21-05 – niedrig – Sonnenwahl zeigt ohne Snapshot „Nacht“ als ausgewählt
- **Ort:** `src/client/hausReducer.ts:375`, `src/components/SonnenWahl.tsx:25`
- **Szenario:** Das ist ein Code-Trace. Beim Laden bzw. Verbinden (`server === null`) liefert `anzeigeSonne` den Wert `'nacht'`. Der Radio „Nacht“ wird als ausgewählt angesagt, obwohl die echte Lage unbekannt ist. Die Solarwerte daneben zeigen dagegen ein Skeleton.
- **Fix:** In `SonnenWahl` `gewaehlt = zustand.server !== null && stufe === s.id`, oder vor dem Snapshot ein Skeleton zeigen.

### CR21-06 – niedrig – „voll in 0 min“ neben „Voll“
- **Ort:** `src/components/Elektroauto.tsx:27-28, 36, 60`
- **Szenario:** Das ist ein Code-Trace. Die Hochrechnung im Client erreicht die Kapazität, bevor die Server-Änderung `akkuVoll` ankommt (Uhrversatz oder Jitter). Dann ist `rest = 0` und `laedt` noch `true`, und der Status lautet „zu Hause · lädt · Voll · voll in 0 min“.
- **Fix:** Wenn `istVoll(wh)` gilt, „voll in …“ ausblenden.

### CR21-07 – niedrig – Uhr zurückgestellt während des Ladens: Akku bleibt stehen, Wallbox zeigt weiter „lädt“
- **Ort:** `server/zustandsdienst.ts:203-213, 242-243`
- **Szenario:** Testlauf mit 59.000 Wh, Wallbox an, Uhr −1 h, danach 30 min Laufzeit. Der Akku bleibt bei 59.000 Wh, die Wallbox bleibt an und zählt 11 kW. Der Akku-voll-Timer plant sich wiederholt neu, ohne dass sich etwas ändert. Energie und Akku bleiben dabei konsistent, beide bleiben stehen. Das entspricht der CR-11/12-Logik aus 2.0, ist hier aber sichtbar.
- **Fix:** Bei `jetzt < energieStand` `energieStand` und `auto.stand` auf `jetzt` zurücksetzen (ohne Integration).

### CR21-08 – niedrig – Akku-Balken wird beim Laden amber statt neutral
- **Ort:** `src/components/Elektroauto.tsx:67` (`laedt ? 'bg-on' : 'bg-ink-secondary'`)
- **Abweichung:** §5.4.6 / E-28 verlangt: „Akku-Balken: Spur `surface-sunken`, Füllung `ink-secondary` (neutral; „lädt“ trägt Text + Blitz `on`)“. Das Paar `on`/`surface-sunken` ist nicht im Kontrasttest.
- **Fix:** Immer `bg-ink-secondary`.

### CR21-09 – niedrig – Wallbox-Standby „3,0 W“ statt „3 W“
- **Ort:** `src/components/GeraeteZeile.tsx:62, 70`
- **Abweichung:** §5.4.3 und §5.4.4 verlangen „Standby 3 W · Auto unterwegs“ bzw. „Standby 3 Watt“. Der Code nutzt `wattEineStelle`/`zahl(…,1)` aus 2.0 und liefert „3,0 W“ bzw. „3,0 Watt“.
- **Fix:** Ganzzahlige Standbywerte ohne Nachkommastelle formatieren. Oder die Spezifikation bewusst auf „3,0“ anpassen und die Entscheidung dokumentieren.

### CR21-10 – niedrig – Log bei `NICHT_MOEGLICH` ohne `typ`
- **Ort:** `server/ws-verbindungen.ts:181`
- **Abweichung:** §5.3.2 verlangt „Log `befehl typ=… ergebnis=NICHT_MOEGLICH`“. Geloggt werden nur `{ ergebnis, unterdrueckt }`.
- **Fix:** `typ` des bereits geprüften Befehls an `fehler()` durchreichen.

### CR21-11 – niedrig – Kontrasttest prüft die Anzahl der Rollen (36) nicht
- **Ort:** `tests/architektur/kontrast.test.ts`
- **Abweichung:** T-14 / AC-22 verlangt „Test erwartet 36 Rollen“. Der Test läuft nur über die vorhandenen Paare.
- **Fix:** `expect(TOKEN_NAMEN).toHaveLength(36)`.

### CR21-12 – niedrig – Der Kompatibilitätstest T-24 nutzt den 2.1-Reducer statt der 2.0-Clientlogik
- **Ort:** `src/client/hausReducer.test.ts:258`
- **Abweichung:** AC-23 / T-24 verlangt „2.0-Clientlogik mit 2.1-Snapshot“. Getestet wird der aktuelle Reducer mit `clientVersion '2.0.0'`.
- **Fix:** Einen Test mit dem 2.0-Reducer (`git show 033c290:src/client/hausReducer.ts` als Fixture) oder einen expliziten Kontrakttest (zusätzliche Schlüssel werden ignoriert, kein Absturz).

## Hinweis außerhalb des Code-Diffs (Vorbedingung für den Merge, Story 8.7)

Die folgenden Dateien sind in HEAD nicht committet. Sie liegen erst als nicht verfolgte oder geänderte Dateien im Arbeitsverzeichnis:
- `.github/release-hinweise/v2.1.0.md`. Laut Spezifikation ist sie **Pflicht**, sonst bricht der Release-Job ab (AC-24, E-35).
- `docs/abnahme-2.1.md`
- `API.md`, `README.md`, die Compose-Dateien und `scripts/smoke-container.mjs`. `smoke-container.mjs` steht in §8 auf „unverändert (bewusst)“; die Änderung ist zu begründen.

Vor dem Merge müssen diese Dateien committet werden.

## Verworfen (4)

- **Szene schaltet die Wallbox ein und wieder aus (falsches `seit`):** Keine Szene enthält `carport.wallbox: true` (E-11, `szenen.ts`). Der Fall ist nicht erreichbar.
- **`NICHT_MOEGLICH` zeigt „Bitte erneut versuchen“:** Das ist so spezifiziert: §5.3.3 sagt „`NICHT_MOEGLICH` nutzt denselben Weg wie jeder `fehler`“.
- **Energie v2 ohne Konsistenzprüfung (`bezugWh > wh`):** Tritt nur bei manipulierten retained-Daten auf. Die Anzeige ist durch `Math.max(0, …)` geschützt.
- **Uhr über Mitternacht zurückgestellt setzt die Tagesenergie zurück:** Das Verhalten ist unverändert gegenüber 2.0 (`integriere` in 033c290) und nicht durch 2.1 verursacht. Zurückgestellt (defer).

## Umsetzung der Befunde (Amelia, 2026-09-27)

| ID | Ergebnis | Umsetzung |
|---|---|---|
| CR21-01 | behoben | `autoGeaendert` berücksichtigt das Schalten der Wallbox; die `aenderung` enthält dann immer den frisch integrierten Akkustand (`stand` = Schaltzeitpunkt). Test „Schalten der Wallbox verteilt den aktuellen Akkustand mit“. |
| CR21-02 | behoben | Snapshot-Zustand wird mit dem Ausgangszustand des eigenen Katalogs aufgefüllt; Test mit Snapshot ohne Wallbox. |
| CR21-03 | behoben | `CarportFlaeche` nutzt den gemeinsamen Sekundentakt, solange geladen wird. |
| CR21-04 | behoben | Sonnenwahl sendet jede Auswahl (Rate-Limit schützt), die zuletzt gewählte Stufe wird angezeigt; Fokus und Auswahl laufen nicht mehr auseinander. |
| CR21-05 | behoben | Vor dem ersten Snapshot ist keine Stufe gewählt. |
| CR21-06 | behoben | „voll in …“ nur bei Restzeit > 0 und Akku < 100 %. |
| CR21-07 | Teamentscheidung | Zurückgestellte Uhr: Anzeige steht höchstens bis zur nächsten Server-Nachricht still (≤ 60 s, dank CR21-01 auch bei jedem Schalten); der Server bleibt Autorität. Kein weiterer Aufwand. |
| CR21-08 | behoben | Akku-Balken neutral (`ink-secondary`); „lädt“ trägt Text + Blitz. |
| CR21-09 | Teamentscheidung | PRD FR-8/FR-29 schreibt Standby mit einer Nachkommastelle vor („0,5 W“); „Standby 3,0 W“ ist damit konsistent zu allen Geräten. Das Proposal-Beispiel „3 W“ war verkürzt. |
| CR21-10 | behoben | Logzeile bei `NICHT_MOEGLICH` enthält `typ`. |
| CR21-11 | behoben | Kontrasttest prüft ausdrücklich 36 Rollen. |
| CR21-12 | Teamentscheidung | Der 2.0-Client ersetzt beim Snapshot nur `server` und liest Geräte über seinen eigenen Katalog (28 IDs, alle im 2.1-Snapshot vorhanden); unbekannte Felder werden nicht gelesen, Änderungen bei Versionskonflikt ignoriert (CR-06 aus 2.0). Ein Test mit dem echten 2.0-Code würde den 2.0-Katalog parallel zum 2.1-Katalog verlangen; der Nachweis erfolgt stattdessen im Container-Rauchtest und im Versionsbanner-Test. |
| Vorbedingung | erledigt | Release-Hinweise, Doku, Abnahme und `scripts/smoke-container.mjs` werden mit diesem Stand committet. Die Änderung am Rauchtest ist nötig, weil der Katalog jetzt 29 Geräte hat; zusätzlich prüft er Auto, Sonne und Netzbilanz im Snapshot. |

## Re-Review (2026-09-27)

- **Umfang:** `git diff e3d326e..501d068` (38 Dateien), dazu Doku-Abgleich README/API.md mit dem Code und `.github/release-hinweise/v2.1.0.md`.
- **Gates:** `npm run typecheck` ok, `npm run lint` ok (0 Warnungen), `npm test` ok (15 Dateien, **342** Tests).
- **Live-Prüfung** (`ws://localhost:3100/mqtt`, Version 2.1.0):
  - `schalten carport.wallbox an:true` bzw. `an:false` → `aenderung` enthält jetzt `auto` mit `stand` = Schaltzeitpunkt und frisch integriertem `akkuWh`.
  - Wegfahren → `aenderung` mit `auto.zuhause:false`. Wallbox an bei Auto unterwegs → `fehler NICHT_MOEGLICH`. Zurückkommen zieht 9.000 Wh ab.
  - Endzustand wie vorgegeben: Sonne `nacht`, Auto zu Hause, Wallbox aus. Durch die Hin- und Rückfahrt hat der Akku 9 kWh verloren (21.004 Wh → 12.004 Wh, 35 % → 20 %). Das lässt sich ohne ca. 50 min Laden nicht zurückdrehen und ist für die Abnahme unerheblich.

### Urteile zu CR21-01 bis CR21-12

| ID | Urteil | Begründung |
|---|---|---|
| CR21-01 | **behoben, verifiziert** | `autoGeaendert = auto !== this.auto \|\| geaendert.includes(WALLBOX)` in `aendere`. Damit ist `auto` bei jedem Schalten der Wallbox dabei: per Befehl, Szene, `raumAus`, Akku voll und Wegfahren. Der neue Test prüft `stand` und `akkuWh` beim Ein- und Ausschalten, live bestätigt. Der Client (`meldungFuer`) erzeugt dabei keine Zusatzmeldung, weil sich die Meldung nach `ursache` richtet. Die Persistenzbedingung Z. 197 (`\|\| geaendert.includes(WALLBOX)`) ist jetzt redundant. Das ist kosmetisch und kein Befund. |
| CR21-02 | **behoben** | `{ ...ausgangszustand(n.serverZeit), ...n.zustand }`, Test mit Snapshot ohne Wallbox. |
| CR21-03 | **behoben** | `CarportFlaeche` nutzt `useSekundentakt(laedt)`, der Hook läuft vor jedem Rückgabezweig. `Raumkarte.sperrGrund` braucht keinen Takt: Es rechnet mit `laedt=false` und greift nur bei ausgeschalteter Wallbox, dann ändert sich der Akku nicht. |
| CR21-04 | **behoben, Restfall siehe RR21-01** | Jede Wahl wird gesendet, und `anzeigeSonne` zeigt die zuletzt ausstehende Stufe. Die Reihenfolge ist stabil, weil die Befehls-IDs nicht numerisch sind und die Einfügereihenfolge gilt. Das Rate-Limit (100 am Stück, dann 20/s) reicht für Pfeiltasten. |
| CR21-05 | **behoben** | `stufe: null` vor dem Snapshot, getestet. |
| CR21-06 | **behoben** | „voll in …“ nur bei `rest > 0 && prozent < 100`. `akkuProzent` liefert 100 nur ab Kapazität minus Toleranz, dadurch gibt es keine falsche Unterdrückung. |
| CR21-07 | **Teamentscheidung akzeptiert** | Die Auswirkung ist begrenzt (≤ 60 s bzw. bis zur nächsten `aenderung`), der Server bleibt konsistent. |
| CR21-08 | **behoben** | Der Balken ist immer `bg-ink-secondary`. |
| CR21-09 | **Teamentscheidung akzeptiert** | Die Begründung (PRD FR-8/FR-29: eine Nachkommastelle) trägt. Die Doku zieht aber nicht nach, siehe RR21-03. |
| CR21-10 | **behoben** | `fehler(…, typ)` loggt `typ`. Das greift auch bei `NICHT_MOEGLICH`, der einzigen Stelle, an der `fuehreAus` fehlschlägt. |
| CR21-11 | **behoben** | `expect(TOKEN_NAMEN).toHaveLength(36)`. |
| CR21-12 | **Teamentscheidung akzeptiert** | Der 2.0-Client liest nur Katalog-IDs, und alle 28 davon sind im 2.1-Snapshot enthalten. Der Versionskonflikt blockiert `aenderung`. Der Nachweis über den Container-Rauchtest und den Versionsbanner-Test reicht. |
| Vorbedingung | **erledigt** | `.github/release-hinweise/v2.1.0.md` ist committet, und `ci-release.yml` liest `.github/release-hinweise/v$V.md`. Die Zahlen im Hinweis sind nachgerechnet: 2 h 44 min ab 50 %, −10.997 W, 8.330/8.252 W, 0,66 €/h, 78 W. Die Env-Doku ist korrekt. Die Änderung an `smoke-container.mjs` ist begründet (29 Geräte, Auto/Sonne/Netzbilanz). Der Doku-Abgleich zeigt keine Abweichung. Geprüft wurden: Env-Variablen (`konfig.ts` mit README-Tabelle und Compose-Dateien), die Logereignisse `*_ungueltig`, die Befehle `sonne`/`auto`, die Regeln für `NICHT_MOEGLICH`, `aenderung.auto` (neue Regel in API.md richtig beschrieben), `energie.auto`, die Prüfreihenfolge und „Heute erzeugt“. |

### Neue Befunde

#### RR21-01 – niedrig – Sonnenwahl: Eine Stufe erneut zu wählen, deren früherer Befehl noch aussteht, wird verworfen
- **Ort:** `src/hooks/useHaus.tsx:78-82` (`istBeschaeftigt(z, 'sonne', ref)`)
- **Szenario:** Das ist ein Code-Trace. Ausgang „Nacht“, dann schnell → „Bedeckt“ (s1 offen), ← „Nacht“ (s2 offen), → „Bedeckt“.
  - Der dritte Befehl wird nicht gesendet, weil s1 mit `ref: 'bedeckt'` noch aussteht.
  - Angezeigt wird die zuletzt ausstehende Stufe „Nacht“, der Fokus steht aber auf „Bedeckt“. Der Server endet bei „Nacht“, obwohl der Nutzer „Bedeckt“ wollte.
  - Das tritt nur im Latenzfenster auf, also über das Netz.
- **Fix:** Für `sonne` gar nicht blockieren, denn das Rate-Limit schützt ohnehin. Alternativ ausstehende Sonnenbefehle mit gleicher `ref` vor dem Senden entfernen oder ersetzen.

#### RR21-02 – niedrig – `docs/abnahme-2.1.md` nennt 338 Tests, Stand 501d068 sind es 342
- **Ort:** `docs/abnahme-2.1.md:23`
- **Fix:** Zahl aktualisieren.

#### RR21-03 – niedrig – Doku nennt „Standby 3 W · Auto unterwegs“, die Oberfläche zeigt nach Teamentscheidung CR21-09 „Standby 3,0 W …“
- **Ort:** `docs/component-inventory.md:55`
- **Fix:** Text auf „Standby 3,0 W · Auto unterwegs“ angleichen. Leistungsangaben wie „Standby 3 W“ in README, data-models und Release-Hinweisen sind Fließtext und dürfen bleiben.

### Ergebnis Re-Review

| Schweregrad | offen |
|---|---|
| kritisch | 0 |
| hoch | 0 |
| mittel | 0 |
| niedrig | 3 (RR21-01 bis RR21-03) |

CR21-01 ist behoben und verifiziert. In `e3d326e..501d068` gibt es keine Regression ab „mittel“. **Freigegeben.** Die drei niedrigen Befunde können vor dem Merge mitgenommen werden, sie blockieren aber nicht.

### Umsetzung Re-Review (Amelia)

| ID | Ergebnis | Umsetzung |
|---|---|---|
| RR21-01 | behoben | Sonnenwahl-Befehle werden nie wegen offener Befehle verworfen; die zuletzt gewählte Stufe wird angezeigt. |
| RR21-02 | behoben | Abnahme nennt 342 Tests. |
| RR21-03 | behoben | Komponenteninventar nennt „Standby 3,0 W“. |
