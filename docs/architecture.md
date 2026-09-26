# IoT-Haus 2.0 – Architektur (Kurzfassung)

Verbindliche Details und Begründungen stehen im
[Architektur-Entscheidungsdokument](../_bmad-output/planning-artifacts/architecture.md). Diese Seite fasst den umgesetzten Stand zusammen.

## Laufzeit

```
Browser (React 19)                        Container node:22-alpine, UID 1000, supervisord
┌───────────────────────────┐  HTTP :3000  ┌──────────────────────────────────────────────┐
│ App → HausProvider        │ ───────────► │ dist/server/index.js                         │
│   hausReducer (Zustand)   │              │  ├ GET/HEAD /api/health                      │
│   HausVerbindung (WS)     │  WS /mqtt    │  ├ Next.js Request-Handler                   │
│   sendet nur Befehle      │ ◄══════════► │  ├ WsVerbindungen: Prüfung, Limits, Broadcast│
│   empfängt Ereignisse     │  JSON ≤ 4 KB │  ├ Zustandsdienst: Zustand, Energie, Auto-Aus│
└───────────────────────────┘              │  └ MqttSpeicher ─► Mosquitto 127.0.0.1:1883  │
                                           │                    └► Volume mosquitto-data  │
                                           └──────────────────────────────────────────────┘
```

- **Ein Container, zwei Prozesse:** supervisord startet Mosquitto (Priorität 100) und den Node-Server (200). Beim Stoppen endet
  Node zuerst und sichert den Tagesverbrauch.
- **Der Node-Server ist der einzige MQTT-Client.** Browser sprechen das JSON-Protokoll aus [API.md](../API.md).
- **Server-autoritativ:** Der Zustand im Speicher des Zustandsdiensts ist maßgeblich, der Broker dient als Persistenz, der Browser zeigt
  nur an. Ein neu verbundener Browser bekommt einen `snapshot` und sendet selbst nichts.

## Code-Teilung

| Bereich | Inhalt | darf importieren |
|---|---|---|
| `src/domain/` | Katalog, Szenen, Verbrauch, Energie, Befehlsprüfung, Protokolltypen, Formatierer | nur sich selbst |
| `server/` | HTTP, WebSocket, Zustandsdienst, MQTT-Speicher, Konfiguration, Log | `src/domain/` |
| `src/client/` | `HausVerbindung` (WS, Backoff, Lebenszeichen), `hausReducer` | `src/domain/` |
| `src/hooks/`, `src/components/`, `src/app/` | React-Oberfläche | `src/domain/`, `src/client/`, `src/ui/` |

Der Server wird mit `tsc -p tsconfig.server.json` nach `dist/` (CommonJS) kompiliert. Im Image läuft reines `node`, ohne tsx/ts-node.

## Datenfluss „Mikrowelle an“

1. Schalter → `useHaus().schalten(…)` → Reducer merkt den Befehl als ausstehend → `{ typ: 'schalten', … }` über WebSocket.
2. Server: prüfen (inkl. Befehlsrate) → Energie bis jetzt integrieren → Zustand ändern → Auto-Aus-Timer (180 s) → `aenderung` an alle →
   Gerätezustand retained speichern → `bestaetigt` an den Absender.
3. Alle Browser: Zähler zählt hoch, Meldung „+1.199 W · Mikrowelle (Küche)“, Live-Region-Ansage.
4. Nach 180 s: Server-Timer → `aenderung` mit `ursache.art = 'autoAus'`.

## Zuverlässigkeit

- **Start:** Retained Zustand 500 ms lang einlesen, ungültige Einträge ignorieren, fehlende Geräte im Ausgangszustand, Auto-Aus-Restzeiten
  neu planen, alles einmal neu speichern → bereit (`/api/health` 200).
- **Broker-Ausfall:** Health 503, alle WebSockets mit 1013 schließen, neue Upgrades mit 503 ablehnen. Timer laufen im Speicher weiter;
  nach der Wiederverbindung wird der Speicherstand komplett neu geschrieben.
- **Browser:** Backoff 1/2/4/8 s, danach alle 10 s; Neuverbindung nach 75 s ohne Nachricht und beim Zurückkehren in den Tab.
  Versionskonflikt → Banner „Neue Version verfügbar“, Schalter gesperrt.
- **Energie:** ein Timer auf `min(60 s, nächste Mitternacht Berlin)`. Gerätezustände werden bei jeder Änderung gespeichert, die
  Tagesenergie nur in diesem Takt und bei SIGTERM; Verlust bei Absturz höchstens 60 s. Zeitsprünge über 2 min zählen nicht als Verbrauch,
  `seit`-Werte aus der Zukunft werden beim Start auf „jetzt“ begrenzt, nicht endliche `wh` beim Einlesen ignoriert.

## Sicherheit

Keine Anmeldung (Heimnetz; für das Internet Reverse-Proxy mit Anmeldung, siehe README). Beim Upgrade: optionale Host-Allowlist
`ERLAUBTE_HOSTS` gegen DNS-Rebinding, Origin-Prüfung, höchstens 100 Verbindungen. Je Verbindung: nur drei Befehlstypen mit strenger
Feldprüfung, 4 KB fachlich / 64 KiB hart (Close 1009), Token-Bucket 100 + 20/s (`ZU_VIELE_BEFEHLE`), Abbruch bei > 1 MB Sendepuffer.
Security-Header aus `next.config.mjs` (`nosniff`, `DENY`, `strict-origin-when-cross-origin`, kein `X-Powered-By`; die Datei liegt dafür
im Laufzeit-Image), Logs ohne Nutzdaten, gehärtetes Image (UID 1000, keine Paketmanager und Download-Werkzeuge).

## Betrieb

Genau eine Instanz, weil der Zustand im Container lebt (siehe [KUBERNETES.md](../KUBERNETES.md#warum-genau-eine-replik)).
Details: [deployment-guide.md](./deployment-guide.md).
