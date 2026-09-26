#!/bin/sh
# Wartet, bis der Container „healthy“ ist; sonst Log ausgeben und mit Fehler enden (Review CR-09).
# Aufruf: scripts/warte-healthy.sh <container> <sekunden>
set -eu
NAME="$1"
MAX="${2:-60}"
i=0
while [ "$i" -lt "$MAX" ]; do
  STATUS=$(docker inspect -f '{{.State.Health.Status}}' "$NAME" 2>/dev/null || echo fehlt)
  if [ "$STATUS" = "healthy" ]; then
    echo "$NAME ist healthy nach ${i} s"
    exit 0
  fi
  i=$((i + 1))
  sleep 1
done
echo "$NAME wurde nicht innerhalb von ${MAX} s healthy (Status: $STATUS)" >&2
docker logs "$NAME" >&2 || true
exit 1
