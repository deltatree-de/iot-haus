# syntax=docker/dockerfile:1
# Multi-Stage-Dockerfile für IoT-Haus 2.0
# Gehärtet nach dem Vorfall React2Shell (CVE-2025-55182):
# - Node 22 statt Node 18 (Node 18 hat keine Sicherheitsupdates mehr)
# - Laufzeit als Benutzer node, nicht als root
# - kein npm, npx, corepack, yarn, apk, wget oder nc im Laufzeit-Image
# - Anwendungscode gehört root und ist für node nur lesbar

# Stage 1: alle Abhängigkeiten für den Build
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Stage 2: nur Laufzeit-Abhängigkeiten
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Stage 3: Next.js bauen
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 4: Laufzeit mit MQTT-Broker
FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist ./dist
# next.config.mjs wird zur Laufzeit gelesen (Security-Header, poweredByHeader: false – Review CR-05)
COPY package.json next.config.mjs ./

COPY docker/mosquitto.conf /etc/mosquitto/mosquitto.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY --chmod=0755 docker/start.sh /start.sh

# Pakete installieren, dann Paketmanager und Download-Werkzeuge entfernen.
# Nur Cache, Broker-Daten und Supervisor-Laufzeit sind für node beschreibbar.
RUN apk add --no-cache mosquitto supervisor \
 && mkdir -p /var/lib/mosquitto /var/log/supervisor /run/supervisor /app/.next/cache \
 && chown -R node:node /var/lib/mosquitto /var/log/supervisor /run/supervisor /app/.next/cache \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-* \
 && rm -f /usr/bin/wget /usr/bin/nc /usr/bin/ftpget /usr/bin/ftpput /usr/bin/tftp \
 && rm -rf /sbin/apk /etc/apk /lib/apk /usr/share/apk /var/cache/apk

EXPOSE 3000

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    MQTT_BROKER_HOST=127.0.0.1 \
    MQTT_BROKER_PORT=1883

# Healthcheck ohne curl/wget: Node 22 bringt fetch mit (FR-31, AD-14).
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

# Numerische Kennung statt Name: Kubernetes prueft runAsNonRoot nur an einer Zahl.
# Mit "USER node" verweigert der Pod den Start (CreateContainerConfigError).
# 1000 ist node im Basis-Image node:22-alpine.
USER 1000:1000

CMD ["/start.sh"]
