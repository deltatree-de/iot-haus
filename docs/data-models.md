# iot-haus – Datenmodelle

**Stand:** 2026-09-26 · Keine Datenbank, kein ORM, keine Migrationen. Modelle ausschließlich als TypeScript-Interfaces
(`src/types/index.ts`) und als JSON-Payloads.

## 1. Domänenmodell (`src/types/index.ts`)

```ts
interface Room  { id: string; name: string; floor: number; position: 'left' | 'right'; lightOn: boolean; }
interface Floor { number: number; rooms: Room[]; }
interface House { floors: Floor[]; }
interface LightState { roomId: string; isOn: boolean; timestamp: number; clientId?: string; }
interface MqttMessage { topic: string; payload: string; timestamp: number; }   // ungenutzt
```

Beziehungen: `House 1—n Floor 1—n Room`. Ein Raum hat genau **ein** schaltbares Licht (`lightOn`). `position` und `floor`
bestimmen direkt die SVG-Koordinaten (`RoomComponent.tsx:16-17`) — das Modell unterstützt daher faktisch nur 2×2 Räume.

## 2. Stammdaten (hart codiert, `src/app/page.tsx:10-35`)

| id | name | floor | position | Topic |
|---|---|---|---|---|
| `room_1_left` | Wohnzimmer | 1 (EG) | left | `smarthome/room_1_left/light` |
| `room_1_right` | Küche | 1 (EG) | right | `smarthome/room_1_right/light` |
| `room_2_left` | Schlafzimmer | 2 (OG) | left | `smarthome/room_2_left/light` |
| `room_2_right` | Badezimmer | 2 (OG) | right | `smarthome/room_2_right/light` |

Zusätzlich doppelt gepflegt: `MQTT_TOPICS` (`page.tsx:30-35`), Kurzname-Mapping (`RoomComponent.tsx:22-30`),
Raumanzahl/Stockwerke als Literale im Footer (`page.tsx:253`, `:259`), Raum-IDs in allen `test-*.js`.

## 3. Persistenzorte

| Ort | Schlüssel/Pfad | Inhalt | Lebensdauer |
|---|---|---|---|
| Browser `localStorage` | `smart-home-state` | komplettes `House`-JSON | pro Browser/Gerät, unbegrenzt; ohne Versionsfeld/Migration |
| Mosquitto | `/var/lib/mosquitto/mosquitto.db` (Volume `mosquitto-data`) | nur Broker-Interna; keine retained Messages | Autosave alle 1800 s |
| Server-Speicher | `clientSubscriptions`, `activeClients` (`server.js:34-35`) | Abos je WS-Verbindung | bis Prozessende |

## 4. Schwächen

- Kein Schema-Versioning in `localStorage`: Jede Modelländerung (z. B. Geräte statt `lightOn`) liest alte Stände ungeprüft ein
  (`page.tsx:44` `JSON.parse` ohne Validierung) → Laufzeitfehler möglich.
- Kein Gerätebegriff, keine Leistungs-/Verbrauchsattribute, keine Zeitreihen.
