# IoT-Haus 2.0 – Schnittstellen

Nach außen hat IoT-Haus drei Schnittstellen auf Port 3000:

| Schnittstelle | Zweck |
|---|---|
| `GET`/`HEAD /api/health` | Zustand für Healthcheck und Probes |
| WebSocket `/mqtt` | Befehle vom Browser, Zustand und Ereignisse vom Server (JSON) |
| alle übrigen Pfade | Next.js-Seite und Assets |

MQTT ist **nur intern**: Der Node-Server ist der einzige Client des eingebetteten Mosquitto (`127.0.0.1:1883`).
Der Pfad heißt aus Kompatibilitätsgründen weiterhin `/mqtt`, spricht aber kein MQTT.

Die Typen stehen verbindlich in [`src/domain/protokoll.ts`](src/domain/protokoll.ts). Die Prüfung der Befehle ist in
[`src/domain/befehle.ts`](src/domain/befehle.ts) umgesetzt, die WebSocket-Schicht in [`server/ws-verbindungen.ts`](server/ws-verbindungen.ts).

---

## 1. `/api/health`

Wird vom Node-Server vor Next.js beantwortet. `Content-Type: application/json; charset=utf-8`, `Cache-Control: no-store`.
Bei `HEAD` wird der Statuscode ohne Body gesendet.

| Lage | Status | Body |
|---|---|---|
| Broker verbunden und Zustand geladen | `200` | `{"status":"ok","mqtt":"verbunden","version":"2.0.0"}` |
| Start, noch beim Laden des Zustands | `503` | `{"status":"fehler","mqtt":"verbunden","version":"2.0.0"}` |
| Broker nicht erreichbar | `503` | `{"status":"fehler","mqtt":"getrennt","version":"2.0.0"}` |

`version` ist die Version aus `package.json` des Servers.

---

## 2. WebSocket `/mqtt`

### 2.1 Verbindungsaufbau

URL: `ws://<host>/mqtt` bzw. `wss://<host>/mqtt` hinter TLS. Der Browser leitet sie aus `location` ab.

Das Upgrade wird nur angenommen, wenn alle Bedingungen erfüllt sind. Geprüft wird in dieser Reihenfolge:

| # | Prüfung | Bei Verstoß |
|---|---|---|
| 1 | Pfad ist `/mqtt` | Socket wird geschlossen (im Dev-Modus gehen andere Upgrades an Next-HMR) |
| 2 | Host-Allowlist (nur wenn `ERLAUBTE_HOSTS` gesetzt ist, unten) | `HTTP/1.1 403 Forbidden`, Logzeile `ws_abgelehnt grund=host` |
| 3 | Origin-Regel (unten) | `HTTP/1.1 403 Forbidden`, Logzeile `ws_abgelehnt grund=origin` |
| 4 | Server ist bereit (Broker verbunden, Zustand geladen) | `HTTP/1.1 503 Service Unavailable`, Logzeile `ws_abgelehnt grund=nicht_bereit` |
| 4 | weniger als 100 gleichzeitige WebSocket-Verbindungen | `HTTP/1.1 503 Service Unavailable`, Logzeile `ws_abgelehnt grund=zu_viele_verbindungen` |

**Host-Allowlist** (`ERLAUBTE_HOSTS`, [`server/ursprung.ts`](server/ursprung.ts)) – Schutz gegen DNS-Rebinding:

- Leer oder nicht gesetzt: keine Prüfung.
- Gesetzt (kommagetrennte Hostnamen ohne Port, z. B. `haus.local,192.168.1.10`): Der Hostname aus dem `Host`-Header **und**, falls
  vorhanden, aus dem ersten Wert von `X-Forwarded-Host` muss in der Liste stehen. Ports werden vor dem Vergleich entfernt,
  Groß-/Kleinschreibung ist egal, IPv6-Literale bleiben in eckigen Klammern (`[::1]`). Fehlen beide Header, wird abgelehnt.

**Origin-Regel** ([`server/ursprung.ts`](server/ursprung.ts)):

- Fehlt der `Origin`-Header (z. B. Skripte, CLI-Clients), ist die Verbindung erlaubt.
- Sonst muss `Origin` eine `http:`- oder `https:`-URL sein, deren Host (inkl. Port) einem dieser Werte entspricht:
  dem `Host`-Header oder dem ersten Wert von `X-Forwarded-Host`. Groß-/Kleinschreibung ist egal. Die Standardports `:80` und `:443`
  im Header-Wert werden ignoriert.
- Ungültige Origin-URLs werden abgelehnt.

Direkt nach dem Upgrade sendet der Server einen `snapshot`. Der Client sendet von sich aus nichts. Ein neu verbundener Browser
kann den Zustand also nicht überschreiben.

### 2.2 Rahmenbedingungen

- Nur **Text-Frames** mit genau einem JSON-Objekt. Binär-Frames werden mit `UNGUELTIGES_JSON` beantwortet.
- **Größe:** Nachrichten über 4.096 Byte bis 64 KiB beantwortet der Server mit `ZU_GROSS`; die Verbindung bleibt offen.
  Nachrichten über 64 KiB schließen die Verbindung mit Close-Code `1009` (Message Too Big). Diese harte Grenze ist eine bewusste
  Teamentscheidung gegen Speichermissbrauch.
- **Befehlsrate je Verbindung:** Token-Bucket mit 100 Befehlen Vorrat, aufgefüllt mit 20 Befehlen pro Sekunde. Gültige Befehle darüber
  hinaus werden nicht ausgeführt und mit `fehler` `ZU_VIELE_BEFEHLE` (mit `befehlId`) beantwortet; die Verbindung bleibt offen.
- **Langsame Leser:** Übersteigt der Sendepuffer einer Verbindung 1 MB (der Client liest nicht mit), beendet der Server sie hart
  (Logzeile `ws_getrennt grund=liest_nicht`).
- **Höchstens 100 gleichzeitige Verbindungen**; weitere Upgrades erhalten HTTP 503.
- Feldnamen sind deutsch in camelCase, der Diskriminator heißt `typ`.
- Zeitpunkte sind Millisekunden seit Epoch (`number`), Datumsangaben `YYYY-MM-DD` in Europe/Berlin, Energie in Wh (ungerundet).
- **Heartbeat:** Der Server sendet alle 30 s ein Ping und beendet Verbindungen ohne Pong. Die `energie`-Nachricht kommt spätestens
  alle 60 s; der Browser-Client baut die Verbindung nach 75 s ohne Nachricht neu auf.
- **Close-Codes vom Server:** `1013` (Broker nicht erreichbar oder Server nicht bereit), `1012` (Server fährt herunter),
  `1009` (Nachricht über 64 KiB).
  Der Browser verbindet sich mit Backoff neu (1 s, 2 s, 4 s, 8 s, danach alle 10 s).

### 2.3 Befehle (Client → Server)

Es gibt genau drei Befehle. Jeder Befehl hat **genau** die aufgeführten Felder; zusätzliche oder fehlende Felder ergeben
`UNGUELTIGER_BEFEHL`.

| `typ` | Felder | Wirkung |
|---|---|---|
| `schalten` | `id`, `geraet`, `an` (boolean) | Ein Gerät an- oder ausschalten. Gilt auch für Grundlastgeräte (die Rückfrage macht die Oberfläche). |
| `szene` | `id`, `szene` | Eine Szene anwenden. Grundlastgeräte bleiben unverändert. |
| `raumAus` | `id`, `raum` | Alle Geräte des Raums außer Grundlast ausschalten. |

`id` ist die vom Client vergebene Befehlskennung, Muster `^[A-Za-z0-9_-]{1,64}$`.

```json
{ "typ": "schalten", "id": "mfz3k1-7", "geraet": "kueche.mikrowelle", "an": true }
{ "typ": "szene",    "id": "mfz3k1-8", "szene": "filmabend" }
{ "typ": "raumAus",  "id": "mfz3k1-9", "raum": "wohnzimmer" }
```

**Gültige IDs**

- Geräte: `‹raum›.‹geraet›`, z. B. `kueche.mikrowelle`. Die vollständige Liste der 28 IDs steht in
  [`src/domain/katalog.ts`](src/domain/katalog.ts).
- Räume: `wohnzimmer`, `kueche`, `hwr`, `schlafzimmer`, `bad`, `arbeitszimmer`.
- Szenen ([`src/domain/szenen.ts`](src/domain/szenen.ts)):

| Szene | Wirkung (Grundlast bleibt immer unverändert) |
|---|---|
| `alles-aus` | alle Nicht-Grundlastgeräte aus |
| `filmabend` | Wohnzimmer: Deckenlampe aus, Stehlampe, Fernseher, Soundbar an; Küche: Deckenlampe aus. Andere Geräte unverändert. |
| `morgenroutine` | Küche: Deckenlampe, Kaffeemaschine, Wasserkocher an; Bad: Deckenlampe, Spiegelleuchte, Heizlüfter an. Andere Geräte unverändert. |
| `gute-nacht` | alle Nicht-Grundlastgeräte aus, danach Schlafzimmer-Nachttischlampe an |

### 2.4 Nachrichten (Server → Client)

#### `snapshot` – vollständiger Zustand, einmal direkt nach dem Verbinden

```json
{
  "typ": "snapshot",
  "version": "2.0.0",
  "zustand": {
    "wohnzimmer.deckenlampe": { "an": false, "seit": 1758900000000 },
    "kueche.kuehlschrank":    { "an": true,  "seit": 1758900000000 }
  },
  "energie": { "datum": "2026-09-26", "wh": 3420.51 },
  "strompreis": 0.35,
  "serverZeit": 1758900123456
}
```

- `zustand` enthält **immer alle 28 Geräte** (oben gekürzt). `seit` ist der Zeitpunkt der letzten Zustandsänderung. Für Auto-Aus-Geräte
  ergibt sich die Restzeit aus `seit + 180 000 − Serverzeit`.
- `energie.wh` ist der Verbrauch seit 00:00 Uhr (Europe/Berlin).
- `strompreis` in €/kWh aus `STROMPREIS_EUR_PRO_KWH`.
- `serverZeit` dient dem Client zum Ausgleich des Uhrversatzes.
- Weicht `version` von der Version des Browser-Bundles ab, zeigt die Oberfläche „Neue Version verfügbar“ und sperrt die Schalter.

#### `aenderung` – an **alle** Clients, genau eine Nachricht je wirksamer Änderung

```json
{
  "typ": "aenderung",
  "ursache": { "art": "geraet", "ref": "kueche.mikrowelle", "befehlId": "mfz3k1-7" },
  "geraete": { "kueche.mikrowelle": { "an": true, "seit": 1758900130000 } },
  "energie": { "datum": "2026-09-26", "wh": 3421.02 }
}
```

- `geraete` enthält nur die geänderten Geräte, jeweils mit vollständigem neuen Zustand.
- `ursache.art`: `geraet` | `szene` | `raumAus` | `autoAus`. `ref` ist die Geräte-, Szenen- bzw. Raum-ID.
  Bei `autoAus` ist `befehlId` `null`.
- Ändert ein Befehl nichts (z. B. Gerät ist schon an), wird **keine** `aenderung` gesendet.

#### `bestaetigt` – nur an den Absender, nach der zugehörigen `aenderung`

```json
{ "typ": "bestaetigt", "befehlId": "mfz3k1-7", "geaendert": true }
```

`geaendert: false` heißt: Der Befehl war gültig, aber der Zustand entsprach schon dem Ziel.

#### `fehler` – nur an den Absender

```json
{ "typ": "fehler", "befehlId": "mfz3k1-7", "code": "UNBEKANNTES_GERAET", "meldung": "Unbekanntes Gerät." }
```

`befehlId` ist gesetzt, sobald die Nachricht eine gültige `id` enthielt, sonst `null`. Die Verbindung bleibt offen.

| `code` | Auslöser | `meldung` |
|---|---|---|
| `ZU_GROSS` | Nachricht > 4.096 Byte | Nachricht ist größer als 4096 Byte. |
| `UNGUELTIGES_JSON` | kein gültiges JSON oder Binär-Frame | Nachricht ist kein gültiges JSON. |
| `ALTES_PROTOKOLL` | Objekt enthält das Feld `type` (Protokoll aus 1.x) | Veraltetes Protokoll. Bitte die Seite neu laden. |
| `UNGUELTIGER_BEFEHL` | kein Objekt, unbekannter `typ`, fehlende/ungültige `id`, falsche Feldmenge, `an` nicht boolean, unerwarteter Serverfehler | Befehl ist ungültig. |
| `UNBEKANNTES_GERAET` | `geraet` nicht im Katalog | Unbekanntes Gerät. |
| `UNBEKANNTE_SZENE` | `szene` unbekannt | Unbekannte Szene. |
| `UNBEKANNTER_RAUM` | `raum` unbekannt | Unbekannter Raum. |
| `ZU_VIELE_BEFEHLE` | gültiger Befehl, aber Befehlsrate überschritten (siehe 2.2) | Zu viele Befehle. Bitte kurz warten. |

Die Prüfreihenfolge ist: Größe → Binär/JSON → `type`-Feld → `id` und `typ` → Feldmenge → Feldwerte → Befehlsrate.

#### `energie` – an alle, spätestens alle 60 s und genau um 00:00 Uhr (Europe/Berlin)

```json
{ "typ": "energie", "energie": { "datum": "2026-09-26", "wh": 3440.9 }, "serverZeit": 1758900180000 }
```

Beim Tageswechsel beginnt `wh` wieder bei 0. Es gibt keine Historie. Zeiten, in denen der Server nicht lief, zählen nicht.
Ebenso zählen Zeitsprünge über 2 Minuten (Uhr vorgestellt, Prozess eingefroren) nicht als Verbrauch: Integriert wird je Schritt
höchstens über die letzten 2 Minuten.

### 2.5 Ablauf eines Befehls

1. Prüfen (siehe `fehler`). Ungültig → `fehler` an den Absender, sonst nichts.
2. Anwenden auf den Serverzustand. Befehle werden strikt nacheinander verarbeitet.
3. Bei Änderung: Energie bis jetzt mit der alten Leistung integrieren, Auto-Aus-Timer setzen oder löschen,
   `aenderung` an alle senden, geänderte Geräte retained im Broker speichern.
4. `bestaetigt` an den Absender.

Auto-Aus (Wasserkocher, Mikrowelle: 180 s nach dem Einschalten) läuft über denselben Weg mit `ursache.art = "autoAus"`.

---

## 3. MQTT-Topic-Schema (intern)

Nur der Server liest und schreibt. Alle Nachrichten sind **retained** mit **QoS 1**, das Feld `v` ist die Schemaversion.
Befehls-Topics gibt es nicht. Die Topics `smarthome/…` aus 1.x werden weder gelesen noch geschrieben.

| Topic | Payload |
|---|---|
| `iot-haus/v2/geraet/<geraet-id>/zustand` | `{"v":1,"an":true,"seit":1758900000000}` |
| `iot-haus/v2/energie/heute` | `{"v":1,"datum":"2026-09-26","wh":3420.51,"stand":1758900000000}` |

`stand` ist der Zeitpunkt, bis zu dem integriert wurde.

**Wann wird geschrieben**

- Geräte-Topic: für jedes geänderte Gerät direkt nach der Änderung.
- Energie-Topic: nicht bei jeder Änderung, sondern im Energie-Takt (alle 60 s und genau zum Tageswechsel), beim Herunterfahren
  (SIGTERM) sowie beim Start und nach einer Wiederverbindung (siehe nächster Punkt).
  Nach einem Absturz fehlen also höchstens die letzten 60 s Verbrauch.
- Beim Start und nach einer Wiederverbindung zum Broker: alle 28 Geräte-Topics und das Energie-Topic.

**Wiederherstellung beim Start**

1. `iot-haus/v2/#` abonnieren, 500 ms retained Nachrichten sammeln, wieder abbestellen.
2. Übernommen werden nur gültige Payloads (`v === 1`, richtige Typen, Geräte-ID im Katalog, `seit` endlich und ≥ 0,
   `wh` endlich und ≥ 0). Alles andere wird ignoriert und als `restore_ignoriert topic=…` geloggt. `seit`-Werte in der Zukunft
   (Uhr zurückgestellt) werden auf den Startzeitpunkt begrenzt.
3. Fehlende Geräte starten im Ausgangszustand (nur Grundlast an). Stammt die Energie von einem anderen Tag, beginnt sie bei 0.
4. Laufende Auto-Aus-Timer werden mit der Restzeit neu gesetzt; bereits abgelaufene schalten sofort aus.

Mosquitto speichert nach jeder Änderung (`autosave_on_changes true`, `autosave_interval 1`) im Volume `mosquitto-data`
(`/var/lib/mosquitto`).
