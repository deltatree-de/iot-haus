# IoT-Haus 2.0 – Projektüberblick

**Stand:** 2.0.0

## Zweck

Ein simuliertes Zuhause für den Browser: Geräte schalten und sofort sehen, was das Haus gerade verbraucht und kostet.
Gedacht für das Heimnetz; mehrere Geräte (Handy, Laptop) sehen gleichzeitig denselben Zustand.

## Kurzfakten

| | |
|---|---|
| Räume / Geräte | 6 Räume auf 2 Etagen, 28 Geräte (Katalog: `src/domain/katalog.ts`) |
| Szenen | Alles aus, Filmabend, Morgenroutine, Gute Nacht |
| Grundlast | Kühlschrank, Gefrierschrank, Router (Szenen/„Raum ausschalten“ lassen sie an, Einzelschalten mit Rückfrage) |
| Auto-Aus | Wasserkocher, Mikrowelle nach 180 s |
| Ausgangszustand | nur Grundlast an: 75,3 W, davon 10,3 W Standby |
| Strompreis | `STROMPREIS_EUR_PRO_KWH`, Standard 0,35 €/kWh |
| Laststufe | < 500 W niedrig, < 2.000 W mittel, sonst hoch |
| Tagesverbrauch | kWh und € seit 00:00 Uhr Europe/Berlin, ohne Historie |
| Sprache | Deutsch (UI, Doku, Fachbezeichner im Code) |
| Barrierefreiheit | Ziel WCAG 2.2 AA; Tastatur, Screenreader-Ansagen, Zoom 200 %, Dunkelmodus, reduzierte Bewegung |
| Tests | 258 automatisierte Tests (Vitest), axe in Hell und Dunkel ohne Verstöße |
| JS First Load | 117 kB (Budget 200 kB, in der CI geprüft) |

## Was sich gegenüber 1.x geändert hat

- Aus 4 Räumen mit je einem Licht werden 6 Räume mit 28 Geräten und Live-Verbrauch.
- Der Server ist autoritativ. Browser senden nur Befehle und speichern keinen Gerätezustand mehr (vorher: `localStorage`,
  jeder neue Client überschrieb den Zustand).
- Persistenz über retained MQTT-Nachrichten `iot-haus/v2/…` statt Topics `smarthome/<raum>/light`.
- Server in TypeScript (`server/*.ts`), gemeinsames Domänenmodul für Server und Browser.
- Tests, Lint und Typecheck in der CI; ein Workflow für CI, Image und Release; Healthcheck ohne curl.

Weiter: [Architektur](./architecture.md) · [README](../README.md) · [Abnahme](./abnahme-2.0.md)
