# Multi-stage Dockerfile for Smart Home Control System
# Stage 1: Dependencies installation
FROM node:18-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with better caching
RUN npm ci --no-audit --no-fund --frozen-lockfile

# Stage 2: Build the Next.js application  
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 3: Runtime with MQTT Broker
FROM node:18-alpine AS runtime

# Install Mosquitto MQTT broker and supervisor in one layer
RUN apk add --no-cache mosquitto mosquitto-clients supervisor

# Create app directory
WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production --no-audit --no-fund --frozen-lockfile && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js

# Create mosquitto directories and configuration in one layer
RUN mkdir -p /etc/mosquitto/conf.d /var/lib/mosquitto /var/log/mosquitto && \
    chown -R mosquitto:mosquitto /var/lib/mosquitto /var/log/mosquitto

# Copy configuration files
COPY docker/mosquitto.conf /etc/mosquitto/mosquitto.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/start.sh /start.sh

# Set permissions
RUN chmod +x /start.sh

# Expose HTTP port only
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_MQTT_BROKER_URL=auto
ENV MQTT_BROKER_HOST=127.0.0.1
ENV MQTT_BROKER_PORT=1883

# Start services using supervisor
CMD ["/start.sh"]
