# 📡 API Dokumentation

## 🌐 WebSocket MQTT API

### Verbindung

**Endpoint:** 
- **Entwicklung:** `ws://localhost:3000/mqtt`
- **Production:** `wss://your-domain/mqtt` (automatische Erkennung)
- **Docker/K8s:** Relative URL basierend auf aktueller Domain

**Protokoll:** WebSocket über MQTT-Proxy

> **💡 Smart URL Detection**: Die Anwendung erkennt automatisch die korrekte WebSocket-URL basierend auf der Browser-URL. Konfiguration über `NEXT_PUBLIC_MQTT_BROKER_URL=auto` in den Environment Variables.

### 📨 Nachrichtenformate

#### 1. Subscribe (Client → Server)

Abonnieren eines MQTT-Topics:

```json
{
  "type": "subscribe",
  "topic": "smarthome/room_1_left/light"
}
```

**Response:**
```json
{
  "type": "subscribed", 
  "topic": "smarthome/room_1_left/light"
}
```

#### 2. Publish (Client → Server)

Senden einer MQTT-Nachricht:

```json
{
  "type": "publish",
  "topic": "smarthome/room_1_left/light",
  "payload": "{\"roomId\":\"room_1_left\",\"isOn\":true,\"timestamp\":1693747200000}"
}
```

**Response:**
```json
{
  "type": "published",
  "topic": "smarthome/room_1_left/light"
}
```

#### 3. Message (Server → Client)

Empfangen einer MQTT-Nachricht:

```json
{
  "type": "message",
  "topic": "smarthome/room_1_left/light", 
  "payload": "{\"roomId\":\"room_1_left\",\"isOn\":true,\"timestamp\":1693747200000}",
  "timestamp": 1693747200000
}
```

#### 4. Unsubscribe (Client → Server)

Abmelden von einem MQTT-Topic:

```json
{
  "type": "unsubscribe",
  "topic": "smarthome/room_1_left/light"
}
```

#### 5. Error (Server → Client)

Fehler-Nachrichten:

```json
{
  "type": "error",
  "message": "Failed to subscribe to topic",
  "error": "Connection refused",
  "topic": "smarthome/room_1_left/light"
}
```

#### 6. Connected (Server → Client)

Verbindungsbestätigung:

```json
{
  "type": "connected",
  "message": "MQTT WebSocket Proxy connected"
}
```

## 🏠 Smart Home Data Models

### Light State

**Topic Pattern:** `smarthome/{roomId}/light`

```typescript
interface LightState {
  roomId: string;      // Eindeutige Raum-ID
  isOn: boolean;       // Licht an/aus Status
  timestamp: number;   // Unix Timestamp
}
```

**Beispiel:**
```json
{
  "roomId": "room_1_left",
  "isOn": true,
  "timestamp": 1693747200000
}
```

### Room Configuration

```typescript
interface Room {
  id: string;          // Eindeutige ID (z.B. "room_1_left")
  name: string;        // Anzeigename (z.B. "Wohnzimmer")
  floor: number;       // Stockwerk (1 oder 2)
  position: string;    // Position ("left" oder "right")
  lightOn: boolean;    // Aktueller Lichtstatus
}
```

### House Structure

```typescript
interface House {
  floors: Floor[];
}

interface Floor {
  number: number;      // Stockwerknummer
  rooms: Room[];       // Räume auf diesem Stockwerk
}
```

## 📋 MQTT Topics

| Topic | Beschreibung | Payload Type |
|-------|-------------|--------------|
| `smarthome/room_1_left/light` | Wohnzimmer Licht | `LightState` |
| `smarthome/room_1_right/light` | Küche Licht | `LightState` |
| `smarthome/room_2_left/light` | Schlafzimmer Licht | `LightState` |
| `smarthome/room_2_right/light` | Badezimmer Licht | `LightState` |

### Topic-Namenskonvention

```
smarthome/{floor}_{position}/light
```

- `{floor}`: Stockwerk (1 oder 2)
- `{position}`: Position (left oder right)

## 🔌 WebSocket Client Beispiele

### JavaScript/TypeScript

```typescript
const ws = new WebSocket('ws://localhost:3000/mqtt');

ws.onopen = () => {
  console.log('Verbunden');
  
  // Topic abonnieren
  ws.send(JSON.stringify({
    type: 'subscribe',
    topic: 'smarthome/room_1_left/light'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'message') {
    const lightState = JSON.parse(data.payload);
    console.log('Licht Update:', lightState);
  }
};

// Licht einschalten
function toggleLight(roomId: string, isOn: boolean) {
  const lightState = {
    roomId,
    isOn,
    timestamp: Date.now()
  };
  
  ws.send(JSON.stringify({
    type: 'publish',
    topic: `smarthome/${roomId}/light`,
    payload: JSON.stringify(lightState)
  }));
}
```

### Python

```python
import websocket
import json
import time

def on_message(ws, message):
    data = json.loads(message)
    
    if data['type'] == 'message':
        light_state = json.loads(data['payload'])
        print(f"Licht Update: {light_state}")

def on_open(ws):
    print("Verbunden")
    
    # Topic abonnieren
    ws.send(json.dumps({
        'type': 'subscribe',
        'topic': 'smarthome/room_1_left/light'
    }))

def toggle_light(ws, room_id, is_on):
    light_state = {
        'roomId': room_id,
        'isOn': is_on,
        'timestamp': int(time.time() * 1000)
    }
    
    ws.send(json.dumps({
        'type': 'publish',
        'topic': f'smarthome/{room_id}/light',
        'payload': json.dumps(light_state)
    }))

# WebSocket Client erstellen
ws = websocket.WebSocketApp("ws://localhost:3000/mqtt",
                           on_message=on_message,
                           on_open=on_open)

ws.run_forever()
```

### Node.js

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/mqtt');

ws.on('open', () => {
  console.log('Verbunden');
  
  // Alle Lichter abonnieren
  ['room_1_left', 'room_1_right', 'room_2_left', 'room_2_right'].forEach(roomId => {
    ws.send(JSON.stringify({
      type: 'subscribe',
      topic: `smarthome/${roomId}/light`
    }));
  });
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  
  if (message.type === 'message') {
    const lightState = JSON.parse(message.payload);
    console.log(`${lightState.roomId}: ${lightState.isOn ? 'AN' : 'AUS'}`);
  }
});

// Alle Lichter ausschalten
function allLightsOff() {
  ['room_1_left', 'room_1_right', 'room_2_left', 'room_2_right'].forEach(roomId => {
    toggleLight(roomId, false);
  });
}

function toggleLight(roomId, isOn) {
  const lightState = {
    roomId,
    isOn,
    timestamp: Date.now()
  };
  
  ws.send(JSON.stringify({
    type: 'publish',
    topic: `smarthome/${roomId}/light`,
    payload: JSON.stringify(lightState)
  }));
}
```

## 🧪 Testing & Development

### MQTT CLI Tools

```bash
# Direkt mit MQTT Broker (im Container)
docker exec smart-home mosquitto_pub -h 127.0.0.1 -t "smarthome/room_1_left/light" -m '{"roomId":"room_1_left","isOn":true,"timestamp":1693747200000}'

docker exec smart-home mosquitto_sub -h 127.0.0.1 -t "smarthome/+/light" -v

# Mit mosquitto_clients (lokal installiert)
mosquitto_pub -h localhost -p 1883 -t "smarthome/room_1_left/light" -m '{"roomId":"room_1_left","isOn":true,"timestamp":1693747200000}'
```

### WebSocket Testing

```bash
# Mit wscat (npm install -g wscat)
wscat -c ws://localhost:3000/mqtt

# Nachrichten senden
{"type":"subscribe","topic":"smarthome/room_1_left/light"}
{"type":"publish","topic":"smarthome/room_1_left/light","payload":"{\"roomId\":\"room_1_left\",\"isOn\":true,\"timestamp\":1693747200000}"}
```

### Browser Console

```javascript
// Im Browser (F12 → Console)
const ws = new WebSocket('ws://localhost:3000/mqtt');
ws.onopen = () => console.log('Verbunden');
ws.onmessage = (e) => console.log('Message:', JSON.parse(e.data));

// Subscribe
ws.send('{"type":"subscribe","topic":"smarthome/room_1_left/light"}');

// Publish
ws.send('{"type":"publish","topic":"smarthome/room_1_left/light","payload":"{\\"roomId\\":\\"room_1_left\\",\\"isOn\\":true,\\"timestamp\\":' + Date.now() + '}"}');
```

## 🔧 Error Handling

### Connection Errors

```typescript
ws.onerror = (error) => {
  console.error('WebSocket Error:', error);
};

ws.onclose = (event) => {
  console.log('Connection closed:', event.code, event.reason);
  
  // Auto-Reconnect
  setTimeout(() => {
    connect();
  }, 2000);
};
```

### Message Validation

```typescript
function validateLightState(data: any): data is LightState {
  return (
    typeof data.roomId === 'string' &&
    typeof data.isOn === 'boolean' &&
    typeof data.timestamp === 'number'
  );
}

ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    
    if (message.type === 'message') {
      const payload = JSON.parse(message.payload);
      
      if (validateLightState(payload)) {
        handleLightUpdate(payload);
      } else {
        console.error('Invalid light state:', payload);
      }
    }
  } catch (error) {
    console.error('Parse error:', error);
  }
};
```

## 🚀 Rate Limiting & Best Practices

### Connection Management

- **Reconnection**: Implementieren Sie exponential backoff
- **Heartbeat**: Senden Sie regelmäßige ping/pong Messages
- **Clean Disconnect**: Schließen Sie Verbindungen ordnungsgemäß

### Message Optimization

- **Batching**: Sammeln Sie mehrere Updates vor dem Senden
- **Debouncing**: Vermeiden Sie zu häufige Updates
- **Compression**: Nutzen Sie kompakte JSON-Formate

### Security

- **Input Validation**: Validieren Sie alle eingehenden Daten
- **Authentication**: Implementieren Sie bei Bedarf Token-basierte Auth
- **Rate Limiting**: Begrenzen Sie Nachrichten pro Client

---

📡 **Smart Home Control API** - WebSocket MQTT Integration für Echtzeit-Kommunikation
