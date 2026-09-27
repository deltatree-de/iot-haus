---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: final
date: 2026-09-26
updated: 2026-09-27
changeProposal: _bmad-output/planning-artifacts/sprint-change-proposal-2026-09-27.md
project: iot-haus
assessor: 'John (BMAD PM), headless'
documentsIncluded:
  prd:
    - _bmad-output/planning-artifacts/prd.md
    - _bmad-output/planning-artifacts/prd-addendum.md
    - _bmad-output/planning-artifacts/prd-decision-log.md
  architecture:
    - _bmad-output/planning-artifacts/architecture.md
  epics:
    - _bmad-output/planning-artifacts/epics.md
  ux:
    - _bmad-output/planning-artifacts/ux-design-specification.md
    - _bmad-output/planning-artifacts/ux-designs/ux-iot-haus-2026-09-26/DESIGN.md
    - _bmad-output/planning-artifacts/ux-designs/ux-iot-haus-2026-09-26/EXPERIENCE.md
    - _bmad-output/planning-artifacts/ux-designs/ux-iot-haus-2026-09-26/.decision-log.md
---

# Implementation Readiness Assessment Report

**Date:** 2026-09-26
**Project:** iot-haus (Release 2.0.0 „Best UX ever“)
**Assessor:** John (BMAD PM), headless – alle Menüs mit [C] beantwortet, Stakeholder nicht verfügbar (00-auftrag.md)

> **Für die Entwicklung zuerst lesen:** Abschnitt [Konfliktauflösung](#konfliktauflösung) (K-01 bis K-31, inkl. [Fortschreibung 2.1](#fortschreibung-21-2026-09-27)). Er ist **verbindlich** und geht bei Widersprüchen allen anderen Planungsartefakten vor. Die Stories in `epics.md` sind bereits danach formuliert.

## 1. Document Discovery

| Typ | Datei(en) | Form | Befund |
|---|---|---|---|
| PRD | `prd.md` (48,7 KB) + `prd-addendum.md` + `prd-decision-log.md` (+ `prd-review-rubric.md`, nur Review-Hilfe) | ganz | vollständig, `status: final` |
| Architektur | `architecture.md` (61,4 KB) | ganz | vollständig, `status: complete`, READY FOR IMPLEMENTATION |
| Epics & Stories | `epics.md` | ganz | in diesem Lauf erstellt (7 Epics, 34 Stories) |
| UX | `ux-design-specification.md` (Einstieg) + Spines `DESIGN.md`, `EXPERIENCE.md`, `.decision-log.md` | Einstieg + Ordner | vollständig, `status: final` |
| Kontext | `00-auftrag.md`, `01-analyse-befunde.md` | ganz | Spielregeln und Ist-Analyse |

- **Duplikate:** keine (kein Dokument liegt zugleich ganz und geshardet vor). `ux-design-specification.md` ist nur ein Verweis-Einstieg auf die Spines, kein Duplikat.
- **Fehlende Dokumente:** keine. `project-context.md` existiert nicht (optional).
- **Hinweis Parallelbetrieb:** Die Umsetzung läuft bereits (`src/domain/*`, `server/*`, `src/ui/farbtokens.ts`, `src/ui/themeSkript.ts`, `tsconfig.server.json`, `vitest.config.mts`). Diese Dateien wurden nur gelesen, um die Konfliktauflösung am realen Stand auszurichten; nichts wurde verändert.

## 2. PRD Analysis

### Functional Requirements

35 FR (FR-1 bis FR-35) in 6 Feature-Gruppen; vollständiger Wortlaut in `epics.md` → „Requirements Inventory“ (1:1 aus PRD §4 extrahiert):

| Gruppe | FR |
|---|---|
| Haus und Gerätekatalog | FR-1 Hausmodell 6 Räume · FR-2 Katalog 28 Geräte · FR-3 Gerät schalten · FR-4 Grundlast schützen · FR-5 Auto-Aus |
| Live-Verbrauch und Kosten | FR-6 Hausverbrauch live · FR-7 Raumverbrauch · FR-8 Geräteleistung · FR-9 Kosten/h · FR-10 Tagesverbrauch · FR-11 Änderungsmeldung · FR-12 Laststufe · FR-13 Standby-Anteil |
| Echtzeit/Autorität | FR-14 Server autoritativ · FR-15 Snapshot · FR-16 Verteilung · FR-17 Neustartfest · FR-18 Befehle prüfen/Version · FR-19 Gleichzeitigkeit · FR-20 Verbindungsstatus · FR-21 Sofortige Rückmeldung |
| Szenen | FR-22 Szene ausführen · FR-23 Definitionen · FR-24 Grundlast in Szenen |
| Bedienoberfläche | FR-25 Seitenaufbau · FR-26 Hausansicht · FR-27 Raumkarte · FR-28 Hell/Dunkel · FR-29 Deutsch/Formate |
| Betrieb/Auslieferung | FR-30 Health · FR-31 Healthcheck ohne curl · FR-32 CI · FR-33 Release 2.0.0 · FR-34 Doku · FR-35 Aufräumen |

**Total FRs: 35**

### Non-Functional Requirements

NFR-1 Performance · NFR-2 Barrierefreiheit WCAG 2.2 AA · NFR-3 Responsivität · NFR-4 Sicherheit · NFR-5 Zuverlässigkeit · NFR-6 Wartbarkeit · NFR-7 Beobachtbarkeit · NFR-8 Browserunterstützung · NFR-9 Betriebskompatibilität · NFR-10 Abnahme-Checkliste.

**Total NFRs: 10**

### Additional Requirements

- Spielregeln (00-auftrag): nichts vertagen, alles Deutsch, Härtung aus PR #1/#2 bleibt, Prod = Push auf main.
- Erfolgskennzahlen SM-1 bis SM-5 und Gegenkennzahlen SM-C1 bis SM-C4 (u. a. Testlaufzeit ≤ 60 s).
- Bewusst nicht Teil des Produkts (PRD §6): u. a. keine echte Hardware, kein Login, kein Szenen-Editor, keine Historie, keine PWA, kein Browser-E2E.
- Addendum A-1 bis A-8 (von der Architektur präzisiert, Abweichungen in AD-01 bis AD-22 protokolliert).

### PRD Completeness Assessment

Das PRD ist vollständig, testbar formuliert (jede FR mit „Konsequenzen (testbar)“), ohne offene Fragen und ohne vertagte Punkte. Kontrollsummen in Anhang A wurden stichprobenartig nachgerechnet (Ausgangszustand 75,3 W, Standby 10,3 W, Morgenroutine +5.532 W → 5.607 W, UJ-2 Wohnzimmer 270,5 W → „271 W“, Mikrowelle-Ansage 1.273,8 W → „1.274 Watt“, Gute Nacht 80,3 W → „80 W“) – alle stimmig. Einzige Unschärfen sind die in der Konfliktauflösung behandelten Punkte K-14 und K-27.

## 3. Epic Coverage Validation

### Coverage Matrix

| FR | Epic-Abdeckung (Stories) | Status |
|---|---|---|
| FR-1 | 1.1, 5.6 | ✓ |
| FR-2 | 1.1, 1.6 | ✓ |
| FR-3 | 1.3, 2.3, 5.1 | ✓ |
| FR-4 | 1.1, 1.3, 5.3 | ✓ |
| FR-5 | 2.3, 5.2, 4.5 (Meldung) | ✓ |
| FR-6 | 1.2, 4.4 | ✓ |
| FR-7 | 1.2, 5.1, 5.6 | ✓ |
| FR-8 | 5.1 | ✓ |
| FR-9 | 1.2, 2.1, 4.4 | ✓ |
| FR-10 | 1.4, 2.2, 2.3, 2.5, 4.4 | ✓ |
| FR-11 | 4.2, 4.5 | ✓ |
| FR-12 | 1.2, 4.4 | ✓ |
| FR-13 | 1.2, 4.4 | ✓ |
| FR-14 | 2.4, 4.1, 4.2 | ✓ |
| FR-15 | 2.4, 4.3 | ✓ |
| FR-16 | 2.4, 2.6, 5.4 | ✓ |
| FR-17 | 2.2, 2.6, 3.1, 3.3, 6.2 | ✓ |
| FR-18 | 1.3, 2.4, 2.6, 4.2, 4.6 | ✓ |
| FR-19 | 2.3, 2.6 | ✓ |
| FR-20 | 4.2, 4.6 | ✓ |
| FR-21 | 4.2, 5.1 | ✓ |
| FR-22 | 1.3, 5.5 | ✓ |
| FR-23 | 1.3, 5.5 | ✓ |
| FR-24 | 1.3 | ✓ |
| FR-25 | 4.3, 4.4, 5.6 | ✓ |
| FR-26 | 5.6 | ✓ |
| FR-27 | 5.1, 5.4 | ✓ |
| FR-28 | 4.1, 4.4 | ✓ |
| FR-29 | 1.5, 4.1, 4.3, 7.1 | ✓ |
| FR-30 | 2.5 | ✓ |
| FR-31 | 3.2, 6.2 | ✓ |
| FR-32 | 6.1 | ✓ |
| FR-33 | 1.6, 6.3 | ✓ |
| FR-34 | 7.2 | ✓ |
| FR-35 | 1.6, 2.1, 2.4, 4.3, 7.1 | ✓ |

NFR-Abdeckung: NFR-1 (2.6, 4.4, 5.1, 6.1), NFR-2 (4.1, 4.3–5.6, 5.7, 7.3), NFR-3 (5.6, 5.7, 7.3), NFR-4 (1.6, 2.4, 3.1, 6.1, 6.2), NFR-5 (2.5, 2.6), NFR-6 (Epic 1, 2.6, Komponententests in 4.x/5.x), NFR-7 (2.1, 2.3, 2.4), NFR-8 (4.2, 5.3, 7.3), NFR-9 (2.1, 3.1, 3.2, 6.3, 7.2), NFR-10 (7.3). UX-DR1 bis UX-DR31 sind alle mindestens einer Story zugeordnet (Tabelle in `epics.md`).

### Missing Requirements

Keine. Es gibt auch keine Stories mit Anforderungen, die nicht im PRD, in der Architektur oder in der UX-Spezifikation stehen.

### Coverage Statistics

- Total PRD FRs: 35
- FRs covered in epics: 35
- Coverage percentage: **100 %** (NFR 10/10, UX-DR 31/31)

## 4. UX Alignment Assessment

### UX Document Status

Gefunden: Einstieg `ux-design-specification.md` + zwei verbindliche Spines (`DESIGN.md` = Aussehen, `EXPERIENCE.md` = Verhalten) + Entscheidungsprotokoll UX-01 bis UX-30. Alle 5 User Journeys des PRD sind als Key Flows abgebildet; die FR→UX-Abdeckungsmatrix der UX deckt FR-1 bis FR-35 und NFR-1/2/3/10 ab.

### Alignment Issues

**UX ↔ PRD:** Inhaltlich deckungsgleich; alle PRD-Texte (FR-4, FR-10, FR-11, FR-18, FR-20, FR-21, FR-29) stehen wortgleich im Microcopy-Katalog. Die UX ergänzt Details, die das PRD offenlässt (Fehlertexte für Szene/Raum, „±0 W“, Singular „1 Gerät an“, Toast-Pause bei Hover, Erstfehler-Zustand) – alle als Ergänzung angenommen (K-15, K-16, K-22, K-24, K-29). Ein echter Widerspruch betrifft die Ansage-Logik der Architektur (K-09, PRD gewinnt).

**UX ↔ Architektur:** Die Architektur (erstellt vor Abschluss der UX, §6.2: „UX-Details liegen beim UX-Spec“) und die UX benennen Dateien, Komponenten, Hooks, Theme-Attribute und den Speicher-Schlüssel unterschiedlich. Das ist die Hauptquelle der Konflikte (K-01 bis K-12, K-23, K-26, K-28, K-30). Architektonisch unterstützt ist jede UX-Anforderung: keine neue Laufzeitabhängigkeit nötig (natives `<dialog>`, Inline-SVG, rAF), JS-Budget 200 kB realistisch, alle Farbpaare erfüllen WCAG (nachgerechnet, siehe K-05).

### Warnings

- Keine fehlende UX. Die UX nennt ihre Dateinamen ausdrücklich „empfohlen (Architektur darf abweichen)“ – die Auflösung folgt dieser Vorgabe.

## Konfliktauflösung

**Rangfolge (verbindlich):** PRD (Was/Werte/Texte aus FR) > Architektur (Dateien, Modulgrenzen, Namen, Protokoll, Technik) > UX-Spines (Aussehen, Verhalten, Microcopy, soweit Architektur nichts festlegt) > Addendum. Wo der bereits umgesetzte Code einer der zulässigen Varianten entspricht, wurde diese gewählt, um Nacharbeit zu vermeiden.

| ID | Konflikt | Quellen | Verbindliche Auflösung |
|---|---|---|---|
| **K-01** | Datei und Form der Farb-Tokens | UX: `src/ui/tokens.ts`, Exporte `hell`/`dunkel`; Arch §3.8/AD-15: `src/ui/farbtokens.ts` | Datei **`src/ui/farbtokens.ts`** (Arch). Exporte `TOKEN_NAMEN`, `HELL`, `DUNKEL`, `KONTRAST_PAARE` (wie umgesetzt). **Werte** = exakt DESIGN.md-Frontmatter, 34 Rollen je Theme; kein Wert darf abweichen. **2.1:** 36 Rollen je Theme (+ `solar`, `solar-soft`). |
| **K-02** | Wert des Theme-Attributs | UX: `[data-theme="dark"]`; Arch: `hell`/`dunkel` | **`data-theme="hell"` / `data-theme="dunkel"`** auf `<html>`. Tailwind: `@custom-variant dark (&:where([data-theme=dunkel], [data-theme=dunkel] *));` Kein `light`/`dark`. |
| **K-03** | Namen der CSS-Variablen | UX: `--c-<name>`; Arch: nicht festgelegt | **`--c-‹rolle›`** (z. B. `--c-ink-muted`), per `<style>` im Layout aus `farbtokens.ts` erzeugt; Tailwind-Mapping `@theme inline { --color-‹rolle›: var(--c-‹rolle›) }`. Motion-Variablen `--m-*` (UX). |
| **K-04** | localStorage-Schlüssel für die Darstellung | UX-21: `iot-haus-darstellung`; Arch §3.4: `iot-haus.theme` | **`iot-haus.theme`** mit Werten `system`/`hell`/`dunkel` (Arch, einziger Browser-Schlüssel). Altschlüssel `smart-home-state` wird im Theme-Skript gelöscht. |
| **K-05** | Umfang des Kontrasttests | UX: „mindestens die Paare der DESIGN.md-Tabellen“; Arch: „Liste der Paare in farbtokens.ts“ | `KONTRAST_PAARE` enthält **mindestens alle Paare aller DESIGN.md-Kontrasttabellen** (Flächen/Text, Akzent, Schalter/Fokus/Primär/Fehler, Laststufen, Delta, Banner, Hausansicht) mit Soll 4,5 bzw. 3, geprüft in beiden Themes. Nachgerechnet am 2026-09-26: alle Paare bestehen (niedrigster UI-Wert `on`/`room-lit` hell 4,03:1 ≥ 3; niedrigster Textwert `ink-muted`/`surface-sunken` hell 4,75:1). **2.1:** + 10 Paare aus Proposal §5.4.6 (`solar`/`solar-soft` u. a.), alle bestehen. |
| **K-06** | Komponenten-Namen und -Schnitt | UX „Bausteine“ vs. Arch §3.8/§5.1 | **Dateinamen nach Architektur §5.1**, Verhalten/Aussehen nach UX. Abbildung: `SkipLink`→**`Sprunglink`**; `Hausverbrauch`→**`Zaehler`** (im `Kopfbereich`, mit UX-Struktur sr-only-Zielwert + `aria-hidden`-Zahl); `Laststufe`→**`LaststufePille`**; `Verbindungsstatus`→**`VerbindungsStatus`**; `SzenenLeiste`→**`Szenenleiste`** + **`SzenenKnopf`**; `GeraetSchalter`→**`GeraeteZeile`** + **`Schalter`** (siehe K-07); `Ansager`→**`LiveRegion`**; `Banner`→**`VerbindungsBanner`** + **`VersionsBanner`** (gemeinsame Optik, siehe K-23); `Icon`→**`Symbol`**. **Zusätzlich neu** (in Arch fehlend, von UX verlangt): **`DeltaChip.tsx`**, **`Fusszeile.tsx`**, **`src/ui/texte.ts`**, **`src/hooks/useSekundentakt.ts`**. Das Erstfehler-Hinweisfeld rendert `Skeleton` (Prop). `RaumAusKnopf`, `InfoHinweis`, `ThemeWahl`, `Uebersicht`, `RaumFlaeche`, `VerbrauchNachRaum`, `Meldungen`, `GrundlastDialog` wie Arch. **2.1:** neu `NetzZeile`, `Solaranlage`, `SonnenWahl`, `Elektroauto`, `CarportFlaeche`. |
| **K-07** | Struktur Gerätezeile/Schalter | Arch: `GeraeteZeile → Schalter`, Komponententest „Schalter (role/aria)“; UX-05: ganze Zeile ist der Switch | **Die ganze `GeraeteZeile` ist ein `<button role="switch" aria-checked>`** (UX, erfüllt FR-27 „ganze Zeile ist Trefferfläche“). `Schalter.tsx` ist rein visuell und `aria-hidden`. Der Arch-Komponententest „Schalter“ prüft Rolle/ARIA an der `GeraeteZeile`. |
| **K-08** | Hook-Namen und Sekundentakt | UX: `useZaehler`, `useSekundentakt`; Arch: `useHochzaehlen`, `useRestzeit` | **`useHochzaehlen(ziel, 600)`** und **`useRestzeit(seit, dauerS)`** (Arch). `useRestzeit` und der Banner-Countdown nutzen **einen** gemeinsamen, neuen **`useSekundentakt()`** (UX-Forderung „ein Takt für die Seite“), der nur tickt, solange ein Abonnent aktiv ist. |
| **K-09** | Sammelfenster der Screenreader-Ansage | Arch §3.8 `useAnsage`: „erste Änderung sofort, weitere ersetzen den ausstehenden Eintrag“; PRD FR-11 + UX + UJ-4-Randfall: „nur die letzte wird angesagt“ | **PRD gewinnt.** Mit der ersten Änderung startet ein 2-s-Fenster; jede weitere Änderung im Fenster ersetzt den ausstehenden Text; **am Fensterende wird nur der letzte Text angesagt**. Fehler, „keine Änderung nötig“ und „Verbindung wiederhergestellt.“ werden sofort angesagt. (Die Arch-Variante würde im UJ-4-Randfall zusätzlich „Mikrowelle an …“ ansagen.) |
| **K-10** | ARIA-Struktur der Hausansicht | Arch: `<section aria-label="Hausansicht">`; UX: `<section aria-labelledby>` mit h2 + `div role="group" aria-label="Hausansicht"` + Etagengruppen | **UX-Struktur** (erfüllt FR-26 „zugänglicher Name Hausansicht“ und liefert zusätzlich die Etagen): h2 „Hausansicht“, Gruppe „Hausansicht“, Gruppen „Obergeschoss“/„Erdgeschoss“, OG vor EG. Architekturentscheidung AD-12 (HTML-Raster aus Buttons) bleibt. |
| **K-11** | Symbolnamen der Geräte | UX: `lampe` für alle Lampen, `trockner`; umgesetzter Katalog: `deckenlampe`, `stehlampe`, `nachttischlampe`, `spiegelleuchte`, `schreibtischlampe`, `waeschetrockner` | **Der umgesetzte Typ `SymbolName` in `src/domain/katalog.ts` ist verbindlich** (22 Gerätesymbole). `Symbol` muss jeden Wert rendern; die fünf Lampen dürfen dieselbe Zeichnung teilen. UI-Symbole wie in UX (haus, verbunden, …, haekchen). |
| **K-12** | `apple-touch-icon` | UX-30: echte PNG 180 × 180; Arch §3.8: kaputten PNG-Link entfernen, `apple-touch-icon.svg` bleibt | **Arch gewinnt:** der Link auf die nicht existierende PNG entfällt, es wird kein neues Binär-Asset erzeugt; `appleWebApp.title: "IoT-Haus"` bleibt (UX). Begründung: kein PRD-Bestandteil, vermeidet Bild-Pipeline; der 404 (Befund U-10) ist damit behoben. |
| **K-13** | Quelle und Wortlaut der Texte | UX: Microcopy-Katalog in `src/ui/texte.ts`; Arch: „UI-Texte aus Katalog zusammengesetzt“; PRD: Einzeltexte in FR | **`src/ui/texte.ts`** enthält den **vollständigen Microcopy-Katalog aus EXPERIENCE.md** (Schlüssel dort); Geräte-, Raum- und Szenennamen kommen aus dem Katalog. PRD-Wortlaute haben Vorrang; sie sind im Katalog wortgleich enthalten (Grundlast-Dialog = PRD-Satz, aufgeteilt in Titel „‹Gerät› wirklich ausschalten?“ und Text „Es ist ein Grundlastgerät und läuft normalerweise dauerhaft.“). Zeichen: „…“ (U+2026) mit Leerzeichen davor („Verbinde …“), Minus U+2212, schmales geschütztes Leerzeichen U+202F vor Einheiten. |
| **K-14** | Inhalt des sticky Kopfbereichs | PRD §4.5-Beschreibung nennt Tageswerte und Theme-Wahl im Kopf; PRD FR-6 legt sie in den Übersichtsbereich | **FR-6 gewinnt** (spezifischer, testbar): sticky nur Hausverbrauch, Laststufe, Kosten/h, Verbindungsstatus (+ Marke, siehe K-19); Standby, Tageswerte, Strompreis, Theme im mitscrollenden Übersichtsbereich. **2.1:** zusätzlich Netz-Zeile (nur Werte); Sonnenwahl **nicht** im Kopf. |
| **K-15** | Fehlertexte für Szene und Raum | PRD FR-21 definiert nur „‹Gerät› konnte nicht geschaltet werden …“ | UX-Texte übernommen: „‹Szene› konnte nicht ausgeführt werden. Bitte erneut versuchen.“, „‹Raum› konnte nicht ausgeschaltet werden. Bitte erneut versuchen.“; nur im auslösenden Client. |
| **K-16** | Erstfehler / Snapshot-Zeitlimit | UX: Erstfehler nach 5 s ohne Snapshot; Arch-Transport kennt kein Snapshot-Zeitlimit | `HausVerbindung` schließt die Verbindung, wenn **5 s nach dem Öffnen kein Snapshot** kam, und geht in den Backoff. Solange noch nie ein Snapshot da war, zeigt die App Skeleton + Hinweisfeld „Keine Verbindung zum Haus“ + Getrennt-Banner; beim normalen Start kein Banner. |
| **K-17** | `theme-color` | PRD FR-28 ohne Werte; UX: Kopffläche | Hell **`#FFFFFF`**, Dunkel **`#131C2E`**; gesetzt durch das Theme-Skript, `viewport` ohne `themeColor`. |
| **K-18** | Healthcheck-Intervall | Addendum A-6: 30 s; Arch AD-14: 10 s | **Arch:** `--interval=10s --timeout=5s --start-period=20s --retries=3`. |
| **K-19** | Marke und Delta-Chip im sticky Kopf | FR-6 „fest sichtbar sind nur …“; UX: h1 „IoT-Haus“ und Delta-Chip im Kopf | **Erlaubt.** Marke (h1, Landmarke) und der `aria-hidden` Delta-Chip sind weder Werte noch Bedienelemente; die FR-6-Absicht (keine weiteren Werte/Bedienelemente im Kopf) bleibt erfüllt. |
| **K-20** | Health-Antwort bei verbundenem Broker, aber laufender Wiederherstellung | PRD FR-30 kennt nur verbunden → 200 / getrennt → 503; Arch AD-17: 200 nur wenn verbunden **und** bereit | **Arch:** 503 `{ status: "fehler", mqtt: "verbunden", version }` solange der Restore läuft; sonst wie PRD. |
| **K-21** | Broker in Tests | Addendum A-5/FR-32: Mosquitto-Service-Container; Arch AD-10: aedes in-process | **Arch:** aedes im Testprozess (erfüllt „in der CI gestarteter Broker“); echtes Mosquitto wird im CI-Job `container` am gebauten Image geprüft. |
| **K-22** | Zugänglicher Name eines Raums bei n = 1 | PRD FR-26: „‹n› Geräte an“ | UX-Ergänzung übernommen: bei n = 1 „1 Gerät an“, sonst „‹n› Geräte an“. |
| **K-23** | Platz der Banner | Arch-Komponentenbaum: Banner direkt nach dem Sprunglink; UX-08: fest am unteren Rand, in der Tab-Reihenfolge zuletzt | **UX:** Banner im Überlagerungsbereich nach der Fußzeile, `position: fixed` unten, `role="status"`, max. eines (Version vor Getrennt). Tab-Reihenfolge endet mit Toast-Schließen-Knöpfen und Banner-Aktion. |
| **K-24** | Sichtbarkeitsdauer der Meldungen | PRD FR-11: 4 s; UX-26: Timer pausiert bei Hover/Fokus | Beide gelten: 4 s **reine** Sichtzeit, pausiert während Zeiger-Hover oder Fokus in der Meldung (WCAG 2.2.1). |
| **K-25** | „Anzahl an“ und Grundlast | PRD FR-7 unbestimmt; UX-Beispiel „0 von 5 an“ mit Zusatz „Grundlastgeräte zählen mit“ | Grundlastgeräte **zählen** bei „n an“/„n von m an“ und im zugänglichen Raumnamen mit (Küche im Ausgangszustand: „EG · 1 von 7 an“). „Raum ausschalten“ ist dagegen nur aktiv, wenn ein **Nicht**-Grundlastgerät an ist. **2.1:** Carport zählt als Raum („Außen · 1 von 1 an“); „Raum ausschalten“ entfällt dort. |
| **K-26** | Optimistische Anzeige bei Szenen/Raum | Arch-`ausstehend` hat für alle Arten ein `ziel`; UX-10: keine optimistische Geräteänderung für Szenen und „Raum ausschalten“ | **UX:** `ausstehend`-Einträge für `szene`/`raumAus` haben ein **leeres `ziel`**; nur die auslösende Schaltfläche ist `aria-busy`. Optimistisch ist nur der Einzelschalter (FR-21). |
| **K-27** | Strompreis-Variable fehlt oder ist leer | PRD FR-9: „fehlende Werte → 0,35 und Warnung“; Arch §7: „leer → 0,35 + Logzeile“ | Nicht gesetzt oder leer → 0,35 mit **INFO**-Zeile `strompreis quelle=standard` (normaler Standardfall, keine Warnung im Dauerbetrieb); ungültig (z. B. `abc`, `0,32`) oder negativ → 0,35 mit **WARN** `strompreis_ungueltig`; `0` ist gültig. Entspricht dem umgesetzten `server/konfig.ts`. |
| **K-28** | Countdown „Nächster Versuch in n s“ | UX verlangt Countdown; Arch-Transport liefert keinen Zeitpunkt | `HausVerbindung` stellt **`naechsterVersuchUm`** (ms epoch) bereit; der Banner rechnet mit `useSekundentakt`. |
| **K-29** | Vorzeichen und Null-Differenz | PRD FR-11: „mit Vorzeichen“; UX-15: „±0 W“ | „+“ für Zunahme, „−“ (U+2212) für Abnahme, **„±0 W“** wenn die gerundete Differenz 0 ist, aber Geräte geändert wurden (dann kein Delta-Chip, keine Zählanimation). |
| **K-30** | Snapshot nach Wiederverbindung | Arch: „Snapshot ersetzt `server` vollständig“; UX-14: ohne Animation, Toasts, Impulse | Beide: vollständiger Ersatz **ohne** Zählanimation, Delta-Chip, Toasts oder Impulse; nur die Live-Region sagt „Verbindung wiederhergestellt.“ |
| **K-31** | Bezugsgröße von Laststufe/Delta mit Solaranlage (2.1) | Proposal §5.2/§5.4: Hero Hausverbrauch vs. neue Netzbilanz | Laststufe und Delta-Chip bleiben am **Hausverbrauch**; die Netzbilanz hat keinen eigenen Chip und keine Zählanimation (E-19). |

Diese Tabelle ersetzt keine Planungsdokumente, sondern ist die eine eindeutige Antwort bei Widersprüchen. Neue Widersprüche, die in der Umsetzung auffallen, werden per `bmad-correct-course` ergänzt (neue K-Nummer), nicht stillschweigend entschieden.

### Fortschreibung 2.1 (2026-09-27)

Auslöser: `sprint-change-proposal-2026-09-27.md` (Elektroauto & Solaranlage, Epic 8). Die folgenden Auflösungen ergänzen die obigen Einträge (dort jeweils mit „**2.1:**“ vermerkt) und sind ebenso verbindlich.

| ID | Fortschreibung |
|---|---|
| K-01 | 36 Rollen je Theme (+ `solar`, `solar-soft`). |
| K-05 | `KONTRAST_PAARE` + 10 Paare aus Proposal §5.4.6 (niedrigster Wert `solar`/`room-off` hell 4,53:1 ≥ 4,5). |
| K-06 | Neue Komponenten: `NetzZeile`, `Solaranlage`, `SonnenWahl`, `Elektroauto`, `CarportFlaeche`. |
| K-14 | Sticky-Kopf zusätzlich mit Netz-Zeile (Werte, keine Bedienelemente); Sonnenwahl gehört **nicht** in den Kopf. Kopfhöhe mobil 136 px (21 %). |
| K-25 | Carport zählt als Raum („Außen · 1 von 1 an“); „Raum ausschalten“ entfällt dort (E-12). |
| K-31 (neu) | Laststufe und Delta-Chip bleiben am Hausverbrauch, die Netzbilanz hat keinen eigenen Chip und keine Zählanimation (E-19). |

Readiness für Epic 8: **READY** (FR-36 … FR-44 und die geänderten FR sind in Epic 8 abgedeckt; Architektur §3.12, AD-23 … AD-27).

## 5. Epic Quality Review

### Epic-Struktur

| Epic | Nutzerwert | Unabhängigkeit | Bewertung |
|---|---|---|---|
| 1 Gemeinsames Hausmodell | indirekt: richtige Zahlen (SM-5); Grundlage aller Anzeigen | steht allein (reine Domäne + Werkzeuge) | 🟡 grenzwertig technisch, akzeptiert: Architektur §2/§3.11 verlangt die Domäne als ersten Schritt (Brownfield, kein Starter-Template) |
| 2 Ein Hauszustand für alle | direkt: behebt Überschreib-Bug (SM-1) | nutzt nur Epic 1 | ✔ |
| 3 Betrieb im Container | Betreiber-Wert (UJ-5) | nutzt Epic 1–2 | 🟡 Betreiber-Epic, akzeptiert (Betreiber ist PRD-Persona) |
| 4 Live-Verbrauch auf einen Blick | direkt (Kern des Auftrags) | nutzt Epic 1–2 | ✔ |
| 5 Geräte, Räume, Szenen bedienen | direkt | nutzt Epic 1–4 | ✔ |
| 6 Automatisch geprüft und ausgeliefert | Betreiber-Wert (SM-3) | nutzt Epic 1–5 (Scripts, Build, Smoke) | 🟡 Betreiber-Epic, akzeptiert |
| 7 Aufgeräumt, dokumentiert, abgenommen | Betreiber/Entwicklung, Abnahme | nutzt alles davor | ✔ |

### Findings nach Schwere

#### 🔴 Critical Violations

Keine. Keine Vorwärtsabhängigkeit, keine epicgroße Story, keine fehlende FR.

#### 🟠 Major Issues

- **M-1 Übergangslücke zwischen Story 2.5 und 4.3.** Ab dem Ersetzen von `server.js` spricht der Server nur noch das neue Protokoll; die alte Oberfläche ist bis Story 4.3 funktionslos. *Bewertung:* akzeptiert, weil zwischen diesen Stories kein Release erfolgt (Auslieferung ausschließlich über Epic 6 nach Push auf main). *Auflage:* Bis Epic 6 abgeschlossen ist, wird **nicht** auf `main` gemergt bzw. nur als ein Gesamt-PR; die Feature-Branch-Arbeit (`feature/iot-haus-2-energie-geraete`) bleibt bis dahin isoliert.
- **M-2 Paralleler Umsetzungsvorlauf.** Code zu Stories 1.1–1.5, 2.1–2.3 und Teilen von 4.1 existiert, bevor Story-Dateien erstellt sind. *Auflage:* Beim Erstellen der Story-Datei (`bmad-create-story`) wird der vorhandene Code gegen die ACs geprüft; Abweichungen werden in der Story als Aufgaben geführt, nicht durch Neuschreiben.

#### 🟡 Minor Concerns

- **m-1** Story 1.6 (Werkzeugkette) und 2.6 (Integrationstests) sind technisch geschnitten; beide sind klein, klar abgegrenzt und durch Architektur §3.11 bzw. SM-1 begründet.
- **m-2** Story 1.1 enthält den Vitest-Bootstrap, damit Stories 1.1–1.5 testbar sind, ohne auf 1.6 vorzugreifen (bewusste Entscheidung gegen eine Vorwärtsabhängigkeit).
- **m-3** Größte Stories: 2.4 (WS-Protokoll), 4.2 (Verbindung + Reducer), 5.1 (Raumkarte + Gerätezeile), 5.6 (Hausansicht + Verbrauch nach Raum + Layout). Alle sind durch Architektur §3.5/§3.8 und EXPERIENCE vollständig spezifiziert; bei Überlauf in einer Dev-Sitzung per `bmad-correct-course` teilen.
- **m-4** Architektur §5.1 listet `DeltaChip.tsx`, `Fusszeile.tsx`, `texte.ts`, `useSekundentakt.ts` nicht; durch K-06/K-08 legitimiert. Architektur §4.4 („keine weiteren WS-Nachrichtentypen“) ist davon nicht berührt.

### Best-Practice-Checkliste

- [x] Epics liefern Nutzer- bzw. Betreiberwert
- [x] Epic N funktioniert mit Epics 1…N−1
- [x] Stories angemessen groß
- [x] Keine Vorwärtsabhängigkeiten
- [x] Persistenz (Topics) erst bei erstem Bedarf (Story 2.2)
- [x] Given/When/Then-ACs, testbar, inkl. Fehlerfälle
- [x] Rückverfolgbarkeit zu FR/NFR/UX-DR
- [x] Brownfield: Integrations-/Kompatibilitätsstories vorhanden (Protokollwechsel, NFR-9, Upgrade-Hinweis, Altschlüssel, altes Protokoll)

## Summary and Recommendations

### Overall Readiness Status

**READY** – unter der Bedingung, dass die Konfliktauflösung K-01 bis K-31 (inkl. Fortschreibung 2.1) als verbindlich gilt.

### Critical Issues Requiring Immediate Action

Keine kritischen Befunde. Handlungsbedarf besteht nur bei den Auflagen M-1 (nicht vor Abschluss von Epic 6 auf main mergen) und M-2 (vorhandenen Code beim Erstellen der Story-Dateien gegen die ACs prüfen).

### Recommended Next Steps

1. `bmad-sprint-planning` → `_bmad-output/implementation-artifacts/sprint-status.yaml` (in diesem Lauf erledigt).
2. Für Story 1.1 ff. mit `bmad-create-story` Story-Dateien erzeugen; dabei den bereits vorhandenen Code in `src/domain/`, `server/`, `src/ui/` gegen die ACs prüfen (M-2) und die K-Auflösungen in die Dev-Notes übernehmen.
3. Umsetzung strikt in der Reihenfolge aus `epics.md` (= Architektur §3.11); nach jeder Story `npm run lint && npm run typecheck && npm test`.
4. Code-Review je Story mit `bmad-code-review`; Abnahme-Checkliste (Story 7.3) vor dem Merge auf main vollständig ausfüllen.

### Final Note

Diese Prüfung fand **0 kritische, 2 wesentliche und 4 kleinere** Befunde in 2 Kategorien (Epic-Qualität, Parallelbetrieb) sowie **30 Widersprüche** zwischen PRD, Architektur und UX, die alle oben verbindlich aufgelöst sind. FR-Abdeckung 35/35, NFR 10/10, UX-DR 31/31. Die Planung ist umsetzungsbereit.
