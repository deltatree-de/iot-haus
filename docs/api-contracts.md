# IoT-Haus 2.1 – API-Verträge (Kurzfassung)

Die vollständige Beschreibung mit Beispielen steht in [API.md](../API.md). Verbindlich im Code: `src/domain/protokoll.ts`.

## HTTP

| Pfad | Antwort |
|---|---|
| `GET`/`HEAD /api/health` | `200 {"status":"ok","mqtt":"verbunden","version":"2.1.0"}` oder `503 {"status":"fehler","mqtt":…,"version":…}` mit `mqtt` = `verbunden` (Start) oder `getrennt` (Broker weg) |
| alles andere | Next.js |

## WebSocket `/mqtt`

Prüfreihenfolge beim Upgrade: Pfad `/mqtt` → Host-Allowlist `ERLAUBTE_HOSTS`, falls gesetzt (`Host` und vorhandener `X-Forwarded-Host`
müssen darin stehen, sonst 403) → Origin (fehlt oder Host = `Host`/`X-Forwarded-Host`, sonst 403) → Server bereit und < 100 Verbindungen
(sonst 503).

Limits je Verbindung: 4 KB fachlich (`ZU_GROSS`), 64 KiB hart (Close 1009), Token-Bucket 100 Befehle Vorrat + 20/s
(`ZU_VIELE_BEFEHLE`), Sendepuffer > 1 MB → Verbindung wird beendet. Die neuen Befehle aus 2.1 laufen durch dieselben Grenzen.

**Client → Server** (genau diese Felder, `id` = `^[A-Za-z0-9_-]{1,64}$`):

| `typ` | Felder |
|---|---|
| `schalten` | `id`, `geraet` (29 IDs, neu `carport.wallbox`), `an` |
| `szene` | `id`, `szene` (`alles-aus`, `filmabend`, `morgenroutine`, `gute-nacht`) |
| `raumAus` | `id`, `raum` (`wohnzimmer`, `kueche`, `hwr`, `schlafzimmer`, `bad`, `arbeitszimmer`, `carport`) |
| `sonne` (2.1) | `id`, `stufe` (`nacht`, `bedeckt`, `wolkig`, `heiter`, `sonnig`) |
| `auto` (2.1) | `id`, `zuhause` (boolean: `false` = wegfahren, `true` = zurückkommen) |

Fachliche Regeln (2.1): Wallbox einschalten nur mit Auto zu Hause und Akku < 60.000 Wh; Wegfahren nur ab 9.000 Wh (15 %).
Verstoß → `fehler` `NICHT_MOEGLICH`, Zustand unverändert.

**Server → Client**

| `typ` | Empfänger | Inhalt |
|---|---|---|
| `snapshot` | neuer Client | `version`, `zustand` (alle 29 Geräte), `auto`, `sonne`, `energie`, `strompreis`, `einspeiseverguetung`, `serverZeit` |
| `aenderung` | alle | `ursache {art, ref, befehlId}`, `geraete` (nur geänderte, darf `{}` sein), `auto?` (bei Änderung am Auto oder Schalten der Wallbox), `sonne?` (nur bei Änderung), `energie` |
| `bestaetigt` | Absender | `befehlId`, `geaendert` |
| `fehler` | Absender | `befehlId`, `code`, `meldung` |
| `energie` | alle, ≤ 60 s und um Mitternacht | `energie`, `auto`, `serverZeit` |

Strukturen: `auto = { zuhause, akkuWh, stand }`, `sonne = { stufe, seit }`,
`energie = { datum, wh, bezugWh, einspeisungWh }` (Wh seit 00:00 Uhr Europe/Berlin, ungerundet).

`ursache.art`: `geraet`, `szene`, `raumAus`, `autoAus`, `sonne` (`ref` = Stufe), `auto` (`ref` = `weg` | `zurueck`),
`akkuVoll` (`ref` = `carport.wallbox`, `befehlId` `null`). Wegfahren während des Ladens ist **eine** `aenderung` mit `auto` und
ausgeschalteter Wallbox.

Fehlercodes: `ZU_GROSS` (> 4.096 Byte), `UNGUELTIGES_JSON`, `ALTES_PROTOKOLL` (Feld `type`), `UNGUELTIGER_BEFEHL` (auch unbekannte
`stufe` oder `zuhause` nicht boolean), `UNBEKANNTES_GERAET`, `UNBEKANNTE_SZENE`, `UNBEKANNTER_RAUM`, `ZU_VIELE_BEFEHLE` (Befehlsrate
überschritten), `NICHT_MOEGLICH` (2.1, fachliche Regel verletzt: „Aktion ist im aktuellen Zustand nicht möglich.“).

Close-Codes: `1013` Broker weg / nicht bereit, `1012` Server fährt herunter, `1009` Nachricht > 64 KiB.

Kompatibilität: Weicht `snapshot.version` von der Version des Browser-Bundles ab, zeigt der Tab „Neue Version verfügbar“ und sendet
nichts mehr. Ein 2.1-Client ergänzt fehlende Felder defensiv (Auto zu Hause mit 50 %, Sonne „Nacht“, Vergütung 0,08, `bezugWh = wh`,
`einspeisungWh = 0`).

## MQTT (intern, retained, QoS 1)

| Topic | Payload |
|---|---|
| `iot-haus/v2/geraet/<geraet-id>/zustand` | `{"v":1,"an":…,"seit":…}` |
| `iot-haus/v2/energie/heute` | `{"v":2,"datum":"YYYY-MM-DD","wh":…,"bezugWh":…,"einspeisungWh":…,"stand":…}` |
| `iot-haus/v2/auto/zustand` (2.1) | `{"v":1,"zuhause":…,"akkuWh":…,"stand":…}` |
| `iot-haus/v2/solar/sonne` (2.1) | `{"v":1,"stufe":…,"seit":…}` |

Geräte-Topics werden bei jeder Änderung geschrieben, das Sonnen-Topic bei jedem Sonnenwechsel, das Auto-Topic bei Änderungen an Auto
oder Wallbox und im 60-s-Takt, das Energie-Topic im 60-s-Takt; alle vier zusätzlich bei SIGTERM (Energie, Auto) sowie beim Start und
nach einer Wiederverbindung zum Broker.

**Migration:** Ein Energie-Payload `v: 1` aus 2.0 (nur `wh`) wird beim Start als `bezugWh = wh`, `einspeisungWh = 0` gelesen; der
Tageswert bleibt beim Upgrade erhalten. Geschrieben wird immer `v: 2`.
