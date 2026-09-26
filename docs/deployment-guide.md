# iot-haus – Deployment-Leitfaden

**Stand:** 2026-09-26

## 1. Artefakt

- Image: `ghcr.io/deltatree-de/iot-haus` (Multi-Arch `linux/amd64`, `linux/arm64`).
- Tags (`docker-publish.yml:89-99`): `main` (Branch), `latest` (nur Default-Branch), bei `v*`-Tags zusätzlich `X.Y.Z`, `X.Y`, `X`.
- Produktion läuft mit `:latest` über `docker-compose.prod.yml` → **jeder Push auf `main` ist ein Produktionsrelease**
  (sobald der Host das Image neu zieht; es gibt keinen automatischen Pull/Watchtower im Repo).

## 2. Dockerfile (gehärtet, nicht zurückdrehen)

| Stage | Basis | Inhalt |
|---|---|---|
| `deps` | node:22-alpine | `npm ci` (alle Abhängigkeiten) |
| `prod-deps` | node:22-alpine | `npm ci --omit=dev` |
| `builder` | node:22-alpine | `COPY . .` + `npm run build` |
| `runtime` | node:22-alpine | prod-`node_modules`, `.next`, `public`, `package.json`, `server.js`; `apk add mosquitto supervisor`; danach Entfernen von npm/npx/corepack/yarn/wget/nc/apk; beschreibbar nur Broker-Daten, Supervisor-Laufzeit, `.next/cache`; `USER 1000:1000`; `CMD /start.sh` |

Konsequenzen für Betrieb: im Container gibt es **kein curl, kein wget, kein npm**. Healthchecks müssen mit `node` arbeiten, z. B.
`["CMD","node","-e","fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]`.

## 3. Prozesse im Container

`/start.sh` → `supervisord` (`docker/supervisord.conf`): `mosquitto` (prio 100) und `node server.js` (prio 200), beide mit
`autorestart`, Logs nach stdout. Keine Startreihenfolge-Garantie außer Priorität; der Proxy verbindet sich mit 1 s Reconnect.

## 4. Compose

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

- Port `3000:3000`, Volumes `mosquitto-data:/var/lib/mosquitto` (genutzt) und `mosquitto-logs:/var/log/mosquitto` (ungenutzt, Broker loggt nach stdout).
- **Bekannter Defekt:** Healthcheck `["CMD","curl","-f","http://127.0.0.1:3000/api/health || exit 1"]`
  (`docker-compose.prod.yml:21`, `docker-compose.yml:24`) — `curl` fehlt im Image und die Shell-Syntax in CMD-Form wird nicht
  interpretiert → Container wird dauerhaft `unhealthy`.

## 5. CI/CD-Pipelines

| Workflow | Trigger | Jobs | Lücken |
|---|---|---|---|
| `docker-publish.yml` | PR auf main/master; Push auf main/master; Tags `v*` | `build-fast` (PR, amd64, kein Push), `build-multiplatform` (Push, amd64+arm64, Push nach GHCR, Step-Summary) | kein Lint/Typecheck/Test/Smoke-Test vor Push; `moby/buildkit:master` ungepinnt; Actions nicht per SHA gepinnt; `packages: write` auch im PR-Job; keine `concurrency`; kein Image-Scan/SBOM |
| `release.yml` | Tags `v*` | `release` (Changelog aus `git log`, `softprops/action-gh-release@v1`), `notify-deployment` (Summary) | Changelog + `generate_release_notes` doppelt; kein Bezug zum erfolgreichen Image-Build; Release-Tags werden nicht automatisch erzeugt |

## 6. Kubernetes (nur Doku)

`KUBERNETES.md` beschreibt Deployment/Service/Ingress mit Probes auf `/api/health`, das dort referenzierte Verzeichnis `k8s/`
existiert jedoch nicht. Die numerische UID (PR #2) ist für `runAsNonRoot` vorbereitet. WebSocket-Upgrade am Ingress und
Einzelinstanz-Betrieb (Broker im Pod, kein Skalieren möglich) beachten.

## 7. Betrieb / Monitoring

- Logs: `docker logs -f iot-haus-control` (Broker + Node gemischt).
- Health: `GET /api/health` (sagt nichts über den Broker aus).
- Keine Metriken, kein Tracing.

## 8. Rollback

`:latest` ist veränderlich. Rollback nur über Re-Deploy eines älteren Semver-Tags (sofern Tags existieren) oder Revert-Commit auf `main`.
