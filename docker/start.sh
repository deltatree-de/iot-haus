#!/bin/sh
# Startskript des IoT-Haus-Containers.
# Läuft als node. Rechte setzt das Dockerfile beim Bauen, nicht beim Start.
set -e

echo "IoT-Haus 2.0 startet (Benutzer: $(id -un)) ..."

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
