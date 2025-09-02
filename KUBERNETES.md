# 🚀 Kubernetes Deployment Guide

## 📋 Übersicht

Diese Anleitung zeigt, wie das IoT-Haus Control System in Kubernetes mit Ingress deployed wird. Die Anwendung unterstützt automatische URL-Erkennung für WebSocket-Verbindungen.

## 🐳 Kubernetes Manifests

### 1. Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: iot-haus
  labels:
    app: iot-haus
spec:
  replicas: 2
  selector:
    matchLabels:
      app: iot-haus
  template:
    metadata:
      labels:
        app: iot-haus
    spec:
      containers:
      - name: iot-haus
        image: ghcr.io/deltatree-de/iot-haus:latest
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXT_PUBLIC_MQTT_BROKER_URL
          value: "auto"  # Automatische URL-Erkennung
        - name: MQTT_BROKER_HOST
          value: "127.0.0.1"
        - name: MQTT_BROKER_PORT
          value: "1883"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: iot-haus-service
spec:
  selector:
    app: iot-haus
  ports:
  - name: http
    port: 80
    targetPort: 3000
    protocol: TCP
  type: ClusterIP
```

### 2. Ingress (NGINX)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: iot-haus-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/websocket-services: "iot-haus-service"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    # SSL/TLS für WSS
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - iot-haus.your-domain.com
    secretName: iot-haus-tls
  rules:
  - host: iot-haus.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: iot-haus-service
            port:
              number: 80
```

### 3. Traefik Ingress (Alternative)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: iot-haus-traefik
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
    traefik.ingress.kubernetes.io/router.tls.certresolver: letsencrypt
    # WebSocket Unterstützung
    traefik.ingress.kubernetes.io/service.sticky.cookie: "true"
spec:
  rules:
  - host: iot-haus.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: iot-haus-service
            port:
              number: 80
  tls:
  - hosts:
    - iot-haus.your-domain.com
    secretName: iot-haus-tls
```

## 🔧 Deployment Commands

```bash
# Namespace erstellen
kubectl create namespace iot-haus

# Manifests anwenden
kubectl apply -f k8s/ -n iot-haus

# Status prüfen
kubectl get pods -n iot-haus
kubectl get svc -n iot-haus
kubectl get ingress -n iot-haus

# Logs anzeigen
kubectl logs -f deployment/iot-haus -n iot-haus
```

## 🌐 URL-Automatik

### Funktionsweise

Die Anwendung erkennt automatisch die korrekte WebSocket-URL:

```javascript
// Beispiel: https://iot-haus.your-domain.com
// WebSocket URL wird automatisch: wss://iot-haus.your-domain.com/mqtt

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.host;
const mqttUrl = `${protocol}//${host}/mqtt`;
```

### Unterstützte Szenarien

| Szenario | Browser URL | WebSocket URL |
|----------|-------------|---------------|
| **Localhost** | `http://localhost:3000` | `ws://localhost:3000/mqtt` |
| **HTTPS Domain** | `https://iot-haus.example.com` | `wss://iot-haus.example.com/mqtt` |
| **HTTP Domain** | `http://iot-haus.local` | `ws://iot-haus.local/mqtt` |
| **Port Mapping** | `https://example.com:8080` | `wss://example.com:8080/mqtt` |

## 🔐 Security Considerations

### 1. TLS/SSL Termination

```yaml
# Ingress-Annotation für NGINX
nginx.ingress.kubernetes.io/ssl-redirect: "true"

# Oder für Traefik
traefik.ingress.kubernetes.io/router.tls: "true"
```

### 2. Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: iot-haus-netpol
spec:
  podSelector:
    matchLabels:
      app: iot-haus
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from: []  # Allow all ingress
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - {}  # Allow all egress
```

## 📊 Monitoring & Observability

### Health Checks

```bash
# Health Check Endpoint
curl https://iot-haus.your-domain.com/api/health

# Response:
{
  "status": "healthy",
  "timestamp": "2025-09-02T10:30:00.000Z",
  "service": "iot-haus",
  "version": "1.0.0"
}
```

### Prometheus Metrics (Optional)

```yaml
# ServiceMonitor für Prometheus
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: iot-haus-metrics
spec:
  selector:
    matchLabels:
      app: iot-haus
  endpoints:
  - port: http
    path: /api/health
    interval: 30s
```

## 🚀 Scaling

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: iot-haus-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: iot-haus
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 🔧 Troubleshooting

### WebSocket Verbindungsprobleme

```bash
# Ingress Controller Logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Pod Logs
kubectl logs -f deployment/iot-haus -n iot-haus

# WebSocket Test
wscat -c wss://iot-haus.your-domain.com/mqtt
```

### Häufige Probleme

1. **WebSocket Timeout**: Proxy-Timeouts in Ingress erhöhen
2. **SSL-Fehler**: Cert-Manager und TLS-Konfiguration prüfen
3. **CORS-Probleme**: Origin-Headers in Ingress konfigurieren

## 📚 Weitere Ressourcen

- [Kubernetes Ingress Documentation](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [NGINX Ingress WebSocket Support](https://kubernetes.github.io/ingress-nginx/user-guide/miscellaneous/#websockets)
- [Traefik Kubernetes Guide](https://doc.traefik.io/traefik/providers/kubernetes-ingress/)

---

🏠 **IoT-Haus Control System** - Kubernetes-ready mit automatischer URL-Erkennung
