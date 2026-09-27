---
title: IoT-Haus 2.0 – Best UX ever
status: final
created: 2026-09-26
updated: 2026-09-27
version: 2.1.0
owner: John (BMAD PM)
inputs:
  - _bmad-output/planning-artifacts/00-auftrag.md
  - _bmad-output/planning-artifacts/00-auftrag-2.1.md
  - _bmad-output/planning-artifacts/sprint-change-proposal-2026-09-27.md
companions:
  - _bmad-output/planning-artifacts/prd-addendum.md
  - _bmad-output/planning-artifacts/prd-decision-log.md
---

# PRD: IoT-Haus 2.0 – Best UX ever

## 0. Zweck des Dokuments

Dieses PRD beschreibt den vollständigen Lieferumfang des Releases **2.1.0** von IoT-Haus (Basis 2.0.0, erweitert um Elektroauto und Solaranlage gemäß `sprint-change-proposal-2026-09-27.md`; Entscheidungen dort als E-nn). Es richtet sich an das BMAD-Team (UX, Architektur, Epics/Stories, Entwicklung, Review) und ist die verbindliche Grundlage für alle nachgelagerten Artefakte. Die Begriffe in §3 (Glossar) sind verbindlich. Funktionale Anforderungen (FR-1 bis FR-44) sind nach Features gruppiert und global nummeriert, übergreifende Qualitätsanforderungen stehen als NFR-1 bis NFR-10 in §5. Technische Umsetzungshinweise (Topic-Schema, Protokoll, Testwerkzeuge) stehen im Addendum `prd-addendum.md`; alle Entscheidungen samt Begründung im `prd-decision-log.md` (Verweise als D-nn).

Der Stakeholder steht nicht für Rückfragen zur Verfügung; das Team hat alle Fragen selbst entschieden. Es gibt **keine** offenen Fragen, keine Phase 2 und keine „später“-Punkte: Was nicht in diesem Release geliefert wird, ist in §6 als bewusst nicht Teil des Produkts aufgeführt. Der Umfang 2.0 war so geschnitten, dass eine erfahrene Entwicklerin bzw. ein erfahrener Entwickler ihn an einem Tag vollständig liefern kann; die Erweiterung 2.1 (Features 4.7 und 4.8) ist auf rund 1,5 Entwicklertage geschnitten.

## 1. Vision

IoT-Haus ist eine Web-App, die ein simuliertes zweistöckiges Haus steuert. Bisher konnte man pro Raum genau ein Licht schalten. Version 2.0 macht daraus ein lebendiges Zuhause: In sechs Räumen stehen 28 typische Haushaltsgeräte, von der Stehlampe über den Fernseher bis zu Mikrowelle, Wasserkocher, Waschmaschine und Heizlüfter. Jedes Gerät hat realistische Leistungswerte für Betrieb und Standby.

Der Kern des Erlebnisses ist der **Live-Verbrauch**: Wer die Mikrowelle einschaltet, sieht die Gesamtleistung des Hauses sofort und animiert um rund 1.200 W steigen, dazu die Kosten pro Stunde und die geschätzten Kosten des Tages. So wird unsichtbarer Strom greifbar. Man sieht auch, wie viel Standby kostet und welcher Raum gerade am meisten zieht.

Alle Geräte im Haushalt, ob Handy, Tablet oder Laptop, sehen jederzeit denselben Zustand. Der Server ist die einzige Quelle der Wahrheit, sodass ein neu geöffneter Browser nie mehr fremde Schaltzustände überschreibt. Szenen wie „Filmabend“ oder „Gute Nacht“ schalten mit einem Tipp. Die Oberfläche ist deutschsprachig, für das Handy gebaut, hat einen Dunkelmodus und ist mit Tastatur und Screenreader vollständig bedienbar.

Version 2.1 bringt Sonne und Straße ins Haus: Auf dem Dach liegt eine Solaranlage mit 9,8 kWp, und man stellt ein, wie viel Sonne gerade scheint. Im Carport steht ein Elektroauto an der Wallbox. Es lädt mit 11 kW, bis der Akku voll ist, und es kann wegfahren und wiederkommen. Oben sieht man jetzt nicht nur, was das Haus verbraucht, sondern auch, was die Sonne liefert und ob gerade Strom aus dem Netz kommt oder ins Netz fließt.

## 2. Zielgruppe

### 2.1 Jobs To Be Done

- **Funktional:** Geräte im Haus von jedem Endgerät aus schnell und zuverlässig schalten, ohne nachzudenken, ob die Anzeige stimmt.
- **Funktional:** Auf einen Blick sehen, was das Haus gerade verbraucht und was das kostet, gesamt, je Raum und je Gerät.
- **Emotional:** Das Gefühl von Kontrolle und „das ist ein echtes Smart Home“: sofortige, schöne Rückmeldung bei jedem Tipp.
- **Kontextuell:** Einhändig auf dem Handy in der Küche, auf dem Sofa im Dunkeln, am Schreibtisch mit Tastatur.
- **Für den Betreiber:** Ein Image, das per GitHub Action gebaut wird und mit `docker compose pull && docker compose up -d` aktualisiert wird, ohne Handarbeit.

### 2.2 Nicht-Nutzer

- Menschen, die echte Hardware (Shelly, Zigbee, Tasmota, Home Assistant) steuern wollen. IoT-Haus simuliert (D-01).
- Energieberater, die abrechnungsgenaue Messwerte brauchen. Alle Verbrauchswerte sind ausgewiesene Schätzungen (D-05).

### 2.3 Zentrale User Journeys

- **UJ-1. Sabine startet den Morgen und sieht den Verbrauch springen.**
  - **Persona + Kontext:** Sabine, 41, steht um 6:30 Uhr in der Küche, das Handy in der Hand, die Kinder schlafen noch.
  - **Einstieg:** Die App ist als Lesezeichen auf dem Homescreen gespeichert, sie öffnet sie und ist ohne Login verbunden.
  - **Ablauf:** Oben steht „Hausverbrauch 78 W · niedrig“. Sie tippt die Szene „Morgenroutine“. Kaffeemaschine, Wasserkocher, Küchenlicht, Badlicht, Spiegelleuchte und Heizlüfter gehen an.
  - **Höhepunkt:** Die Zahl zählt in unter einer Sekunde sichtbar auf rund 5.600 W hoch, die Laststufe wechselt auf „hoch“, ein Hinweis zeigt „+5.532 W · Morgenroutine aktiviert“, die Kosten springen auf rund 1,96 €/h.
  - **Auflösung:** Beim Wasserkocher läuft eine Restzeit („noch 2:48“); nach drei Minuten schaltet er sich selbst ab und die Anzeige fällt um 2.200 W.
  - **Randfall:** Das WLAN hakt. Ein Banner „Verbindung getrennt – Schalter sind gesperrt, bis die Verbindung wieder steht“ erscheint, die Schalter werden ausgegraut; nach der Wiederverbindung zeigt die App automatisch den aktuellen Serverzustand.

- **UJ-2. Jonas schaltet die Konsole ein, sein Vater sieht es sofort.**
  - **Persona + Kontext:** Jonas, 14, im Wohnzimmer; sein Vater Tom sitzt im Arbeitszimmer, die App ist auf seinem Laptop offen.
  - **Ablauf:** Aus dem Ausgangszustand tippt Jonas auf dem Handy in der Raumkarte „Wohnzimmer“ zuerst auf „Spielkonsole“, dann auf „Fernseher“.
  - **Höhepunkt:** Auf Toms Laptop leuchtet das Wohnzimmer in der Hausansicht auf; der Raumwert steigt auf 271 W, der Hausverbrauch zählt hoch, eine Meldung zeigt „+179 W · Spielkonsole (Wohnzimmer)“. Das dauert weniger als eine Sekunde.
  - **Auflösung:** Tom sieht in „Verbrauch nach Raum“, dass das Wohnzimmer gerade an erster Stelle steht, und lässt ihn spielen.

- **UJ-3. Mehmet macht Filmabend und danach Gute Nacht.**
  - **Persona + Kontext:** Mehmet, 35, auf dem Sofa, abends, Handy im Dunkelmodus.
  - **Ablauf:** Er tippt „Filmabend“: Deckenlampe aus, Stehlampe, Fernseher und Soundbar an, Küchenlicht aus. Später tippt er „Gute Nacht“.
  - **Höhepunkt:** „Gute Nacht“ schaltet alles außer den Grundlastgeräten aus und die Nachttischlampe im Schlafzimmer an. Kühlschrank, Gefrierschrank und Router bleiben an; die Anzeige fällt auf 83 W, davon 13,3 W Standby.
  - **Auflösung:** Er sieht „Heute 3,42 kWh · 1,20 €“ und legt das Handy weg.
  - **Randfall:** Er versucht, den Kühlschrank einzeln auszuschalten. Ein Dialog fragt „Kühlschrank wirklich ausschalten? Es ist ein Grundlastgerät und läuft normalerweise dauerhaft.“ Mit „Abbrechen“ bleibt er an.

- **UJ-4. Lena bedient alles mit Tastatur und Screenreader.**
  - **Persona + Kontext:** Lena, 29, blind, nutzt VoiceOver am MacBook und die Tastatur.
  - **Ablauf:** Mit Tab erreicht sie über einen Sprunglink „Zu den Räumen springen“ die Raumkarten. VoiceOver liest „Mikrowelle, Küche, Schalter, aus, Standby 1,5 Watt“. Sie drückt die Leertaste.
  - **Höhepunkt:** VoiceOver sagt, höflich nach der laufenden Ausgabe, „Mikrowelle an. Hausverbrauch 1.274 Watt.“
  - **Auflösung:** Sie kann jede Funktion ohne Maus erreichen, der Fokus ist immer sichtbar.

- **UJ-5. Alexander bringt 2.0 in Produktion.**
  - **Persona + Kontext:** Alexander betreibt IoT-Haus per docker-compose mit `ghcr.io/deltatree-de/iot-haus:latest`.
  - **Ablauf:** Der PR wird gemergt; die CI (Lint, Typecheck, Tests, Build) läuft grün; danach wird das Multi-Arch-Image `:latest` veröffentlicht und für den Tag `v2.0.0` ein GitHub Release erzeugt.
  - **Höhepunkt:** `docker compose pull && docker compose up -d` – nach spätestens 60 s meldet `docker ps` den Container als `healthy`.
  - **Auflösung:** Nach einem Neustart des Containers sind alle Schaltzustände und der Container unverändert vorhanden.

- **UJ-6. Nina lädt das Auto mit Sonnenstrom.**
  - **Persona + Kontext:** Nina, 38, Mittagspause im Homeoffice, Laptop.
  - **Ablauf:** Sie wählt unter „Solaranlage“ die Sonne „Sonnig“: Der Kopf zeigt „Solar 8.330 W · Einspeisung 8.252 W“ und „Ertrag 0,66 €/h“. Sie schaltet in der Karte „Carport“ die Wallbox ein.
  - **Höhepunkt:** Der Hausverbrauch zählt auf 11.075 W hoch, der Kopf wechselt auf „Netzbezug 2.745 W“ und „0,96 €/h“, beim Auto steht „lädt · voll in 2 h 44 min“.
  - **Auflösung:** Um 14 Uhr tippt sie „Wegfahren“: Das Laden endet, „−10.997 W · Elektroauto weggefahren, Laden beendet“. Abends tippt sie „Zurückkommen“: „Elektroauto zurück · Akku 49 %“.
  - **Randfall:** Solange das Auto unterwegs ist, ist die Wallbox gesperrt und sagt warum („Elektroauto ist unterwegs“).

## 3. Glossar

- **Haus** – Das simulierte Gebäude mit genau 2 Etagen, 6 Räumen und dem Außenbereich Carport.
- **Etage** – EG oder OG mit je 3 Räumen; zusätzlich die Etage „Außen“ mit dem Carport.
- **Raum** – Ein Bereich des Hauses mit fester ID und 1 bis 7 Geräten; der Carport ist ein Raum der Etage „Außen“.
- **Gerät** – Ein schaltbarer Verbraucher in genau einem Raum, mit Betriebsleistung und Standby-Leistung. Licht ist eine Gerätekategorie, kein eigener Begriff.
- **Gerätekatalog** – Die feste, versionierte Liste aller 29 Geräte (Anhang A). Einzige Quelle für Namen, Räume und Leistungswerte, gemeinsam für Server und Client.
- **Gerätezustand** – *An* oder *Aus* eines Geräts. *Aus* heißt: eingesteckt, im Standby.
- **Betriebsleistung** – Mittlere elektrische Leistung eines Geräts im Zustand *An*, in Watt.
- **Standby-Leistung** – Elektrische Leistung eines Geräts im Zustand *Aus*, in Watt (kann 0 sein).
- **Grundlastgerät** – Gerät, das dauerhaft laufen soll (Kühlschrank, Gefrierschrank, Router): von Szenen und „Alles aus“ ausgenommen, Ausschalten nur mit Bestätigung.
- **Auto-Aus** – Serverseitige automatische Abschaltung eines Geräts nach fester Laufzeit (Wasserkocher, Mikrowelle).
- **Hausverbrauch** – Summe der aktuellen Leistung aller Geräte (Betriebs- bzw. Standby-Leistung je nach Gerätezustand), in Watt.
- **Raumverbrauch** – Summe der aktuellen Leistung aller Geräte eines Raums, in Watt.
- **Standby-Anteil** – Summe der Standby-Leistung aller Geräte im Zustand *Aus*.
- **Laststufe** – Einordnung des Hausverbrauchs: niedrig, mittel, hoch (FR-12).
- **Strompreis** – Preis je kWh in Euro, Standard 0,35 €/kWh, vom Betreiber konfigurierbar.
- **Elektroauto** – Das einzige Fahrzeug; Zustand *zu Hause* oder *unterwegs*, Akkustand in Wh (Kapazität 60 kWh).
- **Wallbox** – Ladegerät im Carport (Gerät `carport.wallbox`); Wallbox *An* heißt „Laden“.
- **Akkustand** – Energie im Akku des Elektroautos; Anzeige in ganzen Prozent, abgerundet.
- **Solaranlage** – Photovoltaikanlage mit 9,8 kWp Spitzenleistung.
- **Sonnenlage** – Vom Menschen gewählte Stufe *Nacht, Bedeckt, Wolkig, Heiter, Sonnig*; gemeinsamer Serverzustand.
- **Erzeugung** – Aktuelle Leistung der Solaranlage = Spitzenleistung × Anteil der Sonnenlage, in Watt.
- **Netzbezug / Einspeisung** – max(0, Hausverbrauch − Erzeugung) bzw. max(0, Erzeugung − Hausverbrauch), jeweils aus den gerundeten Anzeigewerten.
- **Einspeisevergütung** – Preis je eingespeister kWh, Standard 0,08 €/kWh, vom Betreiber konfigurierbar.
- **Kosten pro Stunde** – Netzbezug in kW × Strompreis. **Ertrag pro Stunde** – Einspeisung in kW × Einspeisevergütung.
- **Tagesverbrauch** – Geschätzte Energie in kWh seit 00:00 Uhr (Europe/Berlin), vom Server berechnet. **Tagesbezug** und **Tageseinspeisung** – vom Server integrierte Netzenergie seit 00:00 Uhr. **Tageserzeugung** = Tagesverbrauch − Tagesbezug + Tageseinspeisung. **Tageskosten** = Tagesbezug × Strompreis − Tageseinspeisung × Einspeisevergütung (negativ = Ertrag).
- **Szene** – Fest definierte Menge von Gerätezuständen, die mit einem Befehl gesetzt wird (FR-23).
- **Befehl** – Anfrage eines Clients an den Server (Gerät schalten, Szene ausführen, Raum ausschalten, Sonnenlage setzen, Elektroauto wegfahren/zurückkommen lassen). „Alles aus“ bezeichnet ausschließlich die Szene; die Raumaktion heißt „Raum ausschalten“. Clients ändern Zustand nur über Befehle.
- **Serverzustand** – Der autoritative Gerätezustand aller Geräte, Elektroauto, Sonnenlage plus Tagesenergie, gehalten vom Server.
- **Snapshot** – Vollständiger Serverzustand, den ein Client beim Verbinden erhält.
- **Client** – Ein Browser-Tab mit geöffneter App.
- **Änderungsmeldung** – Kurze sichtbare und für Screenreader angesagte Rückmeldung nach einer Zustandsänderung, mit Leistungsdifferenz.
- **Betreiber** – Person, die den Container betreibt und aktualisiert.

## 4. Features

### 4.1 Haus und Gerätekatalog

**Beschreibung:** Das Haus hat zwei Etagen mit je drei Räumen. Jeder Raum enthält die Geräte aus dem Gerätekatalog (Anhang A). Geräte sind *An* oder *Aus*; im Zustand *Aus* ziehen sie ihre Standby-Leistung. Grundlastgeräte sind geschützt, Wasserkocher und Mikrowelle schalten sich selbst ab. Realisiert UJ-1, UJ-2, UJ-3.

#### FR-1: Hausmodell mit sechs Räumen und Carport

Das System stellt ein Haus mit 2 Etagen und 6 Räumen dar: EG Wohnzimmer, Küche, Hauswirtschaftsraum; OG Schlafzimmer, Badezimmer, Arbeitszimmer (D-02; Annahme, §9). Seit 2.1 kommt der Außenbereich Carport (Etage „Außen“) als 7. Raum hinzu (E-01).

**Konsequenzen (testbar):**
- Der Gerätekatalog enthält genau 7 Räume: die 6 Hausräume mit den IDs `wohnzimmer`, `kueche`, `hwr`, `schlafzimmer`, `bad`, `arbeitszimmer` und den oben genannten Anzeigenamen und Etagen sowie als letzten Eintrag `carport` („Carport“, Etage „Außen“).
- Jeder Hausraum enthält mindestens 3 Geräte; der Carport enthält genau 1 Gerät (Wallbox).

#### FR-2: Gerätekatalog mit realistischen Leistungswerten

Das System kennt genau die 29 Geräte aus Anhang A mit ID, Anzeigename, Raum, Kategorie, Betriebsleistung, Standby-Leistung sowie den Merkmalen Grundlastgerät und Auto-Aus (D-05, D-08).

**Konsequenzen (testbar):**
- Ein Test vergleicht den Katalog mit Anhang A: 29 Geräte, alle IDs eindeutig, alle Werte identisch.
- Für jedes Gerät gilt: Betriebsleistung > 0 und Standby-Leistung ≥ 0 und Standby-Leistung < Betriebsleistung.
- Server und Client importieren dieselbe Katalogdefinition (eine Quelldatei im Domänenmodul); ein Test prüft, dass außerhalb dieses Moduls und der Tests keine Geräte-ID als String-Literal vorkommt.
- Jedes Gerät hat ein Symbol und eine Kategorie aus: Licht, Küche, Unterhaltung, Haushalt, Körperpflege, Heizung, IT, Mobilität.

#### FR-3: Gerät schalten

Jede Person kann jedes Gerät mit einem Tipp, Klick oder Tastendruck zwischen *An* und *Aus* umschalten. Realisiert UJ-2, UJ-4.

**Konsequenzen (testbar):**
- Im Zustand *An* zählt das Gerät mit seiner Betriebsleistung zum Hausverbrauch, im Zustand *Aus* mit seiner Standby-Leistung.
- Ein Schaltbefehl ändert genau ein Gerät; alle anderen Gerätezustände bleiben unverändert.

#### FR-4: Grundlastgeräte schützen

Kühlschrank, Gefrierschrank und Router sind Grundlastgeräte (D-06; Annahme, §9). Realisiert UJ-3.

**Konsequenzen (testbar):**
- Beim allerersten Start (kein gespeicherter Serverzustand) sind genau die drei Grundlastgeräte *An*, alle anderen Geräte *Aus*; der Hausverbrauch beträgt dann 78 W (65 W Grundlast + 13,3 W Standby, gerundet). Zusätzlich gilt: Elektroauto zu Hause, Akku 50 %, Sonnenlage „Nacht“.
- Das Ausschalten eines Grundlastgeräts öffnet einen Bestätigungsdialog mit dem Text „‹Gerät› wirklich ausschalten? Es ist ein Grundlastgerät und läuft normalerweise dauerhaft.“ und den Aktionen „Ausschalten“ und „Abbrechen“; „Abbrechen“ ist vorausgewählt und Escape bricht ab.
- Das Einschalten eines Grundlastgeräts erfolgt ohne Dialog.
- Keine Szene und kein „Raum ausschalten“ ändert den Zustand eines Grundlastgeräts.

#### FR-5: Auto-Aus für Wasserkocher und Mikrowelle

Wasserkocher und Mikrowelle schalten 3 Minuten nach dem Einschalten serverseitig automatisch aus (D-07; Annahme, §9). Realisiert UJ-1.

**Konsequenzen (testbar):**
- 180 s (± 1 s) nach dem Einschalten setzt der Server das Gerät auf *Aus* und verteilt die Änderung an alle Clients.
- Erneutes Einschalten während der Laufzeit ist nicht möglich (Gerät ist bereits *An*); Aus- und wieder Einschalten startet die 3 Minuten neu.
- Solange das Gerät *An* ist, zeigt seine Zeile die Restzeit im Format „noch m:ss“, sekündlich aktualisiert; alle Clients zeigen dieselbe Restzeit (± 1 s), weil sie aus dem vom Server gelieferten Einschaltzeitpunkt berechnet wird.
- Startet der Server neu, während ein Auto-Aus-Gerät *An* ist, schaltet er es aus, sobald die Restzeit abgelaufen ist, bzw. sofort, wenn sie bereits abgelaufen ist.
- Setzt eine Szene ein bereits eingeschaltetes Auto-Aus-Gerät auf *An*, läuft die bisherige Restzeit weiter.
- Die automatische Abschaltung erzeugt eine Änderungsmeldung „−2.200 W · Wasserkocher (Küche) automatisch ausgeschaltet“ (Format wie FR-11).

### 4.2 Live-Verbrauch und Kosten

**Beschreibung:** Ganz oben und beim Scrollen immer sichtbar steht der Hausverbrauch mit Laststufe, Kosten pro Stunde und den Tageswerten. Jede Änderung ist sofort und animiert sichtbar; eine Änderungsmeldung nennt die Differenz und das auslösende Gerät. Raum- und Gerätewerte machen sichtbar, wo der Strom hingeht. Alle Werte sind als Schätzung gekennzeichnet. Realisiert UJ-1, UJ-2, UJ-3.

#### FR-6: Hausverbrauch live anzeigen

Die App zeigt den Hausverbrauch in Watt in einem Kopfbereich, der auf allen Bildschirmbreiten beim Scrollen sichtbar bleibt. Fest sichtbar sind nur Hausverbrauch, Laststufe, Kosten (bzw. Ertrag) pro Stunde, Verbindungsstatus und die Netz-Zeile „Solar ‹x› W · Netzbezug ‹y› W“ bzw. „… · Einspeisung ‹y› W“ (FR-41); Standby-Anteil, Tageswerte, Strompreis und Theme-Wahl stehen im Übersichtsbereich direkt darunter und scrollen mit.

**Konsequenzen (testbar):**
- Der angezeigte Wert entspricht der Summe gemäß FR-3 über alle 29 Geräte, auf ganze Watt gerundet.
- Nach einer bestätigten Zustandsänderung zählt der Wert vom alten zum neuen Wert in 600 ms hoch bzw. herunter; bei `prefers-reduced-motion: reduce` springt er ohne Animation.
- Der Wert ist in jedem Client spätestens 1 s nach der Serverbestätigung aktualisiert (siehe NFR-1).

#### FR-7: Raumverbrauch anzeigen

Die App zeigt für jeden Raum den Raumverbrauch in Watt und die Zahl der eingeschalteten Geräte, in der Hausansicht und auf der Raumkarte, sowie eine Liste „Verbrauch nach Raum“.

**Konsequenzen (testbar):**
- Die Summe aller Raumverbräuche ist gleich dem Hausverbrauch (Rundungsdifferenz ≤ 1 W je Raum zulässig).
- „Verbrauch nach Raum“ listet alle 6 Räume absteigend nach Raumverbrauch, jeweils mit Balken proportional zum Anteil am Hausverbrauch und Prozentangabe als Text.

#### FR-8: Geräteleistung anzeigen

Jede Gerätezeile zeigt die aktuelle Leistung des Geräts.

**Konsequenzen (testbar):**
- Gerät *An*: Betriebsleistung, z. B. „1.200 W“.
- Gerät *Aus* mit Standby-Leistung > 0: „Standby 1,5 W“ in zurückgenommener Darstellung (Kontrast weiterhin ≥ 4,5:1).
- Gerät *Aus* mit Standby-Leistung 0: „aus“.

#### FR-9: Kosten pro Stunde

Die App zeigt die Kosten pro Stunde neben dem Hausverbrauch und den verwendeten Strompreis (D-09; Annahme, §9).

**Konsequenzen (testbar):**
- Kosten pro Stunde = Netzbezug / 1000 × Strompreis, angezeigt mit zwei Nachkommastellen, z. B. „1,96 €/h“ (bei Sonnenlage „Nacht“ ist Netzbezug = Hausverbrauch). Ist die Einspeisung > 0, steht an ihrer Stelle „Ertrag ‹x› €/h“ (FR-41).
- Der Strompreis beträgt standardmäßig 0,35 €/kWh und ist über die Umgebungsvariable `STROMPREIS_EUR_PRO_KWH` (Dezimalpunkt, z. B. `0.32`) änderbar; ungültige, negative oder fehlende Werte führen zu 0,35 und einer Warnung im Serverlog.
- Die Einspeisevergütung beträgt standardmäßig 0,08 €/kWh und ist über `EINSPEISEVERGUETUNG_EUR_PRO_KWH` nach denselben Regeln wie der Strompreis änderbar (`0` ist gültig; ungültig oder negativ → 0,08 und Warnung `einspeiseverguetung_ungueltig`).
- Strompreis und Einspeisevergütung werden vom Server im Snapshot geliefert und in der App als „Strompreis 0,35 €/kWh · Einspeisevergütung 0,08 €/kWh“ angezeigt.

#### FR-10: Tagesverbrauch und Tageskosten

Die App zeigt den Tagesverbrauch in kWh und die Tageskosten in Euro, vom Server berechnet (D-10). Realisiert UJ-3, UJ-5.

**Konsequenzen (testbar):**
- Der Server integriert den Hausverbrauch über die Zeit: Bei jeder Zustandsänderung und mindestens alle 60 s wird Energie = Leistung × vergangene Zeit aufaddiert. Ein Test mit simulierter Uhr: 2.000 W über 30 min ergeben 1,00 kWh (± 0,01).
- Um 00:00 Uhr Europe/Berlin (auch bei Sommer-/Winterzeitwechsel) wird der Tagesverbrauch auf 0 gesetzt.
- Der Tagesverbrauch wird mindestens alle 60 s und beim geordneten Herunterfahren (SIGTERM) persistiert; nach einem Neustart am selben Kalendertag wird er fortgesetzt (Verlust bei Absturz ≤ 60 s Integration), an einem neuen Tag bei 0 begonnen.
- Zeiten, in denen der Server nicht läuft, werden nicht mitgezählt (das Haus ist simuliert; ohne Server gibt es keinen Verbrauch).
- Alle Clients zeigen denselben Wert aus dem Serverzustand, aktualisiert bei jeder Änderung und mindestens alle 60 s, mit zwei Nachkommastellen, z. B. „Heute 3,42 kWh · 1,20 €“ (Tageskosten netto, FR-42) bzw. „Heute ‹x› kWh · Ertrag ‹y› €“, wenn die Tageskosten negativ sind; darunter „Netz heute: Bezug ‹a› kWh · Einspeisung ‹b› kWh“. Eine lokale Hochrechnung zwischen zwei Serverwerten gibt es nicht (Kürzung aus Review H-4).
- Ein Info-Hinweis (per Tastatur erreichbar) erklärt: „Schätzung auf Basis typischer Geräteleistungen und der eingestellten Sonne, gezählt seit 00:00 Uhr. Kosten = Netzbezug × Strompreis abzüglich Einspeisung × Einspeisevergütung.“

#### FR-11: Änderungsmeldung mit Leistungsdifferenz

Nach jeder bestätigten Zustandsänderung zeigt die App in allen Clients eine Änderungsmeldung mit Vorzeichen, Differenz und Auslöser. Realisiert UJ-1, UJ-2, UJ-4.

**Konsequenzen (testbar):**
- Die Differenz ist der neue angezeigte Hausverbrauch minus den alten angezeigten Hausverbrauch (jeweils auf ganze Watt gerundet), damit Meldung und Kopfzeile übereinstimmen.
- Einzelgerät, z. B. aus dem Ausgangszustand: „+1.199 W · Mikrowelle (Küche)“ bzw. beim Ausschalten „−1.199 W · Mikrowelle (Küche)“.
- Szene oder „Raum ausschalten“: z. B. „+124 W · Filmabend aktiviert“ (aus dem Ausgangszustand) bzw. „−‹x› W · Küche ausgeschaltet“.
- Seit 2.1 zusätzlich die Ursachen Sonnenlage („Sonne: Sonnig · Solar 8.330 W“, ohne Leistungsdifferenz), Elektroauto („−10.997 W · Elektroauto weggefahren, Laden beendet“, „Elektroauto zurück · Akku 49 %“) und Akku voll („−10.997 W · Akku voll – Laden beendet (Carport)“); Texte und Ansagen gemäß UX-Spezifikation (EXPERIENCE.md).
- Die Meldung ist 4 s sichtbar, stapelt maximal 3 Meldungen und schließt sich per Escape oder Schließen-Schaltfläche.
- Die Meldung wird über eine `aria-live="polite"`-Region angesagt, mit ausgeschriebenen Einheiten im Format „‹Gerät› an. Hausverbrauch 1.274 Watt.“ bzw. „‹Szene› aktiviert. Hausverbrauch ‹x› Watt.“; bei mehreren Änderungen innerhalb von 2 s wird nur die letzte angesagt.

#### FR-12: Laststufe

Die App ordnet den Hausverbrauch einer Laststufe zu und zeigt sie mit Text, Symbol und Farbe (D-11; Annahme, §9).

**Konsequenzen (testbar):**
- Grundlage ist der angezeigte, auf ganze Watt gerundete Hausverbrauch: < 500 W „niedrig“, 500–1.999 W „mittel“, ≥ 2.000 W „hoch“ (Grenzwerttests bei 499, 500, 1.999, 2.000 W).
- Die Stufe ist ohne Farbwahrnehmung erkennbar (Text immer sichtbar).
- Grundlage bleibt auch mit Solaranlage der Hausverbrauch, nicht der Netzbezug (E-19).

#### FR-13: Standby-Anteil

Die App zeigt im Übersichtsbereich unter dem Kopfbereich „davon Standby ‹x› W“.

**Konsequenzen (testbar):**
- Wert = Summe der Standby-Leistung aller Geräte im Zustand *Aus*, eine Nachkommastelle; im Ausgangszustand „davon Standby 13,3 W“.

### 4.3 Echtzeit-Synchronisation mit Server als Autorität

**Beschreibung:** Der Server ist die einzige Quelle der Wahrheit. Clients schicken Befehle über die bestehende WebSocket-Verbindung (`/mqtt`), der Server prüft sie, ändert den Serverzustand, speichert ihn dauerhaft über MQTT (retained) und verteilt ihn an alle Clients. Ein neu geöffneter Client bekommt einen Snapshot und verändert nichts. Das behebt den bisherigen Fehler, bei dem jeder Client beim Verbinden seinen lokalen Stand veröffentlichte (D-15). Realisiert UJ-2, UJ-5.

#### FR-14: Serverzustand ist autoritativ

Nur der Server ändert Gerätezustände; Clients senden ausschließlich Befehle.

**Konsequenzen (testbar):**
- Die App speichert keine Gerätezustände im Browser (weder localStorage noch sessionStorage noch IndexedDB); der Altschlüssel `smart-home-state` wird beim ersten Laden gelöscht.
- Ein Client, der sich verbindet, sendet keinen Befehl, solange die Person nichts bedient (Integrationstest: Verbinden eines neuen Clients erzeugt keine Zustandsänderung).

#### FR-15: Snapshot beim Verbinden

Jeder Client erhält nach dem Verbinden den vollständigen Serverzustand.

**Konsequenzen (testbar):**
- Spätestens 1 s nach Aufbau der WebSocket-Verbindung liegt dem Client ein Snapshot mit allen 29 Gerätezuständen, Einschaltzeitpunkten der Auto-Aus-Geräte, Elektroauto (Ort, Akkustand), Sonnenlage, Tagesenergie (Verbrauch, Bezug, Einspeisung), Strompreis und Einspeisevergütung vor.
- Bis zum Eintreffen des Snapshots zeigt die App einen Ladezustand (Skeleton) statt Standardwerten; Schalter sind bis dahin nicht bedienbar.

#### FR-16: Änderungen an alle Clients verteilen

Jede Änderung des Serverzustands wird an alle verbundenen Clients verteilt, einschließlich des auslösenden.

**Konsequenzen (testbar):**
- Integrationstest mit 3 Clients: Nach einem Befehl von Client A zeigen A, B und C denselben Gerätezustand; p95 der Verteilzeit über mindestens 100 Befehle ≤ 250 ms.
- Eine Szene oder ein „Raum ausschalten“ wird als eine einzige Änderung verteilt (keine Zwischenzustände sichtbar).

#### FR-17: Zustand übersteht Neustarts

Der Serverzustand bleibt über Neustarts von Server und Container erhalten.

**Konsequenzen (testbar):**
- Nach Neustart des Containers (Volume `mosquitto-data` bleibt) sind alle Gerätezustände identisch mit dem Stand vor dem Neustart, auch wenn die letzte Änderung unmittelbar vor dem Neustart erfolgte (der Broker persistiert retained Nachrichten nach jeder Änderung).
- Elektroauto (Ort, Akkustand) und Sonnenlage überstehen Neustarts ebenso; Zeit ohne laufenden Server lädt den Akku nicht (FR-38).
- Fehlt ein gespeicherter Zustand, gilt der Ausgangszustand aus FR-4.
- Gespeicherte Zustände für Geräte, die nicht (mehr) im Katalog stehen, werden ignoriert; neue Katalog-Geräte starten im Ausgangszustand.

#### FR-18: Befehle prüfen

Der Server akzeptiert nur gültige Befehle (D-19).

**Konsequenzen (testbar):**
- Erlaubt sind genau: Gerät schalten (Geräte-ID, Zielzustand), Szene ausführen (Szenen-ID), Raum ausschalten (Raum-ID), Sonnenlage setzen (`sonne`, Stufe) und Elektroauto bewegen (`auto`, `zuhause`: boolean).
- Ein fachlicher Regelverstoß (z. B. Laden, während das Auto unterwegs oder der Akku voll ist; Wegfahren unter 15 % Akku) wird mit dem Fehler `NICHT_MOEGLICH` beantwortet; der Zustand bleibt unverändert.
- Unbekannte IDs, falsche Typen, fehlende Felder, ungültiges JSON oder Nachrichten > 4 KB werden abgelehnt: Der Serverzustand bleibt unverändert, der sendende Client erhält eine Fehlerantwort mit Befehlskennung, der Server stürzt nicht ab.
- Browser können keine beliebigen MQTT-Topics mehr abonnieren oder beschreiben; ein Test belegt, dass ein Publish auf ein fremdes Topic abgelehnt wird.
- Das Ausschalten eines Grundlastgeräts über einen Einzelbefehl ist erlaubt (die Bestätigung liegt im Client, FR-4).
- Nachrichten im alten Protokoll (z. B. `type: "publish"` aus noch offenen Tabs der Vorversion) werden mit Fehler abgelehnt und ändern nichts.
- Der Snapshot enthält die Serverversion; weicht sie von der Version des geladenen Clients ab (Tab war während eines Updates offen), zeigt die App das Banner „Neue Version verfügbar“ mit der Schaltfläche „Neu laden“ und sperrt die Schalter bis zum Neuladen.

#### FR-19: Gleichzeitige Befehle

Der Server verarbeitet Befehle strikt nacheinander; der zuletzt verarbeitete Befehl gewinnt (D-18).

**Konsequenzen (testbar):**
- Integrationstest: 3 Clients senden zusammen 200 zufällige Befehle ohne Pause; danach sind alle drei Client-Zustände identisch mit dem Serverzustand (100 %).
- Ein Einzelgerät-Befehl, der den Zustand nicht ändert (Gerät ist bereits im Zielzustand), wird bestätigt, erzeugt aber keine Änderungsmeldung. Für Szenen und „Raum ausschalten“ ohne Änderung gilt FR-22 (Hinweis nur im auslösenden Client).

#### FR-20: Verbindungsstatus und Wiederverbindung

Die App zeigt den Verbindungsstatus und verbindet sich selbständig neu (D-17). Realisiert UJ-1.

**Konsequenzen (testbar):**
- Im Kopfbereich steht dauerhaft ein Status „Verbunden“, „Verbinde …“ oder „Getrennt“ mit Symbol und Text.
- Bei „Getrennt“ erscheint ein Banner „Verbindung getrennt – Schalter sind gesperrt, bis die Verbindung wieder steht.“; alle Schalter und Szenen sind deaktiviert (`aria-disabled`), bleiben aber sichtbar mit dem letzten bekannten Zustand.
- Wiederverbindung mit Wartezeiten 1 s, 2 s, 4 s, 8 s, danach alle 10 s; eine Schaltfläche „Jetzt neu verbinden“ startet sofort einen Versuch.
- Nach erfolgreicher Wiederverbindung ersetzt der neue Snapshot den angezeigten Zustand vollständig.
- Es gibt keine Befehlswarteschlange für die Offline-Zeit.

#### FR-21: Sofortige Rückmeldung mit Bestätigung

Ein Schalter reagiert sofort und wird vom Server bestätigt (D-16).

**Konsequenzen (testbar):**
- Nach Betätigung zeigt der Schalter binnen 100 ms den Zielzustand mit einer Kennzeichnung „wird geschaltet“ (visuell und `aria-busy="true"`).
- Mit der Serverbestätigung entfällt die Kennzeichnung; Hausverbrauch und Änderungsmeldung aktualisieren sich erst mit der Bestätigung.
- Ohne Bestätigung nach 5 s oder bei Fehlerantwort kehrt der Schalter zum Serverzustand zurück und eine Fehlermeldung „‹Gerät› konnte nicht geschaltet werden. Bitte erneut versuchen.“ erscheint.

### 4.4 Szenen

**Beschreibung:** Eine Szenenleiste unter dem Kopfbereich bietet vier feste Szenen. Ein Tipp führt die Szene serverseitig als eine Änderung aus. Grundlastgeräte bleiben immer unberührt. Realisiert UJ-1, UJ-3.

#### FR-22: Szene ausführen

Jede Person kann eine Szene mit einem Tipp ausführen.

**Konsequenzen (testbar):**
- Der Server setzt alle in der Szene definierten Gerätezustände in einer Änderung (FR-16) und bestätigt mit der Leistungsdifferenz.
- Geräte, die die Szene nicht nennt, bleiben unverändert (außer bei „Alles aus“ und „Gute Nacht“, die alle Nicht-Grundlastgeräte betreffen).
- Szenen sind idempotent: zweimal ausführen ergibt denselben Zustand; ändert eine Ausführung nichts, zeigt nur der auslösende Client den Hinweis „‹Szene›: keine Änderung nötig“, andere Clients zeigen nichts.
- Die Szenenschaltflächen haben sichtbare Beschriftungen und Symbole; die zuletzt ausgeführte Szene wird nicht als „aktiv“ markiert (Zustand kann sich danach ändern).

#### FR-23: Szenendefinitionen

Es gibt genau die folgenden vier Szenen (D-12):

| ID | Name | Wirkung |
|---|---|---|
| `alles-aus` | Alles aus | Alle Nicht-Grundlastgeräte *Aus*. |
| `filmabend` | Filmabend | Wohnzimmer: Deckenlampe *Aus*, Stehlampe *An*, Fernseher *An*, Soundbar *An*; Küche: Deckenlampe *Aus*. |
| `morgenroutine` | Morgenroutine | Küche: Deckenlampe *An*, Kaffeemaschine *An*, Wasserkocher *An*; Badezimmer: Deckenlampe *An*, Spiegelleuchte *An*, Heizlüfter *An*. |
| `gute-nacht` | Gute Nacht | Alle Nicht-Grundlastgeräte *Aus*, danach Schlafzimmer: Nachttischlampe *An*. |

**Konsequenzen (testbar):**
- Ein Test prüft für jede Szene den resultierenden Zustand aus dem Ausgangszustand (FR-4) und aus „alles an“.
- Aus dem Ausgangszustand ergibt „Morgenroutine“ eine Differenz von +5.532 W (gerundet) und startet das Auto-Aus des Wasserkochers.
- Die Wallbox ist kein Grundlastgerät: „Alles aus“ und „Gute Nacht“ beenden das Laden. Keine Szene startet das Laden; Szenen ändern weder die Sonnenlage noch den Ort des Elektroautos (E-11).

#### FR-24: Grundlast in Szenen

Keine Szene ändert ein Grundlastgerät; siehe FR-4.

**Konsequenzen (testbar):**
- Nach „Alles aus“ aus dem Zustand „alles an“ sind genau Kühlschrank, Gefrierschrank und Router *An*; Hausverbrauch 78 W.

### 4.5 Bedienoberfläche

**Beschreibung:** Eine einzige Seite, für das Handy entworfen und auf größeren Bildschirmen zweispaltig. Von oben nach unten: Kopfbereich (Hausverbrauch, Laststufe, Kosten/Ertrag, Netz-Zeile, Verbindungsstatus), Übersicht (Tageswerte, Preise, Theme-Wahl), Szenenleiste, Solaranlage, Hausansicht, Raumkarten, „Verbrauch nach Raum“. Deutschsprachig, Dunkelmodus, vollständig per Tastatur und Screenreader bedienbar. Realisiert UJ-1 bis UJ-4 und UJ-6.

#### FR-25: Seitenaufbau

Die App besteht aus einer Seite mit Kopfbereich, Übersicht, Szenenleiste, Bereich „Solaranlage“, Hausansicht, Raumkarten (7 Karten, Carport zuletzt) und „Verbrauch nach Raum“.

**Konsequenzen (testbar):**
- Bei 360 px Breite: einspaltig in der genannten Reihenfolge, kein horizontales Scrollen der Seite; der Kopfbereich bleibt beim Scrollen sichtbar und belegt höchstens 30 % der Bildschirmhöhe (bei 640 px Höhe; mobil 136 px = 21 %).
- Ab 1024 px Breite: Hausansicht und „Verbrauch nach Raum“ links, Raumkarten rechts.
- Ein Sprunglink „Zu den Räumen springen“ ist das erste fokussierbare Element.
- Die bisherigen dekorativen Elemente ohne Funktion (Hover-Skalierung ganzer Bereiche, Systeminformations-Kacheln mit Broker-URL) entfallen.

#### FR-26: Hausansicht

Die Hausansicht zeigt das Haus als Grafik mit 2 Etagen × 3 Räumen, darunter eine Zeile „Außen“ mit der Carport-Fläche und auf dem Dach die Solaranlage mit ihrem aktuellen Wert (FR-43).

**Konsequenzen (testbar):**
- Jeder Raum zeigt Namen, Raumverbrauch und Zahl der eingeschalteten Geräte.
- Ist in einem Raum mindestens ein Gerät der Kategorie Licht *An*, leuchtet der Raum warm; der Raumverbrauch steht als Zahl im Raum. Eine abgestufte Füllfarbe nach Verbrauch gibt es nicht (Kürzung aus Review H-4).
- Tipp, Klick oder Enter auf einen Raum scrollt zur Raumkarte und setzt den Fokus auf deren Überschrift.
- Die Grafik hat einen zugänglichen Namen „Hausansicht“; jeder Raum ist eine Schaltfläche mit Namen „‹Raum›, ‹x› W, ‹n› Geräte an – zur Raumkarte“.

#### FR-27: Raumkarte

Jede Raumkarte listet die Geräte des Raums mit Symbol, Name, Leistung (FR-8) und Schalter; jede Karte eines Hausraums bietet die Schaltfläche „Raum ausschalten“ (D-13). Die Carport-Karte hat stattdessen den Elektroauto-Bereich (FR-39) und keinen „Raum ausschalten“ (E-12).

**Konsequenzen (testbar):**
- Jeder Schalter hat `role="switch"`, `aria-checked` und den zugänglichen Namen „‹Gerät›, ‹Raum›“; die Leistung ist per `aria-describedby` verknüpft.
- Die ganze Gerätezeile ist Trefferfläche, mindestens 44 × 44 px.
- Grundlastgeräte tragen ein Kennzeichen „Grundlast“, Auto-Aus-Geräte ein Kennzeichen „Auto-Aus 3 min“.
- „Raum ausschalten“ ist deaktiviert, wenn im Raum kein Nicht-Grundlastgerät *An* ist; sonst schaltet es alle Nicht-Grundlastgeräte des Raums aus (eine Änderung, FR-16) mit Änderungsmeldung.
- Ein eingeschaltetes Gerät ist ohne Farbe erkennbar (Schalterstellung plus Text „an“/Leistungswert).
- Eine gesperrte Wallbox (Auto unterwegs bzw. Akku voll) ist `aria-disabled` und nennt den Grund sichtbar und für Screenreader („nicht verfügbar: Elektroauto ist unterwegs“).

#### FR-28: Hell- und Dunkelmodus

Die App bietet die Darstellung System, Hell und Dunkel (D-21). Realisiert UJ-3.

**Konsequenzen (testbar):**
- Standard ist „System“ (folgt `prefers-color-scheme`); die Wahl wird im Browser gespeichert und beim nächsten Laden ohne Aufblitzen des anderen Themes angewendet.
- Beide Themes erfüllen die Kontrastanforderungen aus NFR-2.
- Die Browser-Theme-Farbe (`theme-color`) passt sich dem aktiven Theme an.

#### FR-29: Deutsche Sprache und Formate

Alle Texte der Oberfläche sind deutsch; Zahlen nach de-DE (D-23).

**Konsequenzen (testbar):**
- Gerundet wird kaufmännisch (ab ,5 aufwärts) und erst bei der Anzeige; alle Summen werden mit ungerundeten Katalogwerten berechnet.
- Leistung ganzzahlig mit Tausenderpunkt („1.200 W“), Standby mit einer Nachkommastelle („0,5 W“), Kosten „1,96 €/h“ und „1,20 €“, Energie „3,42 kWh“.
- `<html lang="de">`, Seitentitel „IoT-Haus – Energie & Steuerung“.
- Kein englischer Text in der Oberfläche (Test: Suche nach bekannten englischen Resttexten wie „Smart Home Control“, „Control System“).

### 4.6 Betrieb, Qualität und Auslieferung

**Beschreibung:** Das Release wird vollständig über GitHub Actions ausgeliefert. Qualität wird in der CI erzwungen, der Container meldet seinen Zustand korrekt, Doku und Code sind aufgeräumt. Die Sicherheitshärtung aus PR #1/#2 bleibt unverändert. Realisiert UJ-5.

#### FR-30: Health-Endpunkt

`GET /api/health` liefert den Betriebszustand (D-24).

**Konsequenzen (testbar):**
- Broker verbunden: HTTP 200, JSON `{ "status": "ok", "mqtt": "verbunden", "version": "2.1.0" }`.
- Broker nicht verbunden: HTTP 503, `status: "fehler"`, `mqtt: "getrennt"`.
- `version` stammt aus `package.json` und ist nicht fest verdrahtet.

#### FR-31: Container-Healthcheck ohne curl

Der Container prüft seine Gesundheit ohne curl oder wget.

**Konsequenzen (testbar):**
- Das Dockerfile enthält einen `HEALTHCHECK`, der `/api/health` mit Node aufruft; `docker-compose.yml` und `docker-compose.prod.yml` nutzen denselben Befehl (oder erben ihn).
- Nach `docker compose up -d` ist der Container innerhalb von 60 s `healthy`.
- Im Runtime-Image existieren weiterhin weder `curl` noch `wget` noch `npm`.

#### FR-32: CI-Pipeline

Eine CI-Pipeline prüft jeden Pull Request und jeden Push auf main (D-25).

**Konsequenzen (testbar):**
- Schritte: `npm ci`, Lint (0 Fehler, 0 Warnungen), Typecheck (`tsc --noEmit`), Tests, `next build`, `npm audit --omit=dev --audit-level=high`.
- Schlägt ein Schritt fehl, wird auf main kein Image veröffentlicht.
- Die Tests laufen ohne externe Dienste außer einem in der CI gestarteten MQTT-Broker.

#### FR-33: Release 2.1.0

Das Release wird vollständig automatisch ausgeliefert (D-26).

**Konsequenzen (testbar):**
- `package.json` hat Version `2.1.0`; das Release `v2.1.0` nutzt die Release-Hinweise `.github/release-hinweise/v2.1.0.md` (Pflicht, E-35).
- Push auf main veröffentlicht nach grüner CI `ghcr.io/deltatree-de/iot-haus:latest` für `linux/amd64` und `linux/arm64`.
- Im selben Workflow liest ein Job nach grüner CI die Version aus `package.json`. Existiert der Git-Tag `v‹version›` noch nicht, erzeugt er den Tag, das GitHub Release mit Änderungsliste und das Image-Tag `:‹version›`. Tag, Release und Versions-Image entstehen damit ohne manuellen Schritt und ohne von einem Tag-Push ausgelöste Folge-Workflows (die mit `GITHUB_TOKEN` nicht starten würden).
- Erlaubte Image-Tags sind abschließend: `:latest`, `:‹version›` (hier `:2.1.0`) und `:sha-‹kurz›`. Keine Tags `:main`, `:2.0` oder `:2`.
- Ein manuell gepushter Tag `v*` löst keinen Build ohne CI-Gate aus; `release.yml` wird entsprechend ersetzt oder entfernt.
- Das GitHub Release enthält den Upgrade-Hinweis aus NFR-9.

#### FR-34: Dokumentation

Die Dokumentation beschreibt den Stand 2.1.0 inkl. neuer Befehle, Topics und Umgebungsvariable (D-27, §6.4 des Sprint Change Proposals).

**Konsequenzen (testbar):**
- README beschreibt Funktionen, Gerätekatalog (Verweis), Strompreis-Variable, Betrieb, Update und Entwicklung (Tests, Lint) auf Deutsch; keine Aussagen mehr über „nur Licht“, 4 Räume oder localStorage-Persistenz.
- `API.md` beschreibt das WebSocket-Protokoll (Befehle, Snapshot, Änderungen, Fehler) und das MQTT-Topic-Schema.
- `DOCKER-SETUP.md` und `KUBERNETES.md` zeigen den Healthcheck ohne curl und die Probes auf `/api/health`.
- README empfiehlt für Zugriff aus dem Internet einen Reverse-Proxy mit Anmeldung (D-20).
- `MOBILE-OPTIMIZATION.md` und `BUILD-OPTIMIZATION.md` sind entfernt, relevante Inhalte in README/DOCKER-SETUP übernommen; `.github/copilot-instructions.md` und `GITHUB-ACTIONS.md` beschreiben die neue Pipeline (FR-32/33).

#### FR-35: Aufräumen

Toter Code und Debug-Ausgaben werden entfernt (D-27).

**Konsequenzen (testbar):**
- `useMockMqtt`, `shouldUseMock` und die Root-Skripte `test-container-*.js` und `test-multi-device.js` existieren nicht mehr (ihre Absicht ist durch automatisierte Tests abgedeckt).
- Der Produktions-Build erzeugt im Browser keine `console.log`-Ausgaben (Lint-Regel `no-console` für `src/`, Ausnahme `console.error` bei echten Fehlern).
- Der Server loggt pro Befehl höchstens eine Zeile und keine Nutzdaten jeder MQTT-Nachricht.

### 4.7 Elektroauto (seit 2.1)

**Beschreibung:** Im Carport steht genau ein Elektroauto an einer Wallbox. Es lädt mit 11 kW, bis der Akku voll ist, kann wegfahren und wiederkommen. Der Server führt Akkustand und Laden; alle Clients zeigen dasselbe. Realisiert UJ-6.

#### FR-36: Carport und Wallbox

Der Katalog enthält den Raum `carport` („Carport“, Etage „Außen“) und das Gerät `carport.wallbox` (E-01, E-02; Annahme, §9).

**Konsequenzen (testbar):**
- Wallbox: Kategorie Mobilität, Betrieb 11.000 W, Standby 3 W, kein Grundlastgerät, kein Auto-Aus (Anhang A).
- Wallbox *An* bedeutet „Laden“.

#### FR-37: Elektroauto

Es gibt genau ein Elektroauto mit 60.000 Wh Akkukapazität (E-04; Annahme, §9).

**Konsequenzen (testbar):**
- Ausgangszustand: zu Hause mit 30.000 Wh (50 %).
- Anzeige: Ort („zu Hause“/„unterwegs“), Akkustand in ganzen Prozent (abgerundet; „100 %“ nur bei vollem Akku), beim Laden „voll in ‹h› h ‹m› min“ (ab 50 %: „voll in 2 h 44 min“).

#### FR-38: Laden

Die Wallbox lädt nur, wenn das Auto zu Hause ist und der Akku nicht voll ist (E-05, E-09, E-10).

**Konsequenzen (testbar):**
- Wallbox *An* ist nur möglich, wenn das Auto zu Hause ist und der Akku < 60.000 Wh; sonst ist die Gerätezeile gesperrt (mit Grund) und der Server lehnt mit `NICHT_MOEGLICH` ab.
- Während des Ladens steigt der Akkustand um 11.000 W × Zeit (verlustfrei), serverseitig integriert; 1 % ≈ 196 s.
- Bei 100 % schaltet der Server die Wallbox aus (Ursache „Akku voll“, eine Änderung, Meldung an alle); ab 50 % nach 9.818 s (± 1 s).
- Nach einem Neustart zählt die Ausfallzeit nicht als Ladezeit; ist der Akku voll oder das Auto unterwegs, wird die Wallbox beim Start ausgeschaltet.

#### FR-39: Wegfahren und Zurückkommen

Jede Person kann das Elektroauto wegfahren und zurückkommen lassen (E-06, E-07, E-13).

**Konsequenzen (testbar):**
- „Wegfahren“ setzt das Auto auf unterwegs und schaltet eine laufende Wallbox in **derselben** Änderung aus; der Akkustand bleibt auf dem Wert bei Abfahrt.
- „Wegfahren“ ist nur bei Akku ≥ 9.000 Wh (15 %) möglich, sonst gesperrt mit sichtbarem Grund bzw. `NICHT_MOEGLICH`.
- „Zurückkommen“ setzt das Auto auf zu Hause und zieht pauschal 9.000 Wh ab (mindestens 0); aus 64 % werden 49 %.
- Keine optimistische Anzeige: Der Zustand ändert sich erst mit der Serverbestätigung.

### 4.8 Solaranlage und Netzbilanz (seit 2.1)

**Beschreibung:** Auf dem Dach liegt eine Solaranlage mit 9,8 kWp. Man wählt, wie viel Sonne gerade scheint; daraus folgen Erzeugung, Netzbezug bzw. Einspeisung, Kosten bzw. Ertrag. Realisiert UJ-6.

#### FR-40: Solaranlage und Sonnenlage

Die Solaranlage hat 9.800 W Spitzenleistung; die Sonnenlage hat 5 Stufen (E-15 bis E-18; Annahme, §9).

**Konsequenzen (testbar):**
- Stufen und Anteile: Nacht 0, Bedeckt 0,10, Wolkig 0,35, Heiter 0,65, Sonnig 0,85; Erzeugung = 9.800 W × Anteil (0 · 980 · 3.430 · 6.370 · 8.330 W).
- Jede Person kann die Sonnenlage wählen; der Server setzt, speichert (retained) und verteilt sie an alle Clients. Ausgangszustand „Nacht“.
- Die Auswahl reagiert sofort (optimistisch wie FR-21); ohne Bestätigung nach 5 s springt sie zurück und es erscheint „Sonne konnte nicht eingestellt werden. Bitte erneut versuchen.“

#### FR-41: Netzbilanz live

Der Kopfbereich zeigt Erzeugung und Netzbilanz (E-19 bis E-21).

**Konsequenzen (testbar):**
- Netz-Zeile „Solar ‹x› W“ und je nach Vorzeichen „Netzbezug ‹y› W“ oder „Einspeisung ‹y› W“; bei 0/0 „Netzbezug 0 W“.
- Kosten pro Stunde aus dem Netzbezug; bei Einspeisung > 0 stattdessen „Ertrag ‹x› €/h“ (Einspeisung × Einspeisevergütung).
- Berechnung aus gerundetem Hausverbrauch und gerundeter Erzeugung, sodass Hausverbrauch − Solar = Netzbezug bzw. −Einspeisung exakt stimmt.
- Beispiele: Ausgangszustand + „Sonnig“ → „Solar 8.330 W · Einspeisung 8.252 W“, „Ertrag 0,66 €/h“; zusätzlich Laden → „Netzbezug 2.745 W“, „0,96 €/h“.
- Keine eigene Laststufe, kein Delta-Chip und keine Zählanimation für die Netzbilanz.

#### FR-42: Tagesbilanz

Der Server integriert Verbrauch, Netzbezug und Einspeisung über den Tag (E-23, E-24).

**Konsequenzen (testbar):**
- Integration bei jeder Änderung und mindestens alle 60 s; Tageswechsel, Persistenz und Neustartverhalten wie FR-10 für alle drei Reihen.
- Test mit simulierter Uhr: 2.000 W Verbrauch bei „Wolkig“ (3.430 W) über 30 min → Verbrauch 1,00 kWh, Bezug 0,00 kWh, Einspeisung 0,72 kWh, „Heute erzeugt 1,72 kWh“, Anzeige „Heute 1,00 kWh · Ertrag 0,06 €“.
- Ein gespeicherter Tageswert aus 2.0 (ohne Bezug/Einspeisung) wird als Bezug = Verbrauch, Einspeisung = 0 übernommen.
- Anzeige: Übersicht („Heute …“, „Netz heute: …“) und Bereich Solaranlage („Heute erzeugt ‹x› kWh“).

#### FR-43: Darstellung Solaranlage und Carport

Die Oberfläche zeigt Solaranlage und Elektroauto (E-29, E-30).

**Konsequenzen (testbar):**
- Bereich „Solaranlage“ (h2) nach den Szenen mit Erzeugung, Spitzenleistung „9,8 kWp“, „Heute erzeugt“ und der Sonnenwahl als Radiogruppe (eine Tab-Station, Pfeiltasten).
- Hausansicht mit Solarmodulen und Solarwert auf dem Dach sowie Carport-Fläche in der Zeile „Außen“ (Sprung zur Carport-Karte wie bei Räumen).
- Carport-Raumkarte mit Elektroauto-Bereich (Status, Akku-Balken, „Wegfahren“/„Zurückkommen“) und Wallbox-Zeile.
- Alles per Tastatur und Screenreader bedienbar; Laden, Einspeisung und Ertrag nie nur über Farbe. Details in DESIGN.md/EXPERIENCE.md.

#### FR-44: Release 2.1.0

Die Erweiterung wird als Release 2.1.0 ausgeliefert (E-36).

**Konsequenzen (testbar):**
- `package.json` hat Version `2.1.0`; offene 2.0-Tabs zeigen das Banner „Neue Version verfügbar“ und senden nichts (FR-18).
- Kein manueller Upgrade-Schritt.
- `docs/abnahme-2.1.md` ist ausgefüllt eingecheckt (NFR-10).

## 5. Übergreifende Qualitätsanforderungen (NFR)

- **NFR-1 Performance.**
  - Visuelle Reaktion auf Schalterbetätigung ≤ 100 ms (FR-21).
  - Verteilung einer Änderung an andere Clients im Heimnetz ≤ 1 s (p95); im automatisierten Test lokal ≤ 250 ms (p95).
  - Snapshot ≤ 1 s nach Verbindungsaufbau.
  - „First Load JS“ der Seite laut `next build` ≤ 200 kB; ein CI-Schritt wertet die Build-Ausgabe aus und schlägt bei Überschreitung fehl.
  - Animationen laufen ausschließlich über `transform`/`opacity` bzw. Zahlen-Interpolation, ohne Layout-Verschiebungen (CLS ≤ 0,1).
- **NFR-2 Barrierefreiheit (WCAG 2.2 AA)** (D-22).
  - Alle Funktionen per Tastatur erreichbar und bedienbar, sichtbarer Fokusrahmen mit Kontrast ≥ 3:1, logische Fokusreihenfolge, keine Tastaturfallen (Dialog aus FR-4 hält den Fokus und gibt ihn beim Schließen zurück).
  - Textkontrast ≥ 4,5:1, große Schrift und UI-Komponenten ≥ 3:1, in Hell und Dunkel.
  - Zoom bis 200 % ohne Funktionsverlust; `user-scalable=no` und `maximum-scale=1` sind entfernt.
  - Trefferflächen ≥ 44 × 44 px.
  - `prefers-reduced-motion: reduce` schaltet alle nicht notwendigen Animationen ab.
  - Information nie nur über Farbe.
  - Automatisierte axe-Prüfung der Seite mit Snapshot-Daten in Hell und Dunkel: 0 Verstöße (Struktur, Namen, Rollen; axe prüft unter jsdom keine Kontraste).
  - Kontraste werden über einen Unit-Test belegt, der alle Farb-Token-Paare (Text/Hintergrund, Fokus/Hintergrund, Komponenten) beider Themes nach WCAG-Formel berechnet.
  - Tastatur, Screenreader-Ansagen (VoiceOver), Zoom 200 % und reduzierte Bewegung werden in der Abnahme-Checkliste (NFR-10) geprüft.
- **NFR-3 Responsivität.** Fehlerfreie Darstellung ohne horizontales Scrollen bei 360, 768, 1024 und 1440 px Breite; Hoch- und Querformat. Nachweis über die Abnahme-Checkliste (NFR-10).
- **NFR-4 Sicherheit.**
  - Die Härtung aus PR #1/#2 bleibt unverändert: Node 22, `USER 1000:1000`, kein npm/npx/corepack/yarn/apk/wget/curl/nc im Runtime-Image, App-Code nur lesbar.
  - Broker lauscht nur auf 127.0.0.1.
  - WebSocket-Proxy nur mit Befehls-Whitelist und 4-KB-Limit (FR-18); das WebSocket-Upgrade wird nur akzeptiert, wenn der `Origin`-Header fehlt oder zum Host der App passt, sonst HTTP 403.
  - `npm audit` ohne Befunde ≥ high in Produktionsabhängigkeiten.
  - Keine neuen Laufzeitabhängigkeiten, außer sie sind im Addendum begründet.
- **NFR-5 Zuverlässigkeit.**
  - Ungültige Eingaben bringen den Server nie zum Absturz (FR-18).
  - Verliert der Server den Broker, verbindet er sich selbständig neu und meldet währenddessen 503 (FR-30).
  - Nach einem Broker-Neustart stellt der Server den Zustand aus den gespeicherten Daten wieder her.
- **NFR-6 Wartbarkeit.**
  - Lint und Typecheck ohne Befunde.
  - Zeilenabdeckung ≥ 90 % für die Domänenlogik: Katalog, Verbrauchs- und Kostenrechnung, Tagesintegration, Szenen, Befehlsprüfung, Auto-Aus.
  - Komponententests für Kopfbereich, Raumkarte, Schalter, Dialog und Verbindungsbanner.
  - Integrationstests für Mehrclient-Synchronisation (FR-16, FR-19) gegen den echten Server.
  - Ein gemeinsamer Gerätekatalog für Server und Client.
- **NFR-7 Beobachtbarkeit.** Serverlog mit Start, Broker-Verbindungswechseln, abgelehnten Befehlen (ohne Nutzdaten), Auto-Aus-Ereignissen, Akku-voll-Ereignissen (`akku_voll`), Strompreis- und Einspeisevergütungs-Meldungen (`einspeiseverguetung`, `einspeiseverguetung_ungueltig`); eine Zeile je Ereignis.
- **NFR-8 Browserunterstützung** (D-29). Jeweils aktuelle zwei Hauptversionen von Chrome/Edge, Firefox und Safari (macOS und iOS).
- **NFR-9 Betriebskompatibilität** (D-30). Port 3000, Imagename, die Umgebungsvariablen `PORT`, `HOSTNAME`, `MQTT_BROKER_HOST`, `MQTT_BROKER_PORT` und das Volume `mosquitto-data` bleiben gültig; `NEXT_PUBLIC_MQTT_BROKER_URL` wird ignoriert (die App verbindet sich immer relativ zum eigenen Host). Einziger manueller Schritt beim Update: Enthält die Compose-Datei auf dem Host noch den alten `healthcheck` mit `curl`, muss dieser Block einmalig entfernt oder durch den Befehl aus dem Repo ersetzt werden, weil er den Image-Healthcheck überschreibt und `docker compose pull` die Host-Datei nicht ändert. README und Release-Notes nennen diesen Schritt als „Upgrade-Hinweis 2.0.0“.
- **NFR-10 Abnahme-Checkliste.** Das Repo enthält `docs/abnahme-2.0.md` mit abhakbaren Browser-Prüfungen: Breiten 360/768/1024/1440 px in Hell und Dunkel (mit Screenshots), Tastaturdurchlauf UJ-4, VoiceOver-Ansagen aus FR-11, Zoom 200 %, `prefers-reduced-motion`, Zwei-Geräte-Sync (SM-2). Die Checkliste wird vor dem Release vollständig ausgefüllt eingecheckt. Für 2.1 zusätzlich `docs/abnahme-2.1.md` (Breiten, Hell/Dunkel, Tastaturdurchlauf Sonnenwahl und Carport, VoiceOver-Ansagen Wallbox/Sonne, Zwei-Geräte-Sync der Sonnenlage, gemessenes JS-Budget).

## 6. Bewusst nicht Teil des Produkts

Diese Punkte werden nicht gebaut, auch nicht später im Rahmen dieses Auftrags. Jede Streichung ist begründet.

- **Anbindung echter Hardware** (Shelly, Zigbee, Tasmota, Home Assistant). IoT-Haus ist eine Simulation; echte Geräte bräuchten Geräteerkennung, Sicherheit und Fehlerbehandlung, die weit über ein Release hinausgehen (D-01).
- **Benutzerkonten, Login, Rechte.** Betrieb im Heimnetz; Zugriffsschutz nach außen leistet ein Reverse-Proxy (Doku-Hinweis FR-34, D-20).
- **Szenen-Editor und eigene Szenen.** Vier gut gewählte feste Szenen decken den Auftrag ab; ein Editor in guter UX-Qualität ist nicht in einem Tag lieferbar (D-12).
- **Rückgängig für Szenen.** Szenen sind idempotent, jedes Gerät ist mit einem Tipp zurückzuschalten (D-14).
- **Zeitpläne, Automationen, Anwesenheitslogik.** Außer dem fest definierten Auto-Aus (FR-5) gibt es keine Regeln; sie verlangen einen Regel-Editor und Zeitzonenlogik ohne Mehrwert für den Auftrag.
- **Verlaufsdiagramme und Statistik über mehrere Tage.** Der Auftrag verlangt, was das Haus *gerade* verbraucht; Tageswerte (FR-10) genügen. Mehrtages-Historie bräuchte eine Datenbank.
- **Geräte in der Oberfläche anlegen, umbenennen oder Leistungen ändern.** Der Gerätekatalog ist fest und versioniert (FR-2).
- **Dritter Gerätezustand „vom Netz getrennt“.** Standby wird über den Zustand *Aus* sichtbar (D-04).
- **Dynamische Tarife, Tag/Nacht-Strom.** Ein konfigurierbarer Strompreis genügt (FR-9). (Einspeisung mit fester Vergütung ist seit 2.1 Teil des Produkts.)
- **PV-Überschussladen, Lademanagement.** Das wäre eine Automation; Regeln sind nicht Teil des Produkts (E-32).
- **Hausbatteriespeicher.** Erhöht Zustände und Rechenwege ohne Mehrwert für den Auftrag (E-32).
- **Zweites Fahrzeug.** Der Auftrag nennt genau ein Elektroauto (E-32).
- **Wählbare Ladeleistung.** Die Wallbox lädt konstant mit 11 kW (E-03, E-32).
- **Fahrten mit Strecke/Dauer und zeitabhängigem Verbrauch.** Eine Fahrt kostet pauschal 15 % Akku (E-07).
- **Sonnenlage nach Uhrzeit oder Wetterdienst, stufenloser Sonnenregler.** Der Mensch wählt die Sonne in 5 Stufen (E-16, E-32).
- **Ladeverluste.** Laden ist verlustfrei modelliert (E-32).
- **Push-Benachrichtigungen, Offline-Modus, installierbare PWA mit Service Worker.** Offline-Befehle widersprechen dem Serverzustand als Autorität (D-17).
- **Weitere Sprachen.** UI ausschließlich Deutsch (Spielregel des Auftrags).
- **Browser-E2E-Testsuite (Playwright/Cypress) und Lighthouse-CI.** Abdeckung durch Komponenten-, axe-, Kontrast- und Mehrclient-Integrationstests plus Abnahme-Checkliste (NFR-10, D-28).
- **MQTT-Befehlskanal für externe Clients.** Befehle kommen nur über den WebSocket; der Broker lauscht ohnehin nur auf 127.0.0.1 (NFR-4).
- **Raumleiste mit Chips, abgestufte Raumfüllung nach Verbrauch, laufende Hochrechnung des Tageswerts zwischen Serverwerten.** Gekürzt, um dem Ein-Tages-Umfang Puffer zu geben; die Hausansicht springt bereits zu den Raumkarten, und der Tageswert aktualisiert sich mit jeder Änderung und alle 60 s (Review H-4, D-31).

## 7. Erfolgskennzahlen

**Primär**
- **SM-1 Zustandskonsistenz:** Im Integrationstest (3 Clients, 200 zufällige Befehle) stimmen alle Client-Zustände zu 100 % mit dem Serverzustand überein; ein neu verbundener Client verändert 0 Gerätezustände. Validiert FR-14 bis FR-19.
- **SM-2 Aha-Moment:** Vom Tipp auf „Mikrowelle“ bis zur sichtbar geänderten Gesamtleistung auf einem zweiten Gerät vergehen im Heimnetz ≤ 1 s; bei der Abnahme auf Handy und Laptop manuell geprüft, im Test automatisiert (≤ 250 ms lokal). Validiert FR-6, FR-11, FR-16.
- **SM-3 Auslieferung:** CI grün, `:latest` und `:2.0.0` veröffentlicht, GitHub Release `v2.0.0` vorhanden, Container nach ≤ 60 s `healthy` (mit der Compose-Datei aus dem Repo bzw. nach dem Upgrade-Hinweis aus NFR-9). Validiert FR-30 bis FR-33, NFR-9.

**Sekundär**
- **SM-4 Barrierefreiheit:** 0 axe-Verstöße in Hell und Dunkel; alle UJ-4-Schritte per Tastatur ausführbar. Validiert NFR-2, FR-27.
- **SM-6 Bilanzrichtigkeit:** Alle Tests zu Netzbilanz, Tagesbilanz, Akku-Integration und Akku-voll grün. Validiert FR-38, FR-41, FR-42.
- **SM-5 Rechenrichtigkeit:** Alle Tests zu Hausverbrauch, Raumverbrauch, Kosten, Laststufen und Tagesintegration grün, Abdeckung Domänenlogik ≥ 90 %. Validiert FR-6 bis FR-13.

**Gegenkennzahlen (nicht optimieren)**
- **SM-C1 Leistungswerte nicht „aufhübschen“:** Die Katalogwerte bleiben realistische Mittelwerte (Anhang A), auch wenn größere Zahlen eindrucksvoller wirken. Balanciert SM-2.
- **SM-C2 Animationsmenge:** Mehr Effekte sind kein Ziel; jede Animation muss bei reduzierter Bewegung abschaltbar sein und darf NFR-1 nicht verletzen. Balanciert SM-2.
- **SM-C3 Katalog- und Szenenumfang:** Mehr Geräte oder Szenen sind kein Erfolg; der Umfang ist mit 29 Geräten, 4 Szenen, 1 Elektroauto und 1 Solaranlage fest. Balanciert den gesamten Scope.
- **SM-C4 Testlaufzeit:** Die CI soll nicht durch langsame Tests aufgebläht werden; Tests insgesamt ≤ 60 s. Balanciert SM-5.

## 8. Offene Fragen

Keine. Alle Fragen wurden vom BMAD-Team entschieden und in `prd-decision-log.md` protokolliert (D-01 bis D-33); die Entscheidungen zu 2.1 stehen in `sprint-change-proposal-2026-09-27.md` §9 (E-01 bis E-36).

## 9. Annahmen-Index

Die folgenden Punkte hat das Team ohne Stakeholder-Bestätigung festgelegt. Sie gelten als verbindlich, sind aber als Annahmen gekennzeichnet:

- §4.1 / Anhang A: Leistungswerte sind typische Mittelwerte eines deutschen Haushalts, keine Messwerte (D-05, D-08).
- FR-9: Strompreis 0,35 €/kWh als Standard (D-09).
- FR-1: Sechs Räume mit der genannten Aufteilung (D-02).
- FR-4: Kühlschrank, Gefrierschrank und Router sind die einzigen Grundlastgeräte (D-06).
- FR-5: Auto-Aus nach 3 Minuten nur für Wasserkocher und Mikrowelle (D-07).
- FR-12: Schwellen der Laststufen (D-11).
- §6: Kein Login; Betrieb im Heimnetz (D-20).
- FR-36: Wallbox mit 11 kW Ladeleistung und 3 W Standby (E-03, E-31).
- FR-37: Akku 60 kWh, Start 50 % zu Hause (E-04).
- FR-39: Pauschal 9 kWh (15 %) je Fahrt, abgezogen bei Rückkehr (E-07).
- FR-40: Solaranlage 9,8 kWp; Stufenanteile 0 / 10 / 35 / 65 / 85 % (E-15, E-17).
- FR-9/FR-41: Einspeisevergütung 0,08 €/kWh als Standard (E-22).

## Anhang A: Gerätekatalog

Leistungen in Watt (Annahme, §9). „Betrieb“ = mittlere Leistung im Zustand *An*, „Standby“ = Leistung im Zustand *Aus*. G = Grundlastgerät (Ausgangszustand *An*), A = Auto-Aus 3 min, L = Ladegerät (lädt nur mit Auto zu Hause, Akku < 100 %).

| Geräte-ID | Gerät | Raum | Etage | Kategorie | Betrieb | Standby | Merkmal |
|---|---|---|---|---|---:|---:|---|
| `wohnzimmer.deckenlampe` | Deckenlampe | Wohnzimmer | EG | Licht | 15 | 0 | |
| `wohnzimmer.stehlampe` | Stehlampe | Wohnzimmer | EG | Licht | 10 | 0 | |
| `wohnzimmer.fernseher` | Fernseher | Wohnzimmer | EG | Unterhaltung | 90 | 0,5 | |
| `wohnzimmer.soundbar` | Soundbar | Wohnzimmer | EG | Unterhaltung | 25 | 0,5 | |
| `wohnzimmer.spielkonsole` | Spielkonsole | Wohnzimmer | EG | Unterhaltung | 180 | 1,5 | |
| `kueche.deckenlampe` | Deckenlampe | Küche | EG | Licht | 15 | 0 | |
| `kueche.kuehlschrank` | Kühlschrank | Küche | EG | Küche | 35 | 0 | G |
| `kueche.mikrowelle` | Mikrowelle | Küche | EG | Küche | 1.200 | 1,5 | A |
| `kueche.backofen` | Backofen | Küche | EG | Küche | 2.000 | 1 | |
| `kueche.wasserkocher` | Wasserkocher | Küche | EG | Küche | 2.200 | 0 | A |
| `kueche.kaffeemaschine` | Kaffeemaschine | Küche | EG | Küche | 1.300 | 1 | |
| `kueche.geschirrspueler` | Geschirrspüler | Küche | EG | Haushalt | 600 | 0,5 | |
| `hwr.deckenlampe` | Deckenlampe | Hauswirtschaftsraum | EG | Licht | 10 | 0 | |
| `hwr.waschmaschine` | Waschmaschine | Hauswirtschaftsraum | EG | Haushalt | 500 | 0,5 | |
| `hwr.waeschetrockner` | Wäschetrockner | Hauswirtschaftsraum | EG | Haushalt | 700 | 0,5 | |
| `hwr.gefrierschrank` | Gefrierschrank | Hauswirtschaftsraum | EG | Küche | 20 | 0 | G |
| `schlafzimmer.deckenlampe` | Deckenlampe | Schlafzimmer | OG | Licht | 12 | 0 | |
| `schlafzimmer.nachttischlampe` | Nachttischlampe | Schlafzimmer | OG | Licht | 5 | 0 | |
| `schlafzimmer.fernseher` | Fernseher | Schlafzimmer | OG | Unterhaltung | 40 | 0,5 | |
| `bad.deckenlampe` | Deckenlampe | Badezimmer | OG | Licht | 10 | 0 | |
| `bad.spiegelleuchte` | Spiegelleuchte | Badezimmer | OG | Licht | 8 | 0 | |
| `bad.foehn` | Föhn | Badezimmer | OG | Körperpflege | 1.800 | 0 | |
| `bad.heizluefter` | Heizlüfter | Badezimmer | OG | Heizung | 2.000 | 0 | |
| `arbeitszimmer.deckenlampe` | Deckenlampe | Arbeitszimmer | OG | Licht | 12 | 0 | |
| `arbeitszimmer.schreibtischlampe` | Schreibtischlampe | Arbeitszimmer | OG | Licht | 6 | 0 | |
| `arbeitszimmer.pc` | PC | Arbeitszimmer | OG | IT | 150 | 2 | |
| `arbeitszimmer.monitor` | Monitor | Arbeitszimmer | OG | IT | 25 | 0,3 | |
| `arbeitszimmer.router` | Router | Arbeitszimmer | OG | IT | 10 | 0 | G |
| `carport.wallbox` | Wallbox | Carport | Außen | Mobilität | 11.000 | 3 | L |

**Kontrollsummen:** 29 Geräte (Wohnzimmer 5, Küche 7, Hauswirtschaftsraum 4, Schlafzimmer 3, Badezimmer 4, Arbeitszimmer 5, Carport 1). Summe der Standby-Leistung aller Nicht-Grundlastgeräte: 13,3 W. Grundlast *An*: 65 W. Ausgangszustand: 78,3 W, angezeigt „78 W“, Kosten pro Stunde 0,03 €/h. „Alles an“ (Auto zu Hause, Akku < 100 %): 23.978 W. „Alles aus“ aus „alles an“: 78 W. Laden aus dem Ausgangszustand bei Nacht: +10.997 W → 11.075 W, 3,88 €/h.
