# IoT-Haus 2.0 – Komponenteninventar

Eine Seite (`src/app/page.tsx` rendert `<App />`). Eine Komponente je Datei, benannt nach Architektur §5.1.
Reihenfolge auf der Seite: Sprunglink → Kopfbereich → Übersicht → Szenenleiste → Hausansicht / Räume / Verbrauch nach Raum → Fußzeile.
Ab 1024 px zweispaltig (links Haus und Verbrauch, rechts Räume).

## Komponentenbaum

```
App ─ Fehlergrenze ─ HausProvider ─ Seite
 ├ Sprunglink
 ├ Kopfbereich ─ Zaehler, DeltaChip, LaststufePille, VerbindungsStatus
 ├ Erstfehler / Skeleton (Ladezustand)
 ├ Uebersicht ─ InfoHinweis, ThemeWahl
 ├ Szenenleiste ─ SzenenKnopf ×4
 ├ Hausansicht ─ RaumFlaeche ×6
 ├ VerbrauchNachRaum
 ├ Raeume ─ Raumkarte ×6 ─ GeraeteZeile ─ Schalter
 │                      └ RaumAusKnopf
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
| `Kopfbereich` | sticky: Hausverbrauch, Laststufe, Kosten pro Stunde, Verbindungsstatus |
| `Zaehler` | Hausverbrauch als animierte Zahl; der Screenreader-Text trägt immer den Zielwert |
| `DeltaChip` | kurzer Hinweis „+1.199 W“ neben dem Hausverbrauch (1,2 s, dekorativ) |
| `LaststufePille` | Laststufe mit Text, Balkensymbol und Farbe (nie nur Farbe) |
| `VerbindungsStatus` | Verbindungsstatus mit Symbol und Text, ohne eigene Ansage |
| `Uebersicht` | Standby-Anteil, Tagesverbrauch in kWh/€, Strompreis, Darstellung |
| `InfoHinweis` | Disclosure „Hinweis zu den Werten“, Escape schließt |
| `ThemeWahl` | System/Hell/Dunkel als native Radios im Segment-Look |
| `Szenenleiste` / `SzenenKnopf` | vier Szenen mit Name und Untertitel; beschäftigt/gesperrt, keine „aktiv“-Markierung, keine optimistische Anzeige |
| `Hausansicht` / `RaumFlaeche` | 2 Etagen × 3 Räume als Schaltflächen mit Verbrauch und Anzahl an, leuchten bei Licht; Sprung zur Raumkarte |
| `VerbrauchNachRaum` | alle Räume absteigend mit Balken und Prozent |
| `Raeume` | Abschnitt „Räume“ mit allen Raumkarten und dem Grundlast-Dialog inkl. Fokus-Rückgabe |
| `Raumkarte` | Geräteliste eines Raums und „Raum ausschalten“ |
| `GeraeteZeile` | ganze Zeile ist der `role="switch"`: Name, Leistung/Standby, Grundlast- und Auto-Aus-Kennzeichen, Restzeit, ausstehender Zustand |
| `Schalter` | rein visueller Schalter innerhalb der `GeraeteZeile` |
| `RaumAusKnopf` | „Raum ausschalten“ für alle Nicht-Grundlastgeräte; gesperrt, wenn nichts auszuschalten ist |
| `GrundlastDialog` | natives `<dialog>`: Rückfrage vor dem Ausschalten eines Grundlastgeräts, Fokus auf „Abbrechen“, Escape schließt |
| `Meldungen` | Toasts (max. 3, je 4 s, pausieren bei Hover/Fokus, Escape schließt die neueste), z. B. „+1.199 W · Mikrowelle (Küche)“ |
| `BannerRahmen` | gemeinsame Optik der Banner unten, `role="status"`, höchstens eines sichtbar (`bannerArt`) |
| `VersionsBanner` | „Neue Version verfügbar“ mit „Neu laden“ (hat Vorrang), Schalter gesperrt |
| `VerbindungsBanner` | „Verbindung getrennt“ mit Countdown und „Jetzt neu verbinden“ |
| `LiveRegion` | `aria-live="polite"`: sammelt Änderungen 2 s und sagt die letzte an; Fehler, Hinweise und „Verbindung wiederhergestellt.“ sofort |
| `Skeleton` | Platzhalter im Ladezustand (pulsiert nur ohne reduzierte Bewegung), dazu `Erstfehler` |
| `Fusszeile` | Schätzungshinweis und Client-Version |
| `Symbol` | eigene Inline-SVG-Symbole (24 × 24, `currentColor`), immer `aria-hidden` |

## Hooks (`src/hooks/`)

| Hook | Aufgabe |
|---|---|
| `useHaus` / `HausProvider` | Client-Zustand (Reducer), Verbindung, Befehle `schalten`/`szene`/`raumAus`, Bestätigungsfrist 5 s |
| `useRestzeit` | Auto-Aus-Restzeit aus Server-`seit` und Uhrversatz, damit alle Clients dieselbe Zeit zeigen |
| `useSekundentakt` | gemeinsamer Sekundentakt, nur aktiv solange eine Restzeit läuft |
| `useHochzaehlen` | animiertes Hochzählen (600 ms), sofortiger Sprung bei reduzierter Bewegung |
| `useImpuls` | startet eine kurze CSS-Impulsanimation neu, ohne den Fokus zu verlieren |
| `useTheme` | Theme-Wahl lesen/speichern (`localStorage` `iot-haus.theme`) |
| `useReduzierteBewegung` | `prefers-reduced-motion`, live beobachtet |

## Client-Module ohne React (`src/client/`)

- `hausReducer.ts` – `ClientZustand` (Serverdaten, Verbindung, ausstehende Befehle, Meldungen, Versionskonflikt) als reine Funktion.
- `verbindung.ts` – `HausVerbindung`: WebSocket zu `/mqtt`, Backoff 1/2/4/8/10 s, Snapshot-Frist 5 s, Lebenszeichen 75 s,
  Neuverbindung bei `visibilitychange`.

## Texte und Gestaltung (`src/ui/`, `src/app/globals.css`)

- `texte.ts`: Microcopy-Katalog, **alle** UI-Texte an einer Stelle. Geräte-, Raum- und Szenennamen kommen aus dem Katalog,
  Zahlen aus `src/domain/format.ts`. Typografie: U+202F (schmales geschütztes Leerzeichen) zwischen Zahl und Einheit,
  „…“ = U+2026, Minus = U+2212.
- `farbtokens.ts`: Paletten `HELL` und `DUNKEL` als CSS-Variablen plus `KONTRAST_PAARE` (vom Kontrasttest geprüft).
- `themeSkript.ts`: Inline-Skript vor dem ersten Paint (kein Aufblitzen), entfernt den Altschlüssel `smart-home-state`.
- Tailwind 4 mit Tokens, sichtbarer Fokusrahmen, Trefferflächen ≥ 44 px, bei `prefers-reduced-motion` keine Animationen.

Tests: `src/components/App.test.tsx` (jsdom, Testing Library, axe in Hell und Dunkel).
