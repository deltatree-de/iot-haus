#!/bin/sh

# Start script for the Smart Home Control System container

echo "Starting Smart Home Control System..."

# Create log directories
mkdir -p /var/log/supervisor
mkdir -p /var/log/mosquitto

# Set proper permissions
chown -R mosquitto:mosquitto /var/lib/mosquitto /var/log/mosquitto
chown -R node:node /app

# Wait a moment for file system setup
sleep 2

echo "Starting Mosquitto MQTT Broker..."
echo "Starting Next.js Application..."

# Start supervisor which will manage both services
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
