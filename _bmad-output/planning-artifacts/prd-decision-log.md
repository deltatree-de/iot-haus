---
title: Entscheidungsprotokoll PRD IoT-Haus 2.0
created: 2026-09-26
updated: 2026-09-26
owner: John (BMAD PM), headless
---

# Entscheidungsprotokoll – PRD „IoT-Haus 2.0 – Best UX ever“

Kanonisches Gedächtnis und Audit-Trail des PRD-Laufs. Der Stakeholder steht laut `00-auftrag.md` nicht zur Verfügung; jede offene Frage hat das BMAD-Team (PM John) selbst entschieden. Jede Entscheidung nennt: Kontext, Entscheidung, Begründung, Verbleib (PRD/Addendum/verworfen).

## Lauf-Metadaten

- **Modus:** Headless, Intent *Create* (kein PRD vorhanden).
- **Eingaben:** `00-auftrag.md` (Stakeholder-Auftrag + Spielregeln), Auftrag des aufrufenden Agenten (Scope-Vorgaben), Code-Scan (`src/`, `server.js`, `Dockerfile`, `docker/*`, `docker-compose*.yml`, `.github/workflows/*`, `README.md`).
- **Research-Subagenten:** nicht gestartet. Begründung: Wettbewerbs-/Marktrecherche liefert für eine Demo-/Hausautomations-Simulation ohne Markt keinen Entscheidungswert; Leistungswerte stammen aus allgemein bekannten Haushaltsgeräte-Kennwerten (siehe D-08).
- **Stakes-Kalibrierung:** Internes Produkt mit Produktivbetrieb (docker-compose, `:latest`) → mittlere Rigorosität, PRD ca. 8–12 Seiten.
- **Working mode:** Fast path (headless) – keine `[ASSUMPTION]`-Lücken offen gelassen, sondern als Entscheidungen protokolliert.

## Abweichungen von Skill-Standards (Headless-Overrides)

- **O-01 Ablageort.** Skill-Default wäre `planning-artifacts/prds/prd-iot-haus-2026-09-26/`. Der Aufrufer verlangt `planning-artifacts/prd.md`. → Ablage direkt in `planning-artifacts/`. Companion-Dateien heißen `prd-decision-log.md` und `prd-addendum.md` (statt `.decision-log.md` / `addendum.md`), damit sie im gemeinsamen Ordner nicht mit Architektur-/UX-Artefakten kollidieren und sichtbar sind.
- **O-02 Reviewer-Gate.** Rubrik-Review als ein Subagent gegen `prd.md` ausgeführt (Ergebnis: `prd-review-rubric.md`). Keine weiteren `finalize_reviewers` konfiguriert.
- **O-03 Polish.** Editorial-Skills (`bmad-editorial-review-structure`/`-prose`) nicht als eigene Läufe gestartet; stattdessen strukturelle und sprachliche Selbstprüfung beim Schreiben. Begründung: Headless, ein Autor, nachgelagert folgen Architektur, UX und Readiness-Check, die das Dokument ohnehin prüfen.
- **O-04 Status.** Frontmatter `status: final`, weil keine offenen Fragen verbleiben (Spielregel: nichts wird vertagt).

## Produktentscheidungen

- **D-01 Produktrahmen.** Das Produkt bleibt eine *Simulation* eines Hauses (keine echte Hardware). Begründung: Auftrag verlangt „mikrowelle, fernseher … adden“, nicht Hardware-Integration; echte Geräteanbindung wäre an einem Tag nicht lieferbar. → PRD §1, §6.
- **D-02 Raummodell.** 2 Etagen × 3 Räume = 6 Räume (EG: Wohnzimmer, Küche, Hauswirtschaftsraum; OG: Schlafzimmer, Badezimmer, Arbeitszimmer). Begründung: Die verlangten Geräte (Waschmaschine, PC, Router, Föhn) brauchen plausible Orte; 4 Räume würden Küche und Wohnzimmer überfrachten. 6 Räume passen weiterhin in eine übersichtliche Hausansicht. → PRD FR-1.
- **D-03 Raum-IDs.** Neue sprechende IDs (`wohnzimmer`, `kueche`, `hwr`, `schlafzimmer`, `bad`, `arbeitszimmer`) statt `room_1_left` usw. Begründung: Topics und Katalog werden ohnehin neu geschnitten; alte Topics waren nicht retained, es gibt keinen Altbestand zu migrieren. → Addendum A-2.
- **D-04 Gerätezustand zweiwertig.** Jedes Gerät ist *An* oder *Aus*; *Aus* bedeutet eingesteckt im Standby und zieht die Standby-Leistung. Ein dritter Zustand „vom Netz getrennt“ entfällt. Begründung: Auftrag verlangt „aktiv + standby“-Werte; zweiwertiger Schalter ist die einfachste, barrierearme Bedienung und macht Standby-Verbrauch trotzdem sichtbar. → PRD FR-3, §6.
- **D-05 Leistungswerte = mittlere Leistung im Betrieb.** Für zyklisch heizende Geräte (Backofen, Waschmaschine, Geschirrspüler, Trockner, Kühlgeräte) wird die *mittlere* Leistung über den Betrieb angesetzt, nicht die Spitzenleistung. Begründung: Nur so ist die kWh-Hochrechnung plausibel; Spitzenwerte würden Tageskosten grob überschätzen. UI kennzeichnet Werte als Schätzung. → PRD FR-2, Anhang A.
- **D-06 Grundlastgeräte.** Kühlschrank, Gefrierschrank und Router sind Grundlastgeräte: beim ersten Start an, von allen Szenen ausgenommen, Ausschalten nur nach Bestätigung. Begründung: „Alles aus“ darf nicht die Lebensmittel verderben oder das Netz kappen – das wäre schlechte UX. → PRD FR-4.
- **D-07 Automatische Abschaltung.** Wasserkocher (3 min) und Mikrowelle (3 min) schalten serverseitig automatisch ab; die Restzeit wird angezeigt. Begründung: realistisches Verhalten, macht Live-Sync sichtbar erlebbar, geringer Aufwand (Timer im Server). Weitere Geräte bewusst ohne Timer (Föhn/Heizlüfter wären reale Sicherheitsfunktionen, aber nicht zeitlich normiert). → PRD FR-5.
- **D-08 Gerätekatalog (28 Geräte).** Werte aus typischen Herstellerangaben/Verbraucherzentrale-Größenordnungen für einen deutschen Durchschnittshaushalt; siehe PRD Anhang A. Keine Recherche-Belege nötig, da Schätzwerte ausdrücklich als solche ausgewiesen werden. → PRD Anhang A.
- **D-09 Strompreis.** Standard 0,35 €/kWh (Größenordnung aktueller Neukundentarife Haushaltsstrom 2026; bewusst gerundet). Konfigurierbar per Umgebungsvariable, damit der Betreiber seinen Tarif eintragen kann, ohne neues Image. Kein Tarif-Editor in der UI. → PRD FR-9.
- **D-10 „Heute“-Werte serverseitig.** kWh und Kosten „heute“ integriert der Server ab 00:00 Uhr Europe/Berlin über den autoritativen Zustand; der Stand wird mindestens alle 60 s persistiert und nach Neustart übernommen, wenn das Datum übereinstimmt. Begründung: Browser-Sitzungswerte wären pro Gerät unterschiedlich – widerspricht dem Multi-Device-Versprechen. Maximaler Verlust bei Absturz: 60 s. → PRD FR-10.
- **D-11 Laststufen.** niedrig < 500 W, mittel 500–1.999 W, hoch ≥ 2.000 W. Begründung: Grundlast (~80 W) ist klar „niedrig“, ein einzelnes Großgerät (Wasserkocher, Heizlüfter) springt sichtbar auf „hoch“ – genau der Aha-Moment des Auftrags. → PRD FR-12.
- **D-12 Szenen.** Vier feste Szenen: „Alles aus“, „Filmabend“, „Morgenroutine“, „Gute Nacht“. Kein Szenen-Editor. Begründung: deckt die im Auftrag genannten Beispiele ab + „Gute Nacht“ als häufigster Alltagsfall; Editor ist an einem Tag nicht in bester UX-Qualität lieferbar → gestrichen (siehe §6). → PRD FR-22/23.
- **D-13 Raum-„Alles aus“.** Jede Raumkarte bietet „Alles aus“ für den Raum (ohne Grundlast). Begründung: häufigster Mehrfachbefehl, trivial auf derselben Serverfunktion wie Szenen. → PRD FR-27.
- **D-14 Rückgängig entfällt.** Kein Undo für Szenen. Begründung: Szenen sind idempotent, jedes Gerät ist mit einem Tipp zurückzuschalten; Undo verlangt Snapshot-Verwaltung und Zeitfenster-UX – Aufwand steht nicht im Verhältnis. → PRD §6.
- **D-15 Server-autoritativer Zustand.** Clients senden nur Befehle; der Node-Server validiert, hält den Zustand, veröffentlicht ihn retained über MQTT und schickt neuen Clients einen Snapshot. localStorage hält keinen Gerätezustand mehr; der alte Schlüssel `smart-home-state` wird beim Laden gelöscht. Begründung: behebt den im Auftrag genannten Autoritätsfehler an der Wurzel. → PRD FR-14–FR-19, Addendum A-2.
- **D-16 Optimistische Anzeige mit Bestätigung.** Schalter reagiert sofort (≤ 100 ms), zeigt „ausstehend“ bis zur Serverbestätigung; ohne Bestätigung nach 5 s Rücksetzen + Fehlermeldung. Begründung: gefühlte Geschwindigkeit ohne Zustandslügen. → PRD FR-21.
- **D-17 Offline-Verhalten.** Bei getrennter Verbindung werden Schalter deaktiviert (nicht versteckt) und ein Hinweisbanner erklärt den Zustand; keine Offline-Warteschlange. Begründung: Befehle gegen veralteten Zustand zu puffern erzeugt genau die Konflikte, die wir beheben. → PRD FR-20.
- **D-18 Konfliktregel.** Der Server verarbeitet Befehle strikt sequenziell; der zuletzt verarbeitete gewinnt, alle Clients konvergieren auf den Serverzustand. → PRD FR-19.
- **D-19 Protokoll-Whitelist.** Der WebSocket-Proxy akzeptiert von Browsern nur definierte Befehle (Gerät schalten, Szene, Raum aus) mit Größenlimit; beliebiges Publish/Subscribe entfällt. Begründung: Sicherheitshärtung aus PR #1/#2 fortsetzen; weniger Angriffsfläche. → PRD FR-18, NFR-4.
- **D-20 Keine Authentifizierung.** Wie bisher kein Login. Begründung: Betrieb im Heimnetz/hinter Reverse-Proxy; Nutzerverwaltung ist an einem Tag nicht sicher lieferbar. In der Doku wird ein Reverse-Proxy mit Auth für Internet-Exposition empfohlen. → PRD §6, FR-34.
- **D-21 Theme.** Drei Optionen System/Hell/Dunkel, Standard System, Wahl pro Browser in localStorage (reine Anzeigepräferenz, kein Gerätezustand). Kein Aufblitzen des falschen Themes beim Laden. → PRD FR-28.
- **D-22 Barrierefreiheit.** Ziel WCAG 2.2 AA; automatisiert mit axe in Komponententests (beide Themes) geprüft; Zoom-Sperre (`user-scalable=no`, `maximum-scale=1`) wird entfernt, weil sie WCAG 1.4.4 verletzt. → PRD NFR-2.
- **D-23 Zahlenformat.** de-DE: Leistung in ganzen Watt mit Tausenderpunkt („1.200 W“), Standby mit einer Nachkommastelle („0,5 W“), €/h mit zwei Nachkommastellen, kWh mit zwei Nachkommastellen. Keine automatische kW-Umschaltung. Begründung: ein Einheitensystem, Vergleichbarkeit beim Hochzählen. → PRD FR-29.
- **D-24 Healthcheck.** `/api/health` meldet 200 nur bei verbundenem Broker, sonst 503; Container-Healthcheck per Node-Einzeiler (kein curl/wget, Härtung bleibt). Healthcheck wandert zusätzlich ins Dockerfile. → PRD FR-30/31.
- **D-25 Qualitäts-Pipeline.** Neuer CI-Workflow (Lint, Typecheck, Tests, Build, npm audit high) auf PR und Push; Image-Publish auf main erst nach grüner CI. Testwerkzeuge in Addendum A-5. → PRD FR-32.
- **D-26 Version & Release.** Version 2.0.0 (Breaking: neue Topics/Protokoll, neue Raum-IDs). Push auf main → `:latest`; Tag `v2.0.0` → GitHub Release + `:2.0.0`. → PRD FR-33.
- **D-27 Aufräumen.** `useMockMqtt`, `shouldUseMock`, Root-Skripte `test-*.js` und Debug-`console.log`s werden entfernt; `MOBILE-OPTIMIZATION.md` und `BUILD-OPTIMIZATION.md` werden in README/DOCKER-SETUP konsolidiert und gelöscht. `.github/copilot-instructions.md` wird aktualisiert. → PRD FR-34/35.
- **D-28 Keine Browser-E2E-Suite.** Kein Playwright/Cypress. Begründung: Browser-Downloads in CI kosten Zeit und Flakiness; Abdeckung über Komponenten-Tests (jsdom + axe) und eine Protokoll-Integrationstestsuite mit mehreren WebSocket-Clients gegen den echten Server. → PRD §6, NFR-6.
- **D-29 Browserunterstützung.** Jeweils aktuelle zwei Hauptversionen von Chrome/Edge, Firefox, Safari (macOS/iOS). → PRD NFR-8.
- **D-30 Betriebskompatibilität.** Port 3000, Imagename, Compose-Datei und Volume `mosquitto-data` bleiben; Update = `docker compose pull && up -d`. → PRD NFR-9.

## Input-Abgleich (Finalize Schritt 2)

Abgleich `00-auftrag.md` gegen PRD, durchgeführt vom PM selbst (eine kurze Quelle, kein Subagent nötig):

- „anzeigen, was das Haus gerade verbraucht, wenn man was anschaltet“ → FR-6, FR-11 (Delta-Feedback), UJ-1. ✔
- „nicht nur Lichter, auch Mikrowelle, Fernseher und viele weitere“ → FR-2, Anhang A (28 Geräte). ✔
- „best user experience ever“ → Feature 4.5, NFR-1/2/3. ✔
- „nichts vertagt“ → §6 formuliert Streichungen als endgültig, keine Phase 2. ✔
- „100 % autonom bis prod per GitHub Action“ → FR-32/33. ✔
- Härtung nicht zurückdrehen → NFR-4. ✔
- Autoritätsfehler, toter Code, veraltete Doku, curl-Healthcheck → FR-14ff, FR-35, FR-34, FR-31. ✔

Keine Lücken.

## Reviewer-Gate (Finalize Schritt 3)

Rubrik-Review als Subagent, vollständiger Bericht: `prd-review-rubric.md`. Urteil: stark in Kohärenz und Rechenrichtigkeit; 0 kritisch, 4 hoch, 9 mittel, 15 niedrig. Alle hohen und mittleren Befunde wurden behoben (siehe unten).

## Review-Ergebnisse

- **R-H1 Release-Mechanismus** → FR-33 präzisiert: ein Workflow, Job nach grüner CI setzt Tag/Release/`:version`; Image-Tags abschließend `:latest`, `:‹version›`, `:sha-‹kurz›`; `release.yml` entfällt. Addendum A-5. (D-32)
- **R-H2 Healthcheck in Host-Compose** → NFR-9: einmaliger manueller Upgrade-Schritt, in README und Release-Notes als „Upgrade-Hinweis 2.0.0“; SM-3 präzisiert. (D-33)
- **R-H3 Prüfbarkeit UI** → NFR-2 um Kontrast-Unit-Test ergänzt, neue NFR-10 Abnahme-Checkliste `docs/abnahme-2.0.md`, JS-Budget-Prüfung in CI (NFR-1).
- **R-H4 Umfang ohne Puffer** → Gekürzt: Raumleiste-Chips, abgestufte Raumfüllung, lokale Tageswert-Hochrechnung (§6). A-8 mit 1,25 h Puffer. (D-31)
- **Mittel:** M-1 Persistenz (Mosquitto speichert nach jeder Änderung, SIGTERM-Flush), M-2 Ausfallzeit zählt nicht, M-3 Rundung kaufmännisch auf angezeigtem Wert (FR-29), Laststufe darauf, M-4 Szene ohne Änderung nur lokaler Hinweis, M-5 Ansagetext mit „Watt“, M-6 Sticky-Kopf nur 4 Elemente, M-7 UJ-2-Rang korrigiert, M-8 Raumaktion heißt „Raum ausschalten“, M-11 altes Protokoll abgelehnt + Banner „Neue Version verfügbar“. Damit sind alle 9 Mittel-Befunde behoben (der Bericht nummeriert M-1 bis M-8 und M-11).
- **Niedrig:** L-01, L-02, L-03, L-04, L-05, L-06, L-07 (entfällt durch Kürzung), L-08, L-09, L-10, L-11 (entfällt durch Kürzung), L-13, L-14, L-15 umgesetzt. L-12 (Zustandstabelle der Verbindung) wird von UX (Sally) im UX-Spec ausgearbeitet; die Anforderungen in FR-15/FR-20 sind ausreichend eindeutig.

## Entscheidungen aus dem Review

- **D-31 Kürzungen für Puffer.** Raumleiste, abgestufte Raumfüllung, lokale Hochrechnung des Tageswerts gestrichen; Begründung: Ein-Tages-Umfang braucht Puffer, der Nutzen ist durch Hausansicht-Sprung und 60-s-Aktualisierung gedeckt.
- **D-32 Release aus einem Workflow.** Tag, Release und Versions-Image entstehen im CI-Workflow nach grüner Qualitätsprüfung; Begründung: mit `GITHUB_TOKEN` gesetzte Tags lösen keine Folge-Workflows aus, und Tag-Builds hätten sonst kein CI-Gate.
- **D-33 Upgrade-Hinweis statt stiller Kompatibilität.** Den curl-Healthcheck in der Host-Compose-Datei kann das Image nicht überschreiben; ein dokumentierter einmaliger Schritt ist ehrlicher als die Behauptung „ohne manuelle Schritte“.
- **Finalisierung:** `status: final`, `updated: 2026-09-26`. Keine offenen Fragen.

