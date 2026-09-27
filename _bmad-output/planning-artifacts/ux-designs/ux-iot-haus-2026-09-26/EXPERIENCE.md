---
name: IoT-Haus 2.1
version: 2.1.0
status: final
updated: 2026-09-27
owner: Sally (BMAD UX), headless
sources:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/prd-addendum.md
  - _bmad-output/planning-artifacts/prd-decision-log.md
  - _bmad-output/planning-artifacts/01-analyse-befunde.md
  - docs/component-inventory.md
  - _bmad-output/planning-artifacts/sprint-change-proposal-2026-09-27.md (2.1: Solaranlage, Elektroauto; Entscheidungen E-01 … E-36)
companion: DESIGN.md
decision_log: .decision-log.md
---

# IoT-Haus 2.1 – EXPERIENCE.md (Verhalten und Struktur)

Dieses Dokument legt fest, **wie IoT-Haus funktioniert**: Seitenaufbau, Texte, Verhalten der Bausteine, Zustände, Bewegung, Barrierefreiheit und die Abläufe der User Journeys. Das Aussehen steht in [`DESIGN.md`](DESIGN.md); Tokens werden hier als `{colors.on}` usw. referenziert. Begriffe folgen dem PRD-Glossar (§3) wörtlich. Beide Spines gehen jedem Mock und jeder Skizze vor. Alle Entscheidungen mit Begründung: [`.decision-log.md`](.decision-log.md) (Verweise als UX-nn).

## Foundation

- **Formfaktor:** eine responsive Web-Seite (Next.js 15 App Router, React 19, Tailwind 4), zuerst für das Handy (360 px) gebaut, zweispaltig ab 1024 px (FR-25). Keine PWA, kein Service Worker (PRD §6).
- **UI-System:** keines. Eigene, kleine Bausteine auf Tailwind-Utilities, Tokens als CSS-Variablen (DESIGN.md). **Keine neue Laufzeitabhängigkeit** (NFR-4): keine Icon-, Animations-, Dialog- oder Toast-Bibliothek. Dialog = natives `<dialog>`, Symbole = eigene Inline-SVG-Komponente, Zahlenanimation = `requestAnimationFrame`.
- **Sprache:** ausschließlich Deutsch, de-DE-Formate über das Domänenmodul `format.ts` (FR-29). Neutrale Ansprache ohne „du“ und ohne „Sie“, wo es sich vermeiden lässt (Addendum A-7).
- **Visuelle Identität:** DESIGN.md.
- **Datenquelle:** ausschließlich Snapshot und Änderungsmeldungen des Servers (FR-14 bis FR-16). Namen, Räume, Leistungen, Symbole und Szenen kommen aus dem gemeinsamen Gerätekatalog; kein UI-Text enthält eine Geräte-ID.

## Information Architecture

Eine Seite, eine Route `/`. Keine Navigation, keine Unterseiten, keine Einstellungsseite.

| Bereich (DOM-Reihenfolge) | Element | Zweck | Deckt |
|---|---|---|---|
| 0 | Sprunglink „Zu den Räumen springen“ | erstes fokussierbares Element, Ziel = Überschrift „Räume“ | FR-25, UJ-4 |
| 1 | **Kopfbereich** (`<header>`, sticky) | Hausverbrauch, Laststufe, Kosten bzw. **Ertrag** pro Stunde, Verbindungsstatus; **Netz-Zeile** „Solar ‹x› W · Netzbezug/Einspeisung ‹y› W“ (seit 2.1); h1 „IoT-Haus“ | FR-6, FR-9, FR-12, FR-20, FR-41 |
| 2 | **Übersichtsbereich** (scrollt mit) | davon Standby, „Heute ‹kWh› · ‹€›“ (netto bzw. „Ertrag“), **„Netz heute: Bezug … · Einspeisung …“**, Info-Hinweis, „Strompreis … · Einspeisevergütung …“, Darstellung (Theme) | FR-6, FR-9, FR-10, FR-13, FR-28, FR-42 |
| 3 | **Szenenleiste** (h2 „Szenen“) | 4 Szenen (unverändert) | FR-22, FR-23 |
| 4 | **Solaranlage** (h2 „Solaranlage“, neu in 2.1) | Erzeugung, Spitzenleistung „9,8 kWp“, „Heute erzeugt“, **Sonnenwahl** (5 Stufen) | FR-40, FR-42, FR-43 |
| 5 | **Hausansicht** (h2 „Hausansicht“) | 2 Etagen × 3 Räume + **Solarmodule und Solarwert auf dem Dach** + Zeile **„Außen“** mit Carport-Fläche; Sprung zur Raumkarte | FR-7, FR-26, FR-43 |
| 6 | **Räume** (h2 „Räume“, Sprungziel) | **7 Raumkarten** mit 29 Gerätezeilen; Carport zuletzt, mit Elektroauto-Bereich und Wallbox-Zeile | FR-3, FR-4, FR-5, FR-7, FR-8, FR-27, FR-37 … FR-39 |
| 7 | **Verbrauch nach Raum** (h2) | **7 Einträge** inkl. Carport, absteigend mit Balken und Prozent | FR-7 |
| 8 | Fußzeile | Schätzungshinweis, Version | §4.2, FR-18 |
| Überlagerung | Banner (unten fest), Toast-Stapel, Grundlast-Dialog, Live-Region | Verbindungs-/Versionshinweis, Änderungsmeldungen, Bestätigung, Ansagen | FR-4, FR-11, FR-18, FR-20, FR-21 |

Die Sonnenwahl gehört bewusst **nicht** in den Kopf (Kopf bleibt ohne Bedienelemente, FR-6/K-14, E-30).

Entfallen (FR-25, Befund U-04/U-05): doppelte Überschriften „Smart Home“/„Smart Home Control“, Untertitel, Systeminformations-Kacheln mit Broker-URL, „2 Stockwerke/4 Zimmer“-Kacheln, Legende grün/grau, Hintergrund-Blobs, Garten, Hover-Skalierung.

### Wireframe mobil (360 × 640, verbindlich)

Zahlen sind Beispielwerte, nicht ein einziger konsistenter Hauszustand. „(B)“ = Glühbirnen-Symbol, „(i)“ = Info-Schaltfläche.

```
┌──────────────────────────────────────┐  ← sticky, 136 px (21 %)
│ ⌂ IoT-Haus                ● Verbunden│
│ Hausverbrauch      +1.199 W          │  ← Delta-Chip (überlagert, 1,2 s)
│ 1.274 W                  ▮▮▯ mittel  │
│                             0,45 €/h │
│ ☀ Solar 0 W · Netzbezug 1.274 W      │  ← Netz-Zeile (label 13/16), seit 2.1
├──────────────────────────────────────┤
│ davon Standby 8,8 W                  │  ← Übersichtsbereich (scrollt)
│ Heute 3,42 kWh · 1,20 €          (i) │
│ Netz heute: Bezug 3,42 kWh · Einspeisung 0,00 kWh │ (umbrechend)
│ Strompreis 0,35 €/kWh · Einspeisevergütung 0,08 €/kWh │
│ Darstellung [System|Hell|Dunkel]     │
│                                      │
│ Szenen                               │
│ ┌───────────────┐ ┌───────────────┐  │
│ │⏻ Alles aus    │ │▶ Filmabend    │  │
│ │Grundlast bl…  │ │Stehlampe, TV… │  │
│ └───────────────┘ └───────────────┘  │
│ ┌───────────────┐ ┌───────────────┐  │
│ │☀ Morgenroutine│ │☾ Gute Nacht   │  │
│ └───────────────┘ └───────────────┘  │
│                                      │
│ Solaranlage                          │  ← seit 2.1
│ ┌──────────────────────────────────┐ │
│ │ (☀) Erzeugung 0 W        9,8 kWp │ │
│ │     Heute erzeugt 0,00 kWh       │ │
│ │ Sonne gerade                     │ │
│ │ [Nacht|Bedeckt|Wolkig|Heiter|Sonnig] │
│ └──────────────────────────────────┘ │
│                                      │
│ Hausansicht                          │
│          ╱‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾╲           │
│ OG │Schlaf-  │Bade-   │Arbeits-│     │
│    │zimmer   │zimmer  │zimmer  │     │
│    │5 W (B)  │0 W     │162 W   │     │
│    │1 an     │0 an    │2 an    │     │
│ EG │Wohn-    │Küche   │Hauswirt│     │
│    │zimmer   │1.238 W │schafts-│     │
│    │271 W    │3 an    │raum …  │     │
│  ─────────────────────────────────   │
│ Außen            │Carport      │      │  ← Zeile „Außen“, seit 2.1
│                  │3 W          │      │
│                  │Auto zu Hause 50 %│ │
│ Warm leuchtend: Licht ist an. Blitz: Auto lädt. │
│                                      │
│ Räume                                │
│ ┌──────────────────────────────────┐ │
│ │ Wohnzimmer                 271 W │ │
│ │ EG · 2 von 5 an                  │ │
│ │ (◌) Deckenlampe          [○──]   │ │
│ │     aus                          │ │
│ │ (◉) Spielkonsole         [──●]   │ │
│ │     180 W                        │ │
│ │ …                                │ │
│ │ [ ⏻ Raum ausschalten ]           │ │
│ └──────────────────────────────────┘ │
│ … 5 weitere Raumkarten + Carport (s. u.) │
│                                      │
│ Verbrauch nach Raum                  │
│ Küche          1.238 W   80 %        │
│ ████████████████░░░░░░░░             │
│ …                                    │
│ Alle Werte sind Schätzungen … 2.0.0  │
└──────────────────────────────────────┘
   ┌────────────────────────────────┐   ← Toasts, unten, über Banner
   │ ↑ +1.199 W · Mikrowelle (Küche)✕│
   └────────────────────────────────┘
```

### Wireframe mobil 2.1 – Laden mit Sonne (360 × 640, verbindlich)

Zustand: Sonne „Sonnig“, Wallbox lädt, Akku 64 %.

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

(Symbole im Wireframe nur als Platzhalter; umgesetzt als Inline-SVG `solar`, `auto`, `blitz`, `wallbox`, keine Emojis.)

Varianten:
- **Einspeisung:** Netz-Zeile „☀ Solar 8.330 W · Einspeisung 8.252 W“, rechts statt Kosten „Ertrag 0,66 €/h“.
- **Auto unterwegs:** Statuszeile „unterwegs · Akku 64 % bei Abfahrt“, Hinweis „Eine Fahrt verbraucht 15 % Akku.“, Schaltfläche „Zurückkommen“; Wallbox-Zeile „Standby 3 W · Auto unterwegs“, gesperrt; Carport-Fläche „Auto unterwegs“.
- **Akku < 15 %:** „Wegfahren“ gesperrt, darunter „Akku zu leer zum Wegfahren (mindestens 15 %).“
- **Akku voll:** Statuszeile „zu Hause · Akku voll“; Wallbox-Zeile „Standby 3 W · Akku voll“, gesperrt.

### Wireframe Desktop (1440 × 900, verbindlich)

```
┌──────────────────────────────────────────────────────────────────────────────┐ sticky 88 px
│ ⌂ IoT-Haus · Hausverbrauch 11.075 W · ▮▮▮ hoch · 0,96 €/h · ☀ Solar 8.330 W · Netzbezug 2.745 W · ● Verbunden │
├──────────────────────────────────────────────────────────────────────────────┤
│ davon Standby 13,3 W · Heute 3,42 kWh · 0,39 € (i) · Netz heute: Bezug 2,10 kWh · Einspeisung 4,30 kWh │
│ Strompreis 0,35 €/kWh · Einspeisevergütung 0,08 €/kWh          Darstellung [System|Hell|Dunkel] │
│ Szenen  [⏻ Alles aus] [▶ Filmabend] [☀ Morgenroutine] [☾ Gute Nacht]            │
│ Solaranlage  (☀) Erzeugung 8.330 W · 9,8 kWp · Heute erzeugt 12,40 kWh   Sonne gerade [Nacht|Bedeckt|Wolkig|Heiter|Sonnig] │
│ ┌──────────── 5/12 ────────────┐  ┌──────────────────── 7/12 ────────────────┐ │
│ │ Hausansicht                   │  │ Räume                                     │ │
│ │  (Haus, 5:4, Dach mit Solar,  │  │ ┌ Wohnzimmer ─────┐ ┌ Küche ────────────┐ │ │
│ │   Zeile „Außen“ mit Carport)  │  │ │                 │ │                   │ │ │
│ │                               │  │ │ …               │ │ …                 │ │ │
│ │ Verbrauch nach Raum           │  │ └─────────────────┘ └───────────────────┘ │ │
│ │  Küche 1.238 W 80 % ███       │  │ ┌ Hauswirtschafts…┐ ┌ Schlafzimmer ─────┐ │ │
│ │  …                            │  │ … (2 Spalten ab 1280 px)                  │ │
│ └───────────────────────────────┘  └───────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

Kopf ≥ 1280 px einzeilig (88 px). 1024–1279 px: Netz-Zeile als zweite Zeile (≈ 112 px). Kompakt (Höhe ≤ 500 px): einzeilig Hero · Pille · €/h · „Netzbezug 2.745 W“ bzw. „Einspeisung …“ (ohne Solarwert). Solaranlage-Karte ab 768 px einzeilig: Werte links, Sonnenwahl rechts. Carport-Karte steht in den Raumkarten zuletzt.

Linke Spalte ist ab 1024 px Breite **und** mindestens 860 px Viewport-Höhe `position: sticky` (oben = Kopfhöhe + 16 px), damit beim Schalten rechts die Hausansicht sichtbar mitleuchtet (UX-07). Bei geringerer Höhe scrollt sie normal.

### Oberflächen-Abschluss (jede Anforderung hat eine Oberfläche, jede Oberfläche eine Journey)

| Oberfläche | Journey |
|---|---|
| Kopfbereich, Delta-Chip, Toast | UJ-1, UJ-2, UJ-4 |
| Übersichtsbereich (Heute, Standby, Theme) | UJ-3 |
| Szenenleiste | UJ-1, UJ-3 |
| Hausansicht | UJ-2 |
| Raumkarte, Gerätezeile, Auto-Aus-Anzeige | UJ-1, UJ-2, UJ-4 |
| Grundlast-Dialog | UJ-3 (Randfall) |
| Verbrauch nach Raum | UJ-2 |
| Getrennt-Banner, Statusanzeige | UJ-1 (Randfall) |
| Versions-Banner, Fußzeile mit Version | UJ-5 |
| Netz-Zeile, Kosten/Ertrag, Netz heute | UJ-6 |
| Solaranlage, Sonnenwahl, Dach-Solar | UJ-6 |
| Carport-Karte, Elektroauto, Wallbox-Zeile, Carport-Fläche | UJ-6 |

## Voice and Tone

Ruhig, klar, sachlich-freundlich. Zahlen zuerst, dann das Wort. Keine Ausrufezeichen, keine Emojis, kein Marketing. Fehler sagen, was passiert ist und was jetzt geht.

| So | Nicht so |
|---|---|
| „Verbindung getrennt – Schalter sind gesperrt, bis die Verbindung wieder steht.“ | „Ups! Da ist was schiefgelaufen 😕“ |
| „+1.199 W · Mikrowelle (Küche)“ | „Du hast die Mikrowelle eingeschaltet!“ |
| „Mikrowelle konnte nicht geschaltet werden. Bitte erneut versuchen.“ | „Error: timeout“ |
| „Filmabend: keine Änderung nötig“ | „Szene bereits aktiv“ (Szenen werden nie als aktiv markiert, FR-22) |
| „Standby 1,5 W“ | „Stromfresser!“ |
| „noch 2:48“ | „Timer: 168 s“ |

### Microcopy-Katalog (verbindlich, vollständig)

Empfohlen als eine Datei `src/ui/texte.ts`; Platzhalter in ‹›. Zahlen immer über die de-DE-Formatierer (FR-29): Leistung ganzzahlig mit Tausenderpunkt, Standby eine Nachkommastelle, € zwei Nachkommastellen, kWh zwei Nachkommastellen, Prozent ganzzahlig, Einheit nach geschütztem schmalem Leerzeichen. Screenreader-Texte schreiben Einheiten aus („Watt“, „Euro pro Stunde“, „Kilowattstunden“).

| Schlüssel | Sichtbarer Text | Screenreader-Text (falls abweichend) |
|---|---|---|
| `seite.titel` | IoT-Haus – Energie & Steuerung (`<title>`) | – |
| `seite.beschreibung` | Simuliertes Zuhause mit Solaranlage und Elektroauto: Geräte schalten und live sehen, was das Haus verbraucht, erzeugt und kostet. (`meta description`, seit 2.1) | – |
| `sprunglink` | Zu den Räumen springen | – |
| `kopf.marke` | IoT-Haus (h1) | – |
| `kopf.verbrauch.label` | Hausverbrauch | – |
| `kopf.verbrauch.wert` | 1.274 W | Hausverbrauch 1.274 Watt |
| `kopf.laststufe` | niedrig · mittel · hoch | Laststufe niedrig/mittel/hoch |
| `kopf.kosten` | 0,45 €/h | Kosten 0,45 Euro pro Stunde |
| `status.verbunden` | Verbunden | Verbindungsstatus: verbunden |
| `status.verbinde` | Verbinde … | Verbindungsstatus: verbinde |
| `status.getrennt` | Getrennt | Verbindungsstatus: getrennt |
| `uebersicht.standby` | davon Standby 13,3 W | davon Standby 13,3 Watt |
| `uebersicht.heute` | Heute 3,42 kWh · 1,20 € | Heute 3,42 Kilowattstunden, 1,20 Euro |
| `uebersicht.info.knopf` | (Symbol i) | Hinweis zu den Werten |
| `uebersicht.info.text` | Schätzung auf Basis typischer Geräteleistungen und der eingestellten Sonne, gezählt seit 00:00 Uhr. Kosten = Netzbezug × Strompreis abzüglich Einspeisung × Einspeisevergütung. | – |
| `uebersicht.strompreis` | Strompreis 0,35 €/kWh | Strompreis 0,35 Euro pro Kilowattstunde |
| `theme.legende` | Darstellung | – |
| `theme.system` / `.hell` / `.dunkel` | System · Hell · Dunkel | – |
| `szenen.titel` | Szenen (h2) | – |
| `szene.alles-aus` | Alles aus – Untertitel: Grundlast bleibt an | – |
| `szene.filmabend` | Filmabend – Untertitel: Stehlampe, Fernseher, Soundbar | – |
| `szene.morgenroutine` | Morgenroutine – Untertitel: Kaffee, Wasserkocher, Bad warm | – |
| `szene.gute-nacht` | Gute Nacht – Untertitel: Nur Nachttischlampe bleibt an | – |
| `szene.busy` | Wird ausgeführt … | ‹Szene› wird ausgeführt |
| `haus.titel` | Hausansicht (h2) | – |
| `haus.etage.og` / `.eg` / `.aussen` | OG · EG · Außen | Obergeschoss · Erdgeschoss · Außenbereich |
| `haus.raum.an` | 2 an | – |
| `haus.raum.name` | – | ‹Raum›, ‹x› W, ‹n› Geräte an – zur Raumkarte (n = 1: „1 Gerät an“) |
| `haus.legende` | Warm leuchtend: Licht ist an. Blitz: Auto lädt. | – |
| `raeume.titel` | Räume (h2) | – |
| `raum.meta` | EG · 2 von 5 an | Erdgeschoss, 2 von 5 Geräten an |
| `raum.verbrauch` | 271 W | Raumverbrauch 271 Watt |
| `raum.aus` | Raum ausschalten | ‹Raum› ausschalten |
| `raum.aus.busy` | Wird ausgeschaltet … | – |
| `raum.aus.gesperrt` | – | Keine Geräte zum Ausschalten an (per `aria-describedby`) |
| `geraet.name` | ‹Gerät› | ‹Gerät›, ‹Raum› |
| `geraet.an` | 1.200 W | 1.200 Watt |
| `geraet.standby` | Standby 1,5 W | Standby 1,5 Watt |
| `geraet.aus` | aus | aus |
| `geraet.busy` | wird geschaltet … | wird geschaltet |
| `geraet.restzeit` | noch 2:48 | noch 2 Minuten 48 Sekunden (nur in der Beschreibung, nicht live) |
| `geraet.restzeit.ende` | schaltet aus … | schaltet gleich aus |
| `badge.grundlast` | Grundlast | Grundlastgerät |
| `badge.autoaus` | Auto-Aus 3 min | schaltet nach 3 Minuten automatisch aus |
| `verbrauch.titel` | Verbrauch nach Raum (h2) | – |
| `verbrauch.zeile` | Küche 1.236 W 64 % | Küche, 1.236 Watt, 64 Prozent |
| `fuss.hinweis` | Alle Leistungs- und Kostenwerte sind Schätzungen auf Basis typischer Geräteleistungen. | – |
| `fuss.version` | IoT-Haus ‹version› | – |
| `toast.geraet` | +1.199 W · Mikrowelle (Küche) | – |
| `toast.szene` | +5.532 W · Morgenroutine aktiviert | – |
| `toast.raum` | −1.161 W · Küche ausgeschaltet | – |
| `toast.autoaus` | −2.200 W · Wasserkocher (Küche) automatisch ausgeschaltet | – |
| `toast.keine-aenderung` | ‹Szene›: keine Änderung nötig / ‹Raum›: keine Änderung nötig | – |
| `toast.fehler.geraet` | ‹Gerät› konnte nicht geschaltet werden. Bitte erneut versuchen. | – |
| `toast.fehler.szene` | ‹Szene› konnte nicht ausgeführt werden. Bitte erneut versuchen. | – |
| `toast.fehler.raum` | ‹Raum› konnte nicht ausgeschaltet werden. Bitte erneut versuchen. | – |
| `toast.schliessen` | (Symbol ✕) | Meldung schließen |
| `ansage.geraet.an` / `.aus` | – | ‹Gerät› an. Hausverbrauch 1.274 Watt. / ‹Gerät› aus. Hausverbrauch 78 Watt. |
| `ansage.szene` | – | ‹Szene› aktiviert. Hausverbrauch ‹x› Watt. |
| `ansage.raum` | – | ‹Raum› ausgeschaltet. Hausverbrauch ‹x› Watt. |
| `ansage.autoaus` | – | ‹Gerät› automatisch ausgeschaltet. Hausverbrauch ‹x› Watt. |
| `ansage.wieder-verbunden` | – | Verbindung wiederhergestellt. |
| `banner.getrennt` | Verbindung getrennt – Schalter sind gesperrt, bis die Verbindung wieder steht. | – |
| `banner.getrennt.aktion` | Jetzt neu verbinden | – |
| `banner.getrennt.countdown` | Nächster Versuch in 8 s | – |
| `banner.getrennt.versuch` | Verbinde … | – |
| `banner.version.titel` | Neue Version verfügbar | – |
| `banner.version.text` | Die App wurde aktualisiert. Bitte neu laden, um weiter zu schalten. | – |
| `banner.version.aktion` | Neu laden | – |
| `laden` | – | Hauszustand wird geladen … |
| `erstfehler.titel` | Keine Verbindung zum Haus | – |
| `erstfehler.text` | Die App versucht es automatisch erneut. Bitte prüfen, ob der Server läuft. | – |
| `dialog.grundlast.titel` | ‹Gerät› wirklich ausschalten? | – |
| `dialog.grundlast.text` | Es ist ein Grundlastgerät und läuft normalerweise dauerhaft. | – |
| `dialog.grundlast.abbrechen` | Abbrechen | – |
| `dialog.grundlast.ausschalten` | Ausschalten | – |
| `dialog.grundlast.offline` | Verbindung getrennt – Ausschalten ist gerade nicht möglich. | – |

#### Microcopy 2.1 – Solaranlage, Netzbilanz, Elektroauto (verbindlich)

Umsetzung in `src/ui/texte.ts` exakt wie im Sprint Change Proposal 2026-09-27 §5.4.5 festgelegt (Schlüssel und Funktionssignaturen dort). Übersicht:

| Schlüssel | Sichtbarer Text | Screenreader-Text (falls abweichend) |
|---|---|---|
| `kopf.solar` / `.netzbezug` / `.einspeisung` | Solar 8.330 W · Netzbezug 2.745 W bzw. · Einspeisung 8.252 W (bei 0/0: „Netzbezug 0 W“) | `kopf.netzSr`: Solar 8.330 Watt, Netzbezug 2.745 Watt |
| `kopf.ertrag` | Ertrag 0,66 €/h (ersetzt Kosten, wenn Einspeisung > 0) | `kopf.ertragSr`: Ertrag 0,66 Euro pro Stunde |
| `uebersicht.heuteErtrag` | Heute 1,00 kWh · Ertrag 0,06 € (wenn Tageskosten < 0) | `uebersicht.heuteSr`: Heute 1,00 Kilowattstunden, Ertrag 0,06 Euro |
| `uebersicht.netzHeute` | Netz heute: Bezug 2,10 kWh · Einspeisung 4,30 kWh | Netz heute: Bezug 2,10 Kilowattstunden, Einspeisung 4,30 Kilowattstunden |
| `uebersicht.verguetung` | Einspeisevergütung 0,08 €/kWh | Einspeisevergütung 0,08 Euro pro Kilowattstunde |
| `solar.titel` | Solaranlage (h2) | – |
| `solar.erzeugung` | Erzeugung 8.330 W | Erzeugung 8.330 Watt |
| `solar.spitzenleistung` | 9,8 kWp | Spitzenleistung 9,8 Kilowatt-Peak |
| `solar.heuteErzeugt` | Heute erzeugt 12,40 kWh | Heute erzeugt 12,40 Kilowattstunden |
| `solar.sonneLegende` | Sonne gerade | – |
| Stufen | Nacht · Bedeckt · Wolkig · Heiter · Sonnig | `solar.stufeSr`: „Sonnig, 8.330 Watt“ |
| `solar.busy` | wird eingestellt … | – |
| `solar.dach` | ☀ Solar 8.330 W | `solar.dachSr`: Solaranlage 8.330 Watt |
| `auto.name` | Elektroauto | – |
| `auto.zuhause` / `.unterwegs` / `.laedt` | zu Hause · unterwegs · lädt | – |
| `auto.akku` / `.akkuAbfahrt` | Akku 64 % / Akku 64 % bei Abfahrt | – |
| `auto.vollIn` | voll in 2 h 44 min / voll in 12 min | `auto.vollInSr`: voll in 2 Stunden 44 Minuten |
| `auto.voll` | Akku voll | – |
| `auto.statusSr` | – | Elektroauto zu Hause, Akku 64 Prozent, lädt |
| `auto.wegfahren` / `.zurueckkommen` | Wegfahren / Zurückkommen | Elektroauto wegfahren lassen / Elektroauto zurückkommen lassen |
| `auto.busy` | Wird ausgeführt … | – |
| `auto.zuLeer` | Akku zu leer zum Wegfahren (mindestens 15 %). | – |
| `auto.fahrtHinweis` | Eine Fahrt verbraucht 15 % Akku. | – |
| `geraet.sperreUnterwegs` / `.sperreVoll` | Standby 3 W · Auto unterwegs / · Akku voll | `geraet.sperreSr`: nicht verfügbar: Elektroauto ist unterwegs / Akku ist voll |
| `haus.carportAuto` | Auto lädt 64 % · Auto zu Hause 50 % · Auto unterwegs | – |
| `haus.carportName` | – | Carport, 11.000 W, Elektroauto lädt, Akku 64 % – zur Raumkarte |
| `toast.sonne` | Sonne: Sonnig · Solar 8.330 W | – |
| `toast.autoWeg` / `.autoWegLaden` | Elektroauto weggefahren / Elektroauto weggefahren, Laden beendet | – |
| `toast.autoZurueck` | Elektroauto zurück · Akku 49 % | – |
| `toast.akkuVoll` | Akku voll – Laden beendet (Carport) | – |
| `toast.fehlerSonne` | Sonne konnte nicht eingestellt werden. Bitte erneut versuchen. | – |
| `toast.fehlerAuto` | Elektroauto konnte nicht wegfahren/zurückkommen. Bitte erneut versuchen. | – |
| `ansage.sonne` | – | Sonne: Sonnig. Solar 8.330 Watt. Einspeisung 8.252 Watt. |
| `ansage.autoWeg` | – | Elektroauto weggefahren. Hausverbrauch 78 Watt. |
| `ansage.autoZurueck` | – | Elektroauto zurück, Akku 49 Prozent. |
| `ansage.akkuVoll` | – | Akku voll, Laden beendet. Hausverbrauch 78 Watt. |

Neue Formatierer in `format.ts`: `akku(prozent)` → „64 %“, `kwp(w)` → „9,8 kWp“ (eine Nachkommastelle); Ertrag nutzt `euro`/`euroProStunde` (Betrag ohne Vorzeichen, E-21). Szenen-Untertitel bleiben unverändert (E-11).

Vorzeichen: „+“ für Zunahme, „−“ (U+2212) für Abnahme, „±0 W“ wenn die gerundete Differenz 0 ist, aber Geräte geändert wurden (UX-15).

## Component Patterns

Verhalten. Aussehen: DESIGN.md.Components. Empfohlene Dateinamen in Klammern (Architektur darf abweichen).

| Baustein | Verhalten |
|---|---|
| **Sprunglink** (`SkipLink`) | Erstes Element im `<body>`. Nur bei Fokus sichtbar (oben links, `surface-raised`, Ebene 2). Ziel `#raeume` (h2 mit `tabindex="-1"`); Aktivierung setzt den Fokus auf die Überschrift. |
| **Kopfbereich** (`Kopfbereich`) | `<header>` mit `position: sticky; top: 0; z-index: 20`. Enthält genau: h1 „IoT-Haus“, Hausverbrauch, Laststufe, Kosten bzw. Ertrag pro Stunde, Netz-Zeile (seit 2.1), Statusanzeige (FR-6). Keine Bedienelemente. Höhe laut DESIGN.md; Kopfhöhe wird als CSS-Variable `--kopf-h` gesetzt (per `ResizeObserver`) und für `scroll-margin-top` sowie die sticky linke Spalte genutzt. |
| **Hausverbrauch** (`Hausverbrauch`) | Struktur: `<p><span class="sr-only">Hausverbrauch ‹x› Watt</span><span aria-hidden="true">‹animierte Zahl›<small> W</small></span></p>`. Der sr-only-Text trägt stets den **Zielwert**, die sichtbare Zahl zählt (siehe Live-Verbrauch). Kein `aria-live` am Kopf (Ansage läuft über die Live-Region). |
| **Delta-Chip** (`DeltaChip`) | `aria-hidden`. Erscheint bei jeder bestätigten Änderung mit Differenz ≠ 0 im **Kopf** (auch bei fremden Änderungen). Zeigt die Differenz der letzten Änderung; eine neue Änderung ersetzt den Chip. Sichtbar 1,2 s. |
| **Laststufe** (`Laststufe`) | Berechnet aus dem angezeigten, gerundeten **Zielwert** (FR-12), nicht aus dem animierten Zwischenwert; wechselt sofort mit der Bestätigung. |
| **Kosten pro Stunde / Ertrag** | Ein Element. Wechselt sofort mit der Bestätigung auf den Zielwert (keine Zählanimation). Basis ist seit 2.1 der **Netzbezug**; bei Einspeisung > 0 steht dort „Ertrag 0,66 €/h“ (das Wort trägt die Bedeutung, Farbe `ink`), sonst „0,96 €/h“ wie bisher (E-21). |
| **Netz-Zeile** (`NetzZeile`, seit 2.1) | Teil des Kopfs, keine Bedienelemente, kein `aria-live`. Sichtbarer Text `aria-hidden`, sr-only-Text `kopf.netzSr`. Werte aus gerundetem Hausverbrauch und gerundeter Erzeugung, sodass Hausverbrauch − Solar = Netzbezug bzw. −Einspeisung exakt stimmt (FR-41, E-20). Wechselt sofort mit der Bestätigung (keine Zählanimation, kein Delta-Chip, K-31). Feste Mindestbreiten (`7ch` je Zahl, `tabular-nums`), damit nichts springt. |
| **Statusanzeige** (`Verbindungsstatus`) | Reiner Text mit Symbol, keine Schaltfläche. Werte siehe Verbindungs-Zustandsautomat. Nicht `aria-live` (das Banner übernimmt die Ansage). |
| **Übersichtsbereich** (`Uebersicht`) | Zeilen „davon Standby“, „Heute … · … €“ (seit 2.1 netto; bei negativen Tageskosten „Heute ‹kWh› kWh · Ertrag ‹x› €“) mit Info-Schaltfläche, „Netz heute: Bezug … · Einspeisung …“, „Strompreis … · Einspeisevergütung …“, Theme-Wahl. Tages- und Standby-Werte aktualisieren ohne Animation. Info-Schaltfläche = Disclosure: `<button aria-expanded aria-controls>`; öffnet den Hinweistext **inline** unter der Zeile (kein schwebendes Popover); Escape schließt, wenn der Fokus auf der Schaltfläche liegt. |
| **Theme-Wahl** (`ThemeWahl`) | `<fieldset>` mit `<legend>Darstellung</legend>` und drei nativen Radios, als Segmente gestaltet (Pfeiltasten wechseln nativ). Speichert `system`/`hell`/`dunkel` unter `localStorage["iot-haus-darstellung"]` (in `try/catch`). Setzt `data-theme` auf `<html>` sofort, aktualisiert `<meta name="theme-color">`. Bei „System“ folgt die App Änderungen von `prefers-color-scheme` live. |
| **Solaranlage** (`Solaranlage`, seit 2.1) | `<section aria-labelledby>` mit h2 „Solaranlage“, Karte `surface`, steht nach der Szenenleiste. Zeigt Erzeugung (`solar.erzeugung`), Spitzenleistung „9,8 kWp“, „Heute erzeugt ‹x› kWh“ (FR-42) und die Sonnenwahl. Werte ohne Animation. |
| **Sonnenwahl** (`SonnenWahl`, seit 2.1) | `<fieldset>` + `<legend>Sonne gerade</legend>`, 5 native Radios (Nacht, Bedeckt, Wolkig, Heiter, Sonnig) im Segment-Look wie `ThemeWahl`, eine Tab-Station, Pfeiltasten wechseln. Kontrolliert durch `anzeigeSonne`. Auswahl sendet Befehl `sonne`; das gewählte Segment wechselt sofort (optimistisch wie Einzelschalter, FR-21), Fieldset `aria-busy`, Hinweis „wird eingestellt …“. Fehler oder 5 s ohne Bestätigung → zurück auf Serverwert + Toast `toast.fehlerSonne`. Offline/veraltet: Radios `aria-disabled`, Änderungen wirkungslos. Zugänglicher Name je Radio: „Sonnig, 8.330 Watt“. Umbruch in 2 Zeilen erlaubt (< 360 px, 200 % Zoom). |
| **Szenen-Schaltfläche** (`SzenenLeiste`) | `<button>` mit sichtbarem Namen + Untertitel; zugänglicher Name = Szenenname (Untertitel per `aria-describedby`). Aktivierung sendet Befehl `szene`, setzt `aria-busy="true"` nur auf diese Schaltfläche; andere Szenen bleiben bedienbar. **Keine** optimistische Geräteänderung: Geräte ändern sich erst mit der Serveränderung (eine Änderung, FR-16). Weitere Aktivierung derselben Szene während `aria-busy` wird ignoriert. Erfolg: Toast `toast.szene` (alle Clients) oder `toast.keine-aenderung` (nur auslösender Client, FR-22). Ohne Bestätigung nach 5 s oder bei Fehler: `toast.fehler.szene`. Nie „aktiv“-Markierung. Gesperrt (offline/veraltet): `aria-disabled="true"`, Aktivierung wirkungslos. |
| **Hausansicht** (`Hausansicht`) | `<section aria-labelledby>` mit h2 „Hausansicht“; das Haus selbst ist ein `<div role="group" aria-label="Hausansicht">`, darin Dach-SVG (`aria-hidden`), je Etage ein `<div role="group" aria-label="Obergeschoss">` bzw. „Erdgeschoss“ mit sichtbarer, `aria-hidden` Beschriftung „OG“/„EG“ und 3 `<button>`-Räumen; Reihenfolge OG links→rechts, dann EG links→rechts. Zugänglicher Name je Raum: `haus.raum.name`. Aktivierung (Tipp, Klick, Enter, Leertaste): Raumkarte per `scrollIntoView` in Sicht (glatt, bei reduzierter Bewegung sofort), Fokus auf die h3 der Raumkarte (`tabindex="-1"`, `focus({preventScroll:true})` nach dem Scrollen), Raumkarte zeigt 800 ms den Fokus-Hervorhebungsrahmen. Räume sind **auch offline bedienbar** (reine Navigation). Leuchtend, sobald ≥ 1 Gerät der Kategorie Licht *An* (FR-26). Bei jeder bestätigten Änderung in diesem Raum: Lichtimpuls (siehe Motion). **Seit 2.1:** Dach-Solar (Module + Text „☀ Solar ‹x› W“, nicht interaktiv; für Screenreader in der Gruppe „Hausansicht“: „Solaranlage ‹x› Watt“) und eine dritte Gruppe „Außenbereich“ nach dem Erdgeschoss mit der Carport-Fläche. |
| **Dach-Solar** (seit 2.1) | Dach-SVG bleibt `aria-hidden`; Module: Erzeugung > 0 → Füllung `solar-soft`, Kontur `solar`; sonst `surface-sunken`. Darüber ein Text-Element (nicht interaktiv) „☀ Solar 8.330 W“ in `solar`; sr-only „Solaranlage 8.330 Watt“ als Teil der Gruppe „Hausansicht“. Keine Animation. |
| **Carport-Fläche** (`CarportFlaeche`, seit 2.1) | `<button>` in der Gruppe „Außenbereich“ der Hausansicht, Sprung zur Carport-Karte wie Räume (Fokus auf h3 „Carport“). Zeilen: „Carport“, Raumverbrauch, „Auto lädt 64 %“ / „Auto zu Hause 50 %“ / „Auto unterwegs“. Lädt: 2-px-Rand `on` + Blitz-Symbol `on` (nie nur Farbe: Text „lädt“). Zugänglicher Name `haus.carportName`. Auch offline bedienbar (reine Navigation). |
| **Raumkarte** (`Raumkarte`) | `<section aria-labelledby="raum-‹id›-titel">`, h3 = Raumname, `id="raum-‹id›"` als Sprungziel. Meta „EG · n von m an“. Raumverbrauch live (ohne Zählanimation). Geräteliste als `<ul>` in Katalogreihenfolge. Fuß: „Raum ausschalten“. **Carport-Karte** (seit 2.1): Meta „Außen · 1 von 1 an“, oben der Elektroauto-Block, darunter die Wallbox-Zeile, **kein** „Raum ausschalten“ (E-12, K-25). Erkennung über `ELEKTROAUTO.ladegeraet`, keine ID-Literale. |
| **Elektroauto** (`Elektroauto`, seit 2.1) | Block oben in der Carport-Karte, `role="group"` mit `aria-labelledby` = sichtbarer Name „Elektroauto“. Statuszeile und Akku-Balken `aria-hidden`, sr-only `auto.statusSr`. Schaltfläche „Wegfahren“/„Zurückkommen“ (`button-secondary`, ≥ 44 px), zugänglicher Name `auto.wegfahrenSr`/`auto.zurueckSr`; Aktivierung sendet Befehl `auto` (`zuhause: false/true`), `aria-busy` + „Wird ausgeführt …“ bis zur Bestätigung, **keine optimistische Änderung** (wie Szenen, K-26, E-13). Akku < 15 %: „Wegfahren“ `aria-disabled` + sichtbarer Grund `auto.zuLeer` (per `aria-describedby`). Unterwegs: Hinweis `auto.fahrtHinweis`. „voll in …“ aktualisiert minütlich über `useSekundentakt` (nur solange geladen wird), Akkustand über `akkuJetzt` (Extrapolation mit Uhrversatz, Anzeige abgerundet, AD-24). Akkuprozent zählt nicht animiert. Fehler/5 s: `toast.fehlerAuto`. |
| **Wallbox-Zeile** (seit 2.1) | `GeraeteZeile` mit Prop `sperrGrund`: bei Auto unterwegs bzw. Akku voll `aria-disabled`, Leistungszeile „Standby 3 W · Auto unterwegs“ bzw. „· Akku voll“, Beschreibung „nicht verfügbar: Elektroauto ist unterwegs“ bzw. „… Akku ist voll“. Kein Grundlast-Dialog. Lehnt der Server trotzdem ab (`NICHT_MOEGLICH`, Rennen zwischen Clients), gilt der normale Fehlerweg (Rücksprung + Fehler-Toast). |
| **Raum ausschalten** | `<button>`. Zugänglicher Name „‹Raum› ausschalten“. `aria-disabled="true"` (bleibt fokussierbar), wenn kein Nicht-Grundlastgerät des Raums *An* ist, mit Beschreibung `raum.aus.gesperrt`; ebenso offline/veraltet. Aktivierung: Befehl `raumAus`, `aria-busy`, Text „Wird ausgeschaltet …“; keine optimistische Geräteänderung. Erfolg: `toast.raum`; ohne Änderung: `toast.keine-aenderung` (nur lokal); Fehler/5 s: `toast.fehler.raum`. |
| **Gerätezeile + Schalter** (`GeraetSchalter`) | Die **ganze Zeile ist ein** `<button role="switch" aria-checked>` (Trefferfläche = Zeile, ≥ 56 px). `aria-label="‹Gerät›, ‹Raum›"`; `aria-describedby` → sr-only-Span mit Leistung ausgeschrieben + Kennzeichen + ggf. Restzeit (z. B. „Standby 1,5 Watt, schaltet nach 3 Minuten automatisch aus“). Sichtbare Leistungszeile ist `aria-hidden`, damit nichts doppelt gelesen wird. Aktivierung (Tipp, Klick, Leertaste, Enter): siehe Schalt-Ablauf unten. Während `aria-busy="true"` werden weitere Aktivierungen ignoriert. Offline/veraltet/Ladezustand: `aria-disabled="true"`, Aktivierung wirkungslos. |
| **Grundlast-Dialog** (`GrundlastDialog`) | Natives `<dialog>` per `showModal()` (Fokusfalle, `inert` für den Rest, Escape = `cancel`). `aria-labelledby` = Titel, `aria-describedby` = Text. Fokus beim Öffnen auf „Abbrechen“ (`autofocus`). „Abbrechen“, Escape, Klick auf `::backdrop` → schließen ohne Befehl. „Ausschalten“ → schließen und Schalt-Ablauf mit Ziel *Aus* starten. Nach dem Schließen Fokus zurück auf die auslösende Gerätezeile. Wird das Gerät während des offenen Dialogs anderweitig *Aus*: Dialog schließt sich selbst, Fokus zurück. Geht die Verbindung verloren: „Ausschalten“ wird `aria-disabled`, darunter erscheint `dialog.grundlast.offline`; Dialog bleibt offen, bis Abbrechen. |
| **Auto-Aus-Anzeige** | Nur bei Wasserkocher und Mikrowelle im Zustand *An*: Restzeit = `seit + 180 000 ms − (Date.now() + uhrVersatz)`; `uhrVersatz = serverZeit − Date.now()` beim Snapshot (Addendum A-3). Aktualisierung sekündlich über **einen** gemeinsamen Takt für die ganze Seite. Format „noch m:ss“. Bei ≤ 0: „schaltet aus …“ bis die Serveränderung eintrifft. Fortschrittslinie = Restanteil. Offline läuft die Restzeit weiter (die Abschaltung macht der Server); nach Wiederverbindung korrigiert der Snapshot. |
| **Verbrauch nach Raum** (`VerbrauchNachRaum`) | `<ol>` mit 7 `<li>` (seit 2.1 inkl. Carport; Skeleton-Zeilen aus `RAEUME.length`), absteigend nach Raumverbrauch, bei Gleichstand Katalogreihenfolge. Prozent = Raumverbrauch / Hausverbrauch, ganzzahlig gerundet (Summe darf von 100 abweichen). Balken `role="presentation"`; Prozent als Text sichtbar (FR-7). Umsortierung ohne Animation; Balkenbreite gleitet 250 ms. Nicht interaktiv. |
| **Meldungen 2.1** | Neue Art `solar` (Sonnen-Symbol, Farbe `solar`) für Sonnenwechsel, ohne Delta (E-34). Elektroauto-Meldungen nach der Tabelle „Toast-Texte nach Ursache“. Delta-Chip nur bei Hausverbrauchs-Differenz ≠ 0 (Sonnenwechsel erzeugt keinen Chip). |
| **Toast-Stapel** (`Meldungen`) | Ein Container am Ende von `<body>`, **nicht** selbst live (Ansagen laufen über die Live-Region). Max. 3 sichtbar; die vierte verdrängt die älteste. Jede Meldung 4 s sichtbar; Timer pausiert bei Zeiger-Hover oder Fokus in der Meldung. Schließen-Schaltfläche je Meldung. Escape schließt die neueste Meldung (Priorität: offener Dialog > offene Info-Disclosure mit Fokus > neueste Meldung). Meldungen stehlen nie den Fokus. Alle Clients zeigen Änderungsmeldungen, Fehler und „keine Änderung nötig“ nur der auslösende Client. |
| **Live-Region** (`Ansager`) | Genau eine sr-only `<div aria-live="polite" aria-atomic="true">`, beim ersten Rendern leer vorhanden. Änderungsansagen werden 2 s gesammelt: Innerhalb von 2 s nach einer Änderung ersetzt jede weitere die ausstehende, angesagt wird nur die letzte (FR-11). Fehlermeldungen, „keine Änderung nötig“ und „Verbindung wiederhergestellt.“ werden ohne Sammelfenster sofort angesagt. Technik: Text leeren, im nächsten Frame setzen. Ansagen zu Sonne, Elektroauto und Akku voll (seit 2.1) laufen durch dasselbe 2-s-Sammelfenster wie Änderungen (K-09). |
| **Banner** (`Banner`) | Fest am unteren Rand (`position: fixed; bottom: 16px + safe-area`), `role="status"`. Höchstens ein Banner; „Neue Version verfügbar“ hat Vorrang vor „Getrennt“. Solange ein Banner sichtbar ist, erhält `<main>` unten Innenabstand in Bannerhöhe, und der Toast-Stapel sitzt 8 px darüber. Kein Schließen-Knopf (Zustand, nicht Meldung). |
| **Ladezustand** (`Skeleton`) | Struktur aus dem Katalog wird sofort gerendert (Raumnamen, Gerätenamen, Symbole, Szenennamen), alle **Werte** und Schalter als Skeleton. Schalter sind im Ladezustand keine `role="switch"`, sondern `aria-hidden`-Platzhalter; `<main aria-busy="true">` plus sr-only `laden`. |
| **Fußzeile** | `fuss.hinweis` und `fuss.version` (Version aus dem Client-Build). |

### Schalt-Ablauf Einzelgerät (FR-3, FR-4, FR-21)

1. Aktivierung einer Gerätezeile (verbunden, nicht beschäftigt).
2. Ist das Gerät ein Grundlastgerät und das Ziel *Aus* → Grundlast-Dialog; nur „Ausschalten“ führt weiter zu 3.
3. **≤ 100 ms:** Schalter zeigt den Zielzustand (`aria-checked` = Ziel), `aria-busy="true"`, Leistungszeile „wird geschaltet …“. Hausverbrauch, Raumwerte, Hausansicht und Toast bleiben unverändert.
4. Befehl `schalten` mit neuer Befehls-ID senden.
5. **Serveränderung + Bestätigung:** `aria-busy` entfällt, Anzeige = Serverzustand. Alle abgeleiteten Werte aktualisieren sich in **einem** Render: Zählanimation Hausverbrauch, Delta-Chip, Laststufe, Kosten, Raumwert, Hausansicht-Impuls, Zeilen-Aufleuchten, Toast, Ansage.
6. **Bestätigung ohne Änderung** (Gerät war schon im Ziel, FR-19): `aria-busy` entfällt, keine Meldung.
7. **Fehler oder 5 s ohne Bestätigung:** Schalter kehrt zum Serverzustand zurück, `toast.fehler.geraet`, Ansage sofort. Verbindung bricht während des Wartens ab → sofort zurück + Fehler-Toast (nicht 5 s warten).
8. Trifft während des Wartens eine fremde Änderung für dieses Gerät ein, wird sie im Zustand übernommen; die Anzeige bleibt bis zu 5./7. beim Zielzustand.

## State Patterns

### Verbindungs-Zustandsautomat (löst Review-Befund L-12)

| Zustand | Eintritt | Statusanzeige | Banner | Inhalt | Schalter, Szenen, Raum ausschalten | Hausansicht-Sprung, Theme, Info |
|---|---|---|---|---|---|---|
| **Initial-Verbinde** | Seitenaufruf; WebSocket öffnet; noch kein Snapshot | Verbinde … | keins | Katalogstruktur + Skeleton | nicht vorhanden (Platzhalter) | bedienbar |
| **Erstfehler** | Erster Aufbau scheitert oder kein Snapshot binnen 5 s | Getrennt (während eines Versuchs: Verbinde …) | Getrennt-Banner mit Countdown und „Jetzt neu verbinden“ | Skeleton bleibt; darüber in `<main>` Hinweisfeld `erstfehler.titel/text` | nicht vorhanden | bedienbar |
| **Verbunden** | Snapshot empfangen, Version gleich | Verbunden | keins | Live-Werte | bedienbar | bedienbar |
| **Getrennt** | WebSocket schließt/Fehler nach „Verbunden“ | Getrennt | Getrennt-Banner, Nebentext „Nächster Versuch in n s“ (sekündlich, nicht angesagt) | letzter bekannter Zustand, voll lesbar; Auto-Aus-Restzeit läuft weiter | `aria-disabled`, Grafik abgeblendet; ausstehende Befehle sofort zurückgesetzt + Fehler-Toast | bedienbar |
| **Wiederverbinde** | Backoff-Timer (1, 2, 4, 8, dann alle 10 s) oder „Jetzt neu verbinden“ | Verbinde … | Banner bleibt, Nebentext „Verbinde …“, Aktion `aria-disabled` während des Versuchs | wie Getrennt | wie Getrennt | bedienbar |
| **Wieder verbunden** | Neuer Snapshot, Version gleich | Verbunden | verschwindet | Snapshot ersetzt alles **ohne** Zählanimation, **ohne** Toasts, **ohne** Impulse | bedienbar | bedienbar |
| **Veraltet** | Snapshot-Version ≠ Client-Version (FR-18) | Verbunden | Info-Banner „Neue Version verfügbar“ + „Neu laden“ (`location.reload()`) | Werte aus dem Snapshot | `aria-disabled` bis zum Neuladen | bedienbar |

Ansagen: Beim Eintritt in Getrennt liest `role="status"` den Bannertext einmal vor. Beim Wechsel zu „Wieder verbunden“ sagt die Live-Region „Verbindung wiederhergestellt.“ Das Banner erscheint **nicht** bei „Initial-Verbinde“ (normaler Start ≤ 1 s, FR-15).

### Weitere Zustände

| Oberfläche | Zustand | Verhalten |
|---|---|---|
| Kopfbereich | Laden | Hero-Zahl als Skeleton 5ch; Pille und Kosten als Skeleton; Status „Verbinde …“ |
| Gerätezeile | *An* / *Aus* mit Standby / *Aus* ohne Standby | „1.200 W“ / „Standby 1,5 W“ / „aus“ (FR-8) |
| Gerätezeile | wird geschaltet | Zielzustand + „wird geschaltet …“ + `aria-busy` |
| Gerätezeile | Auto-Aus läuft / läuft ab | „1.200 W · noch 2:48“ / „1.200 W · schaltet aus …“ |
| Gerätezeile | gesperrt | Schalter abgeblendet, `aria-disabled`, Text voll lesbar |
| Wallbox-Zeile | Auto unterwegs / Akku voll | „Standby 3 W · Auto unterwegs“ / „· Akku voll“, `aria-disabled`, Grund angesagt |
| Elektroauto | zu Hause / lädt / voll / unterwegs / zu leer | „zu Hause · Akku 50 %“ / „zu Hause · lädt · voll in 2 h 44 min“ / „zu Hause · Akku voll“ / „unterwegs · Akku 64 % bei Abfahrt“ / „Wegfahren“ gesperrt mit Grund |
| Elektroauto | beschäftigt | „Wird ausgeführt …“ + `aria-busy`, keine optimistische Änderung |
| Sonnenwahl | beschäftigt / gesperrt | optimistisch gewähltes Segment + „wird eingestellt …“ + `aria-busy` / `aria-disabled` |
| Kopf | Einspeisung > 0 / sonst | „Einspeisung ‹y› W“ + „Ertrag ‹x› €/h“ / „Netzbezug ‹y› W“ + „‹x› €/h“ |
| Raumkarte | kein Nicht-Grundlastgerät an | „Raum ausschalten“ `aria-disabled` + Beschreibung; Meta „0 von 5 an“ (Grundlastgeräte zählen bei „an“ mit) |
| Szene | beschäftigt / gesperrt | „Wird ausgeführt …“ + `aria-busy` / `aria-disabled` |
| Szene, Raum aus | keine Änderung nötig | nur lokaler Hinweis-Toast (Symbol i), Ansage sofort |
| Hausverbrauch | Differenz 0 nach Rundung, Geräte geändert | Toast „±0 W · …“, kein Delta-Chip, keine Zählanimation |
| Grundlast-Dialog | Verbindung weg / Gerät extern aus | siehe Component Patterns |
| Toast | Server-Fehlerantwort mit Code | immer der jeweilige `toast.fehler.*`-Text; Code und Servermeldung **nicht** anzeigen (nur `console.error` in Entwicklung erlaubt) |
| Theme | `localStorage` nicht verfügbar | „System“ gilt, Wahl wirkt nur für die Sitzung, kein Fehlerhinweis |
| Seite | Altschlüssel `smart-home-state` vorhanden | beim ersten Laden stillschweigend löschen (FR-14) |

Leere Zustände im engeren Sinn gibt es nicht: Katalog, Räume und Szenen sind fest und immer vollständig. Die einzigen „leeren“ Situationen sind Laden (Skeleton) und Erstfehler (Hinweisfeld).

## Live-Verbrauch und Änderungsmeldungen

Der Kern des Auftrags: „anzeigen, was das Haus gerade verbraucht, wenn man was anschaltet“.

| Ebene | Wo | Wann | Wie |
|---|---|---|---|
| Haus gesamt | Kopf (sticky) | jede bestätigte Änderung, alle Clients | Zählanimation 600 ms, Delta-Chip, Laststufe, Kosten/Ertrag |
| Netz (seit 2.1) | Kopf, Netz-Zeile | jede bestätigte Änderung inkl. Sonnenwechsel | Wert wechselt sofort, keine Zählanimation, kein Chip (E-19, K-31) |
| Solaranlage (seit 2.1) | Bereich Solaranlage, Dach | Sonnenwechsel | Wert wechselt ohne Animation |
| Elektroauto (seit 2.1) | Carport-Karte, Carport-Fläche | Änderung und `energie`-Nachricht; Anzeige extrapoliert | Akkuprozent springt (keine Zählanimation), Akku-Balken gleitet 250 ms |
| Raum | Hausansicht, Raumkarte, Verbrauch nach Raum | dieselbe Änderung | Zahl springt (keine Zählanimation), Hausansicht-Impuls, Balken gleitet 250 ms |
| Gerät | Gerätezeile | dieselbe Änderung | Leistungszeile wechselt, Zeile leuchtet 800 ms in `{colors.on-soft}` auf |
| Tag | Übersichtsbereich | jede Änderung und `energie`-Nachricht (≥ alle 60 s) | Wert wechselt ohne Animation (keine lokale Hochrechnung, FR-10) |

**Berechnung:** Alle Werte clientseitig aus Katalog + Serverzustand über das Domänenmodul (`hausverbrauch`, `raumverbrauch`, `standbyAnteil`, `laststufe`, `kostenProStunde`; seit 2.1 zusätzlich `erzeugung`, `netzbilanz`, `ertragProStunde`, `tagesKosten`, `tagesErzeugungWh`, `akkuWhBei`, `akkuProzent`, `restLadezeitMs`). Laststufe und Delta-Chip bleiben am Hausverbrauch (E-19). Differenz = gerundeter neuer minus gerundeter alter Hausverbrauch (FR-11); Kopf, Chip, Toast und Ansage nutzen denselben Wert.

**Toast-Texte nach Ursache** (`ursache.art` aus Addendum A-3):

| `art` | Text | Ansage |
|---|---|---|
| `geraet` | „±Δ W · ‹Gerät› (‹Raum›)“ | „‹Gerät› an./aus. Hausverbrauch ‹x› Watt.“ |
| `szene` | „±Δ W · ‹Szene› aktiviert“ | „‹Szene› aktiviert. Hausverbrauch ‹x› Watt.“ |
| `raumAus` | „±Δ W · ‹Raum› ausgeschaltet“ | „‹Raum› ausgeschaltet. Hausverbrauch ‹x› Watt.“ |
| `autoAus` | „−Δ W · ‹Gerät› (‹Raum›) automatisch ausgeschaltet“ | „‹Gerät› automatisch ausgeschaltet. Hausverbrauch ‹x› Watt.“ |
| `sonne` (seit 2.1) | Art `solar`: „Sonne: Sonnig · Solar 8.330 W“ | „Sonne: Sonnig. Solar 8.330 Watt. Einspeisung 8.252 Watt.“ |
| `auto` (weg, Laden lief) | „−10.997 W · Elektroauto weggefahren, Laden beendet“ | „Elektroauto weggefahren. Hausverbrauch 78 Watt.“ |
| `auto` (weg, ohne Laden) | Art `info`: „Elektroauto weggefahren“ | „Elektroauto weggefahren. Hausverbrauch 78 Watt.“ |
| `auto` (zurück) | Art `info`: „Elektroauto zurück · Akku 35 %“ | „Elektroauto zurück, Akku 35 Prozent.“ |
| `akkuVoll` | „−10.997 W · Akku voll – Laden beendet (Carport)“ | „Akku voll, Laden beendet. Hausverbrauch 78 Watt.“ |
| `geraet` Wallbox | „+10.997 W · Wallbox (Carport)“ (bestehendes Format) | „Wallbox an. Hausverbrauch 11.075 Watt.“ |

**Zählanimation:** Startwert = aktuell **angezeigter** Wert (auch mitten in einer laufenden Animation), Zielwert = neuer gerundeter Hausverbrauch; Dauer 600 ms, Kurve aus `motion.zaehlen` (Abschnitt Motion); Zwischenwerte ganzzahlig gerundet und de-DE formatiert. `requestAnimationFrame`, keine CSS-Layoutänderung (feste Mindestbreite 7ch). Bei `prefers-reduced-motion: reduce` sofort Zielwert.

## Motion

Einzige Quelle für Bewegungswerte (als CSS-Variablen `--m-*` definieren).

| Token | Wert | Einsatz |
|---|---|---|
| `motion.schnell` | 150 ms, `cubic-bezier(0.2, 0, 0, 1)` | Schalterknopf, Hover, Segmentwechsel |
| `motion.basis` | 250 ms, `cubic-bezier(0.2, 0, 0, 1)` | Toast rein/raus (translateY 8 px + opacity), Balkenbreite, Banner rein |
| `motion.zaehlen` | 600 ms, `cubic-bezier(0.22, 1, 0.36, 1)` | Hausverbrauch-Zahl (FR-6) |
| `motion.chip` | 1.200 ms gesamt: 150 ms einblenden + translateY −6 px, 750 ms stehen, 300 ms ausblenden | Delta-Chip |
| `motion.impuls` | 800 ms, ease-out | Hausansicht-Raum: Leuchtring (Pseudo-Element, opacity 0 → 1 → 0, scale 1 → 1,04); Gerätezeile: Fläche `on-soft` opacity 1 → 0; Raumkarte nach Sprung: Fokus-Hervorhebung |
| `motion.puls` | 1.600 ms, unendlich | Skeleton-Deckkraft, Ladering-Drehung (Status „Verbinde …“, Beschäftigt) |

Regeln: nur `transform` und `opacity` animieren (NFR-1); keine Animation beim Snapshot-Ersatz; keine Dauerschleifen außer Laden/Beschäftigt. **Seit 2.1:** keine neuen Animationen; der Akku-Balken nutzt das vorhandene Balkengleiten (`motion.basis`, bei reduzierter Bewegung sofort); Netz-Zeile, Solarwerte und Akkuprozent wechseln ohne Animation; **kein Dauer-Pulsieren beim Laden** („Laden/Beschäftigt“ oben meint nur den Ladering eines ausstehenden Befehls).

**`prefers-reduced-motion: reduce`** (NFR-2, SM-C2): Zählanimation, Chip-Bewegung, Impulse, Zeilen-Aufleuchten, Toast-Gleiten, Balkengleiten, Skeleton-Puls und Glattes Scrollen entfallen. Es bleiben: Delta-Chip erscheint und verschwindet ohne Bewegung (1,2 s), Toasts erscheinen/verschwinden sofort, Ladering wird durch statisches Symbol + Text ersetzt, Auto-Aus-Linie springt sekündlich. Umsetzung: `window.matchMedia` für JS-Animationen (live beobachten) und eine globale CSS-Regel, die `--m-*`-Dauern auf 0 ms setzt. Die bisherige globale `!important`-Regel in `globals.css` wird durch diese ersetzt.

## Interaction Primitives

- **Zeiger/Touch:** Ein Tipp schaltet. Kein Doppeltipp, kein langes Drücken, keine Wischgesten, kein Ziehen. Hover-Effekte nur bei `@media (hover: hover)`. `touch-action: manipulation` bleibt (kein 300-ms-Verzug).
- **Tastatur:** Tab-Reihenfolge = DOM-Reihenfolge: Sprunglink → Info-Schaltfläche → Theme-Radios (eine Tab-Station, Pfeiltasten innerhalb) → 4 Szenen → **Sonnenwahl** (eine Tab-Station, Pfeiltasten, seit 2.1) → 6 Räume + **Carport** der Hausansicht → je Raumkarte: Gerätezeilen, dann „Raum ausschalten“ (Carport-Karte: **Wegfahren/Zurückkommen**, dann **Wallbox**) → Toast-Schließen-Knöpfe → Banner-Aktion. Leertaste/Enter aktivieren Schalter und Schaltflächen. Escape: Dialog > Disclosure > neueste Meldung. Keine globalen Tastenkürzel (keine Konflikte mit Screenreadern).
- **Ausgelöste Befehle:** Es gibt genau fünf (FR-18): `schalten`, `szene`, `raumAus`, seit 2.1 `sonne` und `auto`. Es gibt **keine** Befehlswarteschlange offline (FR-20) und **keine** optimistische Anzeige für Szenen, „Raum ausschalten“ und Wegfahren/Zurückkommen (UX-10, E-13); die Sonnenwahl ist optimistisch wie ein Einzelschalter.
- **Verboten:** `hover:scale` auf Bereichen, Bestätigungsdialoge außer beim Ausschalten eines Grundlastgeräts (auch nicht für „Alles aus“, D-14), Rückgängig-Knöpfe, Fokus-Diebstahl durch Toasts, automatisches Scrollen außer beim Hausansicht-Sprung und beim Sprunglink.

## Accessibility Floor

Ziel WCAG 2.2 AA (NFR-2). Kontrast: DESIGN.md.Colors.

- **Landmarken:** `<header>` (Kopf), `<main>` (alles ab Übersichtsbereich), `<footer>`. Überschriften: h1 „IoT-Haus“; h2 „Szenen“, „Solaranlage“ (seit 2.1), „Hausansicht“, „Räume“, „Verbrauch nach Raum“ und sr-only h2 „Übersicht“; h3 je Raum inkl. „Carport“.
- **Schalter:** `role="switch"`, `aria-checked`, Name „‹Gerät›, ‹Raum›“, Beschreibung per `aria-describedby` (FR-27). Erwartete VoiceOver-Ausgabe (UJ-4): „Mikrowelle, Küche, Schalter, aus, Standby 1,5 Watt, schaltet nach 3 Minuten automatisch aus“.
- **Gesperrt:** immer `aria-disabled="true"` statt `disabled` (bleibt fokussierbar und ansagbar); Klick-/Tasten-Handler prüfen den Zustand. Fachlich gesperrte Elemente (Wallbox, Wegfahren, seit 2.1) nennen ihren Grund sichtbar **und** angesagt.
- **Erwartete VoiceOver-Ausgaben 2.1:** „Wallbox, Carport, Schalter, aus, Standby 3 Watt, nicht verfügbar: Elektroauto ist unterwegs“; „Sonnig, 8.330 Watt, Optionsfeld, 5 von 5, Sonne gerade“; „Elektroauto wegfahren lassen, Taste“.
- **Beschäftigt:** `aria-busy="true"` auf dem betroffenen Element (FR-21).
- **Ansagen:** eine polite Live-Region mit 2-s-Sammelfenster (siehe Component Patterns); Banner `role="status"`; keine `assertive`-Regionen.
- **Fokus:** `:focus-visible` mit `{components.focus-ring}` auf jedem interaktiven Element, ≥ 3:1 gegen alle Hintergründe (DESIGN.md). Dialog hält und gibt den Fokus zurück. Nach dem Hausansicht-Sprung liegt der Fokus auf der h3 der Raumkarte. Der sticky Kopf verdeckt nie ein fokussiertes Element (`scroll-margin-top`/`scroll-padding-top: calc(var(--kopf-h) + 16px)` auf `html`).
- **Nicht nur Farbe:** Laststufe mit Text + Balkensymbol; *An* mit Knopfposition + Häkchen + Leistungswert; leuchtender Raum mit Rand + Glühbirne; Delta mit Vorzeichen; Status mit Text; seit 2.1 Einspeisung/Netzbezug/Ertrag als Wörter, Laden als Text „lädt“ + Blitz, Solarmodule zusätzlich mit Zahlwert.
- **Zoom und Text:** `user-scalable=no` und `maximum-scale=1` entfernt (Next-15-`viewport`-Export nur mit `width=device-width, initial-scale=1`). Bis 200 % ohne Funktionsverlust; bei Viewport-Höhe ≤ 500 px kompakter Kopf. Keine festen Höhen für Textcontainer.
- **Trefferflächen:** ≥ 44 × 44 px; Gerätezeile 56 px.
- **Bewegung:** siehe Motion; alles Nicht-Notwendige abschaltbar.
- **Sprache:** `<html lang="de">`; Theme-Skript setzt vor dem ersten Paint `data-theme` (kein Aufblitzen, FR-28).
- **Prüfung:** axe in Hell und Dunkel mit Snapshot-Daten (0 Verstöße; seit 2.1 zusätzlich Fixture „Auto lädt, Sonne Heiter“), Kontrast-Unit-Test über alle Token-Paare aus DESIGN.md, Abnahme-Checkliste NFR-10 (Tastaturdurchlauf UJ-4, VoiceOver-Ansagen, 200 %, reduzierte Bewegung).

## Responsive & Platform

| Breite / Höhe | Verhalten |
|---|---|
| 360–767 px | Eine Spalte; Kopf mit Netz-Zeile (136 px, 21 %); Szenen 2 × 2; Solaranlage-Karte zweizeilig; Hausansicht volle Breite 4:3; Raumkarten untereinander; „Raum ausschalten“ volle Breite; Toasts unten zentriert |
| 768–1023 px | Szenen 1 × 4; Solaranlage-Karte einzeilig (Werte links, Sonnenwahl rechts); Raumkarten 2 Spalten; Toasts unten rechts; Banner max. 640 px zentriert |
| ≥ 1024 px | Kopf ≥ 1280 px einzeilig inkl. Netzwerten (88 px), 1024–1279 px mit Netz-Zeile als zweiter Zeile (112 px); Hero `display-lg`; zwei Spalten (5/12 Haus + Verbrauch nach Raum, 7/12 Raumkarten); Übersichtsbereich einzeilig mit Theme-Wahl rechts |
| ≥ 1280 px | Raumkarten rechts in 2 Spalten; Container max. 1280 px |
| Höhe ≤ 500 px (Querformat, 200 % Zoom) | Kompakter Kopf 64 px, einzeilig: Hero `display-compact` · Pille · €/h bzw. Ertrag · „Netzbezug ‹y› W“/„Einspeisung ‹y› W“ (ohne Solarwert) · Status (nur Symbol + sr-Text, Text ab 640 px Breite) |
| Höhe ≥ 860 px und Breite ≥ 1024 px | Linke Spalte sticky |

Kein horizontales Scrollen bei 360/768/1024/1440 px (NFR-3); `overflow-x: hidden` auf `body` entfällt als Pflaster, stattdessen `min-width: 0` in Grid-Zellen. Sicherer Bereich: `env(safe-area-inset-*)` für Kopf-Innenabstand, Banner und Toasts. iOS: `<meta name="apple-mobile-web-app-title" content="IoT-Haus">`, `apple-touch-icon` als existierende PNG (180 × 180) statt 404 (Befund U-10, reine Asset-Korrektur).

## Inspiration & Anti-patterns

- **Übernommen – Strommessgerät/Zwischenstecker:** eine große Zahl in Watt, sofortige Reaktion beim Einschalten. Das ist der Aha-Moment (SM-2).
- **Übernommen – Apple Home / Home Assistant Tiles:** ganze Kachel/Zeile ist Trefferfläche, Zustand warm leuchtend.
- **Übernommen – Git-Diff-Sprache:** „+1.199 W“ / „−2.200 W“ als knappe Änderungsmeldung.
- **Verworfen – Verbrauchs-Heatmap der Räume:** gestrichen (PRD §6, D-31); der Raum leuchtet nur bei Licht.
- **Verworfen – Diagramme/Verlauf, Tacho-Nadel, Donut:** kein Mehrwert für „gerade jetzt“, zusätzliches JS (NFR-1-Budget).
- **Verworfen – „Aktive Szene“-Markierung:** Zustand ändert sich danach (FR-22).
- **Verworfen – Gamification (Sparziele, Abzeichen), Konfetti:** SM-C2.
- **Verworfen – Emojis als Symbole** (Vorversion): uneinheitlich je Plattform, für Screenreader laut.

## Key Flows

### UJ-1. Sabine startet den Morgen und sieht den Verbrauch springen

1. 6:30 Uhr, Küche. Sabine öffnet das Lesezeichen. Katalogstruktur mit Skeleton, Status „Verbinde …“.
2. ≤ 1 s: Snapshot. Status „Verbunden“, Kopf „Hausverbrauch 75 W · niedrig · 0,03 €/h“.
3. Sie tippt in der Szenenleiste „Morgenroutine“. Die Schaltfläche zeigt „Wird ausgeführt …“.
4. Serveränderung trifft ein (eine Änderung): Küche und Bad leuchten warm in der Hausansicht, beide Räume pulsieren kurz.
5. **Höhepunkt:** Die Zahl zählt in 600 ms von 75 auf 5.607 W hoch, der Chip „+5.532 W“ steigt kurz auf, die Pille springt auf „▮▮▮ hoch“, Kosten 1,96 €/h. Unten erscheint „↑ +5.532 W · Morgenroutine aktiviert“.
6. In der Raumkarte Küche steht beim Wasserkocher „2.200 W · noch 2:59“, die Linie darunter schrumpft.
7. Nach 3 Minuten: „−2.200 W · Wasserkocher (Küche) automatisch ausgeschaltet“, die Zahl zählt auf 3.407 W herunter.

Randfall: WLAN hakt. Status „Getrennt“, Banner unten „Verbindung getrennt – Schalter sind gesperrt, bis die Verbindung wieder steht.“ mit „Jetzt neu verbinden“ und „Nächster Versuch in 2 s“; Schalter abgeblendet, Werte lesbar. Nach der Wiederverbindung verschwindet das Banner, der Snapshot ersetzt still alle Werte.

### UJ-2. Jonas schaltet die Konsole ein, sein Vater sieht es sofort

1. Jonas tippt in der Raumkarte „Wohnzimmer“ auf die Zeile „Spielkonsole“: sofort Zielzustand, „wird geschaltet …“.
2. Bestätigung: „180 W“, Zeile leuchtet auf; Toast „+179 W · Spielkonsole (Wohnzimmer)“.
3. Auf Toms Laptop (1440 px, linke Spalte sticky) erscheint derselbe Toast unten rechts, die Zahl zählt auf 254 W.
4. Jonas tippt „Fernseher“: „+89 W · Fernseher (Wohnzimmer)“.
5. **Höhepunkt:** Bei Tom leuchtet das Wohnzimmer in der Hausansicht kurz auf und zeigt „271 W · 2 an“; der Kopf steht auf 343 W. Alles in unter einer Sekunde.
6. Tom schaut auf „Verbrauch nach Raum“: Wohnzimmer steht oben mit dem längsten Balken und „79 %“.

### UJ-3. Mehmet macht Filmabend und danach Gute Nacht

1. Abends, Handy im Dunkelmodus (Theme „System“), kein Aufblitzen beim Öffnen.
2. Er tippt „Filmabend“: „+124 W · Filmabend aktiviert“; im Wohnzimmer leuchtet die Stehlampe.
3. Später „Gute Nacht“: alles außer Grundlast aus, Nachttischlampe an.
4. **Höhepunkt:** Die Zahl zählt auf 80 W herunter, „▮▯▯ niedrig“, nur das Schlafzimmer leuchtet warm im dunklen Haus. Im Übersichtsbereich: „davon Standby 10,3 W“ und „Heute 3,42 kWh · 1,20 €“.
5. Er legt das Handy weg.

Randfall: Er tippt „Kühlschrank“. Dialog „Kühlschrank wirklich ausschalten?“ – „Es ist ein Grundlastgerät und läuft normalerweise dauerhaft.“ Fokus auf „Abbrechen“. Er tippt „Abbrechen“; der Kühlschrank bleibt an, der Fokus liegt wieder auf der Kühlschrank-Zeile.

### UJ-4. Lena bedient alles mit Tastatur und Screenreader

1. Lena lädt die Seite; erste Tab-Station: „Zu den Räumen springen, Link“. Enter → Fokus auf „Räume, Überschrift“.
2. Tab: „Deckenlampe, Wohnzimmer, Schalter, aus“ … Sie tabbt bis zur Küche: „Mikrowelle, Küche, Schalter, aus, Standby 1,5 Watt, schaltet nach 3 Minuten automatisch aus“.
3. Leertaste. „Mikrowelle, Küche, Schalter, an, beschäftigt“.
4. **Höhepunkt:** Nach der laufenden Ausgabe sagt VoiceOver höflich: „Mikrowelle an. Hausverbrauch 1.274 Watt.“
5. Escape schließt den Toast; der Fokusrahmen ist jederzeit sichtbar, keine Tastaturfalle.

Randfall: Lena schaltet Mikrowelle und Kaffeemaschine innerhalb von 2 s: angesagt wird nur „Kaffeemaschine an. Hausverbrauch 2.573 Watt.“

### UJ-5. Alexander bringt 2.0 in Produktion

Betreiber-Flow ohne eigene Oberfläche. UX-Berührungspunkte: (1) Fußzeile zeigt „IoT-Haus 2.0.0“ zur Sichtkontrolle nach dem Update; (2) **Höhepunkt für Nutzende:** Ein während des Updates offener Tab verbindet sich neu, erkennt die abweichende Version und zeigt „Neue Version verfügbar“ mit „Neu laden“; Schalter sind bis dahin gesperrt (FR-18). Nach „Neu laden“ sind alle Zustände und der Tageswert unverändert (FR-17).

### UJ-6. Nina lädt das Auto mit Sonnenstrom (seit 2.1)

1. Mittagspause im Homeoffice, Laptop. Kopf „Hausverbrauch 78 W · niedrig · 0,03 €/h“, Netz-Zeile „Solar 0 W · Netzbezug 78 W“.
2. Sie wählt unter „Solaranlage“ die Sonne „Sonnig“: Segment wechselt sofort, „wird eingestellt …“. Bestätigung: Kopf „Solar 8.330 W · Einspeisung 8.252 W“ und „Ertrag 0,66 €/h“; Toast „Sonne: Sonnig · Solar 8.330 W“, kein Delta-Chip, Hausverbrauch bleibt 78 W. Auf dem Dach leuchten die Module petrol.
3. In der Hausansicht tippt sie „Carport“ → Carport-Karte, Fokus auf h3. Sie schaltet die Wallbox ein.
4. **Höhepunkt:** Der Hausverbrauch zählt auf 11.075 W hoch, „▮▮▮ hoch“, Chip „+10.997 W“, der Kopf wechselt auf „Netzbezug 2.745 W“ und „0,96 €/h“; beim Auto steht „zu Hause · lädt · voll in 2 h 44 min“, die Carport-Fläche zeigt Blitz und „Auto lädt 50 %“.
5. **Auflösung:** Um 14 Uhr tippt sie „Wegfahren“: „−10.997 W · Elektroauto weggefahren, Laden beendet“. Abends „Zurückkommen“: „Elektroauto zurück · Akku 49 %“.

Randfall: Solange das Auto unterwegs ist, ist die Wallbox gesperrt und sagt warum („nicht verfügbar: Elektroauto ist unterwegs“). Randfall 2: Mit 14 % Akku ist „Wegfahren“ gesperrt mit „Akku zu leer zum Wegfahren (mindestens 15 %).“

## Implementierungsleitplanken (für Amelia, Architektur-Spielraum bleibt)

- **Tokens:** `src/ui/tokens.ts` exportiert `hell` und `dunkel` (Werte = DESIGN.md-Frontmatter) sowie die Kontrastpaar-Liste für den Test. CSS-Variablen `--c-*` werden aus dieser Datei erzeugt (z. B. im Root-Layout als `<style>` gerendert) oder in `globals.css` gespiegelt und per Test auf Gleichheit geprüft. Tailwind 4: `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));` und `@theme inline { --color-bg: var(--c-bg); … }`, damit Klassen wie `bg-surface text-ink` funktionieren.
- **Theme-Skript** (inline im `<head>`, vor dem ersten Paint, `suppressHydrationWarning` auf `<html>`): liest `iot-haus-darstellung` (`system`|`hell`|`dunkel`), bestimmt hell/dunkel über `matchMedia('(prefers-color-scheme: dark)')`, setzt `document.documentElement.dataset.theme` und den `content` von `<meta name="theme-color">`; alles in `try/catch`.
- **Metadaten:** Next-15-Exporte `metadata` (Titel, Beschreibung, `appleWebApp.title: "IoT-Haus"`) und `viewport` (`width: 'device-width', initialScale: 1`, ohne `themeColor`, weil das Skript es setzt); die manuellen `<meta>`-Duplikate entfallen.
- **Hooks:** `useHaus()` (Snapshot, Änderungen, Befehle, ausstehende Befehle, Verbindungszustand gemäß Automat), `useZaehler(ziel)` (rAF-Zählanimation mit reduzierter Bewegung), `useSekundentakt()` (ein Takt für alle Restzeiten und den Banner-Countdown), `useReduzierteBewegung()`.
- **Bausteine:** `Kopfbereich`, `Hausverbrauch`, `DeltaChip`, `Laststufe`, `Verbindungsstatus`, `Uebersicht`, `ThemeWahl`, `SzenenLeiste`, `Hausansicht`, `Raumkarte`, `GeraetSchalter`, `GrundlastDialog`, `VerbrauchNachRaum`, `Meldungen`, `Ansager`, `Banner`, `Icon`, `SkipLink`; seit 2.1 `NetzZeile`, `Solaranlage`, `SonnenWahl`, `Elektroauto`, `CarportFlaeche` (K-06). Die alten `HouseVisualization`, `RoomComponent`, `ControlPanel` entfallen.
- **Performance:** Zählanimation und Sekundentakt dürfen nur die jeweiligen Blätter neu rendern (Zahl als eigene Komponente); keine Re-Renders der 29 Zeilen pro Frame. First-Load-JS-Budget 200 kB (NFR-1).
