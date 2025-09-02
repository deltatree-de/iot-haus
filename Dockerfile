# Multi-stage Dockerfile for Smart Home Control System
# Stage 1: Build the Next.js application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Setup MQTT Broker and Runtime
FROM node:18-alpine AS runtime

# Install Mosquitto MQTT broker and supervisor
RUN apk add --no-cache mosquitto mosquitto-clients supervisor

# Create app directory
WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js

# Create mosquitto directories
RUN mkdir -p /etc/mosquitto/conf.d /var/lib/mosquitto /var/log/mosquitto
RUN chown -R mosquitto:mosquitto /var/lib/mosquitto /var/log/mosquitto

# Create Mosquitto configuration
COPY docker/mosquitto.conf /etc/mosquitto/mosquitto.conf

# Create supervisor configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create startup script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Expose HTTP port only
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_PUBLIC_MQTT_BROKER_URL=ws://localhost:3000/mqtt
ENV MQTT_BROKER_HOST=127.0.0.1
ENV MQTT_BROKER_PORT=1883

# Start services using supervisor
CMD ["/start.sh"]
