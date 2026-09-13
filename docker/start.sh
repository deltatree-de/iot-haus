#!/bin/sh
# Start script for the Smart Home Control System container.
# Läuft als node. Rechte setzt das Dockerfile beim Bauen, nicht beim Start.
set -e

echo "Starting Smart Home Control System (user: $(id -un))..."

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
