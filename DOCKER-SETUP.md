# IoT-Haus 2.0 – Docker

Ein Container enthält alles: den Node-Server (Next.js-Seite, `/api/health`, WebSocket `/mqtt`) und den MQTT-Broker Mosquitto.
supervisord startet beide.

## Image

`ghcr.io/deltatree-de/iot-haus` für `linux/amd64` und `linux/arm64`. Tags: `:latest`, `:<version>` (z. B. `:2.0.0`), `:sha-<kurz>`.

Das [Dockerfile](Dockerfile) hat vier Stufen:

| Stufe | Inhalt |
|---|---|
| `deps` | `npm ci` mit allen Abhängigkeiten |
| `prod-deps` | `npm ci --omit=dev` für die Laufzeit |
| `builder` | `npm run build` = `next build` + `tsc -p tsconfig.server.json` (Server-Kompilat nach `dist/`) |
| `runtime` | `node:22-alpine` mit `.next`, `public`, `dist`, `package.json`, `next.config.mjs`, Laufzeit-`node_modules`, Mosquitto und supervisord |

`next.config.mjs` (reines JavaScript, damit das Image ohne TypeScript/npm auskommt) liegt im Laufzeit-Image, weil Next sie beim Start liest: Nur so gelten in Produktion die Security-Header
(`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`) und der Header
`X-Powered-By` entfällt.

**Härtung** (seit 1.x, bleibt unverändert und wird in der CI geprüft):

- Node 22, Laufzeit als `USER 1000:1000` (numerisch, damit Kubernetes `runAsNonRoot` prüfen kann).
- Kein npm, npx, corepack, yarn, apk, wget, nc und kein curl im Laufzeit-Image.
- Anwendungscode gehört root und ist nur lesbar. Beschreibbar sind nur `/var/lib/mosquitto`, `/var/log/supervisor`,
  `/run/supervisor` und `/app/.next/cache`.
- Mosquitto lauscht nur auf `127.0.0.1:1883` und ist von außen nicht erreichbar. Nach außen geht nur Port 3000.

## Healthcheck

Das Image bringt seinen Healthcheck mit. Er braucht kein curl, weil Node 22 `fetch` eingebaut hat:

```dockerfile
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
```

- `/api/health` liefert `200` nur, wenn der Broker verbunden und der Zustand geladen ist. Solange der Broker nicht erreichbar ist
  oder der Server noch startet, kommt `503` (Details in [API.md](API.md#1-apihealth)).
- Der Healthcheck folgt `PORT`; wer den Port im Container ändert, braucht nichts weiter anzupassen.
- Nach dem Start ist der Container nach spätestens 60 s `healthy` (lokal gemessen: 6 s). Die CI prüft das mit `scripts/warte-healthy.sh`.
- In Compose-Dateien **keinen** eigenen `healthcheck`-Block setzen. Ein alter Block mit `curl` aus 1.x überschreibt den Image-Healthcheck
  und meldet den Container dauerhaft als `unhealthy` (siehe [Upgrade-Hinweis 2.0.0](README.md#upgrade-hinweis-200)).

## Betrieb

### Produktion (Image aus GHCR)

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f
```

Update:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Lokal bauen

```bash
docker compose up -d --build        # oder: npm run compose:up
docker compose logs -f              # oder: npm run compose:logs
docker compose down                 # oder: npm run compose:down
```

Ohne Compose:

```bash
docker build -t iot-haus .
docker run -d --name iot-haus -p 3000:3000 -v iot-haus-daten:/var/lib/mosquitto iot-haus
```

(`npm run docker:build`, `docker:run`, `docker:logs`, `docker:stop` machen dasselbe.)

### Umgebungsvariablen

| Variable | Standard | Wirkung |
|---|---|---|
| `STROMPREIS_EUR_PRO_KWH` | `0.35` | Strompreis in €/kWh mit Dezimalpunkt; ungültige Werte → `0.35` und Warnung im Log |
| `ERLAUBTE_HOSTS` | leer | Optional gegen DNS-Rebinding: kommagetrennte Hostnamen ohne Port (z. B. `haus.local,192.168.1.10`). Gesetzt → WebSocket nur, wenn `Host` und ein vorhandener `X-Forwarded-Host` in der Liste stehen, sonst 403 |
| `PORT` | `3000` | HTTP/WebSocket-Port im Container (Healthcheck folgt automatisch) |
| `HOSTNAME` | `0.0.0.0` | Bind-Adresse |
| `MQTT_BROKER_HOST` / `MQTT_BROKER_PORT` | `127.0.0.1` / `1883` | nicht ändern, der Broker läuft im selben Container |
| `NODE_ENV` | `production` | nicht ändern |

`NEXT_PUBLIC_MQTT_BROKER_URL` gibt es nicht mehr; ein gesetzter Wert wird ignoriert.

### Daten und Sicherung

Das Volume `mosquitto-data` (Mount `/var/lib/mosquitto`) enthält die retained Gerätezustände und den Tagesverbrauch.
Ohne Volume beginnt das Haus nach jedem Neustart im Ausgangszustand.

Sicherung:

```bash
docker run --rm -v iot-haus_mosquitto-data:/daten -v "$PWD":/ziel alpine \
  tar czf /ziel/iot-haus-daten.tgz -C /daten .
```

Compose stellt dem Volume-Namen den Projektnamen voran (hier `iot-haus_`); den genauen Namen zeigt `docker volume ls`.

### Herunterfahren

`docker stop` sendet SIGTERM. supervisord stoppt zuerst den Node-Server; der sichert den Tagesverbrauch im Broker (Gerätezustände
sind bereits bei jeder Änderung gespeichert, der Tagesverbrauch sonst im 60-s-Takt) und schließt
die WebSockets mit Code 1012. Danach stoppt Mosquitto. Beide Programme haben 5 s Zeit (`stopwaitsecs=5`).

### Logs

Node-Server und Mosquitto schreiben nach stdout. Serverzeilen haben das Format
`<ISO-Zeit> INFO|WARN|FEHLER <ereignis> schluessel=wert …`, z. B. `start`, `bereit`, `mqtt_getrennt`, `befehl typ=schalten ergebnis=ok`,
`auto_aus geraet=kueche.mikrowelle`, `ws_abgelehnt grund=origin|host|nicht_bereit|zu_viele_verbindungen`, `ws_getrennt grund=liest_nicht`. Nutzdaten werden nicht geloggt.

## Hinter einem Reverse-Proxy

Für Zugriff aus dem Internet gehört ein Proxy mit TLS und Anmeldung vor den Container (Empfehlung und Caddy-Beispiel im
[README](README.md#zugriff-aus-dem-internet)). Beispiel nginx:

```nginx
server {
    listen 443 ssl;
    server_name haus.example.de;
    # ssl_certificate …; ssl_certificate_key …;

    auth_basic "IoT-Haus";
    auth_basic_user_file /etc/nginx/iot-haus.htpasswd;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }
}
```

- `Host` muss durchgereicht werden (oder `X-Forwarded-Host` gesetzt sein), sonst lehnt die Origin-Prüfung den WebSocket mit 403 ab.
- Den Container-Port dann nur lokal veröffentlichen: `ports: ["127.0.0.1:3000:3000"]`.
- `ERLAUBTE_HOSTS` auf den öffentlichen Namen und ggf. lokale Namen setzen, z. B. `ERLAUBTE_HOSTS=haus.example.de,haus.local`.

## Fehlersuche

| Symptom | Ursache und Abhilfe |
|---|---|
| Container bleibt `unhealthy`, Log zeigt aber `bereit` | Compose-Datei hat noch den alten `healthcheck`-Block mit `curl` → Block entfernen, `docker compose up -d` |
| `unhealthy`, Log zeigt `mqtt_getrennt` | Mosquitto läuft nicht; `docker logs` auf Mosquitto-Fehler prüfen (z. B. Rechte am Volume, Eigentümer muss UID 1000 sein) |
| Browser zeigt dauerhaft „Getrennt“, Log zeigt `ws_abgelehnt grund=origin` | Proxy reicht `Host` nicht durch → `proxy_set_header Host $host` bzw. `X-Forwarded-Host` setzen |
| Browser bleibt „Getrennt“, Log zeigt `ws_abgelehnt grund=host` | Aufgerufener Hostname fehlt in `ERLAUBTE_HOSTS` → Namen ergänzen (ohne Port) |
| Log zeigt `ws_abgelehnt grund=zu_viele_verbindungen` | mehr als 100 gleichzeitige WebSockets (z. B. sehr viele offene Tabs) → Tabs schließen |
| Browser zeigt „Neue Version verfügbar“ | Tab stammt von einer älteren Version → „Neu laden“ |
| Zustand nach Neustart weg | Volume fehlt oder wurde gelöscht → `mosquitto-data` wie in der Compose-Datei einbinden |
