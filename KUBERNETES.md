# IoT-Haus 2.1 – Kubernetes

Das Repository enthält keine fertigen Manifeste. Die folgenden Beispiele sind eine vollständige, minimale Vorlage:
Namespace, PersistentVolumeClaim, Deployment, Service und Ingress. Namen, StorageClass und Hostname an den Cluster anpassen.

## Warum genau eine Replik

IoT-Haus läuft als **ein** Pod mit **einer** Replik, und das bleibt so:

- Der Zustand (29 Geräte, Elektroauto, Sonnenlage, Tagesenergie, Auto-Aus- und Akku-voll-Timer) liegt autoritativ im Speicher des Node-Servers und wird im
  **eingebetteten Mosquitto desselben Containers** gespeichert (Volume `/var/lib/mosquitto`).
- Zwei Repliken hätten zwei unabhängige Server mit je eigenem Broker. Browser, die der Service auf verschiedene Pods verteilt,
  würden unterschiedliche Häuser sehen, Änderungen erreichten nur einen Teil der Clients, und zwei Pods würden um dasselbe Volume
  konkurrieren.
- Deshalb: `replicas: 1`, Update-Strategie `Recreate` (der alte Pod gibt Volume und Zustand frei, bevor der neue startet) und ein
  `ReadWriteOnce`-Volume. Kein HorizontalPodAutoscaler.

Bei einem Update ist die App für einige Sekunden nicht erreichbar. Browser zeigen dann „Getrennt“ und verbinden sich selbst neu.

## Manifeste

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: iot-haus
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mosquitto-data
  namespace: iot-haus
spec:
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 100Mi
  # storageClassName: <klasse>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: iot-haus
  namespace: iot-haus
  labels:
    app: iot-haus
spec:
  replicas: 1                 # nie erhöhen, siehe oben
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: iot-haus
  template:
    metadata:
      labels:
        app: iot-haus
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000         # Volume für UID 1000 beschreibbar
      containers:
        - name: iot-haus
          image: ghcr.io/deltatree-de/iot-haus:2.1.0   # oder :latest mit imagePullPolicy: Always
          ports:
            - name: http
              containerPort: 3000
          env:
            - name: STROMPREIS_EUR_PRO_KWH
              value: "0.35"
            - name: EINSPEISEVERGUETUNG_EUR_PRO_KWH   # seit 2.1, Standard 0.08
              value: "0.08"
            - name: ERLAUBTE_HOSTS          # Schutz gegen DNS-Rebinding, Hostnamen ohne Port
              value: "haus.example.de"
          volumeMounts:
            - name: mosquitto-data
              mountPath: /var/lib/mosquitto
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop: ["ALL"]
          resources:
            requests:
              cpu: 50m
              memory: 128Mi
            limits:
              memory: 512Mi
          startupProbe:
            httpGet:
              path: /api/health
              port: http
            periodSeconds: 5
            failureThreshold: 12        # bis zu 60 s für den Start
          readinessProbe:
            httpGet:
              path: /api/health
              port: http
            periodSeconds: 10
            failureThreshold: 1
          livenessProbe:
            httpGet:
              path: /api/health
              port: http
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 6         # 60 s Toleranz, siehe „Probes“
      terminationGracePeriodSeconds: 20
      volumes:
        - name: mosquitto-data
          persistentVolumeClaim:
            claimName: mosquitto-data
---
apiVersion: v1
kind: Service
metadata:
  name: iot-haus
  namespace: iot-haus
spec:
  selector:
    app: iot-haus
  ports:
    - name: http
      port: 80
      targetPort: http
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: iot-haus
  namespace: iot-haus
  annotations:
    # ingress-nginx: WebSocket-Verbindungen lange offen halten
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    # Anmeldung vor der App (siehe unten), z. B. Basic Auth:
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: iot-haus-basic-auth
    nginx.ingress.kubernetes.io/auth-realm: "IoT-Haus"
spec:
  ingressClassName: nginx
  tls:
    - hosts: ["haus.example.de"]
      secretName: iot-haus-tls
  rules:
    - host: haus.example.de
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: iot-haus
                port:
                  name: http
```

Anwenden:

```bash
kubectl apply -f iot-haus.yaml
kubectl -n iot-haus rollout status deploy/iot-haus
kubectl -n iot-haus logs deploy/iot-haus -f
```

## Probes

Alle Probes nutzen `GET /api/health`. Der Endpunkt antwortet `200`, wenn der eingebettete Broker verbunden und der Zustand geladen ist,
sonst `503` (auch in den ersten Sekunden nach dem Start und **solange Mosquitto nicht erreichbar ist**).

- **startupProbe** gibt dem Pod bis zu 60 s zum Starten.
- **readinessProbe** nimmt den Pod bei `503` sofort aus dem Service. Das passt zum Verhalten des Servers, der bei Broker-Ausfall ohnehin
  alle WebSockets schließt und neue ablehnt.
- **livenessProbe** ist bewusst tolerant (6 × 10 s). supervisord startet einen abgestürzten Mosquitto selbst neu; erst wenn der Broker
  länger als etwa eine Minute fehlt, startet Kubernetes den Pod neu.

Das Image hat zusätzlich einen Docker-`HEALTHCHECK` (per `node` gegen `127.0.0.1:$PORT/api/health`, ohne curl). Kubernetes wertet ihn
nicht aus; maßgeblich sind die Probes. Probes kommen über die Pod-IP und nicht über den WebSocket, `ERLAUBTE_HOSTS` betrifft sie nicht.

## Sicherheit

- Das Image läuft als UID/GID 1000 ohne Paketmanager und ohne curl/wget. `runAsNonRoot: true` funktioniert, weil das Image eine
  numerische Benutzerkennung setzt.
- Beschreibbar sein müssen `/var/lib/mosquitto` (Volume), `/var/log/supervisor`, `/run/supervisor` und `/app/.next/cache`.
  Ein `readOnlyRootFilesystem` ist deshalb nicht ohne zusätzliche `emptyDir`-Volumes möglich und wird hier nicht verwendet.
- IoT-Haus hat keine eigene Anmeldung. Wer den Ingress aus dem Internet erreichbar macht, braucht TLS und eine Anmeldung am Ingress
  (Basic Auth wie oben oder Forward-Auth mit oauth2-proxy/Authelia). Sie muss auch für den WebSocket `/mqtt` gelten.
  Basic-Auth-Secret anlegen:

  ```bash
  htpasswd -c auth familie
  kubectl -n iot-haus create secret generic iot-haus-basic-auth --from-file=auth
  ```

- ingress-nginx reicht den `Host`-Header durch und setzt `X-Forwarded-Host`; damit besteht der WebSocket die Origin-Prüfung.
  Andere Ingress-Controller müssen eines von beiden ebenfalls liefern, sonst antwortet der Server mit 403.
- `ERLAUBTE_HOSTS` (im Beispiel `haus.example.de`) lässt WebSocket-Verbindungen nur zu, wenn `Host` und – falls gesetzt –
  `X-Forwarded-Host` in der Liste stehen (Schutz gegen DNS-Rebinding). Wird der Pod zusätzlich über einen anderen Namen
  erreicht (z. B. `kubectl port-forward` → `localhost`), diesen Namen ergänzen: `haus.example.de,localhost`. Reicht ein Ingress-Controller `Host` nicht durch, sondern nur `X-Forwarded-Host`, muss auch der interne Service-Name (z. B. `iot-haus`) in der Liste stehen.
- Je Pod gelten die Server-Limits: höchstens 100 gleichzeitige WebSocket-Verbindungen, 20 Befehle pro Sekunde je Verbindung
  (Vorrat 100); Details in [API.md](API.md#22-rahmenbedingungen).

## Update und Rückkehr zu einer Version

```bash
kubectl -n iot-haus set image deploy/iot-haus iot-haus=ghcr.io/deltatree-de/iot-haus:2.1.0
kubectl -n iot-haus rollout status deploy/iot-haus
```

Das Update von 2.0.x auf 2.1.0 braucht keinen manuellen Schritt: Der Tagesverbrauch aus 2.0 wird übernommen, offene 2.0-Tabs zeigen
„Neue Version verfügbar“. Die neue Variable `EINSPEISEVERGUETUNG_EUR_PRO_KWH` ist optional.

Mit `:latest` genügt `kubectl -n iot-haus rollout restart deploy/iot-haus` (bei `imagePullPolicy: Always`). Der Zustand bleibt im PVC
erhalten. Für feste Stände die Tags `:<version>` oder `:sha-<kurz>` verwenden (siehe [GITHUB-ACTIONS.md](GITHUB-ACTIONS.md)).
