# IoT-Haus 2.0 – API-Verträge (Kurzfassung)

Die vollständige Beschreibung mit Beispielen steht in [API.md](../API.md). Verbindlich im Code: `src/domain/protokoll.ts`.

## HTTP

| Pfad | Antwort |
|---|---|
| `GET`/`HEAD /api/health` | `200 {"status":"ok","mqtt":"verbunden","version":"2.0.0"}` oder `503 {"status":"fehler","mqtt":…,"version":…}` mit `mqtt` = `verbunden` (Start) oder `getrennt` (Broker weg) |
| alles andere | Next.js |

## WebSocket `/mqtt`

Prüfreihenfolge beim Upgrade: Pfad `/mqtt` → Host-Allowlist `ERLAUBTE_HOSTS`, falls gesetzt (`Host` und vorhandener `X-Forwarded-Host`
müssen darin stehen, sonst 403) → Origin (fehlt oder Host = `Host`/`X-Forwarded-Host`, sonst 403) → Server bereit und < 100 Verbindungen
(sonst 503).

Limits je Verbindung: 4 KB fachlich (`ZU_GROSS`), 64 KiB hart (Close 1009), Token-Bucket 100 Befehle Vorrat + 20/s
(`ZU_VIELE_BEFEHLE`), Sendepuffer > 1 MB → Verbindung wird beendet.

**Client → Server** (genau diese Felder, `id` = `^[A-Za-z0-9_-]{1,64}$`):

| `typ` | Felder |
|---|---|
| `schalten` | `id`, `geraet`, `an` |
| `szene` | `id`, `szene` (`alles-aus`, `filmabend`, `morgenroutine`, `gute-nacht`) |
| `raumAus` | `id`, `raum` (`wohnzimmer`, `kueche`, `hwr`, `schlafzimmer`, `bad`, `arbeitszimmer`) |

**Server → Client**

| `typ` | Empfänger | Inhalt |
|---|---|---|
| `snapshot` | neuer Client | `version`, `zustand` (alle 28 Geräte), `energie`, `strompreis`, `serverZeit` |
| `aenderung` | alle | `ursache {art, ref, befehlId}`, `geraete` (nur geänderte), `energie` |
| `bestaetigt` | Absender | `befehlId`, `geaendert` |
| `fehler` | Absender | `befehlId`, `code`, `meldung` |
| `energie` | alle, ≤ 60 s und um Mitternacht | `energie`, `serverZeit` |

Fehlercodes: `ZU_GROSS` (> 4.096 Byte), `UNGUELTIGES_JSON`, `ALTES_PROTOKOLL` (Feld `type`), `UNGUELTIGER_BEFEHL`,
`UNBEKANNTES_GERAET`, `UNBEKANNTE_SZENE`, `UNBEKANNTER_RAUM`, `ZU_VIELE_BEFEHLE` (Befehlsrate überschritten).

Close-Codes: `1013` Broker weg / nicht bereit, `1012` Server fährt herunter, `1009` Nachricht > 64 KiB.

## MQTT (intern, retained, QoS 1)

| Topic | Payload |
|---|---|
| `iot-haus/v2/geraet/<geraet-id>/zustand` | `{"v":1,"an":…,"seit":…}` |
| `iot-haus/v2/energie/heute` | `{"v":1,"datum":"YYYY-MM-DD","wh":…,"stand":…}` |

Geräte-Topics werden bei jeder Änderung geschrieben, das Energie-Topic im 60-s-Takt, bei SIGTERM sowie beim Start und nach einer
Wiederverbindung zum Broker.
