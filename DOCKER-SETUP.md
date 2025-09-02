# 🐳 Docker Setup für Smart Home Control

## 📋 Überblick

Das Smart Home Control System ist vollständig containerisiert und läuft über **einen einzigen Port (3000)**:

- **🌐 Next.js Web-Anwendung** (HTTP/HTTPS auf Port 3000)
- **🔌 WebSocket MQTT Proxy** (WS/WSS auf ws://localhost:3000/mqtt)
- **📡 Mosquitto MQTT Broker** (intern auf Port 1883, nicht exponiert)

### 🏗️ Container-Architektur

```
🌍 Internet → Port 3000 → 🐳 Docker Container
                         ├── 📱 Next.js App (HTTP)
                         ├── 🔌 WebSocket Proxy (WS)
                         └── 📡 MQTT Broker (intern)
```

## 🚀 Schnellstart

### Option 1: GitHub Container Registry (Empfohlen für Production)

```bash
# 🎯 Sofort starten mit vorgefertigtem Image
docker run -d \
  --name smart-home \
  -p 3000:3000 \
  --restart unless-stopped \
  ghcr.io/deltatree/milan:latest

# 📦 Mit Docker Compose (Production)
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Lokaler Build (Entwicklung)

```bash
# 🔨 Mit Docker Compose (Build)
docker-compose up -d --build

# 🛠️ Mit Docker direkt
docker build -t smart-home-control .
docker run -d \
  --name smart-home \
  -p 3000:3000 \
  --restart unless-stopped \
  smart-home-control
```

## 📦 Verfügbare Images

### GitHub Container Registry

| Image Tag | Beschreibung | Verwendung |
|-----------|-------------|------------|
| `ghcr.io/deltatree/milan:latest` | Neueste Entwicklungsversion | Development/Testing |
| `ghcr.io/deltatree/milan:v1.0.0` | Spezifische Release-Version | Production |
| `ghcr.io/deltatree/milan:main` | Main Branch Build | Staging |

**🚀 Multi-Platform Support:**
- `linux/amd64` (Intel/AMD x86_64)
- `linux/arm64` (ARM64, Apple Silicon, AWS Graviton)

### Image Größen
- **Komprimiert**: ~150 MB
- **Entpackt**: ~400 MB
- **Multi-Stage Build** für optimale Größe

## 🎯 Zugriff

- **🌐 Web-Interface**: http://localhost:3000
- **🔌 WebSocket MQTT**: ws://localhost:3000/mqtt (automatisch verwendet)
- **📊 Gesundheitsprüfung**: http://localhost:3000 (Health Check)

## ⚙️ Container-Inhalt

Der Container führt folgende Services aus:

1. **📡 Mosquitto MQTT Broker** 
   - Läuft intern auf `127.0.0.1:1883`
   - Konfiguration in `/etc/mosquitto/mosquitto.conf`
   - Persistente Daten in `/var/lib/mosquitto`

2. **🌐 Node.js Server**
   - Next.js App + WebSocket-Proxy auf Port 3000
   - Supervisor-basiertes Process Management
   - Automatische Service-Überwachung

## 🔧 Umgebungsvariablen

| Variable | Standard | Beschreibung |
|----------|----------|-------------|
| `NODE_ENV` | `production` | Node.js Umgebung |
| `NEXT_PUBLIC_MQTT_BROKER_URL` | `ws://localhost:3000/mqtt` | Frontend MQTT URL |
| `MQTT_BROKER_HOST` | `127.0.0.1` | Server MQTT Host |
| `MQTT_BROKER_PORT` | `1883` | Server MQTT Port |

### Custom Environment

```bash
# Mit eigenen Umgebungsvariablen
docker run -d \
  --name smart-home \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_MQTT_BROKER_URL=ws://localhost:3000/mqtt \
  ghcr.io/deltatree/milan:latest
```

## 🏃‍♂️ Container-Management

### Starten und Stoppen

```bash
# 🚀 Container starten
docker start smart-home

# ⏹️ Container stoppen
docker stop smart-home

# 🔄 Container neu starten
docker restart smart-home

# 🗑️ Container entfernen
docker stop smart-home && docker rm smart-home
```

### Mit Docker Compose

```bash
# 🔧 Development (lokaler Build)
docker-compose up -d --build
docker-compose logs -f
docker-compose down

# 🌟 Production (GHCR Image)
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml down
```

## 🔍 Troubleshooting

### Häufige Probleme

**❌ Container startet nicht:**
```bash
# Logs prüfen
docker logs smart-home

# Container-Status prüfen
docker ps -a

# Ports prüfen
lsof -i :3000
```

**❌ "Status: Getrennt" in der Web-App:**
```bash
# Container-Services prüfen
docker exec smart-home ps aux

# MQTT-Broker testen
docker exec smart-home mosquitto_pub -h 127.0.0.1 -t "test" -m "hello"

# WebSocket-Verbindung testen
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3000/mqtt
```

**❌ Container läuft, aber App nicht erreichbar:**
```bash
# Port-Binding prüfen
docker port smart-home

# Health Check manuell ausführen
docker exec smart-home wget --quiet --tries=1 --spider http://localhost:3000

# Firewall prüfen (Linux/macOS)
sudo ufw status  # Ubuntu
pfctl -sr | grep 3000  # macOS
```

### Debug-Modus

```bash
# Container mit Debug-Ausgabe starten
docker run -d \
  --name smart-home-debug \
  -p 3000:3000 \
  -e ACTIONS_STEP_DEBUG=true \
  ghcr.io/deltatree/milan:latest

# Erweiterte Logs anzeigen
docker logs --details smart-home-debug
```

### Container-Shell

```bash
# In laufenden Container verbinden
docker exec -it smart-home sh

# Neue Shell-Session starten
docker run -it --rm ghcr.io/deltatree/milan:latest sh
```

### MQTT-Test im Container

```bash
# MQTT Publish Test
docker exec smart-home mosquitto_pub -h 127.0.0.1 -t "smarthome/room_1_left/light" -m '{"roomId":"room_1_left","isOn":true,"timestamp":1693747200000}'

# MQTT Subscribe Test
docker exec smart-home mosquitto_sub -h 127.0.0.1 -t "smarthome/+/light" -v

# MQTT Broker Status
docker exec smart-home netstat -tlnp | grep 1883
```

## 🛡️ Sicherheit

### Production Best Practices

```bash
# 🔒 Non-root User (bereits implementiert)
# Container läuft als mosquitto User

# 🔧 Resource Limits
docker run -d \
  --name smart-home \
  -p 3000:3000 \
  --memory=512m \
  --cpus=1 \
  --restart unless-stopped \
  ghcr.io/deltatree/milan:latest

# 🌐 Reverse Proxy (Nginx/Traefik)
# SSL/TLS Terminierung
# Rate Limiting
```

### Docker Compose mit Limits

```yaml
services:
  smart-home:
    image: ghcr.io/deltatree/milan:latest
    ports:
      - "3000:3000"
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1'
        reservations:
          memory: 256M
          cpus: '0.5'
    restart: unless-stopped
```

## ⚡ Performance-Optimierung

### Build-Optimierungen

- **Multi-Stage Dockerfile** für kleinere Images
- **Layer Caching** für schnellere Builds
- **Alpine Linux** als Base Image
- **.dockerignore** für optimierte Builds

### Container-Optimierungen

```bash
# 📊 Resource-Monitoring
docker stats smart-home

# 🗃️ Volumes für persistente Daten
docker run -d \
  --name smart-home \
  -p 3000:3000 \
  -v mqtt-data:/var/lib/mosquitto \
  -v mqtt-logs:/var/log/mosquitto \
  ghcr.io/deltatree/milan:latest
```

## 🔄 Updates & Maintenance

### Container Updates

```bash
# 📥 Neuestes Image ziehen
docker pull ghcr.io/deltatree/milan:latest

# 🔄 Container mit neuem Image ersetzen
docker stop smart-home
docker rm smart-home
docker run -d \
  --name smart-home \
  -p 3000:3000 \
  --restart unless-stopped \
  ghcr.io/deltatree/milan:latest

# ✅ Mit Docker Compose
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Daten-Backup

```bash
# 💾 MQTT Daten sichern
docker cp smart-home:/var/lib/mosquitto ./backup/

# 📝 Logs sichern  
docker cp smart-home:/var/log/mosquitto ./backup/logs/

# 🔄 Automatisches Backup
docker run --rm -v mqtt-data:/source -v $(pwd)/backup:/backup alpine \
  tar czf /backup/mqtt-backup-$(date +%Y%m%d).tar.gz -C /source .
```

---

🏠 **Smart Home Control System Docker Setup** - Containerisiert für einfaches Deployment
