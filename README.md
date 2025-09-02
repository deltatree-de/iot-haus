# 🏠 Smart Home Control System

![Docker Build](https://github.com/deltatree-de/iot-haus/actions/workflows/docker-publish.yml/badge.svg)
![Release](https://github.com/deltatree-de/iot-haus/actions/workflows/release.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

Eine moderne Single Page Application (SPA) zur Steuerung der Beleuchtung in einem 2-stöckigen Haus mit MQTT-Integration für Echtzeit-Synchronisation.

## ✨ Features

- **🏠 Hausvisualisierung**: Interaktive SVG-Darstellung eines 2-stöckigen Hauses mit jeweils 2 Zimmern pro Stockwerk
- **💡 Echtzeit-Lichtsteuerung**: Steuerung der Beleuchtung über MQTT-Broker mit WebSocket-Proxy
- **👥 Multi-User-Unterstützung**: Gleichzeitige Nutzung von mehreren Benutzern mit automatischer Synchronisation
- **📱 Responsive Design**: Optimiert für Desktop und Mobile
- **🔗 Live-Status**: Echtzeit-Anzeige des Verbindungsstatus und Lichtzustände
- **🐳 Docker-Ready**: Vollständig containerisiert mit integriertem MQTT-Broker
- **🚀 CI/CD**: Automatische Builds und Releases über GitHub Actions

## 🛠️ Technologie-Stack

- **Frontend**: Next.js 15 mit TypeScript
- **Styling**: Tailwind CSS  
- **Echtzeit-Kommunikation**: MQTT.js mit WebSocket-Proxy
- **State Management**: React Hooks
- **MQTT Broker**: Mosquitto (containerisiert)
- **Deployment**: Docker + GitHub Container Registry
- **CI/CD**: GitHub Actions

## 🗂️ Projekt-Struktur

```
src/
├── app/
│   ├── layout.tsx            # App-Layout
│   └── page.tsx              # Hauptseite der Anwendung
├── components/
│   ├── HouseVisualization.tsx # SVG-Hausdarstellung
│   ├── ControlPanel.tsx       # Lichtsteuerung Panel
│   └── RoomComponent.tsx      # Einzelne Zimmerkomponente
├── hooks/
│   ├── useMqtt.ts            # MQTT Client Hook
│   ├── useWebSocketMqtt.ts   # WebSocket MQTT Hook
│   └── useMockMqtt.ts        # Mock für Entwicklung
└── types/
    └── index.ts              # TypeScript Definitionen

docker/
├── mosquitto.conf            # MQTT Broker Konfiguration
├── supervisord.conf          # Process Manager Config
└── start.sh                  # Container Startup Script

.github/workflows/
├── docker-publish.yml        # Docker Build & Publish
└── release.yml               # Release Automation
```

## Installation und Setup

## 🚀 Schnellstart

### Option 1: GitHub Container Registry (Empfohlen für Production)

```bash
# Sofort starten mit vorgefertigtem Image
docker run -d \
  --name smart-home \
  -p 3000:3000 \
  --restart unless-stopped \
  ghcr.io/deltatree-de/iot-haus:latest

# Mit Docker Compose (Production)
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Lokaler Build (Entwicklung)

```bash
# Mit Docker Compose (lokaler Build)
docker-compose up -d --build

# Oder mit npm scripts:
npm run compose:up
```

### Option 3: Entwicklungsserver

```bash
# Dependencies installieren
npm install

# MQTT Broker starten (falls lokal)
brew install mosquitto
brew services start mosquitto

# Entwicklungsserver starten
npm run dev
```

**🌐 Anwendung öffnen:**
- **Web-Interface**: [http://localhost:3000](http://localhost:3000)
- **WebSocket MQTT**: ws://localhost:3000/mqtt (automatisch)

## 📦 Verfügbare Docker Images

### GitHub Container Registry (GHCR)

```bash
# Latest Development Build
docker pull ghcr.io/deltatree-de/iot-haus:latest

# Spezifische Release Version
docker pull ghcr.io/deltatree-de/iot-haus:v1.0.0

# Branch Builds
docker pull ghcr.io/deltatree-de/iot-haus:main
```

**Multi-Platform Support:**
- `linux/amd64` (Intel/AMD x86_64)
- `linux/arm64` (ARM64, Apple Silicon, AWS Graviton)

## 🏗️ Architektur

### Container-Architektur
```
Port 3000 → Docker Container
           ├── Next.js App (HTTP/HTTPS)
           ├── WebSocket MQTT Proxy (WS/WSS)
           └── Mosquitto MQTT Broker (intern)
```

### MQTT Topics
```
smarthome/room_1_left/light   # Wohnzimmer
smarthome/room_1_right/light  # Küche  
smarthome/room_2_left/light   # Schlafzimmer
smarthome/room_2_right/light  # Badezimmer
```

### Message Format
```json
{
  "roomId": "room_1_left",
  "isOn": true,
  "timestamp": 1693747200000
}
```

## 🔧 Entwicklung

### Lokale Entwicklung

1. **Repository klonen:**
   ```bash
   git clone https://github.com/deltatree-de/iot-haus.git
   cd iot-haus
   ```

2. **Dependencies installieren:**
   ```bash
   npm install
   ```

3. **MQTT Broker starten:**
   ```bash
   # macOS mit Homebrew
   brew install mosquitto
   brew services start mosquitto
   
   # Linux (Ubuntu/Debian)
   sudo apt install mosquitto mosquitto-clients
   sudo systemctl start mosquitto
   
   # Windows
   # Download von https://mosquitto.org/download/
   ```

4. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

### Environment Variables

Erstellen Sie eine `.env.local` Datei:
```bash
# MQTT Broker URL (optional, default: ws://localhost:3000/mqtt)
NEXT_PUBLIC_MQTT_BROKER_URL=ws://localhost:3000/mqtt

# Server-seitige MQTT Verbindung (für Docker)
MQTT_BROKER_HOST=127.0.0.1
MQTT_BROKER_PORT=1883
```

### Verfügbare Scripts

```bash
npm run dev          # Entwicklungsserver
npm run build        # Production Build
npm run start        # Production Server
npm run lint         # ESLint

# Docker Scripts
npm run compose:up   # Docker Compose starten
npm run compose:down # Docker Compose stoppen
npm run compose:logs # Logs anzeigen
```

## 🤖 CI/CD & GitHub Actions

### Automatische Builds

Das Projekt nutzt GitHub Actions für automatische Builds und Deployments:

- **🔄 Bei jedem Push auf `main`**: Automatischer Build und Push zu GHCR
- **🔍 Bei Pull Requests**: Build-Test ohne Publishing
- **🏷️ Bei Tags (`v*`)**: Release-Build mit Versionierung

### Docker Images

**GitHub Container Registry:**
```bash
# Latest Version
docker pull ghcr.io/deltatree-de/iot-haus:latest

# Spezifische Version  
docker pull ghcr.io/deltatree-de/iot-haus:v1.0.0
```

**Automatische Releases:**
```bash
# Release erstellen
git tag v1.0.0
git push origin v1.0.0
# → GitHub Action erstellt automatisch Release und Docker Image
```

### Workflow Status

![Docker Build](https://github.com/deltatree-de/iot-haus/actions/workflows/docker-publish.yml/badge.svg)
![Release](https://github.com/deltatree-de/iot-haus/actions/workflows/release.yml/badge.svg)

## 📝 API & Integration

### MQTT Topics

| Topic | Beschreibung | Message Format |
|-------|-------------|----------------|
| `smarthome/room_1_left/light` | Wohnzimmer | `{"roomId": "room_1_left", "isOn": boolean, "timestamp": number}` |
| `smarthome/room_1_right/light` | Küche | `{"roomId": "room_1_right", "isOn": boolean, "timestamp": number}` |
| `smarthome/room_2_left/light` | Schlafzimmer | `{"roomId": "room_2_left", "isOn": boolean, "timestamp": number}` |
| `smarthome/room_2_right/light` | Badezimmer | `{"roomId": "room_2_right", "isOn": boolean, "timestamp": number}` |

### WebSocket API

**Verbindung:** `ws://localhost:3000/mqtt`

**Nachrichtentypen:**
```javascript
// Subscribe zu einem Topic
{
  "type": "subscribe",
  "topic": "smarthome/room_1_left/light"
}

// Publish eine Nachricht
{
  "type": "publish", 
  "topic": "smarthome/room_1_left/light",
  "payload": "{\"roomId\":\"room_1_left\",\"isOn\":true,\"timestamp\":1693747200000}"
}

// Unsubscribe von einem Topic
{
  "type": "unsubscribe",
  "topic": "smarthome/room_1_left/light"
}
```

## 🔧 Konfiguration & Anpassung

### Hausstruktur erweitern

Um weitere Stockwerke oder Zimmer hinzuzufügen:

1. **Erweitern Sie die Hausstruktur** in `src/app/page.tsx`:
   ```typescript
   const initialHouse: House = {
     floors: [
       {
         number: 1,
         rooms: [
           { id: 'room_1_left', name: 'Wohnzimmer', floor: 1, position: 'left', lightOn: false },
           { id: 'room_1_middle', name: 'Esszimmer', floor: 1, position: 'middle', lightOn: false }, // Neu
           { id: 'room_1_right', name: 'Küche', floor: 1, position: 'right', lightOn: false },
         ],
       },
       // Weitere Stockwerke...
     ],
   };
   ```

2. **Fügen Sie entsprechende MQTT-Topics hinzu**:
   ```typescript
   const MQTT_TOPICS = [
     'smarthome/room_1_left/light',
     'smarthome/room_1_middle/light', // Neu
     'smarthome/room_1_right/light',
     // Weitere Topics...
   ];
   ```

3. **Passen Sie die SVG-Koordinaten** in `HouseVisualization.tsx` an

### MQTT-Broker konfigurieren

**Externes MQTT-Broker verwenden:**
```bash
# Environment Variable setzen
export NEXT_PUBLIC_MQTT_BROKER_URL="ws://ihr-broker:3000/mqtt"

# Oder in .env.local
NEXT_PUBLIC_MQTT_BROKER_URL=ws://ihr-broker:3000/mqtt
MQTT_BROKER_HOST=ihr-broker-ip
MQTT_BROKER_PORT=1883
```

### Docker-Konfiguration anpassen

**Custom Mosquitto Config:**
Bearbeiten Sie `docker/mosquitto.conf` für erweiterte MQTT-Einstellungen:
```ini
# Authentifizierung aktivieren
allow_anonymous false
password_file /etc/mosquitto/passwd

# Logging erweitern
log_type all

# Connections limits
max_connections 1000
```

## 📋 Deployment

### Production Deployment

1. **Mit Docker Compose (Empfohlen):**
   ```bash
   # Mit GHCR Image
   docker-compose -f docker-compose.prod.yml up -d
   
   # Mit lokalem Build
   docker-compose up -d --build
   ```

2. **Mit Docker direkt:**
   ```bash
   docker run -d \
     --name smart-home \
     -p 3000:3000 \
     --restart unless-stopped \
     -e NODE_ENV=production \
     ghcr.io/deltatree-de/iot-haus:latest
   ```

3. **Cloud Deployment (Vercel/Netlify):**
   - Repository verknüpfen
   - Environment Variables setzen
   - Externen MQTT-Broker konfigurieren

### Monitoring & Logs

```bash
# Container Logs
docker logs -f smart-home-control

# Docker Compose Logs
docker-compose logs -f

# Gesundheitsprüfung
curl http://localhost:3000/api/health
```

## 🐛 Troubleshooting

### Häufige Probleme

**"Status: Getrennt" angezeigt:**
1. Prüfen Sie, ob der MQTT-Broker läuft
2. Überprüfen Sie die WebSocket-URL
3. Browser-Konsole auf Fehler prüfen

**Docker Container startet nicht:**
```bash
# Logs prüfen
docker logs smart-home-control

# Container-Status prüfen  
docker ps -a

# Neu starten
docker-compose down && docker-compose up -d
```

**WebSocket-Verbindung schlägt fehl:**
1. Firewall-Einstellungen prüfen
2. Port 3000 verfügbar?
3. Browser unterstützt WebSockets?

### Debug-Modus

```bash
# Entwicklungsserver mit Debug-Logs
DEBUG=* npm run dev

# Container mit erweiterten Logs
docker run -e ACTIONS_STEP_DEBUG=true ghcr.io/deltatree-de/iot-haus:latest
```

### Topics
Die Anwendung verwendet folgende MQTT-Topics:
- `smarthome/room_1_left/light` - Wohnzimmer (1. Stock)
- `smarthome/room_1_right/light` - Küche (1. Stock)
- `smarthome/room_2_left/light` - Schlafzimmer (2. Stock)
- `smarthome/room_2_right/light` - Badezimmer (2. Stock)

### Message Format
```json
{
  "roomId": "room_1_left",
  "isOn": true,
  "timestamp": 1641024000000
}
```

### Broker-Optionen

#### Öffentliche Test-Broker
- **EMQ X**: `ws://broker.emqx.io:8083/mqtt`
- **Mosquitto**: `ws://test.mosquitto.org:8080/mqtt`
- **HiveMQ**: `wss://broker.hivemq.com:8884/mqtt`

#### Lokaler Broker (Mosquitto)
```bash
# Installation (macOS)
brew install mosquitto

# Mit WebSocket-Support starten
## 📚 Dokumentation

- **[Docker Setup](DOCKER-SETUP.md)** - Detaillierte Docker-Anweisungen
- **[GitHub Actions](GITHUB-ACTIONS.md)** - CI/CD und Automatisierung
- **[API Dokumentation](API.md)** - WebSocket und MQTT API Details

## 🤝 Contributing

1. **Fork** das Repository
2. **Branch** erstellen: `git checkout -b feature/neue-funktion`
3. **Änderungen** committen: `git commit -m 'Neue Funktion hinzugefügt'`
4. **Push** zum Branch: `git push origin feature/neue-funktion`
5. **Pull Request** erstellen

### Development Guidelines

- TypeScript für Type Safety verwenden
- ESLint Rules befolgen
- Responsive Design beachten
- MQTT Message Format einhalten
- Docker-Kompatibilität testen

## 📄 Lizenz

Dieses Projekt steht unter der MIT Lizenz. Siehe [LICENSE](LICENSE) für Details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/deltatree-de/iot-haus/issues)
- **Discussions**: [GitHub Discussions](https://github.com/deltatree-de/iot-haus/discussions)
- **Wiki**: [GitHub Wiki](https://github.com/deltatree-de/iot-haus/wiki)

## 📈 Roadmap

- [ ] **Authentifizierung**: User-basierte Zugriffskontrolle
- [ ] **Szenen**: Vordefinierte Lichtszenarien
- [ ] **Zeitpläne**: Automatische Lichtsteuerung
- [ ] **Sensoren**: Integration von Bewegungsmeldern
- [ ] **Mobile App**: Native iOS/Android App
- [ ] **Voice Control**: Alexa/Google Assistant Integration
- [ ] **Analytics**: Energie-Verbrauchsanalyse

---

**🏠 Smart Home Control System** - Entwickelt mit ❤️ und Next.js

Die Anwendung kann auf jeder Next.js-kompatiblen Plattform deployed werden:
- **Vercel**: Automatisches Deployment mit Git-Integration
- **Netlify**: JAMStack-optimiert
- **AWS ECS/Fargate**: Mit Docker Container
- **Google Cloud Run**: Serverless Container
- **Azure Container Instances**: Schnelles Container-Deployment

**Wichtig**: Stellen Sie sicher, dass die MQTT-Broker-URL in der Produktionsumgebung korrekt konfiguriert ist.

## CI/CD & GitHub Actions

### 🤖 Automatische Builds

Das Projekt nutzt GitHub Actions für automatische Builds und Deployments:

- **Bei jedem Push auf `main`**: Automatischer Build und Push zu GitHub Container Registry
- **Bei Pull Requests**: Build-Test ohne Publishing  
- **Bei Tags (`v*`)**: Release-Build mit Versionierung

### 📦 Docker Images

**GitHub Container Registry:**
```bash
# Latest Version
docker pull ghcr.io/deltatree-de/iot-haus:latest

# Spezifische Version
docker pull ghcr.io/deltatree-de/iot-haus:v1.0.0
```

**Automatische Releases:**
- Erstelle einen Git-Tag: `git tag v1.0.0 && git push origin v1.0.0`
- GitHub Action erstellt automatisch Release und Docker Image

### 🔧 Workflow Badges

![Docker Build](https://github.com/deltatree-de/iot-haus/actions/workflows/docker-publish.yml/badge.svg)
![Release](https://github.com/deltatree-de/iot-haus/actions/workflows/release.yml/badge.svg)

## Lizenz

MIT License
