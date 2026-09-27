# IoT-Haus 2.1 – Projektüberblick

**Stand:** 2.1.0

## Zweck

Ein simuliertes Zuhause für den Browser: Geräte schalten und sofort sehen, was das Haus gerade verbraucht, was die Solaranlage
erzeugt und was das kostet. Im Carport lädt ein Elektroauto, das wegfahren und zurückkommen kann.
Gedacht für das Heimnetz; mehrere Geräte (Handy, Laptop) sehen gleichzeitig denselben Zustand.

## Kurzfakten

| | |
|---|---|
| Bereiche / Geräte | 6 Räume auf 2 Etagen plus Carport (Außen), 29 Geräte (Katalog: `src/domain/katalog.ts`) |
| Szenen | Alles aus, Filmabend, Morgenroutine, Gute Nacht („Alles aus“ und „Gute Nacht“ beenden das Laden; keine Szene startet es) |
| Grundlast | Kühlschrank, Gefrierschrank, Router (Szenen/„Raum ausschalten“ lassen sie an, Einzelschalten mit Rückfrage) |
| Auto-Aus | Wasserkocher, Mikrowelle nach 180 s |
| Elektroauto | 60-kWh-Akku, Wallbox 11 kW (Standby 3 W), Start zu Hause mit 50 %; Wegfahren ab 15 %, Zurückkommen −15 % (9 kWh); bei 100 % schaltet der Server die Wallbox ab |
| Solaranlage | 9,8 kWp; Sonne in 5 Stufen: Nacht 0 W, Bedeckt 980 W, Wolkig 3.430 W, Heiter 6.370 W, Sonnig 8.330 W; Start „Nacht“ |
| Netzbilanz | Netzbezug = max(0, Verbrauch − Solar), Einspeisung = max(0, Solar − Verbrauch); Kosten/h aus dem Netzbezug, bei Einspeisung „Ertrag ‹x› €/h“ |
| Ausgangszustand | nur Grundlast an: 78,3 W („78 W“), davon 13,3 W Standby; „Alles an“ 23.978 W |
| Strompreis | `STROMPREIS_EUR_PRO_KWH`, Standard 0,35 €/kWh |
| Einspeisevergütung | `EINSPEISEVERGUETUNG_EUR_PRO_KWH`, Standard 0,08 €/kWh |
| Laststufe | < 500 W niedrig, < 2.000 W mittel, sonst hoch (immer auf den Hausverbrauch) |
| Tagesbilanz | Verbrauch, Netzbezug, Einspeisung und Erzeugung in kWh, Tageskosten netto in €, seit 00:00 Uhr Europe/Berlin, ohne Historie |
| Sprache | Deutsch (UI, Doku, Fachbezeichner im Code) |
| Barrierefreiheit | Ziel WCAG 2.2 AA; Tastatur, Screenreader-Ansagen, Zoom 200 %, Dunkelmodus, reduzierte Bewegung |
| Tests | 338 automatisierte Tests (Vitest), Zeilenabdeckung 99 %, axe in Hell und Dunkel ohne Verstöße |
| JS First Load | 123 kB (Budget 200 kB, in der CI geprüft) |

## Was 2.1 gegenüber 2.0 ändert

- Neuer Außenbereich **Carport** mit **Wallbox** und **Elektroauto** (Laden, Akku voll, Wegfahren, Zurückkommen).
- **Solaranlage** mit Sonnenwahl in eigenem Bereich nach den Szenen; Solarmodule und Solarwert auf dem Dach der Hausansicht.
- **Netz-Zeile** im Kopf, Kosten aus dem Netzbezug bzw. Ertrag bei Einspeisung; Übersicht mit Netto-Tageskosten und „Netz heute“.
- Protokoll: Befehle `sonne` und `auto`, Fehlercode `NICHT_MOEGLICH`, neue Felder und Ursachen; keine neuen Nachrichtentypen.
- Persistenz: neue Topics `iot-haus/v2/auto/zustand` und `iot-haus/v2/solar/sonne`, Energie-Topic `v: 2` (liest `v: 1` aus 2.0).
- Upgrade ohne manuellen Schritt; offene 2.0-Tabs zeigen „Neue Version verfügbar“.

## Was sich mit 2.0 gegenüber 1.x geändert hat

- Aus 4 Räumen mit je einem Licht wurden 6 Räume mit 28 Geräten und Live-Verbrauch.
- Der Server ist autoritativ. Browser senden nur Befehle und speichern keinen Gerätezustand mehr (vorher: `localStorage`,
  jeder neue Client überschrieb den Zustand).
- Persistenz über retained MQTT-Nachrichten `iot-haus/v2/…` statt Topics `smarthome/<raum>/light`.
- Server in TypeScript (`server/*.ts`), gemeinsames Domänenmodul für Server und Browser.
- Tests, Lint und Typecheck in der CI; ein Workflow für CI, Image und Release; Healthcheck ohne curl.

Weiter: [Architektur](./architecture.md) · [README](../README.md) · [Abnahme 2.1](./abnahme-2.1.md) · [Abnahme 2.0](./abnahme-2.0.md)
