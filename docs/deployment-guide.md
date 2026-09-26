# IoT-Haus 2.0 – Deployment

## Artefakt

- Image `ghcr.io/deltatree-de/iot-haus`, Multi-Arch `linux/amd64` und `linux/arm64`.
- Tags: `:latest` (jeder Push auf `main`), `:sha-<kurz>` (jeder Push auf `main`), `:<version>` (neue Version in `package.json`).
- Produktion läuft mit `:latest` über `docker-compose.prod.yml`. Jeder Merge auf `main` ist ein Produktionsrelease, sobald der Host
  das Image neu zieht (kein automatischer Pull im Repo).

## Image

Vier Stufen (`deps`, `prod-deps`, `builder`, `runtime`), Laufzeit `node:22-alpine` als `USER 1000:1000` ohne npm/npx/corepack/yarn/apk/wget/nc/curl.
Healthcheck im Image per `node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health')…"` (10 s Intervall, 20 s Startphase,
3 Versuche). `next.config.mjs` liegt im Image, damit die Security-Header auch in Produktion gelten.
Details: [DOCKER-SETUP.md](../DOCKER-SETUP.md).

## Docker Compose

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

- Port `3000`, Volume `mosquitto-data` → `/var/lib/mosquitto`, `restart: unless-stopped`, Containername `iot-haus-control`.
- Kein `healthcheck`-Block in der Compose-Datei (Upgrade von 1.x: alten curl-Block entfernen, siehe
  [README – Upgrade-Hinweis 2.0.0](../README.md#upgrade-hinweis-200)).
- Strompreis über `STROMPREIS_EUR_PRO_KWH`; optional `ERLAUBTE_HOSTS` (Hostnamen ohne Port) gegen DNS-Rebinding.

## Kubernetes

Beispielmanifeste, Probes auf `/api/health` und die Begründung für **genau eine Replik** (Zustand im eingebetteten Broker des Pods):
[KUBERNETES.md](../KUBERNETES.md).

## Zugriff aus dem Internet

Keine eigene Anmeldung. Nur hinter einem Reverse-Proxy mit TLS und Anmeldung betreiben, der auch `/mqtt` schützt und `Host`
bzw. `X-Forwarded-Host` durchreicht ([README](../README.md#zugriff-aus-dem-internet)).

## CI/CD

Workflow `.github/workflows/ci-release.yml`: `qualitaet` → `container` → `image` → `release`. Releases entstehen aus der Version in
`package.json` plus `.github/release-hinweise/v<version>.md`. Details: [GITHUB-ACTIONS.md](../GITHUB-ACTIONS.md).

## Nach dem Deploy prüfen

1. `docker ps` zeigt nach spätestens 60 s `(healthy)`.
2. `curl -s http://<host>:3000/api/health` (vom Host aus) liefert `{"status":"ok","mqtt":"verbunden","version":"<version>"}`.
3. Manuelle Punkte der [Abnahme-Checkliste](./abnahme-2.0.md#b--manuell-auf-echtem-gerät-nach-deploy) auf echtem Handy und Laptop.

## Rückkehr zu einer Version

In der Compose-Datei `:latest` durch `:<version>` oder `:sha-<kurz>` ersetzen und `docker compose … up -d`. Das Volume bleibt erhalten.
Eine Rückkehr auf 1.x ist nicht vorgesehen (andere Topics; 1.x würde den 2.0-Zustand nicht lesen).
