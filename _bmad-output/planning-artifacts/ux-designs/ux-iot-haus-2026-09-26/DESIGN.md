---
name: IoT-Haus 2.0
description: Ruhige, zahlenstarke Energie- und Steuerungsoberfläche für ein simuliertes Haus. Warmes Licht als einzige Akzentfarbe, Laststufen als Ampel mit Text, Hell und Dunkel gleichwertig.
status: final
updated: 2026-09-26
sources:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/prd-addendum.md
  - _bmad-output/planning-artifacts/prd-decision-log.md
companion: EXPERIENCE.md
colors:
  # Hell (Standard-Tokens) – Kontraste siehe Abschnitt „Colors“
  bg: '#F4F6F9'
  surface: '#FFFFFF'
  surface-raised: '#FFFFFF'
  surface-sunken: '#EDF0F5'
  border: '#D4DAE3'
  ink: '#111827'
  ink-secondary: '#4B5563'
  ink-muted: '#5F6B7A'
  on: '#B45309'
  on-contrast: '#FFFFFF'
  on-soft: '#FEF3C7'
  switch-off: '#6B7280'
  focus: '#1D4ED8'
  primary: '#1D4ED8'
  primary-contrast: '#FFFFFF'
  danger: '#B91C1C'
  danger-contrast: '#FFFFFF'
  status-ok: '#15803D'
  load-low: '#166534'
  load-low-bg: '#DCFCE7'
  load-mid: '#9A3412'
  load-mid-bg: '#FFEDD5'
  load-high: '#B91C1C'
  load-high-bg: '#FEE2E2'
  delta-up: '#C2410C'
  delta-down: '#15803D'
  banner-warn-bg: '#FEF3C7'
  banner-warn-ink: '#78350F'
  banner-info-bg: '#DBEAFE'
  banner-info-ink: '#1E3A8A'
  room-off: '#E6EAF0'
  room-lit: '#FDE68A'
  house-roof: '#64748B'
  theme-color: '#FFFFFF'
  # Dunkel
  bg-dark: '#0B1120'
  surface-dark: '#131C2E'
  surface-raised-dark: '#1A2438'
  surface-sunken-dark: '#0F1729'
  border-dark: '#2A364D'
  ink-dark: '#F1F5F9'
  ink-secondary-dark: '#B6C0CF'
  ink-muted-dark: '#98A3B3'
  on-dark: '#FBBF24'
  on-contrast-dark: '#111827'
  on-soft-dark: '#3A2C0C'
  switch-off-dark: '#8391A5'
  focus-dark: '#93C5FD'
  primary-dark: '#93C5FD'
  primary-contrast-dark: '#0B1120'
  danger-dark: '#FCA5A5'
  danger-contrast-dark: '#0B1120'
  status-ok-dark: '#4ADE80'
  load-low-dark: '#4ADE80'
  load-low-bg-dark: '#0F2E1C'
  load-mid-dark: '#FDBA74'
  load-mid-bg-dark: '#3B2210'
  load-high-dark: '#FCA5A5'
  load-high-bg-dark: '#3F1717'
  delta-up-dark: '#FDBA74'
  delta-down-dark: '#4ADE80'
  banner-warn-bg-dark: '#3A2A0B'
  banner-warn-ink-dark: '#FDE68A'
  banner-info-bg-dark: '#172554'
  banner-info-ink-dark: '#BFDBFE'
  room-off-dark: '#1C263A'
  room-lit-dark: '#5B4312'
  house-roof-dark: '#64748B'
  theme-color-dark: '#131C2E'
typography:
  font-family:
    fontFamily: 'Geist Sans (next/font/google, zur Build-Zeit selbst gehostet), Fallback system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
  display-sm:
    fontSize: 40px
    lineHeight: 44px
    fontWeight: 700
    letterSpacing: -0.02em
    note: 'Hausverbrauch-Zahl < 1024 px; immer tabular-nums'
  display-lg:
    fontSize: 56px
    lineHeight: 60px
    fontWeight: 700
    letterSpacing: -0.02em
    note: 'Hausverbrauch-Zahl ≥ 1024 px; immer tabular-nums'
  display-compact:
    fontSize: 28px
    lineHeight: 32px
    fontWeight: 700
    note: 'Kompakter Kopfbereich bei Viewport-Höhe ≤ 500 px'
  title:
    fontSize: 18px
    lineHeight: 24px
    fontWeight: 600
    note: 'Abschnittsüberschriften h2'
  card-title:
    fontSize: 17px
    lineHeight: 24px
    fontWeight: 600
    note: 'Raumkarten-Überschrift h3'
  body:
    fontSize: 16px
    lineHeight: 24px
    fontWeight: 400
  body-strong:
    fontSize: 16px
    lineHeight: 24px
    fontWeight: 500
    note: 'Gerätename'
  meta:
    fontSize: 14px
    lineHeight: 20px
    fontWeight: 400
    note: 'Leistungszeile, Kosten, Tageswerte, Szenen-Untertitel'
  label:
    fontSize: 13px
    lineHeight: 16px
    fontWeight: 500
    note: 'Beschriftung „Hausverbrauch“, Etagen, Kennzeichen (Badges)'
  number:
    note: 'Jede Zahl (W, €, kWh, %, Restzeit) mit font-variant-numeric: tabular-nums'
rounded:
  sm: 6px
  md: 10px
  lg: 16px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  '8': 32px
  '10': 40px
  '12': 48px
  gutter-mobile: 16px
  gutter-desktop: 24px
  container-max: 1280px
  header-height: 116px
  header-height-desktop: 88px
  header-height-compact: 64px
  row-min-height: 56px
  hit-min: 44px
components:
  app-header:
    background: '{colors.surface}'
    borderBottom: '1px solid {colors.border}'
    height: '{spacing.header-height}'
  power-hero:
    typography: '{typography.display-sm}'
    color: '{colors.ink}'
  load-pill:
    rounded: '{rounded.full}'
    typography: '{typography.label}'
    low: '{colors.load-low} auf {colors.load-low-bg}'
    mid: '{colors.load-mid} auf {colors.load-mid-bg}'
    high: '{colors.load-high} auf {colors.load-high-bg}'
  delta-chip:
    typography: '{typography.meta}'
    up: '{colors.delta-up}'
    down: '{colors.delta-down}'
  status-indicator:
    typography: '{typography.label}'
    ok: '{colors.status-ok}'
    connecting: '{colors.ink-secondary}'
    offline: '{colors.danger}'
  scene-button:
    background: '{colors.surface}'
    border: '1px solid {colors.border}'
    rounded: '{rounded.lg}'
    minHeight: 64px
  house-room-tile:
    off: '{colors.room-off}'
    lit: '{colors.room-lit} + 2px Rand {colors.on}'
    rounded: '{rounded.sm}'
    minHeight: 72px
  room-card:
    background: '{colors.surface}'
    rounded: '{rounded.lg}'
    padding: '{spacing.4}'
  device-row:
    minHeight: '{spacing.row-min-height}'
    rounded: '{rounded.md}'
  device-switch:
    width: 44px
    height: 26px
    track-on: '{colors.on}'
    knob-on: '{colors.on-contrast}'
    track-off-border: '2px solid {colors.switch-off}'
    knob-off: '{colors.switch-off}'
  badge:
    rounded: '{rounded.full}'
    typography: '{typography.label}'
    background: '{colors.surface-sunken}'
    color: '{colors.ink-secondary}'
  button-secondary:
    background: '{colors.surface}'
    border: '1px solid {colors.border}'
    color: '{colors.ink}'
    rounded: '{rounded.md}'
    minHeight: '{spacing.hit-min}'
  button-primary:
    background: '{colors.primary}'
    color: '{colors.primary-contrast}'
    rounded: '{rounded.md}'
    minHeight: '{spacing.hit-min}'
  button-danger:
    background: '{colors.danger}'
    color: '{colors.danger-contrast}'
    rounded: '{rounded.md}'
    minHeight: '{spacing.hit-min}'
  toast:
    background: '{colors.surface-raised}'
    color: '{colors.ink}'
    rounded: '{rounded.lg}'
    width: 'min(100% - 32px, 380px)'
  banner:
    warn: '{colors.banner-warn-ink} auf {colors.banner-warn-bg}'
    info: '{colors.banner-info-ink} auf {colors.banner-info-bg}'
  dialog:
    background: '{colors.surface-raised}'
    rounded: '{rounded.lg}'
    maxWidth: 420px
  consumption-bar:
    track: '{colors.surface-sunken}'
    fill: '{colors.on}'
    height: 8px
    rounded: '{rounded.full}'
  focus-ring:
    outline: '2px solid {colors.focus}'
    outlineOffset: 2px
  skeleton:
    background: '{colors.surface-sunken}'
    rounded: '{rounded.sm}'
---

# IoT-Haus 2.0 – DESIGN.md (visuelle Identität)

Dieses Dokument legt fest, **wie IoT-Haus aussieht**. Wie es sich verhält (Informationsarchitektur, Zustände, Interaktion, Barrierefreiheit, Texte), steht in [`EXPERIENCE.md`](EXPERIENCE.md). Beide Spines gehen jedem Mock, jeder Skizze und jedem Import vor. Es gibt in diesem Lauf keine Mockups oder Wireframes als Dateien; die ASCII-Wireframes in `EXPERIENCE.md` sind verbindlich.

## Brand & Style

IoT-Haus macht unsichtbaren Strom sichtbar. Die Oberfläche ist ein **ruhiges Messinstrument mit warmem Herz**: neutrale, kühle Flächen, darauf eine große, klare Zahl, und genau eine Akzentfarbe, **warmes Bernstein**, das bedeutet „hier ist etwas an“. Licht im Haus leuchtet bernsteinfarben, eingeschaltete Schalter sind bernsteinfarben, die Verbrauchsbalken sind bernsteinfarben. Wer die App öffnet, sieht auf einen Blick, wo es warm ist, also wo Strom fließt.

Die bisherige Optik (Verläufe, animierte Blobs, Hover-Skalierung ganzer Panels, Garten mit Blumen) entfällt vollständig (FR-25, Befund U-05). An ihre Stelle treten flache Karten, klare Typografie und Bewegung, die nur Zustandswechsel erklärt. Die Zahl ist der Held: Sie zählt beim Schalten hoch, ein kleiner Delta-Chip zeigt „+1.199 W“, und die Laststufe wechselt ihre Farbe. Mehr Effekte gibt es bewusst nicht (SM-C2).

Hell und Dunkel sind gleichwertig gestaltet. Dunkel ist kein invertiertes Hell: Flächen sind tiefes Nachtblau, das Bernstein wird heller und leuchtet stärker, damit Mehmet auf dem Sofa (UJ-3) das Haus wie bei Nacht sieht.

## Colors

Alle Tokens existieren paarweise (`name` hell, `name-dark` dunkel). In CSS heißen sie `--c-<name>` und werden über `[data-theme="dark"]` umgeschaltet (siehe `EXPERIENCE.md` → Implementierungsleitplanken). Kontrastwerte nach WCAG-2.x-Formel, berechnet für dieses Dokument; der Kontrast-Unit-Test (NFR-2) muss mindestens diese Paare prüfen.

### Flächen und Text

| Rolle | Hell | Dunkel | Einsatz |
|---|---|---|---|
| `bg` | `#F4F6F9` | `#0B1120` | Seitenhintergrund |
| `surface` | `#FFFFFF` | `#131C2E` | Kopfbereich, Karten, Szenen-Schaltflächen |
| `surface-raised` | `#FFFFFF` | `#1A2438` | Toasts, Dialog (Hell: Abhebung per Schatten) |
| `surface-sunken` | `#EDF0F5` | `#0F1729` | Geräte-Symbolkreis (aus), Balkenspur, Badges, Skeleton |
| `border` | `#D4DAE3` | `#2A364D` | Kartenrand, Trennlinien (dekorativ, keine Kontrastpflicht) |
| `ink` | `#111827` | `#F1F5F9` | Primärtext, Hausverbrauch |
| `ink-secondary` | `#4B5563` | `#B6C0CF` | Sekundärtext, Beschriftungen, Symbole im Zustand *Aus* |
| `ink-muted` | `#5F6B7A` | `#98A3B3` | Zurückgenommene Standby-Anzeige („Standby 1,5 W“, FR-8) |

| Paar | Hell | Dunkel | Soll |
|---|---|---|---|
| `ink` / `bg` | 16,39:1 | 17,19:1 | ≥ 4,5 |
| `ink` / `surface` | 17,74:1 | 15,54:1 | ≥ 4,5 |
| `ink-secondary` / `surface` | 7,56:1 | 9,27:1 | ≥ 4,5 |
| `ink-secondary` / `bg` | 6,98:1 | 10,25:1 | ≥ 4,5 |
| `ink-muted` / `surface` | 5,43:1 | 6,67:1 | ≥ 4,5 (FR-8) |
| `ink-muted` / `surface-sunken` | 4,75:1 | 7,00:1 | ≥ 4,5 |
| `ink` / `surface-sunken` | 15,53:1 | 16,32:1 | ≥ 4,5 |
| `ink` / `surface-raised` (dunkel `#1A2438`) | 17,74:1 | 14,16:1 | ≥ 4,5 |
| `ink-secondary` / `surface-raised` | 7,56:1 | 8,45:1 | ≥ 4,5 |

### Akzent „an“ (warmes Licht)

| Rolle | Hell | Dunkel | Einsatz |
|---|---|---|---|
| `on` | `#B45309` | `#FBBF24` | Schalterspur *An*, Text „an“, Symbol eines eingeschalteten Geräts, Glühbirnen-Symbol im Raum, Rand eines leuchtenden Raums, Verbrauchsbalken |
| `on-contrast` | `#FFFFFF` | `#111827` | Schalterknopf auf `on` |
| `on-soft` | `#FEF3C7` | `#3A2C0C` | Symbolkreis eines eingeschalteten Geräts, Aufblitzen der geschalteten Gerätezeile |

| Paar | Hell | Dunkel | Soll |
|---|---|---|---|
| `on` / `surface` (Spur, Text) | 5,02:1 | 10,20:1 | ≥ 4,5 (Text), ≥ 3 (UI) |
| `on` / `bg` | 4,64:1 | 11,28:1 | ≥ 3 |
| `on` / `on-soft` (Symbol im Kreis) | 4,51:1 | 8,14:1 | ≥ 3 |
| `on-contrast` / `on` (Knopf) | 5,02:1 | 10,63:1 | ≥ 3 |
| `on` / `room-off` (Rand leuchtender Raum) | 4,16:1 | 9,06:1 | ≥ 3 |
| `on` / `room-lit` (Glühbirnen-Symbol) | 4,03:1 | 5,58:1 | ≥ 3 |
| `on` / `surface-sunken` (Balken auf Spur) | 4,40:1 | 10,71:1 | ≥ 3 |

`on` ist **nie** Fehler-, Warn- oder Markenfarbe. Es heißt ausschließlich „ist an / verbraucht“.

### Schalter aus, Fokus, Primär, Fehler

| Rolle | Hell | Dunkel | Einsatz |
|---|---|---|---|
| `switch-off` | `#6B7280` | `#8391A5` | 2-px-Rand der Schalterspur und Knopf im Zustand *Aus* |
| `focus` | `#1D4ED8` | `#93C5FD` | Fokusrahmen, ausschließlich |
| `primary` / `primary-contrast` | `#1D4ED8` / `#FFFFFF` | `#93C5FD` / `#0B1120` | Primäraktionen in Bannern („Jetzt neu verbinden“, „Neu laden“) |
| `danger` / `danger-contrast` | `#B91C1C` / `#FFFFFF` | `#FCA5A5` / `#0B1120` | Status „Getrennt“, Fehler-Toast-Symbol, Schaltfläche „Ausschalten“ im Grundlast-Dialog |
| `status-ok` | `#15803D` | `#4ADE80` | Punkt und Text „Verbunden“ |

| Paar | Hell | Dunkel | Soll |
|---|---|---|---|
| `switch-off` / `surface` | 4,83:1 | 5,32:1 | ≥ 3 |
| `switch-off` / `surface-sunken` | 4,23:1 | – | ≥ 3 |
| `focus` / `bg` | 6,19:1 | 10,44:1 | ≥ 3 (NFR-2) |
| `focus` / `surface` | 6,70:1 | 9,44:1 | ≥ 3 |
| `focus` / `room-lit` | 5,38:1 | 5,16:1 | ≥ 3 |
| `primary-contrast` / `primary` | 6,70:1 | 10,44:1 | ≥ 4,5 |
| `danger` / `surface` | 6,47:1 | 8,97:1 | ≥ 4,5 |
| `danger-contrast` / `danger` | 6,47:1 | 9,92:1 | ≥ 4,5 |
| `status-ok` / `surface` | 5,02:1 | 9,77:1 | ≥ 4,5 |

### Laststufen und Delta

Laststufen nutzen eine gedämpfte Ampel, immer mit Text und Balkensymbol (FR-12, „nie nur Farbe“). Delta-Farben: mehr Verbrauch = orange, weniger = grün; das Vorzeichen „+“/„−“ trägt die Bedeutung, die Farbe verstärkt nur.

| Rolle | Hell (Text / Fläche) | Dunkel (Text / Fläche) | Kontrast hell | Kontrast dunkel |
|---|---|---|---|---|
| `load-low` „niedrig“ | `#166534` / `#DCFCE7` | `#4ADE80` / `#0F2E1C` | 6,49:1 | 8,44:1 |
| `load-mid` „mittel“ | `#9A3412` / `#FFEDD5` | `#FDBA74` / `#3B2210` | 6,38:1 | 8,76:1 |
| `load-high` „hoch“ | `#B91C1C` / `#FEE2E2` | `#FCA5A5` / `#3F1717` | 5,30:1 | 8,22:1 |
| `delta-up` auf `surface` / `surface-raised` | `#C2410C` | `#FDBA74` | 5,18:1 | 10,10:1 / 9,20:1 |
| `delta-down` auf `surface` / `surface-raised` | `#15803D` | `#4ADE80` | 5,02:1 | 9,77:1 / 8,90:1 |

### Banner

| Rolle | Hell | Dunkel | Kontrast hell | Kontrast dunkel |
|---|---|---|---|---|
| Warnung (Getrennt) `banner-warn-ink` / `banner-warn-bg` | `#78350F` / `#FEF3C7` | `#FDE68A` / `#3A2A0B` | 8,15:1 | 11,12:1 |
| Info (Neue Version) `banner-info-ink` / `banner-info-bg` | `#1E3A8A` / `#DBEAFE` | `#BFDBFE` / `#172554` | 8,49:1 | 10,34:1 |

### Hausansicht

| Rolle | Hell | Dunkel | Einsatz |
|---|---|---|---|
| `room-off` | `#E6EAF0` | `#1C263A` | Raumfläche ohne eingeschaltetes Licht |
| `room-lit` | `#FDE68A` | `#5B4312` | Raumfläche mit mindestens einem Licht *An* (FR-26), zusätzlich 2-px-Rand `on` und Glühbirnen-Symbol |
| `house-roof` | `#64748B` | `#64748B` | Dach und Bodenlinie (dekorativ, `aria-hidden`) |

| Paar | Hell | Dunkel | Soll |
|---|---|---|---|
| `ink` / `room-off` | 14,69:1 | 13,81:1 | ≥ 4,5 |
| `ink` / `room-lit` | 14,24:1 | 8,50:1 | ≥ 4,5 |
| `ink-secondary` / `room-off` | 6,26:1 | 8,24:1 | ≥ 4,5 |
| `ink-secondary` / `room-lit` | 6,07:1 | 5,07:1 | ≥ 4,5 |

`room-lit` und `room-off` unterscheiden sich im Farbton, kaum in der Helligkeit (hell 1,03:1). Deshalb trägt ein leuchtender Raum immer **zusätzlich** den `on`-Rand (≥ 3:1) und ein Glühbirnen-Symbol. Die Fläche allein ist nie Bedeutungsträger.

### Browser-Theme-Farbe

`theme-color` = Kopfbereichsfläche: hell `#FFFFFF`, dunkel `#131C2E` (FR-28).

**Nicht verwenden:** Verläufe, Transparenz über Text (kein `backdrop-blur` hinter Zahlen), Violett/Indigo der Vorversion, Grün als „Licht an“ (Befund U-06), reines Schwarz `#000`.

## Typography

Eine Schrift: **Geist Sans**, wie bisher über `next/font/google` eingebunden (wird zur Build-Zeit heruntergeladen und selbst ausgeliefert, keine Laufzeitabhängigkeit). `Geist Mono` entfällt. Die bisherige Regel `body { font-family: Arial }` und die Verkleinerung der Wurzelschrift auf 13/14 px unter 640 px entfallen; Basis bleibt 16 px, damit Zoom und Systemschriftgröße greifen.

| Token | Größe / Zeile / Gewicht | Einsatz |
|---|---|---|
| `{typography.display-sm}` | 40/44, 700, −0,02 em | Hausverbrauch < 1024 px |
| `{typography.display-lg}` | 56/60, 700, −0,02 em | Hausverbrauch ≥ 1024 px |
| `{typography.display-compact}` | 28/32, 700 | Kompakter Kopf (Höhe ≤ 500 px) |
| `{typography.title}` | 18/24, 600 | h2: „Szenen“, „Hausansicht“, „Räume“, „Verbrauch nach Raum“ |
| `{typography.card-title}` | 17/24, 600 | h3: Raumname auf der Raumkarte |
| `{typography.body-strong}` | 16/24, 500 | Gerätename, Szenenname |
| `{typography.body}` | 16/24, 400 | Fließtext, Dialogtext, Bannertext (Banner: `meta` auf < 480 px erlaubt) |
| `{typography.meta}` | 14/20, 400 | Leistungszeile, Kosten, Tageswerte, Szenen-Untertitel, Toast-Text |
| `{typography.label}` | 13/16, 500 | „Hausverbrauch“, „EG“/„OG“, Badges, Laststufe, Status |

Regeln:

- **Alle Zahlen** mit `tabular-nums`, damit das Hochzählen nicht wackelt (NFR-1, CLS).
- Die Einheit steht mit schmalem, geschütztem Leerzeichen (` `) hinter der Zahl und ist in der Hero-Zahl kleiner: „1.274“ in `display-*`, „W“ in `title`-Größe, `ink-secondary`.
- Keine Großbuchstaben-Beschriftungen (deutsche Komposita werden unlesbar), keine Kursivschrift.
- Lange Raumnamen in der Hausansicht („Hauswirtschaftsraum“) brechen per `hyphens: auto` (wirkt dank `<html lang="de">`) mit Fallback `overflow-wrap: anywhere`.

## Layout & Spacing

4-px-Raster: `{spacing.1}` 4 bis `{spacing.12}` 48 px. Seitenrand `{spacing.gutter-mobile}` 16 px (< 768 px), `{spacing.gutter-desktop}` 24 px (≥ 768 px). Inhalt maximal `{spacing.container-max}` 1280 px, zentriert.

| Breite | Raster |
|---|---|
| < 768 px | Eine Spalte. Szenen 2 × 2. Raumkarten untereinander. |
| 768–1023 px | Eine Spalte. Szenen 4 nebeneinander. Raumkarten in 2 Spalten (Abstand `{spacing.4}`). |
| ≥ 1024 px | Zwei Spalten 5/12 + 7/12, Abstand `{spacing.6}`. Links: Hausansicht, darunter „Verbrauch nach Raum“. Rechts: Raumkarten (1 Spalte bis 1279 px, 2 Spalten ab 1280 px). Szenen 4 nebeneinander über beiden Spalten. |

Vertikaler Rhythmus: zwischen Abschnitten `{spacing.8}`, zwischen Überschrift und Inhalt `{spacing.3}`, zwischen Karten `{spacing.4}`, zwischen Gerätezeilen `{spacing.1}`.

Kopfbereich: `{spacing.header-height}` 116 px mobil (18 % von 640 px, Grenze FR-25: 30 %), `{spacing.header-height-desktop}` 88 px ab 1024 px, `{spacing.header-height-compact}` 64 px bei Viewport-Höhe ≤ 500 px (Querformat Handy, 200 % Zoom). Alle Sprungziele erhalten `scroll-margin-top` = aktuelle Kopfhöhe + 16 px.

Trefferflächen: mindestens `{spacing.hit-min}` 44 × 44 px; Gerätezeilen `{spacing.row-min-height}` 56 px.

## Elevation & Depth

Hierarchie entsteht durch Fläche und Typografie, nicht durch Schatten.

- **Ebene 0** `bg`: Seite.
- **Ebene 1** `surface`: Karten, Szenen, Kopf. Hell: Rand `border` + Schatten `0 1px 2px rgb(15 23 42 / 0.06)`. Dunkel: nur Rand `border-dark`, kein Schatten.
- **Ebene 2** `surface-raised`: Toasts, Dialog, Info-Hinweis. Hell: `0 10px 30px rgb(15 23 42 / 0.18)`. Dunkel: `0 10px 30px rgb(0 0 0 / 0.5)` plus Rand `border-dark`.
- Dialog-Hintergrund (`::backdrop`): hell `rgb(15 23 42 / 0.45)`, dunkel `rgb(0 0 0 / 0.6)`.
- Kopfbereich: Unterkante `border`; kein Schatten, kein Blur.

## Shapes

- `{rounded.sm}` 6 px: Räume in der Hausansicht, Skeleton-Blöcke, Fokus-Innenradius.
- `{rounded.md}` 10 px: Gerätezeilen, Schaltflächen.
- `{rounded.lg}` 16 px: Karten, Szenen-Schaltflächen, Toasts, Dialog, Banner.
- `{rounded.full}`: Schalter, Laststufen-Pille, Badges, Status, Balken, Symbolkreise.

Die Hausansicht ist bewusst eckiger (6 px) als die Karten: Sie ist ein Grundriss, kein Bedienelement-Stapel.

## Components

Verhalten, Texte und ARIA stehen in `EXPERIENCE.md` → Component Patterns. Hier nur Aussehen.

- **App-Kopf (`app-header`)** – `surface`, sticky, Unterkante `border`. Mobil zwei Zeilen: Zeile 1 links „IoT-Haus“ (`label`, 600, mit 16-px-Haussymbol), rechts Statusanzeige. Zeile 2 links Beschriftung „Hausverbrauch“ (`label`, `ink-secondary`) über der Hero-Zahl; rechts, rechtsbündig untereinander, Laststufen-Pille und Kosten „0,45 €/h“ (`meta`, `ink`). Ab 1024 px eine Zeile: Marke · Hausverbrauch + Zahl · Pille · Kosten · Status (rechts). Kompakt (Höhe ≤ 500 px): eine Zeile ohne Marke und ohne Beschriftung, Zahl `display-compact`.
- **Hero-Zahl (`power-hero`)** – `display-sm`/`display-lg`, `ink`, Einheit „W“ kleiner in `ink-secondary`. Feste Mindestbreite `7ch`, damit „12.978“ ohne Umbruch Platz hat und nichts springt.
- **Delta-Chip (`delta-chip`)** – kleines Etikett „+1.199 W“ bzw. „−2.200 W“ in `meta`, 600, Farbe `delta-up`/`delta-down`, ohne Fläche, absolut positioniert oberhalb rechts der Hero-Zahl (überlagert die Beschriftung, keine Layoutverschiebung).
- **Laststufen-Pille (`load-pill`)** – Pille, Höhe 24 px, Innenabstand 4/10 px, Symbol „Signalbalken“ 14 px (1, 2 oder 3 von 3 Balken gefüllt) + Text „niedrig“/„mittel“/„hoch“, Farben laut Tabelle.
- **Statusanzeige (`status-indicator`)** – Symbol 12 px + Text (`label`). „Verbunden“: gefüllter Punkt `status-ok`. „Verbinde …“: Ring mit Lücke in `ink-secondary`, dreht sich (bei reduzierter Bewegung statisch). „Getrennt“: durchgestrichenes WLAN-Symbol + Text in `danger`.
- **Übersichtsbereich** – kein Karten-Look, direkt auf `bg`, `meta`, `ink-secondary`, Zeilen mit Punkt-Trennern („·“). Info-Schaltfläche: Kreis-i 20 px in 44-px-Trefferfläche. Theme-Wahl: Segmentsteuerung, Höhe 36 px sichtbar (Trefferfläche 44 px durch Innenabstand), `surface-sunken`-Spur, gewähltes Segment `surface` mit Rand `border` und Text `ink`, nicht gewählte `ink-secondary`; Symbole Monitor/Sonne/Mond 16 px.
- **Szenen-Schaltfläche (`scene-button`)** – Karte `surface`, Rand `border`, `rounded.lg`, min. 64 px hoch, Innenabstand 12 px. Links Symbol 24 px in `ink-secondary` (Filmabend: Filmklappe; Morgenroutine: Sonnenaufgang; Gute Nacht: Mond; Alles aus: Power-Symbol), rechts Name (`body-strong`) über Untertitel (`meta`, `ink-secondary`). Hover (Zeiger): Rand `ink-muted`. Gedrückt: Fläche `surface-sunken`. Beschäftigt: Symbol wird durch Ladering ersetzt, Text „Wird ausgeführt …“ ersetzt den Untertitel. Gesperrt: Deckkraft 0,55 für Symbol und Rand; Texte behalten volle Farbe.
- **Hausansicht (`house-room-tile` + Rahmen)** – HTML-Raster mit dekorativem Inline-SVG-Dach (Dreieck `house-roof`, 2 px Kontur, keine Füllung außer `surface-sunken`) und Bodenlinie. Links schmale Spalte (28 px) mit Etagenbeschriftung „OG“/„EG“ (`label`, `ink-secondary`). Pro Etage 3 Räume gleich breit, Abstand 4 px, Außenwände als 2-px-Rand `house-roof` um das gesamte Raster. Raum: min. 72 px hoch (≥ 1024 px: 96 px), Innenabstand 8 px; Zeile 1 Raumname (`label`, 600, `ink`); Zeile 2 Raumverbrauch „271 W“ (`meta`, 600, `ink`); Zeile 3 „2 an“ (`label`, `ink-secondary`) und rechts bis zu 3 Mini-Symbole (14 px) eingeschalteter Geräte in `ink-secondary`, bei mehr „+2“. Leuchtend: Fläche `room-lit`, Rand 2 px `on`, Glühbirnen-Symbol 14 px `on` oben rechts, dazu ein weicher Lichtschein (`box-shadow: inset 0 -12px 24px` in `on-soft` hell bzw. `rgb(251 191 36 / 0.18)` dunkel). Hover: Rand `ink-muted`. Seitenverhältnis des Hauses 4:3 (mobil) bzw. 5:4 (≥ 1024 px).
- **Raumkarte (`room-card`)** – `surface`, Rand `border`, `rounded.lg`, Innenabstand 16 px. Kopf: Name (`card-title`) und darunter „EG · 2 von 5 an“ (`meta`, `ink-secondary`); rechts Raumverbrauch (`title`, `tabular-nums`). Darunter Geräteliste. Fuß: Schaltfläche „Raum ausschalten“ (`button-secondary`, volle Breite mobil, rechtsbündig ab 768 px) mit Power-Symbol 16 px.
- **Gerätezeile (`device-row`)** – ganze Zeile ist Schaltfläche, min. 56 px, Innenabstand 8/12 px, `rounded.md`. Links Symbolkreis 40 px (aus: `surface-sunken` + Symbol `ink-secondary`; an: `on-soft` + Symbol `on`). Mitte: Name (`body-strong`) mit Badges rechts daneben (umbrechend), darunter Leistungszeile (`meta`): an = „1.200 W“ in `ink` 600; aus mit Standby = „Standby 1,5 W“ in `ink-muted`; aus ohne Standby = „aus“ in `ink-muted`; Restzeit „· noch 2:48“ mit Uhrsymbol 14 px in `ink`. Rechts der Schalter. Auto-Aus-Fortschritt: 2-px-Linie am Zeilenunterrand, `on`, Breite = Restanteil (per `transform: scaleX`). Hover (Zeiger): Fläche `surface-sunken`. Beschäftigt: Leistungszeile „wird geschaltet …“, Knopf mit Ladering. Gesperrt: Schalter Deckkraft 0,55, Text unverändert.
- **Schalter (`device-switch`)** – Spur 44 × 26 px, Knopf 20 px. *An*: Spur `on`, Knopf `on-contrast` rechts, im Knopf ein 8-px-Häkchen in `on`. *Aus*: Spur transparent mit 2-px-Rand `switch-off`, Knopf `switch-off` links. Die Knopfposition plus Häkchen und die Leistungszeile tragen den Zustand ohne Farbe (FR-27).
- **Badge (`badge`)** – „Grundlast“ mit Schildsymbol 12 px, „Auto-Aus 3 min“ mit Uhrsymbol 12 px; `surface-sunken`, `ink-secondary`, `label`, Höhe 20 px, Innenabstand 2/8 px.
- **Verbrauch nach Raum** – Liste auf `surface`-Karte. Zeile: Raumname (`body`) links, rechts „1.236 W“ (`meta`, 600) und „64 %“ (`meta`, `ink-secondary`, feste Breite 4ch rechtsbündig); darunter Balken (`consumption-bar`) 8 px, Spur `surface-sunken`, Füllung `on`, Breite per `transform: scaleX(anteil)` mit `transform-origin: left`.
- **Toast (`toast`)** – `surface-raised`, `rounded.lg`, Ebene 2, Innenabstand 12/16 px, Breite `min(100% − 32px, 380px)`. Links Symbol 20 px (Pfeil hoch `delta-up`, Pfeil runter `delta-down`, Hinweis-i `ink-secondary`, Warn-Dreieck `danger`), Mitte Text (`meta`, `ink`, Differenz in 600 und Deltafarbe), rechts Schließen-Schaltfläche (Kreuz 16 px, Trefferfläche 44 px). Mobil unten zentriert, ab 768 px unten rechts; Abstand 16 px zum Rand plus `env(safe-area-inset-bottom)`; Stapel wächst nach oben, Abstand 8 px.
- **Banner (`banner`)** – fest am unteren Rand über der Toast-Zone, volle Breite mobil (16 px Rand), ab 768 px maximal 640 px zentriert. `rounded.lg`, Innenabstand 12/16 px, Warnsymbol 20 px links. Getrennt: Warnfarben; Neue Version: Infofarben. Aktion rechts (≥ 480 px) bzw. darunter volle Breite (< 480 px) als `button-primary`. Nebentext „Nächster Versuch in 8 s“ in `label`.
- **Grundlast-Dialog (`dialog`)** – natives `<dialog>`, `surface-raised`, `rounded.lg`, max. 420 px, Innenabstand 24 px. Titel `title`, Text `body` in `ink-secondary`. Aktionen rechtsbündig, mobil untereinander in voller Breite: „Abbrechen“ (`button-secondary`) und „Ausschalten“ (`button-danger`). DOM-Reihenfolge: Abbrechen zuerst.
- **Skeleton (`skeleton`)** – Blöcke `surface-sunken`, `rounded.sm`, in der Größe des späteren Inhalts (Hero-Zahl 5ch × 40 px, Leistungszeile 8ch × 14 px, Schalter 44 × 26 px `rounded.full`). Pulsieren der Deckkraft 1 → 0,6 → 1 in 1,6 s, bei reduzierter Bewegung statisch.
- **Fokusrahmen (`focus-ring`)** – `outline: 2px solid var(--c-focus); outline-offset: 2px` über `:focus-visible`; auf Gerätezeilen `outline-offset: -2px` (innen), damit Nachbarzeilen ihn nicht verdecken.
- **Symbole** – eine Komponente `Icon` mit Inline-SVG 24 × 24, `stroke="currentColor"`, Strichstärke 1,75, runde Enden; im Lucide-Stil selbst gezeichnet (Übernahme von Lucide-Pfaden ist erlaubt, ISC-Lizenz, Hinweis in der Datei). Immer `aria-hidden="true"` und `focusable="false"`. Benötigte Namen (Gerätekatalog-Feld `symbol`): `lampe` (alle Decken-, Steh-, Nachttisch-, Schreibtischlampen, Spiegelleuchte), `fernseher`, `soundbar`, `spielkonsole`, `kuehlschrank`, `gefrierschrank`, `mikrowelle`, `backofen`, `wasserkocher`, `kaffeemaschine`, `geschirrspueler`, `waschmaschine`, `trockner`, `foehn`, `heizluefter`, `pc`, `monitor`, `router`; UI: `haus`, `verbunden`, `verbinde`, `getrennt`, `info`, `schliessen`, `pfeil-hoch`, `pfeil-runter`, `warnung`, `uhr`, `schild`, `power`, `film`, `sonnenaufgang`, `mond`, `sonne`, `monitor-system`, `laststufe-1`, `laststufe-2`, `laststufe-3`, `haekchen`. Emojis werden nicht mehr verwendet.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Bernstein `on` ausschließlich für „ist an / verbraucht“ | Bernstein als Deko, Marken- oder Warnfarbe |
| Laststufe immer mit Text + Balkensymbol + Farbe | Laststufe nur als Farbfläche oder Punkt |
| Zahlen mit `tabular-nums` und fester Mindestbreite | Zahlen, deren Breite beim Hochzählen springt |
| Leuchtender Raum = Fläche **und** `on`-Rand **und** Glühbirne | Raumzustand nur über Füllfarbe |
| Flache Karten, ein Rand, dezenter Schatten nur in Hell | Verläufe, Blobs, Glas-Effekt, `hover:scale` |
| Gesperrte Steuerung: Grafik abgeblendet, Text voll lesbar | Ganze Zeilen mit `opacity` unter Kontrastgrenze |
| Selbstgezeichnete Inline-SVG-Symbole mit `aria-hidden` | Emojis als Bedeutungsträger, Icon-Bibliothek als neue Abhängigkeit |
| Hell und Dunkel mit eigenen, geprüften Token-Paaren | Dunkel per `filter: invert` oder automatisch abgeleitete Farben |
