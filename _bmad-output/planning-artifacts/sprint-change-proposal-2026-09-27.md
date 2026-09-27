---
title: Sprint Change Proposal – IoT-Haus 2.1.0 „Elektroauto & Solaranlage“
status: final (vom BMAD-Team freigegeben, headless)
date: 2026-09-27
workflow: bmad-correct-course (Modus Batch, nicht interaktiv)
team: John (PM), Sally (UX), Winston (Architekt)
trigger: _bmad-output/planning-artifacts/00-auftrag-2.1.md
baseline: Release 2.0.0 (Merge 033c290), Branch feature/iot-haus-2-1-eauto-solar
inputs:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/planning-artifacts/ux-designs/ux-iot-haus-2026-09-26/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-iot-haus-2026-09-26/EXPERIENCE.md
  - _bmad-output/planning-artifacts/implementation-readiness-report-2026-09-26.md (K-01 … K-30)
  - Code-Stand 033c290: src/domain/*, server/*, src/client/hausReducer.ts, src/components/*, src/ui/texte.ts, src/ui/farbtokens.ts, .github/workflows/ci-release.yml
scope: Moderate (neues Epic 8, Artefakte werden ergänzt, keine Neuplanung bestehender Epics)
---

# Sprint Change Proposal – IoT-Haus 2.1.0 „Elektroauto & Solaranlage“

## 0. Workflow-Protokoll

- **Aktivierung:** `resolve_customization.py` lieferte leere Prepend-/Append-Schritte; `project-context.md` existiert nicht (nichts zu laden). Konfiguration: `user_name` Deltatree, Sprache Deutsch, `user_skill_level` intermediate.
- **Schritt 1 (Initialisierung):** Auslöser ist der neue Stakeholder-Auftrag 2.1 (siehe §1). PRD, Epics, Architektur und UX-Spines liegen vor. **Modus: Batch** (der Stakeholder steht laut Spielregeln nicht zur Verfügung; alle Fragen beantwortet das Team selbst und protokolliert sie in §9).
- **Schritt 2 (Checkliste):** vollständig durchlaufen, Ergebnis in §2.
- **Schritt 3/4 (Änderungsvorschläge, Proposal):** §3 bis §8.
- **Schritt 5 (Freigabe):** Anstelle des Stakeholders hat das BMAD-Team (John, Sally, Winston) den Vorschlag am 2026-09-27 freigegeben. Die Spielregel „Vor dem Merge auf main fragt der Entwickler den Stakeholder per Dialog um Zustimmung“ bleibt davon unberührt.
- **Schritt 6 (Abschluss):** Übergabe in §10.

---

## 1. Issue Summary (Auslöser)

**Wörtlicher Auftrag (2026-09-27):** „baue folgende neue Anforderungen ein: Es soll noch 1 Elektroauto geben (man kann es auch wegfahren lassen). Solaranlage soll es auch geben – mit Einstellung wieviel sonne dass gerade da ist oder eben nicht“.

**Kategorie:** Neue Anforderung des Stakeholders nach Release 2.0.0 (Checkliste 1.2: „New requirement emerged from stakeholders“). Kein Fehler, kein Rückbau.

**Problemstellung:** Das Haus kennt bisher nur Verbraucher und rechnet Kosten als Hausverbrauch × Strompreis. Es fehlen (a) ein großer, mobiler Verbraucher mit eigenem Zustand (Elektroauto, das zu Hause laden oder unterwegs sein kann) und (b) eine Erzeugung (Solaranlage), deren Leistung von einer vom Menschen gewählten Sonnenlage abhängt. Mit (b) gilt die bisherige Kostenformel nicht mehr: Relevant ist der **Netzbezug**, und überschüssiger Strom wird **eingespeist**. PRD §6 schloss „PV-Einspeisung“ ausdrücklich aus – dieser Ausschluss wird mit 2.1 aufgehoben.

**Evidenz / Randbedingungen aus dem Bestand:**
- Katalog, Szenen und Rechenlogik liegen zentral in `src/domain/` (AD-02); jede Zustandsänderung läuft über `Zustandsdienst.aendere()` (Architektur §4.4). Neue Zustände lassen sich dort anschließen, ohne Parallelpfade.
- Protokoll `protokoll.ts` ist streng (exakte Feldmengen, `pruefeBefehl`), Versionsabgleich im Snapshot sperrt alte Tabs (FR-18). Das trägt die Rückwärtskompatibilität.
- Kopfbereich ist auf 116 px und „nur Werte, keine Bedienelemente“ festgelegt (FR-6, K-14, K-19) – die Netzbilanz muss dort hinein, die Sonnenwahl nicht.
- JS First Load aktuell 118 kB (docs/abnahme-2.0.md), Budget 200 kB – genug Luft.

---

## 2. Ergebnis der Change-Navigation-Checkliste

| ID | Punkt | Status | Befund |
|---|---|---|---|
| 1.1 | Auslösende Story | [N/A] | Kein Story-Befund; Auslöser ist `00-auftrag-2.1.md`. |
| 1.2 | Kernproblem | [x] | Neue Stakeholder-Anforderung, siehe §1. |
| 1.3 | Evidenz | [x] | Auftragstext, Code-Stand 033c290, PRD §6 (PV-Ausschluss). |
| 2.1 | Aktuelles Epic | [x] | Epics 1–7 sind abgeschlossen (2.0.0 live) und bleiben gültig. |
| 2.2 | Epic-Änderungen | [x] | Neues **Epic 8 „Elektroauto & Solaranlage“** (§7). |
| 2.3 | Übrige Epics | [x] | Keine Umplanung; einzelne Akzeptanzkriterien aus Epics 1, 4, 5, 7 ändern Zahlen (Kontrollsummen) – über Epic 8 umgesetzt. |
| 2.4 | Neue/obsolete Epics | [x] | Kein Epic obsolet; Epic 8 neu. |
| 2.5 | Reihenfolge | [x] | Epic 8 intern: Domäne → Server → Client-Zustand → UI → Doku/Release (wie Architektur §3.11). |
| 3.1 | PRD-Konflikte | [!] → [x] | FR-1, 2, 4, 6, 9, 10, 11, 15, 17, 18, 23/24, 25, 26, 27, 30, 33, 34, NFR-7, NFR-10, §3, §6, §7, §9, Anhang A betroffen; neue FR-36 … FR-44 (§5.2). |
| 3.2 | Architektur-Konflikte | [!] → [x] | Zustandsmodell, Protokoll, Topics, Zustandsdienst, Konfiguration, Tests (§5.3). |
| 3.3 | UX-Konflikte | [!] → [x] | IA, Kopfbereich, Hausansicht, Raumkarte, neue Bausteine, Microcopy, Tokens (§5.4). |
| 3.4 | Weitere Artefakte | [!] → [x] | README, API.md, DOCKER-SETUP.md, KUBERNETES.md, docs/*, Compose-Dateien, `.github/release-hinweise/v2.1.0.md` (Pflicht für den Release-Job!), `docs/abnahme-2.1.md`, sprint-status.yaml. |
| 4.1 | Option Direkte Anpassung | [x] Tragfähig | Aufwand ~1,5 Entwicklertage, Risiko mittel-niedrig. |
| 4.2 | Option Rückbau | [N/A] | Nichts zurückzubauen. |
| 4.3 | Option MVP-Review | [x] Nicht nötig | Umfang wird durch §6-Ausschlüsse schlank gehalten, nicht durch Streichen des Auftrags. |
| 4.4 | Empfehlung | [x] | Direkte Anpassung (neues Epic 8). |
| 5.1–5.5 | Proposal-Bestandteile | [x] | §1–§10 dieses Dokuments. |
| 6.1 | Checkliste vollständig | [x] | |
| 6.2 | Proposal geprüft | [x] | Zahlen nachgerechnet (§4.3), Kontraste berechnet (§5.4.6). |
| 6.3 | Freigabe | [x] | BMAD-Team (headless) am 2026-09-27; Stakeholder-Dialog vor Merge bleibt Pflicht. |
| 6.4 | sprint-status.yaml | [!] | Einträge `epic-8` und Stories 8-1 … 8-7 als `backlog` beim Start der Umsetzung ergänzen (Aufgabe Amelia/SM, §10). Dieses Proposal ändert die Datei nicht. |
| 6.5 | Übergabe | [x] | §10. |

---

## 3. Impact Analysis

### 3.1 Epic- und Story-Impact

- **Epics 1–7:** abgeschlossen, keine Wiedereröffnung. Wo Akzeptanzkriterien feste Zahlen nennen (75 W, 10,3 W, 12.978 W, 28 Geräte, 6 Räume), werden die zugehörigen **Tests** in Epic 8 auf die neuen Kontrollsummen umgestellt (§4.3).
- **Epic 8 (neu):** 7 Stories, siehe §7.

### 3.2 Artefakt-Konflikte (Kurzfassung)

| Artefakt | Wirkung |
|---|---|
| PRD | Neue Features 4.7 (Elektroauto) und 4.8 (Solaranlage & Netzbilanz), geänderte Zahlen, §6 neu geschnitten (§5.2) |
| Architektur | `ServerZustand` um `auto`, `sonne` erweitert; `Energie` um `bezugWh`, `einspeisungWh`; 2 neue Befehle, 1 neuer Fehlercode, 3 neue Ursachen; 2 neue Topics, Energie-Topic `v: 2`; neue Umgebungsvariable (§5.3) |
| UX DESIGN.md | 2 neue Farbrollen (`solar`, `solar-soft`), Kopfhöhe mobil 136 px, neue Komponenten-Optik (§5.4) |
| UX EXPERIENCE.md | IA um Bereich „Solaranlage“ und Außenbereich „Carport“ erweitert, neue Bausteine, Microcopy, Ansagen (§5.4) |
| Readiness-Report | K-01 (36 statt 34 Rollen), K-05 (neue Paare), K-06 (neue Komponenten), K-14 (Netz-Zeile im Kopf), K-25 (Carport zählt) werden fortgeschrieben (§5.5) |
| Doku/Betrieb | README, API.md, DOCKER-SETUP.md, KUBERNETES.md, docker-compose*.yml (Kommentar), docs/*, Release-Hinweise v2.1.0, Abnahme 2.1 |

### 3.3 Technischer Impact

- **Keine neue Laufzeit- oder Entwicklungsabhängigkeit**, keine neue Infrastruktur, weiterhin ein Container.
- **Server:** zusätzlicher Timer „Akku voll“ (analog Auto-Aus), Akku-Integration im bestehenden Energie-Takt.
- **Persistenz:** zwei neue retained Topics, Migration des Energie-Topics `v: 1 → v: 2` beim Lesen.
- **Rückwärtskompatibilität:** Version 2.1.0 ≠ 2.0.0 → offene 2.0-Tabs zeigen das Versionsbanner und senden nichts mehr (bestehender Mechanismus FR-18). Upgrade ohne manuellen Schritt.
- **Sicherheit/Härtung:** unverändert (4-KB-Limit, Token-Bucket 100/20 pro s, Origin-/Host-Prüfung, Image-Härtung).

---

## 4. Empfohlener Weg und Fachmodell

### 4.1 Empfehlung

**Direkte Anpassung** über ein neues Epic 8 innerhalb des bestehenden Plans. Begründung: Die 2.0-Architektur (zentrale Domäne, ein Änderungspfad, strenges Protokoll, Versionsbanner) ist genau für solche Erweiterungen gebaut; Carport/Wallbox passen als Katalogeintrag in vorhandene Mechanismen (Raumkarte, Gerätezeile, „Verbrauch nach Raum“, Szenen, Tagesenergie). Nur Auto-Zustand und Sonnenlage sind echte neue Zustände.

- **Aufwand:** ca. 1,5 Entwicklertage (Domäne 0,25 · Server 0,35 · Client/UI 0,6 · Tests/Doku/Abnahme 0,3).
- **Risiko:** mittel-niedrig. Größte Risiken: Kopfbereich auf 360 px (Platz), Konsistenz Akku-Extrapolation Client ↔ Server, Zahl der anzupassenden Bestandstests. Gegenmaßnahmen: feste Netz-Zeile mit Mindestbreiten (§5.4.3), eine gemeinsame Domänenfunktion für Server und Client (§5.3.1), Kontrollsummen zentral in einem Test-Fixture.
- **Zeitplan:** ein Release (2.1.0), nichts wird vertagt.

### 4.2 Fachmodell in einem Satz je Teil

- **Elektroauto:** Genau ein Auto („Elektroauto“) mit 60-kWh-Akku gehört zum **Carport** (Außenbereich) mit einer **Wallbox** (11 kW). Laden = Wallbox *An*, nur möglich, wenn das Auto zu Hause ist und der Akku nicht voll ist. Der Server erhöht den Akkustand kontinuierlich und schaltet die Wallbox bei 100 % selbst ab. „Wegfahren“ beendet das Laden; „Zurückkommen“ zieht pauschal 15 % (9 kWh) für die Fahrt ab.
- **Solaranlage:** 9,8 kWp auf dem Dach. Die Sonnenlage wählt man in fünf Stufen (Nacht, Bedeckt, Wolkig, Heiter, Sonnig); daraus folgt die aktuelle Erzeugung. Die Sonnenlage ist gemeinsamer, gespeicherter Serverzustand.
- **Netzbilanz:** Netzbezug = max(0, Hausverbrauch − Erzeugung), Einspeisung = max(0, Erzeugung − Hausverbrauch). Kosten pro Stunde kommen aus dem Netzbezug; bei Einspeisung zeigt die App stattdessen den **Ertrag** pro Stunde (Einspeisevergütung 0,08 €/kWh).

### 4.3 Kennzahlen und Kontrollsummen (nachgerechnet)

| Größe | 2.0.0 | 2.1.0 |
|---|---|---|
| Geräte / Räume (Bereiche) | 28 / 6 | **29 / 7** (Carport mit Wallbox) |
| Standby-Anteil im Ausgangszustand | 10,3 W | **13,3 W** (+ Wallbox 3 W) |
| Hausverbrauch Ausgangszustand | 75,3 W → „75 W“ | **78,3 W → „78 W“**, 0,03 €/h |
| „Alles an“ (Auto zu Hause, Akku < 100 %) | 12.978 W | **23.978 W** |
| „Alles aus“ aus „alles an“ | 75 W | **78 W** |
| „Gute Nacht“ (UJ-3) | ≈ 80 W, davon 10,3 W Standby | **83 W, davon 13,3 W Standby** |
| Morgenroutine aus Ausgangszustand | +5.532 W | +5.532 W (unverändert) |
| Laden aus Ausgangszustand, Nacht | – | Δ **+10.997 W** → 11.075 W, „hoch“, **3,88 €/h** |
| Laden, Sonne „Sonnig“ | – | Netzbezug **2.745 W**, **0,96 €/h** |
| Ausgangszustand, „Sonnig“ | – | Einspeisung **8.252 W**, **Ertrag 0,66 €/h** |
| Ausgangszustand, „Heiter“ | – | Einspeisung **6.292 W**, **Ertrag 0,50 €/h** |
| Erzeugung je Stufe (9.800 W × Anteil) | – | 0 · 980 · 3.430 · 6.370 · 8.330 W |
| Laden 50 % → 100 % bei 11 kW | – | 30 kWh / 11 kW = **2 h 43 min 38 s** („voll in 2 h 44 min“); 1 % ≈ 196 s |
| Tagesbilanz-Test | 2.000 W × 30 min = 1,00 kWh | zusätzlich: 2.000 W Verbrauch bei „Wolkig“ (3.430 W) × 30 min → Verbrauch 1.000 Wh, Bezug 0 Wh, Einspeisung 715 Wh, erzeugt 1.715 Wh |

---

## 5. Detaillierte Änderungsvorschläge

### 5.1 Stories

Bestehende Stories bleiben geschlossen. Alle neuen Arbeiten stehen in Epic 8 (§7). Für Bestandstests mit festen Zahlen gilt:

```
Story: 1.1/1.2/1.3/5.5 (Tests)   Abschnitt: Akzeptanzkriterien mit Kontrollsummen
ALT:  28 Geräte · 6 Räume · 75 W · 10,3 W · 12.978 W · „Alles aus“ → 75 W
NEU:  29 Geräte · 7 Räume (6 im Haus + Carport) · 78 W · 13,3 W · 23.978 W · „Alles aus“ → 78 W
Begründung: Wallbox als Katalog-Gerät (E-02, E-31); umgesetzt in Story 8.1.
```

### 5.2 PRD (`prd.md`) – Änderungen

Frontmatter: `version: 2.1.0`, `updated: 2026-09-27`, Titel bleibt; §0 nennt Release **2.1.0** und verweist zusätzlich auf dieses Proposal.

**§1 Vision – neuer Absatz (anhängen):**
> Version 2.1 bringt Sonne und Straße ins Haus: Auf dem Dach liegt eine Solaranlage mit 9,8 kWp, und man stellt ein, wie viel Sonne gerade scheint. Im Carport steht ein Elektroauto an der Wallbox. Es lädt mit 11 kW, bis der Akku voll ist, und es kann wegfahren und wiederkommen. Oben sieht man jetzt nicht nur, was das Haus verbraucht, sondern auch, was die Sonne liefert und ob gerade Strom aus dem Netz kommt oder ins Netz fließt.

**§2.3 neue Journey UJ-6:**
> **UJ-6. Nina lädt das Auto mit Sonnenstrom.** Nina, 38, Mittagspause im Homeoffice, Laptop. Sie wählt unter „Solaranlage“ die Sonne „Sonnig“: Der Kopf zeigt „Solar 8.330 W · Einspeisung 8.252 W“ und „Ertrag 0,66 €/h“. Sie schaltet in der Karte „Carport“ die Wallbox ein. **Höhepunkt:** Der Hausverbrauch zählt auf 11.075 W hoch, der Kopf wechselt auf „Netzbezug 2.745 W“ und „0,96 €/h“, beim Auto steht „lädt · voll in 2 h 44 min“. **Auflösung:** Um 14 Uhr tippt sie „Wegfahren“: Das Laden endet, „−10.997 W · Elektroauto weggefahren, Laden beendet“. Abends tippt sie „Zurückkommen“: „Elektroauto zurück · Akku 49 %“. **Randfall:** Solange das Auto unterwegs ist, ist die Wallbox gesperrt und sagt warum („Elektroauto ist unterwegs“).

**§3 Glossar – geändert/neu:**
- *Haus* – „… mit 2 Etagen, 6 Räumen **und dem Außenbereich Carport**.“
- *Raum* – „Ein Bereich des Hauses mit fester ID und 1 bis 7 Geräten; **der Carport ist ein Raum der Etage „Außen“**.“
- *Gerätekatalog* – „… aller **29** Geräte …“
- **Elektroauto** – Das einzige Fahrzeug; Zustand *zu Hause* oder *unterwegs*, Akkustand in Wh (Kapazität 60 kWh).
- **Wallbox** – Ladegerät im Carport (Gerät `carport.wallbox`); Wallbox *An* heißt „Laden“.
- **Akkustand** – Energie im Akku des Elektroautos; Anzeige in ganzen Prozent, abgerundet.
- **Solaranlage** – Photovoltaikanlage mit 9,8 kWp Spitzenleistung.
- **Sonnenlage** – Vom Menschen gewählte Stufe *Nacht, Bedeckt, Wolkig, Heiter, Sonnig*; gemeinsamer Serverzustand.
- **Erzeugung** – Aktuelle Leistung der Solaranlage = Spitzenleistung × Anteil der Sonnenlage, in Watt.
- **Netzbezug / Einspeisung** – max(0, Hausverbrauch − Erzeugung) bzw. max(0, Erzeugung − Hausverbrauch), jeweils aus den gerundeten Anzeigewerten.
- **Einspeisevergütung** – Preis je eingespeister kWh, Standard 0,08 €/kWh.
- *Kosten pro Stunde* – „**Netzbezug** in kW × Strompreis.“ **Ertrag pro Stunde** – Einspeisung in kW × Einspeisevergütung.
- *Tagesverbrauch* unverändert; neu **Tagesbezug**, **Tageseinspeisung** (vom Server integriert), **Tageserzeugung** = Tagesverbrauch − Tagesbezug + Tageseinspeisung; *Tageskosten* = Tagesbezug × Strompreis − Tageseinspeisung × Einspeisevergütung.
- *Befehl* – „… (Gerät schalten, Szene ausführen, Raum ausschalten, **Sonnenlage setzen, Elektroauto wegfahren/zurückkommen lassen**).“
- *Serverzustand* – „… Gerätezustände, **Elektroauto, Sonnenlage** plus Tagesenergie …“

**Geänderte FR (ALT → NEU, nur die geänderten Konsequenzen):**

| FR | ALT | NEU |
|---|---|---|
| FR-1 | genau 6 Räume | 6 Räume im Haus **plus Raum `carport` („Carport“, Etage „Außen“)**; Carport enthält genau 1 Gerät, alle Haus-Räume ≥ 3. |
| FR-2 | 28 Geräte; Kategorien Licht … IT | **29 Geräte**; zusätzliche Kategorie **Mobilität**. Anhang A + Zeile `carport.wallbox`. |
| FR-4 | Ausgangszustand 75 W (65 + 10,3) | **78 W** (65 W Grundlast + 13,3 W Standby, gerundet); zusätzlich: Elektroauto zu Hause, Akku 50 %, Sonnenlage „Nacht“. |
| FR-6 | fest sichtbar: Hausverbrauch, Laststufe, Kosten pro Stunde, Verbindungsstatus | zusätzlich fest sichtbar: **Netz-Zeile** „Solar ‹x› W · Netzbezug ‹y› W“ bzw. „… · Einspeisung ‹y› W“ (FR-41). Summe weiterhin über alle 29 Geräte. |
| FR-9 | Kosten = Hausverbrauch/1000 × Strompreis | Kosten = **Netzbezug**/1000 × Strompreis; bei Einspeisung > 0 steht an ihrer Stelle „Ertrag ‹x› €/h“ (FR-41). Neu `EINSPEISEVERGUETUNG_EUR_PRO_KWH` (Regeln wie Strompreis, Standard 0,08). Übersicht: „Strompreis 0,35 €/kWh · Einspeisevergütung 0,08 €/kWh“. |
| FR-10 | „Heute 3,42 kWh · 1,20 €“ (Verbrauch × Preis) | „Heute ‹Verbrauch› kWh · ‹Netto› €“ bzw. „… · Ertrag ‹x› €“; darunter „Netz heute: Bezug ‹a› kWh · Einspeisung ‹b› kWh“ (FR-42). Info-Hinweis-Text neu (§5.4.5). |
| FR-11 | Ursachen Gerät, Szene, Raum, Auto-Aus | zusätzlich **Sonnenlage**, **Elektroauto**, **Akku voll** (Texte §5.4.5). |
| FR-12 | – | unverändert: Basis bleibt der **Hausverbrauch** (E-19). |
| FR-15 | Snapshot mit 28 Gerätezuständen … Strompreis | … **29** Gerätezustände, **Elektroauto, Sonnenlage, Einspeisevergütung**, Tagesenergie inkl. Bezug/Einspeisung. |
| FR-17 | Gerätezustände überstehen Neustart | zusätzlich Elektroauto (Ort, Akkustand) und Sonnenlage; Zeit ohne laufenden Server lädt nicht (FR-38). |
| FR-18 | Erlaubt: schalten, szene, raumAus | zusätzlich **`sonne`** (Stufe) und **`auto`** (zuhause: boolean). Regelverstoß (z. B. Laden, während das Auto unterwegs ist) → Fehler `NICHT_MOEGLICH`, Zustand unverändert. |
| FR-23/24 | „Alles aus“ aus „alles an“ → 75 W | → **78 W**; „Alles aus“ und „Gute Nacht“ beenden das Laden (Wallbox ist kein Grundlastgerät); **keine Szene startet das Laden**; Szenen ändern weder Sonnenlage noch Ort des Autos. |
| FR-25 | Kopf, Szenen, Hausansicht, Raumkarten, Verbrauch nach Raum | Reihenfolge: Kopf, Übersicht, Szenen, **Solaranlage**, Hausansicht, Räume (**7 Karten, Carport zuletzt**), Verbrauch nach Raum. Kopf ≤ 30 % der Höhe (mobil 136 px = 21 %). |
| FR-26 | 2 Etagen × 3 Räume | zusätzlich Zeile **„Außen“** mit der Carport-Fläche und **Solaranlage auf dem Dach** (FR-43). |
| FR-27 | jede Raumkarte mit „Raum ausschalten“ | jede Raumkarte **eines Hausraums**; die Carport-Karte hat stattdessen den Elektroauto-Bereich (FR-39) und keinen „Raum ausschalten“ (E-12). Gesperrte Wallbox nennt den Grund. |
| FR-30/FR-33 | Version 2.0.0 | **2.1.0**; Release `v2.1.0`, Image `:2.1.0`, Release-Hinweise `.github/release-hinweise/v2.1.0.md`. |
| FR-34 | Doku Stand 2.0.0 | Doku Stand **2.1.0** inkl. neuer Befehle, Topics, Umgebungsvariable. |
| NFR-7 | Logereignisse | zusätzlich `akku_voll`, `einspeiseverguetung`/`einspeiseverguetung_ungueltig`. |
| NFR-10 | `docs/abnahme-2.0.md` | zusätzlich **`docs/abnahme-2.1.md`** (§6.3). |

**Neue FR (Feature 4.7 Elektroauto, 4.8 Solaranlage & Netzbilanz):**

- **FR-36 Carport und Wallbox.** Katalog: Raum `carport` (Carport, Außen), Gerät `carport.wallbox` (Wallbox, Mobilität, Betrieb 11.000 W, Standby 3 W, kein Grundlastgerät, kein Auto-Aus).
- **FR-37 Elektroauto.** Genau ein Elektroauto, Akkukapazität 60.000 Wh, Ausgangszustand zu Hause mit 30.000 Wh (50 %). Anzeige: Ort („zu Hause“/„unterwegs“), Akkustand in ganzen Prozent (abgerundet), beim Laden „voll in ‹h› h ‹m› min“.
- **FR-38 Laden.** Wallbox *An* nur, wenn Auto zu Hause und Akku < 60.000 Wh; sonst ist die Gerätezeile gesperrt (mit Grund) und der Server lehnt mit `NICHT_MOEGLICH` ab. Während des Ladens steigt der Akkustand um 11.000 W × Zeit (verlustfrei), serverseitig integriert. Bei 100 % schaltet der Server die Wallbox aus (Ursache „Akku voll“, eine Änderung, Meldung an alle). Nach Neustart: Ausfallzeit lädt nicht; ist der Akku voll oder das Auto unterwegs, wird die Wallbox beim Start ausgeschaltet.
- **FR-39 Wegfahren und Zurückkommen.** „Wegfahren“ setzt das Auto auf unterwegs und schaltet eine laufende Wallbox in **derselben** Änderung aus; nur möglich bei Akku ≥ 9.000 Wh (15 %), sonst gesperrt mit Grund bzw. `NICHT_MOEGLICH`. „Zurückkommen“ setzt das Auto auf zu Hause und zieht 9.000 Wh ab (min. 0). Keine optimistische Anzeige.
- **FR-40 Solaranlage und Sonnenlage.** Spitzenleistung 9.800 W. Sonnenlage in 5 Stufen mit Anteil 0 / 0,10 / 0,35 / 0,65 / 0,85; Erzeugung = 9.800 W × Anteil. Jede Person kann die Sonnenlage wählen; Server setzt, speichert und verteilt sie; Ausgangszustand „Nacht“.
- **FR-41 Netzbilanz live.** Kopf zeigt „Solar ‹x› W“ und je nach Vorzeichen „Netzbezug ‹y› W“ oder „Einspeisung ‹y› W“ (bei 0/0: „Netzbezug 0 W“); Kosten/h aus Netzbezug, sonst „Ertrag ‹x› €/h“. Werte aus gerundetem Hausverbrauch und gerundeter Erzeugung, sodass Hausverbrauch − Solar = Netzbezug bzw. −Einspeisung exakt stimmt.
- **FR-42 Tagesbilanz.** Server integriert Verbrauch, Bezug und Einspeisung (alle ≤ 60 s, Tageswechsel wie FR-10). Anzeige Übersicht (Heute, Netz heute) und Solaranlage („Heute erzeugt ‹x› kWh“).
- **FR-43 Darstellung.** Bereich „Solaranlage“ nach den Szenen; Hausansicht mit Solarmodulen und Solarwert auf dem Dach und Carport-Fläche in der Zeile „Außen“; Carport-Raumkarte mit Elektroauto-Bereich; alles per Tastatur und Screenreader bedienbar (Details §5.4).
- **FR-44 Release 2.1.0.** `package.json` 2.1.0; alte Tabs zeigen das Versionsbanner; kein manueller Upgrade-Schritt; `docs/abnahme-2.1.md` ausgefüllt eingecheckt.

**§6 Bewusst nicht Teil des Produkts – geändert:**
- Streichen: „Dynamische Tarife, Tag/Nacht-Strom, **PV-Einspeisung**“ → neu „Dynamische Tarife, Tag/Nacht-Strom. (Einspeisung mit fester Vergütung ist seit 2.1 Teil des Produkts.)“
- Neu ausgeschlossen (je mit Begründung im Entscheidungsprotokoll): **PV-Überschussladen/Lademanagement** (Automation, §6 „keine Regeln“), **Hausbatteriespeicher**, **zweites Fahrzeug**, **wählbare Ladeleistung**, **Fahrten mit Strecke/Dauer und zeitabhängigem Verbrauch**, **Sonnenlage nach Uhrzeit/Wetterdienst**, **stufenloser Sonnenregler**, **Ladeverluste**.

**§7 Erfolgskennzahlen:** SM-C3 „Katalog fest: **29 Geräte, 4 Szenen, 1 Elektroauto, 1 Solaranlage**“. Neu **SM-6 Bilanzrichtigkeit:** Alle Tests zu Netzbilanz, Tagesbilanz, Akku-Integration und Akku-voll grün.

**§9 Annahmen-Index – neu:** 11-kW-Wallbox, 3 W Standby; 60-kWh-Akku, Start 50 %; Fahrt 9 kWh; 9,8 kWp; Stufenanteile; Einspeisevergütung 0,08 €/kWh (Verweise E-xx).

**Anhang A – neue Zeile und Kontrollsummen:**

| Geräte-ID | Gerät | Raum | Etage | Kategorie | Betrieb | Standby | Merkmal |
|---|---|---|---|---|---:|---:|---|
| `carport.wallbox` | Wallbox | Carport | Außen | Mobilität | 11.000 | 3 | L (lädt nur mit Auto zu Hause, Akku < 100 %) |

Kontrollsummen: 29 Geräte (… Arbeitszimmer 5, **Carport 1**); Standby aller Nicht-Grundlastgeräte **13,3 W**; Ausgangszustand **78,3 W → „78 W“**, 0,03 €/h; „Alles an“ **23.978 W**.

### 5.3 Architektur (`architecture.md`) – Änderungen

Neuer Abschnitt **§3.12 „Elektroauto, Solaranlage, Netzbilanz (2.1)“**; Frontmatter `version: 2.1.0`. Leitlinie bleibt: langweilig und schlank, ein Änderungspfad.

#### 5.3.1 Domänenmodell (exakt)

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
  /** Akkustand in Wh zum Zeitpunkt `stand` (ungerundet, 0 … kapazitaetWh) */
  akkuWh: number;
  /** ms epoch, bis wann akkuWh integriert ist */
  stand: number;
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

`src/domain/energie.ts`: `integriere(e, verbrauchW, erzeugungW, vonMs, bisMs): Energie` integriert **drei** Reihen (wh += v·dt; bezugWh += max(0, v−e)·dt; einspeisungWh += max(0, e−v)·dt), Tageswechsel wie bisher für alle drei. Ungerundete Werte.

`src/domain/befehle.ts`: `FELDER` + `sonne: ['typ','id','stufe']`, `auto: ['typ','id','zuhause']`. `pruefeBefehl` prüft `stufe` via `istSonnenStufe` (sonst `UNGUELTIGER_BEFEHL`), `zuhause` boolean. Neu (rein): `pruefeRegel(zustand: HausZustand, auto: AutoZustand, befehl: Befehl, jetzt: number): 'NICHT_MOEGLICH' | null` – Laden-Einschalten ohne `darfLaden`, `auto zuhause:false` ohne `darfWegfahren` (nur wenn aktuell zu Hause). `ausgangszustand()` bleibt (Wallbox *Aus*). Neu `erzwingeLadeRegeln(zustand, auto, jetzt)`: setzt Wallbox-Ziel *Aus*, wenn Auto unterwegs oder Akku voll (für Restore und Wegfahren).

#### 5.3.2 WebSocket-Protokoll (`src/domain/protokoll.ts`)

```ts
export interface Energie { datum: string; wh: number; bezugWh: number; einspeisungWh: number }

export type Befehl =
  | { typ: 'schalten'; id: string; geraet: GeraetId; an: boolean }
  | { typ: 'szene'; id: string; szene: SzeneId }
  | { typ: 'raumAus'; id: string; raum: RaumId }
  | { typ: 'sonne'; id: string; stufe: SonnenStufe }        // neu
  | { typ: 'auto'; id: string; zuhause: boolean };          // neu

export type UrsachenArt = 'geraet' | 'szene' | 'raumAus' | 'autoAus' | 'sonne' | 'auto' | 'akkuVoll';
// ref: sonne → Stufe; auto → 'weg' | 'zurueck'; akkuVoll → Geräte-ID der Wallbox

export type FehlerCode = … | 'NICHT_MOEGLICH';               // Meldung: „Aktion ist im aktuellen Zustand nicht möglich.“

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
1. Serverversion 2.1.0 ≠ Client 2.0.0 → alter Tab zeigt „Neue Version verfügbar“, verarbeitet nur noch Snapshots, sendet nichts (bestehend, FR-18/CR-06). Der 2.0-Reducer ignoriert unbekannte Felder und die Zusatz-ID `carport.wallbox` im Snapshot ohne Absturz (er iteriert über seinen eigenen Katalog) – per Test mit 2.0-Fixture abgesichert (T-24).
2. 2.1-Client liest fehlende Felder defensiv: `auto` fehlt → `ausgangsAuto`, `sonne` fehlt → `nacht`, `einspeiseverguetung` fehlt → 0,08, `bezugWh` fehlt → `wh`, `einspeisungWh` fehlt → 0. (Relevant nur bei Versionskonflikt; das Banner greift ohnehin.)
3. Neue Nachrichtentypen gibt es nicht; nur neue Befehle, Felder, Ursachen und ein Fehlercode (Architektur §4.4 wird um diese Ausnahme ergänzt).
4. Grenzen unverändert: 4-KB-Limit, `maxPayload` 64 KiB, Token-Bucket 100 / 20 pro s je Verbindung, 200 Ablehnungen in Folge → Trennung, max. 100 Verbindungen, Origin/Host-Prüfung.

**Ablauf je Befehl (Ergänzung zu §3.5 Schritt 4/5):** nach `pruefeBefehl` → `pruefeRegel` (Zustand jetzt) → bei Verstoß `fehler NICHT_MOEGLICH` mit `befehlId`, Log `befehl typ=… ergebnis=NICHT_MOEGLICH` (gedrosselt wie bisher), Zustand unverändert.

#### 5.3.3 Zustandsdienst (`server/zustandsdienst.ts`)

- Zusätzliche Felder `auto: AutoZustand`, `sonne: SonnenZustand`, `akkuVollTimer`.
- **Ein Änderungspfad bleibt:** `aendere(aenderung: { ziele?: Partial<Record<GeraetId, boolean>>; auto?: (a: AutoZustand) => AutoZustand; sonne?: SonnenStufe }, ursache)`. Ablauf: `integriereBis(jetzt)` (Energie **und** Akku) → Geräteziele + Auto + Sonne anwenden → `erzwingeLadeRegeln` → Diff bilden → bei keiner Änderung `false` → eine `aenderung` (nur geänderte Teile) → Persistenz der geänderten Teile → Akku-voll-Timer neu planen oder löschen.
- `fuehreAus(befehl)` liefert `{ ok: true; geaendert: boolean } | { ok: false; code: 'NICHT_MOEGLICH' }`.
- **`integriereBis(jetzt)`**: wie bisher `von = max(stand, jetzt − MAX_INTEGRATION_MS)`; Energie mit `hausverbrauch` und `erzeugung(sonne.stufe)`; Akku: wenn Wallbox *An* und zu Hause, `akkuWh = min(kap, akkuWh + 11.000 · (jetzt − von) / 3.600.000)`, `auto.stand = jetzt`. Damit entspricht die geladene Energie exakt der für die Wallbox integrierten Energie.
- **Akku-voll-Timer** (analog Auto-Aus, AD-09): bei Wallbox *An* `setTimeout((kap − akkuWh) / P · 3.600.000)`; beim Feuern `aendere({ ziele: { wallbox: false } }, { art: 'akkuVoll', ref: wallbox, befehlId: null })`, danach `akkuWh = kap` (Rest ≤ 0,5 Wh wird auf `kap` gesetzt), Logzeile `akku_voll`. Neu geplant nach jedem Energie-Takt.
- **Energie-Takt (60 s):** integriert (Energie + Akku), persistiert Energie **und** Auto, sendet `energie` inkl. `auto`.
- **Start/Restore:** `auto.stand = jetzt` (Ausfallzeit lädt nicht, wie FR-10); `erzwingeLadeRegeln` (Wallbox aus, wenn unterwegs oder voll) vor `speichereAlles()`; Akku-voll-Timer planen.
- **Stopp (SIGTERM):** integrieren, Energie und Auto persistieren (bestehendes 2-s-Fenster).

#### 5.3.4 MQTT-Topics (retained, QoS 1, nur der Server)

| Topic | Payload | Geschrieben |
|---|---|---|
| `iot-haus/v2/geraet/carport.wallbox/zustand` | `{ "v": 1, "an": false, "seit": … }` (bestehendes Schema) | wie alle Geräte |
| `iot-haus/v2/auto/zustand` **(neu)** | `{ "v": 1, "zuhause": true, "akkuWh": 30000, "stand": 1790000000000 }` | bei Änderung, jedem Energie-Takt, Stopp, `speichereAlles` |
| `iot-haus/v2/solar/sonne` **(neu)** | `{ "v": 1, "stufe": "nacht", "seit": 1790000000000 }` | bei Änderung, `speichereAlles` |
| `iot-haus/v2/energie/heute` **(v: 2)** | `{ "v": 2, "datum": "2026-09-27", "wh": 3420.5, "bezugWh": 2100.2, "einspeisungWh": 4300.9, "stand": … }` | wie bisher |

**Validierung beim Restore** (`uebernimmGespeichert`): Auto – `zuhause` boolean, `akkuWh`/`stand` endlich ≥ 0, `akkuWh` wird auf `[0, kap]` begrenzt; Sonne – bekannte Stufe, `seit` endlich ≥ 0; Energie – `v: 1` (nur `wh`) wird als `bezugWh = wh, einspeisungWh = 0` übernommen (2.0 hatte keine Solaranlage), `v: 2` verlangt alle drei Werte endlich ≥ 0. Sonst `restore_ignoriert topic=…` und Ausgangswert. Präfix `iot-haus/v2` bleibt (kein Bruch des Schemas).

#### 5.3.5 Konfiguration

- `server/konfig.ts`: `leseStrompreis` wird zu `leseEuroProKwh(name, wert, standard, log)` verallgemeinert; `leseStrompreis`/`leseEinspeiseverguetung` sind dünne Aufrufe. **`EINSPEISEVERGUETUNG_EUR_PRO_KWH`**, Standard `0.08`, Regeln wie K-27 (leer → INFO `einspeiseverguetung quelle=standard`, ungültig/negativ → WARN `einspeiseverguetung_ungueltig`, `0` gültig).
- `server/index.ts`/`server/app.ts`: Option `einspeiseverguetung` an `erstelleServer`, Snapshot enthält sie.
- Spitzenleistung, Akku, Wallbox sind Katalogwerte, **keine** Umgebungsvariablen (E-14).

#### 5.3.6 Client (`src/client/hausReducer.ts`, `src/hooks/useHaus.tsx`)

- `ServerDaten` + `auto`, `sonne`, `einspeiseverguetung`; `snapshot` setzt sie (defensiv, §5.3.2 Regel 2).
- `aenderung`: Geräte wie bisher; `auto`/`sonne` übernehmen; die bisherige Frühausstiegsregel „keine Geräte → nur Energie“ gilt nur, wenn **auch** `auto` und `sonne` fehlen. Ursachen-Whitelist um `sonne`, `auto`, `akkuVoll` erweitert.
- `energie`: übernimmt `energie` und `auto`.
- `Ausstehend.art` + `'sonne' | 'auto'`; `sonne` mit `zielStufe` (optimistische Auswahl wie Einzelschalter, FR-21), `auto` ohne optimistische Anzeige (wie Szene, K-26).
- Neue Selektoren: `anzeigeSonne(z) → { stufe, beschaeftigt }`, `akkuJetzt(z, jetzt)` (über `akkuWhBei` + `uhrVersatzMs`).
- `MeldungsArt` + `'solar'` (Symbol Sonne, Farbe `solar`).
- `HausKontext` + `sonne(stufe)`, `auto(zuhause)`; `sende` unverändert (Sperre bei nicht bedienbar/beschäftigt).
- `fehlerMeldung` + Texte für `sonne`/`auto`; `NICHT_MOEGLICH` nutzt denselben Weg wie jeder `fehler` mit `befehlId`.

#### 5.3.7 Architektur-Entscheidungen (Ergänzung §9)

| ID | Entscheidung |
|---|---|
| AD-23 | Auto und Sonne als eigene Serverzustände neben `HausZustand`, über denselben `aendere`-Pfad; eine Änderung = eine `aenderung` (auch Wegfahren + Laden-Ende). |
| AD-24 | Akku wird im selben Integrationsschritt wie die Tagesenergie fortgeschrieben; Clients extrapolieren nur zur Anzeige mit derselben Domänenfunktion. |
| AD-25 | Akku-voll als Server-Timer analog Auto-Aus (AD-09). |
| AD-26 | Energie-Topic `v: 2` mit Lese-Migration von `v: 1`; neue Topics `auto/zustand`, `solar/sonne` mit `v: 1`. |
| AD-27 | Neuer Fehlercode `NICHT_MOEGLICH` für fachliche Regelverstöße statt stiller `geaendert: false`. |

### 5.4 UX (`DESIGN.md`, `EXPERIENCE.md`) – Änderungen

#### 5.4.1 Information Architecture (EXPERIENCE.md, Tabelle ersetzen)

| # | Bereich | Neu/Änderung |
|---|---|---|
| 1 | Kopfbereich (sticky) | + **Netz-Zeile** „Solar ‹x› W · Netzbezug/Einspeisung ‹y› W“; Kosten/Ertrag pro Stunde |
| 2 | Übersichtsbereich | „Heute … kWh · … €“ (netto), **„Netz heute: Bezug … · Einspeisung …“**, „Strompreis … · Einspeisevergütung …“ |
| 3 | Szenenleiste | unverändert |
| 4 | **Solaranlage (h2, neu)** | Erzeugung, Spitzenleistung, Heute erzeugt, **Sonnenwahl** (5 Stufen) |
| 5 | Hausansicht | + Solarmodule und Solarwert auf dem Dach, + Zeile **„Außen“** mit Carport-Fläche |
| 6 | Räume | + Raumkarte **Carport** (letzte) mit Elektroauto-Bereich und Wallbox-Zeile |
| 7 | Verbrauch nach Raum | 7 Einträge inkl. Carport |

Tab-Reihenfolge: Sprunglink → Info → Theme → 4 Szenen → **Sonnenwahl (eine Tab-Station, Pfeiltasten)** → 6 Räume + **Carport** der Hausansicht → Raumkarten (Carport: **Wegfahren/Zurückkommen**, dann **Wallbox**) → Toasts → Banner.

#### 5.4.2 Wireframes (verbindlich)

Mobil 360 × 640:
```
┌──────────────────────────────────────┐  ← sticky, 136 px (21 %)
│ ⌂ IoT-Haus                ● Verbunden│
│ Hausverbrauch                        │
│ 11.075 W                   ▮▮▮ hoch  │
│                             0,96 €/h │
│ ☀ Solar 8.330 W · Netzbezug 2.745 W  │  ← Netz-Zeile (label 13/16)
├──────────────────────────────────────┤
│ davon Standby 13,3 W                 │
│ Heute 3,42 kWh · 0,39 €          (i) │
│ Netz heute: Bezug 2,10 kWh · Einspeisung 4,30 kWh │ (umbrechend)
│ Strompreis 0,35 €/kWh · Einspeisevergütung 0,08 €/kWh │
│ Darstellung [System|Hell|Dunkel]     │
│ Szenen  (2 × 2, unverändert)         │
│                                      │
│ Solaranlage                          │
│ ┌──────────────────────────────────┐ │
│ │ (☀) Erzeugung 8.330 W   9,8 kWp  │ │
│ │     Heute erzeugt 12,40 kWh      │ │
│ │ Sonne gerade                     │ │
│ │ [Nacht|Bedeckt|Wolkig|Heiter|Sonnig] │
│ └──────────────────────────────────┘ │
│ Hausansicht                          │
│        ╱▦▦ ☀ Solar 8.330 W ▦▦╲        │  ← Module + Wert im Dach
│ OG │ … │ … │ … │                     │
│ EG │ … │ … │ … │                     │
│ ─────────────────────────────────    │
│ Außen            │Carport    ⚡│      │
│                  │11.000 W     │      │
│                  │Auto lädt 64 %│     │
│ Warm leuchtend: Licht ist an. ⚡: Auto lädt. │
│ Räume … 6 Karten …                   │
│ ┌ Carport ────────────── 11.000 W ─┐ │
│ │ Außen · 1 von 1 an               │ │
│ │ (🚗) Elektroauto    [Wegfahren]  │ │
│ │     zu Hause · lädt · voll in    │ │
│ │     2 h 44 min                   │ │
│ │     Akku 64 % ██████████░░░░░    │ │
│ │ (⚡) Wallbox             [──●]    │ │
│ │     11.000 W                     │ │
│ └──────────────────────────────────┘ │
```
Einspeisung: Netz-Zeile „☀ Solar 8.330 W · Einspeisung 8.252 W“, rechts „Ertrag 0,66 €/h“. Auto unterwegs: „unterwegs · Akku 64 % bei Abfahrt“ + Hinweis „Eine Fahrt verbraucht 15 % Akku.“, Schaltfläche „Zurückkommen“; Wallbox-Zeile „Standby 3 W · Auto unterwegs“, gesperrt.

Desktop ≥ 1280 px: Kopf einzeilig „⌂ IoT-Haus · Hausverbrauch 11.075 W · ▮▮▮ hoch · 0,96 €/h · ☀ Solar 8.330 W · Netzbezug 2.745 W · ● Verbunden“ (88 px). 1024–1279 px: Netz-Zeile als zweite Zeile (≈ 112 px). Kompakt (Höhe ≤ 500 px): einzeilig Hero · Pille · €/h · „Netzbezug 2.745 W“ bzw. „Einspeisung …“ (ohne Solarwert). Solaranlage-Karte ab 768 px einzeilig: Werte links, Sonnenwahl rechts.

#### 5.4.3 Bausteine (Verhalten – EXPERIENCE.md Component Patterns ergänzen)

| Baustein | Verhalten |
|---|---|
| **Netz-Zeile** (`NetzZeile`) | Teil des Kopfs, keine Bedienelemente, kein `aria-live`. Sichtbar `aria-hidden`, sr-only-Text `kopf.netzSr`. Wechselt sofort mit der Bestätigung (keine Zählanimation). Feste Mindestbreiten (`7ch` je Zahl, `tabular-nums`), damit nichts springt. |
| **Kosten/Ertrag** | Ein Element; bei Einspeisung > 0 „Ertrag 0,66 €/h“ (Wort trägt die Bedeutung, Farbe `ink`), sonst „0,96 €/h“ wie bisher. |
| **Solaranlage** (`Solaranlage`) | `<section aria-labelledby>` h2 „Solaranlage“, Karte `surface`. Werte ohne Animation. |
| **Sonnenwahl** (`SonnenWahl`) | `<fieldset>` + `<legend>Sonne gerade</legend>`, 5 native Radios im Segment-Look wie `ThemeWahl`, kontrolliert durch `anzeigeSonne`. Auswahl sendet `sonne`; das gewählte Segment wechselt sofort (optimistisch), Fieldset `aria-busy`, Hinweis „wird eingestellt …“. Fehler/5 s → zurück auf Serverwert + Toast `toast.fehlerSonne`. Offline/veraltet: Radios `aria-disabled`, Änderungen wirkungslos. Zugänglicher Name je Radio: „Sonnig, 8.330 Watt“. Umbruch in 2 Zeilen erlaubt (< 360 px, 200 % Zoom). |
| **Elektroauto** (`Elektroauto`) | Block oben in der Carport-Karte, `role="group"` mit `aria-labelledby` = sichtbarer Name „Elektroauto“. Statuszeile und Akku-Balken (`aria-hidden`), sr-only `auto.statusSr`. Schaltfläche „Wegfahren“/„Zurückkommen“ (`button-secondary`, ≥ 44 px), zugänglicher Name `auto.wegfahrenSr`/`auto.zurueckSr`, `aria-busy` bis Bestätigung, keine optimistische Änderung. Akku < 15 %: „Wegfahren“ `aria-disabled` + sichtbarer Grund `auto.zuLeer` (per `aria-describedby`). „voll in …“ aktualisiert minütlich über `useSekundentakt` (nur solange geladen wird). Akkuprozent zählt nicht animiert. |
| **Wallbox-Zeile** | `GeraeteZeile` mit neuer Prop `sperrGrund`: bei Auto unterwegs bzw. Akku voll `aria-disabled`, Leistungszeile „Standby 3 W · Auto unterwegs“ bzw. „· Akku voll“, Beschreibung „nicht verfügbar: Elektroauto ist unterwegs“. Kein Grundlast-Dialog. |
| **Carport-Fläche** (`CarportFlaeche`) | Button in der Gruppe „Außenbereich“ der Hausansicht, Sprung zur Carport-Karte wie Räume. Zeilen: „Carport“, Raumverbrauch, „Auto lädt 64 %“ / „Auto zu Hause 50 %“ / „Auto unterwegs“. Lädt: 2-px-Rand `on` + Blitz-Symbol `on` (nie nur Farbe: Text „lädt“). Zugänglicher Name `haus.carportName`. |
| **Dach-Solar** | Dach-SVG bleibt `aria-hidden`; Module als Rechtecke: Erzeugung > 0 → Füllung `solar-soft`, Kontur `solar`; sonst `surface-sunken`. Darüber ein Text-Element (nicht interaktiv) „☀ Solar 8.330 W“ in `solar`, für Screenreader als Teil der Gruppe „Hausansicht“: „Solaranlage 8.330 Watt“. |
| **Meldungen** | Art `solar` (Sonnen-Symbol, `solar`). Elektroauto-Meldungen nach Tabelle §5.4.5; Delta-Chip nur bei Hausverbrauchs-Differenz ≠ 0 (Sonnenwechsel erzeugt keinen Chip). |
| **Live-Region** | Neue Ansagen sammeln wie Änderungen (2-s-Fenster, K-09). |

Motion: keine neuen Animationen außer vorhandenen (Balkengleiten 250 ms für Akku-Balken, bei reduzierter Bewegung sofort). Kein Dauer-Pulsieren beim Laden.

#### 5.4.4 Barrierefreiheit (Ergänzung Accessibility Floor)

- Überschriften: h2 „Solaranlage“ neu; Carport-Karte h3 „Carport“.
- Nicht nur Farbe: Einspeisung/Netzbezug/Ertrag als Wörter; Laden als Text „lädt“ + Blitz; Solar-Module zusätzlich Zahlwert.
- Gesperrte Bedienelemente mit sichtbarem und angesagtem Grund (Wallbox, Wegfahren).
- Erwartete VoiceOver-Ausgaben: „Wallbox, Carport, Schalter, aus, Standby 3 Watt, nicht verfügbar: Elektroauto ist unterwegs“; „Sonnig, 8.330 Watt, Optionsfeld, 5 von 5, Sonne gerade“; „Elektroauto wegfahren lassen, Taste“.
- axe (hell/dunkel) mit neuer Fixture (Auto lädt, Sonne „Heiter“): 0 Verstöße.

#### 5.4.5 Microcopy (`src/ui/texte.ts`, neue/geänderte Schlüssel)

```ts
seite.beschreibung: 'Simuliertes Zuhause mit Solaranlage und Elektroauto: Geräte schalten und live sehen, was das Haus verbraucht, erzeugt und kostet.',
kopf: {
  solar: 'Solar',
  netzbezug: 'Netzbezug',
  einspeisung: 'Einspeisung',
  netzSr: (solar: string, art: 'bezug' | 'einspeisung', watt: string) =>
    `Solar ${solar} Watt, ${art === 'bezug' ? 'Netzbezug' : 'Einspeisung'} ${watt} Watt`,
  ertrag: 'Ertrag',
  ertragSr: (euro: string) => `Ertrag ${euro} Euro pro Stunde`,
},
uebersicht: {
  heuteErtrag: 'Ertrag',
  heuteSr: (kwh: string, euro: string, ertrag: boolean) =>
    `Heute ${kwh} Kilowattstunden, ${ertrag ? 'Ertrag ' : ''}${euro} Euro`,
  netzHeute: (bezug: string, einsp: string) => `Netz heute: Bezug ${bezug} · Einspeisung ${einsp}`,
  netzHeuteSr: (bezug: string, einsp: string) => `Netz heute: Bezug ${bezug} Kilowattstunden, Einspeisung ${einsp} Kilowattstunden`,
  verguetung: 'Einspeisevergütung',
  verguetungSr: (preis: string) => `Einspeisevergütung ${preis} Euro pro Kilowattstunde`,
  infoText: 'Schätzung auf Basis typischer Geräteleistungen und der eingestellten Sonne, gezählt seit 00:00 Uhr. Kosten = Netzbezug × Strompreis abzüglich Einspeisung × Einspeisevergütung.',
},
solar: {
  titel: 'Solaranlage',
  erzeugung: 'Erzeugung',
  erzeugungSr: (watt: string) => `Erzeugung ${watt} Watt`,
  spitzenleistung: (kwp: string) => `${kwp} kWp`,           // „9,8 kWp“
  spitzenleistungSr: (kwp: string) => `Spitzenleistung ${kwp} Kilowatt-Peak`,
  heuteErzeugt: 'Heute erzeugt',
  sonneLegende: 'Sonne gerade',
  stufeSr: (name: string, watt: string) => `${name}, ${watt} Watt`,
  busy: 'wird eingestellt …',
  dach: (watt: string) => `Solar ${watt}`,
  dachSr: (watt: string) => `Solaranlage ${watt} Watt`,
},
auto: {
  name: 'Elektroauto',
  zuhause: 'zu Hause',
  unterwegs: 'unterwegs',
  laedt: 'lädt',
  akku: (p: string) => `Akku ${p}`,                          // „Akku 64 %“
  akkuAbfahrt: (p: string) => `Akku ${p} bei Abfahrt`,
  vollIn: (h: number, m: number) => (h > 0 ? `voll in ${h} h ${m} min` : `voll in ${m} min`),
  vollInSr: (h: number, m: number) =>
    `voll in ${h > 0 ? `${h} ${h === 1 ? 'Stunde' : 'Stunden'} ` : ''}${m} ${m === 1 ? 'Minute' : 'Minuten'}`,
  voll: 'Akku voll',
  statusSr: (ort: string, p: number, laedt: boolean) => `Elektroauto ${ort}, Akku ${p} Prozent${laedt ? ', lädt' : ''}`,
  wegfahren: 'Wegfahren',
  zurueckkommen: 'Zurückkommen',
  wegfahrenSr: 'Elektroauto wegfahren lassen',
  zurueckSr: 'Elektroauto zurückkommen lassen',
  busy: 'Wird ausgeführt …',
  zuLeer: 'Akku zu leer zum Wegfahren (mindestens 15 %).',
  fahrtHinweis: 'Eine Fahrt verbraucht 15 % Akku.',
},
geraet: {
  sperreUnterwegs: 'Auto unterwegs',
  sperreVoll: 'Akku voll',
  sperreSr: (grund: string) => `nicht verfügbar: ${grund}`,   // „Elektroauto ist unterwegs“ / „Akku ist voll“
},
haus: {
  etage: { OG: 'Obergeschoss', EG: 'Erdgeschoss', Außen: 'Außenbereich' },
  aussen: 'Außen',
  carportAuto: (zustand: 'laedt' | 'zuhause' | 'unterwegs', p: string) =>
    zustand === 'unterwegs' ? 'Auto unterwegs' : `Auto ${zustand === 'laedt' ? 'lädt' : 'zu Hause'} ${p}`,
  carportName: (watt: string, auto: string) => `Carport, ${watt}, ${auto} – zur Raumkarte`,
      // auto z. B. „Elektroauto lädt, Akku 64 %“ | „Elektroauto zu Hause, Akku 50 %“ | „Elektroauto unterwegs“
  legende: 'Warm leuchtend: Licht ist an. Blitz: Auto lädt.',
},
toast: {
  sonne: (stufe: string, watt: string) => `Sonne: ${stufe} · Solar ${watt}`,
  autoWeg: 'Elektroauto weggefahren',
  autoWegLaden: 'Elektroauto weggefahren, Laden beendet',
  autoZurueck: (p: string) => `Elektroauto zurück · Akku ${p}`,
  akkuVoll: 'Akku voll – Laden beendet (Carport)',
  fehlerSonne: 'Sonne konnte nicht eingestellt werden. Bitte erneut versuchen.',
  fehlerAuto: (weg: boolean) =>
    `Elektroauto konnte nicht ${weg ? 'wegfahren' : 'zurückkommen'}. Bitte erneut versuchen.`,
},
ansage: {
  sonne: (stufe: string, solar: string, netz: string) => `Sonne: ${stufe}. Solar ${solar}. ${netz}`,
      // netz: „Netzbezug 2.745 Watt.“ | „Einspeisung 8.252 Watt.“
  autoWeg: (haus: string) => `Elektroauto weggefahren. ${haus}`,
  autoZurueck: (p: string) => `Elektroauto zurück, Akku ${p} Prozent.`,
  akkuVoll: (haus: string) => `Akku voll, Laden beendet. ${haus}`,
},
```

Toast-/Ansage-Tabelle (Ergänzung „Live-Verbrauch und Änderungsmeldungen“):

| `ursache.art` | Toast | Ansage |
|---|---|---|
| `sonne` | Art `solar`: „Sonne: Sonnig · Solar 8.330 W“ | „Sonne: Sonnig. Solar 8.330 Watt. Einspeisung 8.252 Watt.“ |
| `auto` (weg, Laden lief) | „−10.997 W · Elektroauto weggefahren, Laden beendet“ | „Elektroauto weggefahren. Hausverbrauch 78 Watt.“ |
| `auto` (weg, ohne Laden) | Art `info`: „Elektroauto weggefahren“ | „Elektroauto weggefahren. Hausverbrauch 78 Watt.“ |
| `auto` (zurück) | Art `info`: „Elektroauto zurück · Akku 35 %“ | „Elektroauto zurück, Akku 35 Prozent.“ |
| `akkuVoll` | „−10.997 W · Akku voll – Laden beendet (Carport)“ | „Akku voll, Laden beendet. Hausverbrauch 78 Watt.“ |
| `geraet` Wallbox | „+10.997 W · Wallbox (Carport)“ (bestehendes Format) | „Wallbox an. Hausverbrauch 11.075 Watt.“ |

Neue Formatierer in `format.ts`: `akku(prozent) → „64 %“`, `kwp(w) → „9,8 kWp“` (eine Nachkommastelle), bestehende `euro`/`euroProStunde` für Ertrag (Betrag, ohne Vorzeichen).

Szenen-Untertitel bleiben (E-11: „Alles aus – Grundlast bleibt an“ ist weiterhin wahr; das Ende des Ladens zeigt die Meldung).

#### 5.4.6 Design-Tokens (DESIGN.md + `src/ui/farbtokens.ts`)

Neue Rollen (34 → **36** je Theme). Farbton **Petrol/Teal**, bewusst verschieden von Bernstein `on` („ist an / verbraucht“) und Grün (`load-low`, `delta-down`, `status-ok`).

| Rolle | Hell | Dunkel | Einsatz |
|---|---|---|---|
| `solar` | `#0F766E` | `#2DD4BF` | Solarwert und -symbol im Kopf, Erzeugung, Dach-Solartext, Modulkontur, Toast-Art `solar` |
| `solar-soft` | `#CCFBF1` | `#0B2F2C` | Symbolkreis der Solaranlage, Modulfüllung bei Erzeugung > 0 |

Kontraste (WCAG-2.x-Formel, berechnet 2026-09-27; alle neuen Paare in `KONTRAST_PAARE`):

| Paar | Hell | Dunkel | Soll |
|---|---|---|---|
| `solar` / `surface` | 5,47:1 | 9,15:1 | ≥ 4,5 |
| `solar` / `bg` | 5,06:1 | 10,12:1 | ≥ 4,5 |
| `solar` / `surface-raised` | 5,47:1 | 8,34:1 | ≥ 4,5 |
| `solar` / `surface-sunken` | 4,79:1 | 9,60:1 | ≥ 4,5 |
| `solar` / `solar-soft` | 4,86:1 | 7,74:1 | ≥ 4,5 |
| `solar` / `room-off` | 4,53:1 | 8,13:1 | ≥ 4,5 |
| `ink` / `solar-soft` | 15,74:1 | 13,15:1 | ≥ 4,5 |
| `ink-secondary` / `solar-soft` | 6,71:1 | 7,84:1 | ≥ 4,5 |
| `focus` / `solar-soft` | 5,95:1 | 7,99:1 | ≥ 3 |
| `ink-secondary` / `surface-sunken` (Akku-Balken auf Spur) | 6,62:1 | 9,73:1 | ≥ 3 |

Bestehende Paare decken Laden ab (`on`/`surface` 5,02/10,20; `on`/`room-off` 4,16/9,06). Akku-Balken: Spur `surface-sunken`, Füllung `ink-secondary` (neutral; „lädt“ trägt Text + Blitz `on`). `globals.css`: `@theme inline` um `--color-solar`, `--color-solar-soft` ergänzen.

Weitere Token-Änderungen: `spacing.header-height` 116 → **136 px**; `header-height-desktop` 88 px (≥ 1280) bzw. **112 px** (1024–1279); neue Symbole `auto`, `blitz`, `wallbox`, `solar` (Lucide-Stil, `aria-hidden`); `GERAETE_SYMBOL.wallbox = 'wallbox'`. „Do's and Don'ts“ + „`solar` ausschließlich für Erzeugung/Einspeisung, nie für ‚an‘“.

### 5.5 Readiness-Report – Fortschreibung der Konfliktauflösung

| ID | Fortschreibung |
|---|---|
| K-01 | 36 Rollen je Theme (+ `solar`, `solar-soft`). |
| K-05 | `KONTRAST_PAARE` + 10 Paare aus §5.4.6. |
| K-06 | Neue Komponenten: `NetzZeile`, `Solaranlage`, `SonnenWahl`, `Elektroauto`, `CarportFlaeche`. |
| K-14 | Sticky-Kopf zusätzlich mit Netz-Zeile (Werte, keine Bedienelemente); Sonnenwahl gehört **nicht** in den Kopf. |
| K-25 | Carport zählt als Raum („Außen · 1 von 1 an“); „Raum ausschalten“ entfällt dort (E-12). |
| K-31 (neu) | Laststufe und Delta-Chip bleiben am Hausverbrauch, die Netzbilanz hat keinen eigenen Chip und keine Zählanimation (E-19). |

---

## 6. Akzeptanzkriterien, Tests, Budget, Doku

### 6.1 Akzeptanzkriterien (Given / When / Then)

**Elektroauto & Laden**
- **AC-01** Given ein Server ohne gespeicherten Zustand, When er startet, Then ist das Elektroauto zu Hause mit 30.000 Wh (Anzeige „Akku 50 %“), die Wallbox *Aus*, die Sonnenlage „Nacht“ und der Hausverbrauch „78 W“.
- **AC-02** Given Auto zu Hause mit 50 %, When die Wallbox eingeschaltet wird, Then zeigen alle Clients ≤ 1 s später 11.075 W, Laststufe „hoch“, „3,88 €/h“, die Meldung „+10.997 W · Wallbox (Carport)“ und am Auto „lädt · voll in 2 h 44 min“.
- **AC-03** Given die Wallbox lädt seit 196,4 s ab 50 %, When ein Client die Seite neu lädt, Then zeigt er „Akku 51 %“ (abgerundet, aus Snapshot + Extrapolation), identisch zu anderen Clients (± 1 %-Punkt nur an der Umschaltgrenze).
- **AC-04** Given die Wallbox lädt ab 50 %, When 9.818 s (± 1 s) vergangen sind, Then schaltet der Server die Wallbox aus, der Akku steht auf 60.000 Wh („Akku voll“), alle Clients zeigen „−10.997 W · Akku voll – Laden beendet (Carport)“, die Wallbox-Zeile ist gesperrt mit Grund „Akku voll“.
- **AC-05** Given das Auto ist unterwegs, When jemand die Wallbox-Zeile aktiviert, Then passiert nichts (aria-disabled) und der Screenreader nennt „nicht verfügbar: Elektroauto ist unterwegs“; ein direkt gesendeter Befehl `schalten carport.wallbox an:true` wird mit `fehler NICHT_MOEGLICH` beantwortet, der Zustand bleibt unverändert.
- **AC-06** Given die Wallbox lädt, When „Wegfahren“ gewählt wird, Then setzt **eine** `aenderung` das Auto auf unterwegs und die Wallbox auf *Aus*, alle Clients zeigen „−10.997 W · Elektroauto weggefahren, Laden beendet“, und der Akkustand bleibt auf dem Wert bei Abfahrt.
- **AC-07** Given das Auto ist mit 64 % unterwegs, When „Zurückkommen“ gewählt wird, Then ist es zu Hause mit 49 % („Elektroauto zurück · Akku 49 %“) und die Wallbox wieder bedienbar.
- **AC-08** Given das Auto steht mit 14 % zu Hause, When die Carport-Karte angezeigt wird, Then ist „Wegfahren“ gesperrt mit sichtbarem Grund „Akku zu leer zum Wegfahren (mindestens 15 %).“; ein direkter Befehl `auto zuhause:false` ergibt `NICHT_MOEGLICH`.
- **AC-09** Given die Wallbox lädt, When „Alles aus“ oder „Gute Nacht“ ausgeführt wird, Then ist die Wallbox *Aus*; Given beliebiger Zustand, When eine beliebige Szene ausgeführt wird, Then ändert sie weder Wallbox-Einschalten noch Auto-Ort noch Sonnenlage.
- **AC-10** Given die Wallbox lädt und der Server wird 30 min gestoppt, When er neu startet, Then ist der Akkustand um höchstens die Ladung bis zum letzten 60-s-Takt bzw. SIGTERM-Flush höher als vor dem Stopp (Ausfallzeit lädt nicht), und das Laden läuft weiter.
- **AC-11** Given ein gespeicherter Zustand mit Auto unterwegs und Wallbox *An* (inkonsistent), When der Server startet, Then ist die Wallbox *Aus* und so gespeichert.

**Solaranlage & Netzbilanz**
- **AC-12** Given Ausgangszustand, When ein Client „Sonnig“ wählt, Then zeigen alle Clients ≤ 1 s später „Solar 8.330 W · Einspeisung 8.252 W“ und „Ertrag 0,66 €/h“, die Meldung „Sonne: Sonnig · Solar 8.330 W“, keinen Delta-Chip, und der Hausverbrauch bleibt „78 W“ ohne Zählanimation.
- **AC-13** Given Sonne „Sonnig“ und die Wallbox lädt, Then zeigt der Kopf „Netzbezug 2.745 W“ und „0,96 €/h“; Laststufe „hoch“ (Basis Hausverbrauch).
- **AC-14** Given Sonne „Nacht“, Then rechnen Kopf und Übersicht wie 2.0 (Netzbezug = Hausverbrauch, Kosten = Hausverbrauch × Strompreis, Tageskosten = Tagesverbrauch × Strompreis), die Netz-Zeile zeigt „Solar 0 W · Netzbezug ‹Hausverbrauch› W“.
- **AC-15** Given Sonne „Heiter“, When der Server neu startet, Then ist „Heiter“ wieder gesetzt (retained `iot-haus/v2/solar/sonne`).
- **AC-16** Given ein Client wählt eine Stufe, When keine Bestätigung binnen 5 s kommt, Then springt die Auswahl auf den Serverwert zurück und es erscheint „Sonne konnte nicht eingestellt werden. Bitte erneut versuchen.“
- **AC-17** Given Verbrauch 2.000 W und Sonne „Wolkig“, When 30 min simuliert werden, Then gilt: Tagesverbrauch 1,00 kWh, Bezug 0,00 kWh, Einspeisung 0,72 kWh (715 Wh), „Heute erzeugt 1,72 kWh“; Tageskosten = −0,06 € → Anzeige „Heute 1,00 kWh · Ertrag 0,06 €“.
- **AC-18** Given ein retained Energie-Payload `v: 1` von 2.0 (`wh: 3420`), When 2.1 startet (gleicher Tag), Then gilt `bezugWh = 3420`, `einspeisungWh = 0` und „Heute 3,42 kWh · 1,20 €“.
- **AC-19** Given `EINSPEISEVERGUETUNG_EUR_PRO_KWH=abc`, When der Server startet, Then gilt 0,08 und das Log enthält genau eine Zeile `einspeiseverguetung_ungueltig`.

**Darstellung, A11y, Kompatibilität, Release**
- **AC-20** Given 360 × 640 px, Then ist der Kopf ≤ 136 px hoch (≤ 30 %), zeigt Netz-Zeile ohne Umbruch, und die Seite hat kein horizontales Scrollen (auch 768/1024/1440, hell/dunkel).
- **AC-21** Given Tastatur, Then erreicht man nach den Szenen die Sonnenwahl mit einem Tab, wechselt die Stufe mit Pfeiltasten, erreicht die Carport-Fläche in der Hausansicht (Enter → Fokus auf h3 „Carport“) und darin „Wegfahren“ und die Wallbox.
- **AC-22** Given Snapshot-Fixture „Auto lädt, Sonne Heiter“, Then meldet axe in Hell und Dunkel 0 Verstöße und der Kontrasttest besteht für alle 36 Rollen/Paare.
- **AC-23** Given ein offener 2.0-Tab, When der Server auf 2.1.0 aktualisiert wird, Then zeigt der Tab nach der Wiederverbindung „Neue Version verfügbar“, sendet keine Befehle und wirft keinen Fehler.
- **AC-24** Given Merge auf main nach Stakeholder-Zustimmung, Then erzeugt `ci-release.yml` Tag `v2.1.0`, Image `:2.1.0`/`:latest` und das GitHub Release mit `.github/release-hinweise/v2.1.0.md`; `/api/health` meldet `"version": "2.1.0"`.
- **AC-25** Given Screenreader, When die Wallbox eingeschaltet wird, Then sagt die Live-Region (nach dem 2-s-Fenster) „Wallbox an. Hausverbrauch 11.075 Watt.“; When „Sonnig“ gewählt wird: „Sonne: Sonnig. Solar 8.330 Watt. Einspeisung 8.252 Watt.“

### 6.2 Tests (neu/geändert)

| # | Ebene / Datei | Inhalt |
|---|---|---|
| T-01 | `src/domain/katalog.test.ts` | 29 Geräte, 7 Räume, Wallbox-Werte, Kategorie Mobilität, Carport 1 Gerät, Hausräume ≥ 3 |
| T-02 | `src/domain/verbrauch.test.ts` | Kontrollsummen 78,3 / 13,3 / 23.978 W; `netzbilanz` (Bezug, Einspeisung, 0/0, Grenzfall Gleichstand); `ertragProStunde`; `tagesKosten` negativ; `tagesErzeugungWh` |
| T-03 | `src/domain/solar.test.ts` (neu) | Erzeugung je Stufe 0/980/3.430/6.370/8.330; `istSonnenStufe` |
| T-04 | `src/domain/elektroauto.test.ts` (neu) | `akkuWhBei` (lädt/nicht, unterwegs, Deckel 60.000), `akkuProzent` (abrunden, 100 nur voll), `restLadezeitMs` (9.818.182 ms ab 50 %), `darfLaden`, `darfWegfahren` (Grenze 9.000 Wh), `nachRueckkehr` |
| T-05 | `src/domain/energie-format.test.ts` | Dreifach-Integration (AC-17), Tageswechsel für alle drei Reihen; `akku`, `kwp` |
| T-06 | `src/domain/befehle.test.ts` | Prüfmatrix `sonne`/`auto` (Zusatzfelder, falsche Typen, unbekannte Stufe); `pruefeRegel` (Laden unterwegs/voll, Wegfahren < 15 %); `erzwingeLadeRegeln`; Szenen schalten Wallbox nie ein, „Alles aus“ schaltet sie aus |
| T-07 | `server/zustandsdienst.test.ts` | Fake-Timer: Akku-voll nach 9.818 s; Wegfahren = eine Änderung inkl. Wallbox; Rückkehr −9.000 Wh; Energie-Takt persistiert Auto und sendet `energie.auto`; Restart ohne Ausfallladung; Restore-Normalisierung; Sonne ändert Energie-Integration ab Umschaltzeitpunkt |
| T-08 | `server/mqtt-speicher.test.ts` (neu oder Erweiterung) | `uebernimmGespeichert` für `auto/zustand`, `solar/sonne`, Energie v1→v2-Migration, ungültige Payloads |
| T-09 | `server/konfig.test.ts` | Einspeisevergütung: leer, `0`, `0.1`, `abc`, `-1`, `0,08` |
| T-10 | `tests/integration/protokoll.test.ts` | `sonne` an 3 Clients verteilt; `auto` weg/zurück; `NICHT_MOEGLICH` mit `befehlId`; Snapshot-Felder vollständig |
| T-11 | `tests/integration/persistenz.test.ts` | Neustart gegen dieselbe aedes-Instanz: Sonne, Auto, Wallbox identisch; Energie-v1-Payload wird gelesen |
| T-12 | `src/client/hausReducer.test.ts` | Snapshot ohne neue Felder (Defaults); `aenderung` nur mit `sonne`/`auto`; Meldungstexte je Ursache (Tabelle §5.4.5); optimistische Sonne + Rücksprung; `energie.auto` |
| T-13 | `src/components/App.test.tsx` | Kopf Netz-Zeile (Bezug/Einspeisung/Ertrag), SonnenWahl (Radios, aria-busy, gesperrt), Carport-Karte (Wegfahren-Zustände, Wallbox-Sperrgrund, kein „Raum ausschalten“), CarportFlaeche-Name, axe hell/dunkel mit neuer Fixture |
| T-14 | `tests/architektur/kontrast.test.ts` | läuft automatisch über erweiterte `KONTRAST_PAARE`; Test erwartet 36 Rollen |
| T-15 | `tests/architektur/regeln.test.ts` | ID-Literal-Wächter deckt `carport.wallbox` ab (automatisch über `GERAETE_IDS`) |
| T-24 | `src/client/hausReducer.test.ts` | Kompatibilität: 2.0-Clientlogik mit 2.1-Snapshot (Version abweichend → `versionKonflikt`, keine Ausnahme) |

Rahmen: Coverage-Schwelle 90 % gilt auch für `elektroauto.ts`, `solar.ts`; Testlaufzeit gesamt ≤ 60 s (SM-C4) – Akku-Tests nur mit Fake-Timern.

### 6.3 JS-Budget

Aktuell 118 kB First Load. Erwartung 2.1: **≤ 126 kB** (+ ca. 5–7 kB für fünf kleine Komponenten, Texte, Domänenfunktionen). Harte CI-Grenze bleibt **200 kB** (`scripts/pruefe-js-budget.mjs` unverändert). Der gemessene Wert wird in `docs/abnahme-2.1.md` eingetragen; > 126 kB ist kein Fehler, muss aber begründet werden.

### 6.4 Doku

- `README.md`: Funktionen (Elektroauto, Solaranlage, Netzbilanz), Umgebungsvariable `EINSPEISEVERGUETUNG_EUR_PRO_KWH`, Hinweis „Upgrade 2.1.0: kein manueller Schritt“.
- `API.md` und `docs/api-contracts.md`: neue Befehle, Snapshot-/Änderungs-/Energie-Felder, Ursachen, Fehlercode, Topics inkl. `v: 2`-Migration.
- `docs/data-models.md`, `docs/architecture.md`, `docs/component-inventory.md`, `docs/project-overview.md`, `docs/source-tree-analysis.md`, `docs/development-guide.md`, `docs/deployment-guide.md`, `docs/index.md` (Verweis Abnahme 2.1).
- `DOCKER-SETUP.md`, `KUBERNETES.md`, `docker-compose.yml`, `docker-compose.prod.yml` (auskommentierte Variable).
- `.github/release-hinweise/v2.1.0.md` (**Pflicht**, sonst bricht der Release-Job ab): Neuerungen, „kein manueller Upgrade-Schritt“, neue Variable.
- `docs/abnahme-2.1.md` + Screenshots `docs/abnahme-2.1/` (360/768/1024/1440, hell/dunkel; Tastaturdurchlauf AC-21; VoiceOver AC-25; Zwei-Geräte-Sync der Sonnenlage; JS-Budget-Wert).
- Planungsartefakte: PRD, Architektur, DESIGN.md, EXPERIENCE.md, epics.md, Readiness-Report gemäß §5 fortschreiben.

---

## 7. Epic 8: Elektroauto & Solaranlage (neu in `epics.md`)

**Ziel:** Ein Elektroauto im Carport lädt, fährt weg und kommt zurück; eine Solaranlage erzeugt je nach gewählter Sonne; Kopf und Tageswerte zeigen Netzbezug, Einspeisung, Kosten und Ertrag. **FR:** FR-36 … FR-44 und geänderte FR aus §5.2.

| Story | Titel | Inhalt | Akzeptanz |
|---|---|---|---|
| 8.1 | Domäne: Carport, Elektroauto, Solar, Netzbilanz | `katalog.ts`, `elektroauto.ts`, `solar.ts`, `verbrauch.ts`, `energie.ts`, `befehle.ts`, `protokoll.ts`, `format.ts`; Bestandstests auf neue Kontrollsummen | T-01 … T-06, AC-01 (Domänenteil), AC-09, AC-17 |
| 8.2 | Server: Zustandsdienst, Persistenz, Konfiguration | Auto/Sonne im Zustandsdienst, Akku-Integration und -Timer, Topics + Migration, `NICHT_MOEGLICH`, Einspeisevergütung, Snapshot | T-07 … T-11, AC-04 … AC-06, AC-08, AC-10, AC-11, AC-15, AC-18, AC-19 |
| 8.3 | Client-Zustand und Meldungen | Reducer, `useHaus`, Meldungen, Ansagen, Microcopy `texte.ts` | T-12, T-24, AC-23, AC-25 |
| 8.4 | Kopf und Übersicht mit Netzbilanz | `NetzZeile`, `Kopfbereich`, `Uebersicht`, Tokens `solar`/`solar-soft` inkl. Kontrastpaare, `globals.css` | T-13 (Teil), T-14, AC-12 … AC-14, AC-20 |
| 8.5 | Bereich Solaranlage mit Sonnenwahl | `Solaranlage`, `SonnenWahl`, `App.tsx` | T-13 (Teil), AC-12, AC-16, AC-21 |
| 8.6 | Carport: Raumkarte, Elektroauto, Hausansicht | `Elektroauto`, `Raumkarte`, `GeraeteZeile` (`sperrGrund`), `CarportFlaeche`, `Hausansicht` (Dach-Solar, Außen-Zeile), `Symbol`, `VerbrauchNachRaum` | T-13 (Teil), AC-02, AC-03, AC-05, AC-07, AC-08, AC-21, AC-22 |
| 8.7 | Doku, Abnahme und Release 2.1.0 | Version 2.1.0, Release-Hinweise, Doku §6.4, `docs/abnahme-2.1.md`, JS-Budget-Messung, sprint-status | AC-24, NFR-10, §6.3 |

Reihenfolge 8.1 → 8.2 → 8.3 → (8.4 ∥ 8.5 ∥ 8.6) → 8.7. Code-Review (bmad-code-review) nach 8.6, Re-Review nach Korrekturen – wie bei 2.0.

---

## 8. Datei-für-Datei-Änderungsliste

**Neu**
- `src/domain/elektroauto.ts`, `src/domain/elektroauto.test.ts`
- `src/domain/solar.ts`, `src/domain/solar.test.ts`
- `src/components/NetzZeile.tsx`, `src/components/Solaranlage.tsx`, `src/components/SonnenWahl.tsx`, `src/components/Elektroauto.tsx`, `src/components/CarportFlaeche.tsx`
- `server/mqtt-speicher.test.ts` (falls noch nicht vorhanden; sonst Erweiterung)
- `.github/release-hinweise/v2.1.0.md`
- `docs/abnahme-2.1.md`, `docs/abnahme-2.1/*.png`

**Ändern – Domäne**
- `src/domain/katalog.ts` – `Etage` + `'Außen'`, Kategorie `mobilitaet`, Symbol `wallbox`, Raum `carport`, Gerät `carport.wallbox`, `HAUS_ETAGEN`
- `src/domain/protokoll.ts` – `Energie`, `Befehl`, `UrsachenArt`, `FehlerCode`, `ServerNachricht` (§5.3.2)
- `src/domain/befehle.ts` – `FELDER`, `pruefeBefehl`, `pruefeRegel`, `erzwingeLadeRegeln`
- `src/domain/verbrauch.ts` – `netzbilanz`, `ertragProStunde`, `tagesKosten`, `tagesErzeugungWh`
- `src/domain/energie.ts` – `integriere` mit Erzeugung, drei Reihen
- `src/domain/format.ts` – `akku`, `kwp`
- `src/domain/szenen.ts` – keine Logikänderung (Kommentar: Wallbox ist Nicht-Grundlast)
- Tests: `katalog.test.ts`, `verbrauch.test.ts`, `befehle.test.ts`, `energie-format.test.ts`

**Ändern – Server**
- `server/zustandsdienst.ts` – Auto/Sonne, `aendere`-Signatur, `integriereBis` mit Akku, Akku-voll-Timer, Restore-Normalisierung, `fuehreAus`-Ergebnis, Snapshot/Energie-Nachricht
- `server/ws-verbindungen.ts` – `MELDUNGEN.NICHT_MOEGLICH`, Auswertung des `fuehreAus`-Ergebnisses
- `server/mqtt-speicher.ts` – Topics `auto/zustand`, `solar/sonne`, Energie `v: 2` + Migration, `speichereAuto`, `speichereSonne`, `Gespeichert` erweitert
- `server/konfig.ts` – `leseEuroProKwh`, `leseEinspeiseverguetung`
- `server/app.ts`, `server/index.ts` – Option `einspeiseverguetung`
- Tests: `server/zustandsdienst.test.ts`, `server/konfig.test.ts`, `tests/integration/protokoll.test.ts`, `tests/integration/persistenz.test.ts`, `tests/integration/hilfen.ts`

**Ändern – Client/UI**
- `src/client/hausReducer.ts` (+ Test) – §5.3.6
- `src/hooks/useHaus.tsx` – `sonne()`, `auto()`
- `src/ui/texte.ts` – §5.4.5
- `src/ui/farbtokens.ts` – 2 Rollen, Werte, Paare
- `src/app/globals.css` – `@theme inline` für `solar`, `solar-soft`
- `src/components/Kopfbereich.tsx` – Netz-Zeile, Kosten/Ertrag, Layout mobil/desktop/kompakt
- `src/components/Uebersicht.tsx` – Heute netto, Netz heute, Einspeisevergütung
- `src/components/App.tsx` – `<Solaranlage />` nach der Szenenleiste
- `src/components/Hausansicht.tsx` – Dach-Solar, Außen-Zeile mit `CarportFlaeche`, Legende
- `src/components/RaumFlaeche.tsx` – unverändert für Hausräume (Carport eigene Komponente)
- `src/components/Raumkarte.tsx` – Carport: `Elektroauto`-Block, kein `RaumAusKnopf`, `sperrGrund` für Wallbox (Erkennung über `ELEKTROAUTO.ladegeraet`, keine ID-Literale)
- `src/components/GeraeteZeile.tsx` – Prop `sperrGrund`
- `src/components/Meldungen.tsx` – Art `solar`
- `src/components/Symbol.tsx` – `auto`, `blitz`, `wallbox`, `solar`; `GERAETE_SYMBOL.wallbox`
- `src/components/VerbrauchNachRaum.tsx` – Skeleton mit 7 Zeilen (aus `RAEUME.length`)
- `src/components/App.test.tsx`, `tests/fixtures/snapshot.ts` (Version 2.1.0, Felder `auto`, `sonne`, `einspeiseverguetung`, Energie v2; zweite Fixture „Auto lädt, Heiter“)

**Ändern – Betrieb/Doku**
- `package.json`, `package-lock.json` – Version 2.1.0
- `README.md`, `API.md`, `DOCKER-SETUP.md`, `KUBERNETES.md`, `docker-compose.yml`, `docker-compose.prod.yml`
- `docs/api-contracts.md`, `docs/data-models.md`, `docs/architecture.md`, `docs/component-inventory.md`, `docs/project-overview.md`, `docs/source-tree-analysis.md`, `docs/development-guide.md`, `docs/deployment-guide.md`, `docs/index.md`
- Planung: `prd.md`, `architecture.md`, `ux-designs/ux-iot-haus-2026-09-26/DESIGN.md`, `EXPERIENCE.md`, `epics.md`, `implementation-readiness-report-2026-09-26.md` (K-Fortschreibung), `_bmad-output/implementation-artifacts/sprint-status.yaml` (Epic 8)

**Unverändert (bewusst)**
- `server/ursprung.ts`, `server/log.ts`, `server/version.ts`, `src/client/verbindung.ts`, `Dockerfile`, `docker/*`, `.github/workflows/ci-release.yml`, `scripts/pruefe-js-budget.mjs`, `scripts/smoke-container.mjs`, `src/domain/szenen.ts`-Definitionen, Rate-Limit-Konstanten.

---

## 9. Entscheidungsprotokoll (E-01 …)

| ID | Frage | Entscheidung | Begründung | Rolle |
|---|---|---|---|---|
| E-01 | Wo lebt das Auto? | Neuer Außenbereich **Carport** als 7. Raum (Etage „Außen“), nicht Garage im Haus | Hausraster 2 × 3 bleibt; Raumkarte, „Verbrauch nach Raum“, Sprung und Tagesenergie funktionieren ohne Sonderpfad | Winston/Sally |
| E-02 | Ist Laden ein eigener Schalter? | Ja: **Wallbox** als Katalog-Gerät `carport.wallbox`, *An* = Laden | Nutzt Gerätezeile, Schaltbefehl, Optimismus, Meldungen, Integration; keine Parallelwelt | Winston |
| E-03 | Ladeleistung | **11 kW** konstant | Übliche private Wallbox (dreiphasig 16 A); realistisch (SM-C1) | John |
| E-04 | Akku | **60 kWh** netto, Start **50 %**, zu Hause | Typisches Kompakt-E-Auto; 50 % macht Laden und Wegfahren sofort möglich | John |
| E-05 | Laden nur zu Hause? | Ja, und nur < 100 %; UI sperrt mit Grund, Server lehnt mit `NICHT_MOEGLICH` ab | Physikalisch zwingend; doppelte Absicherung gegen Rennen zwischen Clients | Winston/Sally |
| E-06 | Laden beim Wegfahren? | Endet in **derselben** Änderung | Eine Änderung = ein konsistenter Zustand (FR-16) | Winston |
| E-07 | Fahrtverbrauch | Pauschal **9 kWh (15 %)**, abgezogen **bei Rückkehr**; Wegfahren erst ab 15 % | Zeitbasierter Verbrauch wäre in einer Demo unsichtbar klein oder unrealistisch; pauschal ist verständlich und testbar | John |
| E-08 | Akku-Anzeige | Ganze Prozent, **abgerundet**; „voll in h min“ | „100 %“ erscheint nur, wenn wirklich voll; Restzeit gibt beim langsamen Laden (1 % ≈ 3 min) Rückmeldung | Sally |
| E-09 | Akku-Simulation | Server integriert im Energie-Schritt; Clients extrapolieren mit derselben Domänenfunktion; `energie` trägt `auto` | Server bleibt Autorität, geladene Energie = integrierte Wallbox-Energie, kein zusätzlicher Takt | Winston |
| E-10 | Laden während Serverausfall | Zählt nicht (`stand = jetzt` beim Start) | Konsistent mit FR-10 („ohne Server kein Verbrauch“) | Winston |
| E-11 | Szenen und Laden | Wallbox ist Nicht-Grundlast: „Alles aus“/„Gute Nacht“ beenden das Laden; keine Szene startet es; Szenendefinitionen unverändert | Einfache, vorhersehbare Regel ohne neues Katalogmerkmal; Nachtladen startet man bewusst neu | John/Sally |
| E-12 | „Raum ausschalten“ im Carport | Entfällt | Nur ein schaltbares Gerät; der Knopf wäre ein Duplikat der Wallbox | Sally |
| E-13 | Bedienelement Auto | Schaltfläche „Wegfahren“/„Zurückkommen“, nicht optimistisch | Eine Handlung mit Folgen (Laden endet, Akku sinkt), kein An/Aus-Schalter; wie Szenen (K-26) | Sally |
| E-14 | Konfigurierbarkeit | kWp, Akku, Wallbox sind Katalogwerte, keine Umgebungsvariablen | Katalog ist fest und versioniert (FR-2); weniger Betriebsfläche | Winston |
| E-15 | Spitzenleistung | **9,8 kWp** | Typische Einfamilienhaus-Anlage | John |
| E-16 | Sonnen-Einstellung | **5 Stufen** (Nacht, Bedeckt, Wolkig, Heiter, Sonnig) als Radiogruppe statt Regler | Ein Befehl je Wahl, kein Befehlsstrom beim Ziehen, tastatur- und touchfreundlich, gleiche Optik wie Theme-Wahl; beantwortet „wie viel Sonne“ ausreichend fein | Sally |
| E-17 | Stufen-Anteile | 0 / 10 / 35 / 65 / 85 % der Spitzenleistung | 85 % bei voller Sonne bildet Systemverluste realistisch ab (SM-C1) | John |
| E-18 | Sonnenlage teilen/speichern | Serverzustand, an alle verteilt, retained gespeichert; Start „**Nacht**“ | Server ist Autorität (FR-14); „Nacht“ lässt alle 2.0-Zahlen nach dem Upgrade unverändert | Winston/John |
| E-19 | Hero und Laststufe | Hero bleibt **Hausverbrauch**; Laststufe, Delta-Chip, Zählanimation beziehen sich weiter darauf | „Was verbraucht das Haus“ ist der Kern des Produkts; stabile Tests; Netz ist eine zweite, ruhige Größe | John/Sally |
| E-20 | Netzbilanz-Rechnung | Aus gerundetem Verbrauch und gerundeter Erzeugung | Die drei sichtbaren Zahlen addieren sich exakt (wie FR-11) | Winston |
| E-21 | Kosten pro Stunde | Aus Netzbezug; bei Einspeisung „Ertrag … €/h“ statt negativer Kosten | Negative Euro-Beträge und „+“ bei Geld wären mit dem Watt-Delta verwechselbar; das Wort trägt die Bedeutung | Sally |
| E-22 | Einspeisevergütung | **0,08 €/kWh**, `EINSPEISEVERGUETUNG_EUR_PRO_KWH`, Regeln wie Strompreis | Realistische Größenordnung für Kleinanlagen; Betreiber kann anpassen | John |
| E-23 | Tagesbilanz | Server integriert Verbrauch, Bezug, Einspeisung; Erzeugung abgeleitet; Eigenverbrauch nicht angezeigt; „Heute … €“ = Netto | Konsistente, exakte Integration (stückweise konstant); Anzeige bleibt schlank | Winston/Sally |
| E-24 | Energie-Topic | `v: 2`, liest `v: 1` mit `bezugWh = wh` | Tageswert überlebt das Upgrade ohne Sprung | Winston |
| E-25 | Neue Topics | `iot-haus/v2/auto/zustand`, `iot-haus/v2/solar/sonne`, Präfix bleibt | Kein Schemabruch, Restore-Fenster erfasst sie automatisch | Winston |
| E-26 | Protokoll-Erweiterung | 2 Befehle, 1 Fehlercode, 3 Ursachen, optionale Felder; keine neuen Nachrichtentypen | Minimale Fläche; Versionsbanner schützt alte Tabs | Winston |
| E-27 | Härtung/Rate-Limit | Unverändert | Neue Befehle laufen durch denselben Token-Bucket und dieselbe Prüfung | Winston |
| E-28 | Farbe Solar | Petrol `#0F766E` / `#2DD4BF` + `solar-soft` | Bernstein heißt „verbraucht“, Grün heißt „weniger/ok“; eigene Farbe vermeidet Bedeutungskonflikt; Kontraste ≥ 4,5 | Sally |
| E-29 | Kopfbereich | Neue Netz-Zeile; mobil 136 px; kompakt nur Netzwert | Netzbilanz muss beim Schalten sichtbar sein; 21 % Höhe < 30 %-Grenze | Sally |
| E-30 | Platz der Sonnenwahl | Eigener Bereich „Solaranlage“ nach den Szenen | Kopf bleibt ohne Bedienelemente (FR-6/K-14); nah an den anderen Hausaktionen | Sally |
| E-31 | Wallbox-Standby | **3 W**, Kontrollsummen werden angepasst | Realistisch (SM-C1) statt geschönter 0 W; Aufwand nur in Test-Konstanten | John |
| E-32 | Ausschlüsse | Kein PV-Überschussladen, kein Speicher, kein 2. Auto, keine Ladeleistungswahl, keine Fahrtdauer, keine Tageszeit-Sonne, keine Ladeverluste | Automationen/Regeln sind weiterhin nicht Teil des Produkts (§6); hält 2.1 in einem Release lieferbar | John |
| E-33 | JS-Budget | Erwartung ≤ 126 kB, Gate 200 kB unverändert | Genug Luft; Messwert in Abnahme dokumentieren | Winston |
| E-34 | Meldung Sonnenwechsel | Eigene Art `solar`, ohne Delta | Hausverbrauch ändert sich nicht; die Meldung erklärt trotzdem, was passiert ist | Sally |
| E-35 | Release-Hinweise | `.github/release-hinweise/v2.1.0.md` ist Pflichtbestandteil von Story 8.7 | Der Release-Job bricht ohne die Datei ab | Winston |
| E-36 | Upgrade | Version 2.1.0, kein manueller Schritt, alte Tabs per Banner | Bestehender Mechanismus reicht; NFR-9 bleibt erfüllt | John |

---

## 10. Implementation Handoff

**Scope-Klassifikation:** **Moderate** – neues Epic mit 7 Stories und Fortschreibung der Planungsartefakte; keine Neuplanung, keine Architekturwende.

| Empfänger | Aufgabe |
|---|---|
| John (PM) | PRD 2.1 gemäß §5.2 fortschreiben; `epics.md` um Epic 8 (§7) ergänzen. |
| Winston (Architekt) | `architecture.md` §3.12, §5.3.7 (AD-23 … AD-27), §8-Dateiliste; Readiness-Report K-Fortschreibung (§5.5). |
| Sally (UX) | DESIGN.md (Tokens, Kopfhöhe, Komponenten-Optik), EXPERIENCE.md (IA, Wireframes, Bausteine, Microcopy, A11y) gemäß §5.4. |
| Amelia (Dev) | sprint-status.yaml um `epic-8` + Stories 8-1 … 8-7 (`backlog`) ergänzen; Stories per `bmad-create-story` anlegen und in der Reihenfolge §7 umsetzen; CI grün halten. |
| Review | `bmad-code-review` nach Story 8.6, Re-Review nach Korrekturen. |
| Stakeholder | **Vor dem Merge auf main** holt der Entwickler per Dialog die Zustimmung von Deltatree ein (Spielregel 00-auftrag-2.1.md). |

**Erfolgskriterien:**
1. Alle AC-01 … AC-25 erfüllt und durch Tests T-01 … T-24 bzw. `docs/abnahme-2.1.md` belegt.
2. CI grün: Lint 0/0, Typecheck, Tests ≤ 60 s mit Coverage ≥ 90 % (Domäne inkl. `elektroauto.ts`, `solar.ts`), `next build`, JS-Budget ≤ 200 kB (Erwartung ≤ 126 kB), `npm audit`.
3. Nach Merge: `v2.1.0`, `:2.1.0`, `:latest`, GitHub Release mit Hinweisen; Container ≤ 60 s `healthy`, `/api/health` meldet 2.1.0; nach Neustart sind Sonnenlage, Auto und Tageswerte erhalten.
4. Mit Sonne „Nacht“ sind alle 2.0-Anzeigen zahlengleich (bis auf die Wallbox-Standby-3-W in den Kontrollsummen).

Correct-Course-Workflow abgeschlossen, Deltatree. Nächster Schritt: Artefakte gemäß §5 fortschreiben und Story 8.1 anlegen.
