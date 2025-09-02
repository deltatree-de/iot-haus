# 🤖 Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a **Smart Home Control Application** built with Next.js and TypeScript that manages light states in a 2-story house via MQTT with real-time WebSocket communication.

## 🏗️ Project Context

- **Application Type**: Single Page Application (SPA) for smart home control
- **Architecture**: Next.js with TypeScript, WebSocket MQTT Proxy, containerized MQTT broker
- **House Layout**: 2 floors, 2 rooms per floor (total 4 rooms)
- **Deployment**: Fully containerized with Docker, automated CI/CD via GitHub Actions
- **Distribution**: Multi-platform Docker images on GitHub Container Registry (GHCR)

## ✨ Key Features

- **🏠 Real-time House Visualization**: SVG-based interactive house representation
- **💡 Light Control**: Toggle switches with WebSocket-based state synchronization
- **🔌 WebSocket MQTT Proxy**: Integrated proxy server for browser-MQTT communication
- **📡 MQTT Integration**: Real-time bidirectional communication via containerized Mosquitto broker
- **👥 Multi-user Support**: Concurrent access with automatic state synchronization
- **📱 Responsive Design**: Optimized for desktop and mobile devices
- **🐳 Container-Ready**: Single-port deployment with integrated services

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Hooks** for state management

### Backend & Infrastructure
- **Node.js** custom server with WebSocket proxy
- **Mosquitto MQTT Broker** (containerized)
- **WebSocket** for real-time communication
- **Docker** multi-stage builds
- **Supervisor** for process management

### DevOps & CI/CD
- **GitHub Actions** for automated builds
- **GitHub Container Registry (GHCR)** for image distribution
- **Multi-platform builds** (linux/amd64, linux/arm64)
- **Automated releases** with semantic versioning

## 🏛️ Architecture Overview

```
🌍 Internet → Port 3000 → 🐳 Docker Container
                         ├── 📱 Next.js App (HTTP/HTTPS)
                         ├── 🔌 WebSocket Proxy (WS/WSS)
                         └── 📡 MQTT Broker (internal)
```

## 📁 Key Components

### Frontend Components
- **`HouseVisualization.tsx`**: SVG-based house representation with interactive rooms
- **`ControlPanel.tsx`**: Light control interface with connection status
- **`RoomComponent.tsx`**: Individual room components with click handlers

### Hooks & State Management
- **`useMqtt.ts`**: Main MQTT hook with environment-based switching
- **`useWebSocketMqtt.ts`**: WebSocket MQTT client implementation
- **`useMockMqtt.ts`**: Mock implementation for testing

### Server & Infrastructure
- **`server.js`**: Custom Node.js server with WebSocket MQTT proxy
- **`docker/`**: Container configuration (Mosquitto, Supervisor)
- **`.github/workflows/`**: CI/CD pipeline definitions

## 🔧 Development Guidelines

### Code Style & Standards
- **TypeScript**: Use strict typing, avoid `any` types
- **ESLint**: Follow configured rules for consistency
- **Component Structure**: Functional components with hooks
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

### MQTT Communication
- **Message Format**: Strict JSON schema with validation
- **Topic Convention**: `smarthome/{roomId}/light`
- **Error Handling**: Graceful fallbacks and retry mechanisms
- **Real-time Sync**: Ensure state consistency across clients

### Docker & Deployment
- **Single Port**: All services through port 3000
- **Multi-stage Builds**: Optimize image size and security
- **Environment Variables**: Use for configuration flexibility
- **Health Checks**: Implement service monitoring

### CI/CD Best Practices
- **Automated Testing**: Build validation on all PRs
- **Multi-platform**: Support AMD64 and ARM64 architectures
- **Semantic Versioning**: Use conventional commit messages
- **Container Security**: Regular dependency updates

## 📡 MQTT Integration Details

### Topic Structure
```typescript
interface LightState {
  roomId: string;      // "room_1_left", "room_1_right", etc.
  isOn: boolean;       // Light on/off state
  timestamp: number;   // Unix timestamp
}
```

### WebSocket Messages
```typescript
// Subscribe to topic
{ type: "subscribe", topic: "smarthome/room_1_left/light" }

// Publish state change
{ type: "publish", topic: "smarthome/room_1_left/light", payload: "..." }

// Receive state update
{ type: "message", topic: "...", payload: "...", timestamp: 123456 }
```

### Error Handling
- **Connection Recovery**: Auto-reconnect with exponential backoff
- **Message Validation**: Strict payload validation
- **Fallback States**: Graceful degradation when MQTT unavailable

## 🐳 Container Architecture

### Services
1. **Mosquitto MQTT Broker**: Internal on 127.0.0.1:1883
2. **Next.js Application**: Web server on port 3000
3. **WebSocket Proxy**: MQTT-WebSocket bridge on ws://localhost:3000/mqtt

### Environment Variables
- `NODE_ENV`: production/development
- `NEXT_PUBLIC_MQTT_BROKER_URL`: Frontend WebSocket URL
- `MQTT_BROKER_HOST`: Server-side MQTT host
- `MQTT_BROKER_PORT`: Server-side MQTT port

## 🎯 Development Focus Areas

### Performance Optimization
- **WebSocket Connection Pooling**: Efficient connection management
- **State Update Batching**: Reduce unnecessary re-renders
- **SVG Optimization**: Minimize DOM manipulation
- **Docker Layer Caching**: Optimize build times

### User Experience
- **Real-time Feedback**: Immediate visual state updates
- **Connection Status**: Clear indication of system health
- **Error Messages**: User-friendly error communication
- **Accessibility**: ARIA labels and keyboard navigation

### Scalability Considerations
- **Room Configuration**: Easy addition of new rooms/floors
- **MQTT Topic Scaling**: Structured topic hierarchy
- **Container Resources**: Efficient resource utilization
- **Multi-instance Support**: Horizontal scaling capabilities

## 🔒 Security Guidelines

### Container Security
- **Non-root User**: Run services as non-privileged user
- **Minimal Base Images**: Use Alpine Linux for smaller attack surface
- **Dependency Scanning**: Regular vulnerability assessments
- **Resource Limits**: Prevent resource exhaustion

### Application Security
- **Input Validation**: Sanitize all user inputs
- **MQTT Authentication**: Consider auth for production deployments
- **Rate Limiting**: Prevent message flooding
- **CORS Configuration**: Proper cross-origin handling

## 📊 Monitoring & Debugging

### Logging Strategy
- **Structured Logging**: JSON format for better parsing
- **Log Levels**: Appropriate use of info, warn, error
- **Container Logs**: Accessible via Docker/Docker Compose
- **WebSocket Events**: Debug connection issues

### Health Checks
- **HTTP Endpoint**: Basic health check on port 3000
- **MQTT Connectivity**: Internal broker connection status
- **WebSocket Status**: Connection health monitoring
- **Resource Usage**: Memory and CPU utilization

---

🏠 **Smart Home Control System** - Built with Next.js, TypeScript, MQTT, and Docker for modern smart home automation
