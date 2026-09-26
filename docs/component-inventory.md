# iot-haus – Komponenteninventar

**Stand:** 2026-09-26 · Kein Designsystem, keine Komponentenbibliothek; Tailwind-Utilities + Emojis + Inline-SVG.

## 1. Seiten und Layout

| Komponente | Datei | Typ | Verantwortung | Anmerkungen |
|---|---|---|---|---|
| `RootLayout` | `src/app/layout.tsx` | Server Component | `<html lang="de">`, Fonts (Geist), Metadaten, PWA-Meta | `viewport`/`themeColor` in `metadata` (in Next 15 veraltet), zusätzlich manuelle `<meta>`-Duplikate (`:44-51`); `user-scalable=no`; `/apple-touch-icon.png` existiert nicht |
| `Home` | `src/app/page.tsx` | Client Component (Container) | Hauszustand, localStorage, MQTT-Anbindung, Initial-Sync, Seitenlayout, Footer "System-Information" | 303 Zeilen, zahlreiche `console.log`; Hydration-Risiken (`:39-51`, `:265`) |

## 2. Präsentationskomponenten

| Komponente | Datei | Kategorie | Props | Interaktion | Anmerkungen |
|---|---|---|---|---|---|
| `HouseVisualization` | `src/components/HouseVisualization.tsx` | Display / Visualisierung | `house`, `onLightToggle` | delegiert an `RoomComponent` | 497 Zeilen statisches SVG (viewBox 500×500); eigene Überschrift "Smart Home Control" dupliziert Seitentitel; Legende grün/grau passt nicht zu Amber-Licht; `min-h-screen` im Grid |
| `RoomComponent` | `src/components/RoomComponent.tsx` | Display + Eingabe (SVG) | `room`, `onLightToggle` | `onClick` auf transparenter Hitbox | Hitbox liegt unter Fenster/Lampe/Label → Klicks dort ohne Wirkung; nicht per Tastatur bedienbar (kein `role`, `tabIndex`, `aria-*`); definiert `<filter id="roomShadow">`/`lightGlow` pro Raum erneut (doppelte IDs); schaltet auch bei getrennter Verbindung |
| `ControlPanel` | `src/components/ControlPanel.tsx` | Formular/Steuerung | `rooms`, `onLightToggle`, `connectionStatus` | Toggle-Buttons, deaktiviert wenn nicht `connected` | Buttons ohne `aria-pressed`/`aria-label` (nur Emoji-Inhalt); `getStatusIcon` ungenutzt; Etagen-Badge "1F/2F" (englisch) |

## 3. Hooks (State/Integration)

| Hook | Datei | Rolle | Anmerkungen |
|---|---|---|---|
| `useMqtt` | `src/hooks/useMqtt.ts` | Fassade Mock vs. WebSocket | `shouldUseMock = false` fest; ruft trotzdem beide Hooks auf; `publishMessage` wird jeden Render neu erzeugt |
| `useWebSocketMqtt` | `src/hooks/useWebSocketMqtt.ts` | WS-Verbindung, Abos, Publish, Reconnect | Reconnect nur einmal; Cleanup löst neuen Reconnect aus; auskommentierte Duplikatfilterung; `sentMessagesRef` ungenutzt |
| `useMockMqtt` | `src/hooks/useMockMqtt.ts` | lokaler Fake-Broker | läuft immer mit und setzt nach 1 s Status `connected` |

## 4. Styles und Assets

- `src/app/globals.css`: Theme-Variablen (Dark-Mode-Variablen gesetzt, aber UI nutzt fest helle Verläufe), Blob-Animation,
  Touch-Targets 44 px, `prefers-reduced-motion`/`prefers-contrast`-Regeln, Scrollbar-Styling.
- `public/apple-touch-icon.svg`, `public/window.svg` (ungenutzt), `src/app/favicon.ico`.

## 5. Wiederverwendbarkeit

Es gibt keine generischen Bausteine (Button, Card, Toggle, Badge). Wiederkehrende Muster (Glas-Karten
`bg-white/70 backdrop-blur-sm rounded-2xl`, Verlaufsüberschriften, Status-Pillen) sind mehrfach als Klassenketten kopiert.
Für die geplante Geräte-/Energie-Erweiterung empfiehlt sich eine kleine UI-Basis (Toggle, Card, Stat/Kennzahl, Toast).
