---
title: UX-Designspezifikation IoT-Haus 2.0 (Einstieg)
status: final
created: 2026-09-26
updated: 2026-09-26
owner: Sally (BMAD UX), headless
sources:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/prd-addendum.md
  - _bmad-output/planning-artifacts/prd-decision-log.md
spines:
  design: _bmad-output/planning-artifacts/ux-designs/ux-iot-haus-2026-09-26/DESIGN.md
  experience: _bmad-output/planning-artifacts/ux-designs/ux-iot-haus-2026-09-26/EXPERIENCE.md
  decision_log: _bmad-output/planning-artifacts/ux-designs/ux-iot-haus-2026-09-26/.decision-log.md
---

# UX-Designspezifikation IoT-Haus 2.0 – Einstieg

Die UX-Spezifikation besteht aus zwei gleichrangigen, verbindlichen Dokumenten (Skill `bmad-ux`):

- **[DESIGN.md](ux-designs/ux-iot-haus-2026-09-26/DESIGN.md)** – *wie es aussieht*: Farb-Tokens Hell/Dunkel mit gemessenen Kontrasten, Typografie, Raster, Formen, visuelle Bausteine, Do's & Don'ts.
- **[EXPERIENCE.md](ux-designs/ux-iot-haus-2026-09-26/EXPERIENCE.md)** – *wie es funktioniert*: Seitenaufbau mit Wireframes (360 px, 1440 px), vollständiger deutscher Microcopy-Katalog, Verhalten aller Bausteine, Verbindungs-Zustandsautomat, Live-Verbrauch und Änderungsmeldungen, Motion inkl. reduzierter Bewegung, Tastatur und Screenreader, Responsive-Regeln, Key Flows UJ-1 bis UJ-5, Implementierungsleitplanken.
- **[Entscheidungsprotokoll](ux-designs/ux-iot-haus-2026-09-26/.decision-log.md)** – UX-01 bis UX-30 mit Begründung.

Bei Widerspruch gilt: PRD > Spines > diese Einstiegsseite.

## Abdeckung PRD → UX

| PRD | Thema | UX-Stelle |
|---|---|---|
| FR-1, FR-26 | 6 Räume, Hausansicht | EXPERIENCE → Component Patterns „Hausansicht“; DESIGN → Components „Hausansicht“; UX-03, UX-04 |
| FR-2 | Symbol je Gerät | DESIGN → Components „Symbole“ (Symbolnamen für das Katalogfeld `symbol`) |
| FR-3, FR-21 | Schalten, sofortige Rückmeldung | EXPERIENCE → „Schalt-Ablauf Einzelgerät“; UX-05, UX-11, UX-12 |
| FR-4 | Grundlast-Dialog | EXPERIENCE → „Grundlast-Dialog“; Microcopy `dialog.grundlast.*`; UX-16 |
| FR-5 | Auto-Aus-Restzeit | EXPERIENCE → „Auto-Aus-Anzeige“; DESIGN → „Gerätezeile“ |
| FR-6, FR-9, FR-12 | Hausverbrauch, Kosten, Laststufe (sticky) | EXPERIENCE → „Kopfbereich“, „Live-Verbrauch“; DESIGN → „App-Kopf“, „Hero-Zahl“, „Laststufen-Pille“; UX-06 |
| FR-7 | Raumverbrauch, Verbrauch nach Raum | EXPERIENCE → „Raumkarte“, „Verbrauch nach Raum“; UX-28 |
| FR-8 | Geräteleistung | EXPERIENCE → State Patterns „Gerätezeile“; DESIGN → Tokens `ink-muted` (≥ 4,5:1) |
| FR-10, FR-13 | Heute-Werte, Standby | EXPERIENCE → „Übersichtsbereich“; UX-20 |
| FR-11 | Änderungsmeldung + Ansage | EXPERIENCE → „Live-Verbrauch und Änderungsmeldungen“, „Toast-Stapel“, „Live-Region“; UX-09, UX-15, UX-26 |
| FR-14–FR-17, FR-19 | Serverautorität, Snapshot, Verteilung | EXPERIENCE → Foundation, Ladezustand, UX-14, UX-19 |
| FR-18 | Versionsabgleich | EXPERIENCE → Zustand „Veraltet“, `banner.version.*` |
| FR-20 | Verbindungsstatus, Wiederverbindung | EXPERIENCE → „Verbindungs-Zustandsautomat“; UX-08, UX-13 (schließt Review L-12) |
| FR-22–FR-24 | Szenen | EXPERIENCE → „Szenen-Schaltfläche“; UX-10, UX-24, UX-25 |
| FR-25 | Seitenaufbau, Sprunglink, 360/1024 px | EXPERIENCE → Information Architecture, Wireframes, Responsive; UX-07 |
| FR-27 | Raumkarte, Switch-Semantik | EXPERIENCE → „Raumkarte“, „Gerätezeile + Schalter“, Accessibility Floor |
| FR-28 | Hell/Dunkel/System | DESIGN → Colors; EXPERIENCE → „Theme-Wahl“, Leitplanken; UX-21 |
| FR-29 | Deutsch, Formate, Titel | EXPERIENCE → Microcopy-Katalog |
| FR-30–FR-35 | Betrieb, CI, Doku, Aufräumen | ohne UI; Berührungspunkte in UJ-5 (Fußzeile, Versions-Banner); Aufräumen alter Komponenten in Leitplanken |
| NFR-1 | 100 ms, CLS, 200 kB | EXPERIENCE → Motion (nur transform/opacity), Leitplanken „Performance“; DESIGN → `tabular-nums`, feste Mindestbreite |
| NFR-2 | WCAG 2.2 AA | DESIGN → Kontrasttabellen; EXPERIENCE → Accessibility Floor, reduzierte Bewegung |
| NFR-3 | 360/768/1024/1440 px | EXPERIENCE → Responsive & Platform |
| NFR-10 | Abnahme-Checkliste | EXPERIENCE → Key Flows und Accessibility Floor liefern die Prüfschritte |

Offene Fragen: keine.
