# IoT-Haus 2.1 – Komponenteninventar

Eine Seite (`src/app/page.tsx` rendert `<App />`). Eine Komponente je Datei, benannt nach Architektur §5.1.
Reihenfolge auf der Seite: Sprunglink → Kopfbereich → Übersicht → Szenenleiste → Solaranlage → Hausansicht / Räume (7 Karten,
Carport zuletzt) / Verbrauch nach Raum → Fußzeile.
Ab 1024 px zweispaltig (links Haus und Verbrauch, rechts Räume).

## Komponentenbaum

```
App ─ Fehlergrenze ─ HausProvider ─ Seite
 ├ Sprunglink
 ├ Kopfbereich ─ Zaehler, DeltaChip, LaststufePille, VerbindungsStatus, NetzZeile
 ├ Erstfehler / Skeleton (Ladezustand)
 ├ Uebersicht ─ InfoHinweis, ThemeWahl
 ├ Szenenleiste ─ SzenenKnopf ×4
 ├ Solaranlage ─ SonnenWahl
 ├ Hausansicht ─ RaumFlaeche ×6, CarportFlaeche (Zeile „Außen“), Solarmodule auf dem Dach
 ├ VerbrauchNachRaum
 ├ Raeume ─ Raumkarte ×7 ─ GeraeteZeile ─ Schalter
 │                      ├ RaumAusKnopf        (nur Haus-Räume)
 │                      └ Elektroauto          (nur Carport)
 │        └ GrundlastDialog
 ├ Fusszeile
 ├ Meldungen
 ├ VersionsBanner | VerbindungsBanner (über BannerRahmen, höchstens eines)
 └ LiveRegion
```

## Komponenten (`src/components/`)

| Komponente | Aufgabe |
|---|---|
| `App` | Seitenaufbau, `Fehlergrenze` + `HausProvider`, Lade- und Erstfehlerzustand, Bannerwahl |
| `Fehlergrenze` | fängt unerwartete Renderfehler ab und zeigt einen verständlichen Hinweis statt einer leeren Seite |
| `Sprunglink` | erstes fokussierbares Element, springt zur Überschrift „Räume“ |
| `Kopfbereich` | sticky: Hausverbrauch, Laststufe, Kosten pro Stunde aus dem Netzbezug bzw. „Ertrag ‹x› €/h“ bei Einspeisung, Netz-Zeile, Verbindungsstatus. Mobil 126 px hoch (gemessen), ab 1280 px einzeilig |
| `NetzZeile` (2.1) | Teil des Kopfs: „Solar 8.330 W · Einspeisung 8.252 W“ bzw. „… · Netzbezug 2.745 W“; keine Bedienelemente, keine Animation, kein `aria-live`; sichtbarer Text `aria-hidden`, sr-only-Satz; feste Mindestbreite je Zahl (`7ch`); bei Höhe ≤ 500 px nur der Netzwert |
| `Zaehler` | Hausverbrauch als animierte Zahl; der Screenreader-Text trägt immer den Zielwert |
| `DeltaChip` | kurzer Hinweis „+1.199 W“ neben dem Hausverbrauch (1,2 s, dekorativ) |
| `LaststufePille` | Laststufe mit Text, Balkensymbol und Farbe (nie nur Farbe) |
| `VerbindungsStatus` | Verbindungsstatus mit Symbol und Text, ohne eigene Ansage |
| `Uebersicht` | Standby-Anteil, „Heute ‹kWh› · ‹€›“ netto (bei negativem Saldo „Ertrag ‹€›“), „Netz heute: Bezug … · Einspeisung …“, Strompreis und Einspeisevergütung, Darstellung |
| `InfoHinweis` | Disclosure „Hinweis zu den Werten“, Escape schließt |
| `ThemeWahl` | System/Hell/Dunkel als native Radios im Segment-Look |
| `Szenenleiste` / `SzenenKnopf` | vier Szenen mit Name und Untertitel; beschäftigt/gesperrt, keine „aktiv“-Markierung, keine optimistische Anzeige |
| `Solaranlage` (2.1) | Abschnitt mit h2 „Solaranlage“: Erzeugung, Spitzenleistung „9,8 kWp“, „Heute erzeugt ‹kWh›“, darin die `SonnenWahl`; Werte ohne Animation |
| `SonnenWahl` (2.1) | `<fieldset>` „Sonne gerade“ mit 5 nativen Radios im Segment-Look (Nacht … Sonnig, je mit Watt), eine Tab-Station, Pfeiltasten wechseln. Optimistisch: Auswahl wechselt sofort, `aria-busy` + „wird eingestellt …“; ohne Bestätigung nach 5 s zurück auf den Serverwert plus Toast. Offline/veraltet: `aria-disabled` |
| `Hausansicht` / `RaumFlaeche` | 2 Etagen × 3 Räume als Schaltflächen mit Verbrauch und Anzahl an, leuchten bei Licht; Sprung zur Raumkarte. Seit 2.1: Solarmodule auf dem Dach (gefüllt bei Erzeugung > 0) mit Text „Solar ‹x› W“ und darunter die Zeile „Außen“ mit der `CarportFlaeche` |
| `CarportFlaeche` (2.1) | Schaltfläche des Carports in der Hausansicht: Name, Raumverbrauch, „Auto lädt 64 %“ / „Auto zu Hause 50 %“ / „Auto unterwegs“; beim Laden Rand und Blitz in `on` (nie nur Farbe); Sprung zur Carport-Karte |
| `VerbrauchNachRaum` | alle 7 Bereiche (inkl. Carport) absteigend mit Balken und Prozent |
| `Raeume` | Abschnitt „Räume“ mit allen Raumkarten und dem Grundlast-Dialog inkl. Fokus-Rückgabe |
| `Raumkarte` | Geräteliste eines Raums und „Raum ausschalten“. Carport (erkannt über `ELEKTROAUTO.ladegeraet`, ohne ID-Literal): oben der `Elektroauto`-Bereich, kein „Raum ausschalten“, Sperrgrund für die Wallbox |
| `Elektroauto` (2.1) | Block in der Carport-Karte, `role="group"` „Elektroauto“: Ort, „lädt“, „voll in ‹h› h ‹m› min“, Akku in Prozent mit Balken (`aria-hidden`, sr-only-Satz). Knopf „Wegfahren“ / „Zurückkommen“ ohne optimistische Anzeige, `aria-busy` bis zur Bestätigung. Unter 15 % ist „Wegfahren“ `aria-disabled` mit sichtbarem Grund „Akku zu leer zum Wegfahren (mindestens 15 %).“; unterwegs Hinweis „Eine Fahrt verbraucht 15 % Akku.“. Akku und Restzeit laufen beim Laden über `useSekundentakt` mit |
| `GeraeteZeile` | ganze Zeile ist der `role="switch"`: Name, Leistung/Standby, Grundlast- und Auto-Aus-Kennzeichen, Restzeit, ausstehender Zustand. Neu in 2.1: Prop `sperrGrund` (`'unterwegs'` \| `'voll'` \| `null`) für die Wallbox – ist sie aus und ein Grund gesetzt, ist die Zeile `aria-disabled`, zeigt „Standby 3 W · Auto unterwegs“ bzw. „· Akku voll“ und beschreibt „nicht verfügbar: Elektroauto ist unterwegs“ bzw. „… Akku ist voll“ |
| `Schalter` | rein visueller Schalter innerhalb der `GeraeteZeile` |
| `RaumAusKnopf` | „Raum ausschalten“ für alle Nicht-Grundlastgeräte; gesperrt, wenn nichts auszuschalten ist |
| `GrundlastDialog` | natives `<dialog>`: Rückfrage vor dem Ausschalten eines Grundlastgeräts, Fokus auf „Abbrechen“, Escape schließt |
| `Meldungen` | Toasts (max. 3, je 4 s, pausieren bei Hover/Fokus, Escape schließt die neueste), z. B. „+1.199 W · Mikrowelle (Küche)“. Seit 2.1 Art `solar` (Sonnensymbol, Farbe `solar`) für „Sonne: Sonnig · Solar 8.330 W“ ohne Delta; Auto-Meldungen „−10.997 W · Elektroauto weggefahren, Laden beendet“, „Elektroauto zurück · Akku 35 %“, „Akku voll – Laden beendet (Carport)“ |
| `BannerRahmen` | gemeinsame Optik der Banner unten, `role="status"`, höchstens eines sichtbar (`bannerArt`) |
| `VersionsBanner` | „Neue Version verfügbar“ mit „Neu laden“ (hat Vorrang), Schalter gesperrt |
| `VerbindungsBanner` | „Verbindung getrennt“ mit Countdown und „Jetzt neu verbinden“ |
| `LiveRegion` | `aria-live="polite"`: sammelt Änderungen 2 s und sagt die letzte an; Fehler, Hinweise und „Verbindung wiederhergestellt.“ sofort |
| `Skeleton` | Platzhalter im Ladezustand (pulsiert nur ohne reduzierte Bewegung), dazu `Erstfehler` |
| `Fusszeile` | Schätzungshinweis und Client-Version |
| `Symbol` | eigene Inline-SVG-Symbole (24 × 24, `currentColor`), immer `aria-hidden`; neu in 2.1 `wallbox`, `auto`, `blitz`, `solar` |

## Hooks (`src/hooks/`)

| Hook | Aufgabe |
|---|---|
| `useHaus` / `HausProvider` | Client-Zustand (Reducer), Verbindung, Befehle `schalten`/`szene`/`raumAus`/`sonne`/`auto`, Bestätigungsfrist 5 s; `auto` höchstens eine offene Fahrt, bei `sonne` wird jede Wahl gesendet und die letzte gewinnt |
| `useRestzeit` | Auto-Aus-Restzeit aus Server-`seit` und Uhrversatz, damit alle Clients dieselbe Zeit zeigen |
| `useSekundentakt` | gemeinsamer Sekundentakt, nur aktiv solange eine Restzeit läuft oder das Auto lädt |
| `useHochzaehlen` | animiertes Hochzählen (600 ms), sofortiger Sprung bei reduzierter Bewegung |
| `useImpuls` | startet eine kurze CSS-Impulsanimation neu, ohne den Fokus zu verlieren |
| `useTheme` | Theme-Wahl lesen/speichern (`localStorage` `iot-haus.theme`) |
| `useReduzierteBewegung` | `prefers-reduced-motion`, live beobachtet |

## Client-Module ohne React (`src/client/`)

- `hausReducer.ts` – `ClientZustand` (Serverdaten inkl. `auto`, `sonne`, `einspeiseverguetung`; Verbindung, ausstehende Befehle,
  Meldungen, Versionskonflikt) als reine Funktion. Ergänzt fehlende 2.1-Felder defensiv. Selektoren u. a. `anzeigeSonne`
  (optimistische Stufe) und `autoBeschaeftigt`; `meldungFuer` erzeugt Toast und Ansage je Ursache (`sonne`, `auto`, `akkuVoll` neu).
- `verbindung.ts` – `HausVerbindung`: WebSocket zu `/mqtt`, Backoff 1/2/4/8/10 s, Snapshot-Frist 5 s, Lebenszeichen 75 s,
  Neuverbindung bei `visibilitychange`.

## Texte und Gestaltung (`src/ui/`, `src/app/globals.css`)

- `texte.ts`: Microcopy-Katalog, **alle** UI-Texte an einer Stelle. Geräte-, Raum- und Szenennamen kommen aus dem Katalog,
  Zahlen aus `src/domain/format.ts`. Typografie: U+202F (schmales geschütztes Leerzeichen) zwischen Zahl und Einheit,
  „…“ = U+2026, Minus = U+2212.
- `farbtokens.ts`: Paletten `HELL` und `DUNKEL` als CSS-Variablen plus `KONTRAST_PAARE` (vom Kontrasttest geprüft). Seit 2.1
  36 Rollen je Theme, neu `solar` (Petrol `#0F766E` / `#2DD4BF`) und `solar-soft` (`#CCFBF1` / `#0B2F2C`) – ausschließlich für
  Erzeugung und Einspeisung, nie für „an“.
- `themeSkript.ts`: Inline-Skript vor dem ersten Paint (kein Aufblitzen), entfernt den Altschlüssel `smart-home-state`.
- Tailwind 4 mit Tokens, sichtbarer Fokusrahmen, Trefferflächen ≥ 44 px, bei `prefers-reduced-motion` keine Animationen.

Tests: `src/components/App.test.tsx` (jsdom, Testing Library, axe in Hell und Dunkel, zusätzlich mit der Fixture „Auto lädt, Heiter“).
