# IoT-Haus 2.1 – Architektur (Kurzfassung)

Verbindliche Details und Begründungen stehen im
[Architektur-Entscheidungsdokument](../_bmad-output/planning-artifacts/architecture.md). Diese Seite fasst den umgesetzten Stand zusammen.
Die Erweiterung 2.1 (Elektroauto, Solaranlage, Netzbilanz) ist im
[Sprint Change Proposal 2026-09-27](../_bmad-output/planning-artifacts/sprint-change-proposal-2026-09-27.md) begründet (AD-23 bis AD-27).

## Laufzeit

```
Browser (React 19)                        Container node:22-alpine, UID 1000, supervisord
┌───────────────────────────┐  HTTP :3000  ┌──────────────────────────────────────────────┐
│ App → HausProvider        │ ───────────► │ dist/server/index.js                         │
│   hausReducer (Zustand)   │              │  ├ GET/HEAD /api/health                      │
│   HausVerbindung (WS)     │  WS /mqtt    │  ├ Next.js Request-Handler                   │
│   sendet nur Befehle      │ ◄══════════► │  ├ WsVerbindungen: Prüfung, Limits, Broadcast│
│   empfängt Ereignisse     │  JSON ≤ 4 KB │  ├ Zustandsdienst: Zustand, Energie, Auto-Aus│
│                           │              │  │   Elektroauto/Akku, Sonnenlage, Akku voll │
└───────────────────────────┘              │  └ MqttSpeicher ─► Mosquitto 127.0.0.1:1883  │
                                           │                    └► Volume mosquitto-data  │
                                           └──────────────────────────────────────────────┘
```

- **Ein Container, zwei Prozesse:** supervisord startet Mosquitto (Priorität 100) und den Node-Server (200). Beim Stoppen endet
  Node zuerst und sichert Tagesenergie und Akkustand.
- **Der Node-Server ist der einzige MQTT-Client.** Browser sprechen das JSON-Protokoll aus [API.md](../API.md).
- **Server-autoritativ:** Der Zustand im Speicher des Zustandsdiensts ist maßgeblich, der Broker dient als Persistenz, der Browser zeigt
  nur an. Ein neu verbundener Browser bekommt einen `snapshot` und sendet selbst nichts.

## Code-Teilung

| Bereich | Inhalt | darf importieren |
|---|---|---|
| `src/domain/` | Katalog, Szenen, Elektroauto, Solaranlage, Verbrauch und Netzbilanz, Energie, Befehlsprüfung und fachliche Regeln, Protokolltypen, Formatierer | nur sich selbst |
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

## Datenfluss „Wallbox an, dann Wegfahren“ (2.1)

1. Wallbox-Schalter → `schalten carport.wallbox an:true`. Server: `pruefeRegel` (Auto zu Hause, Akku nicht voll, sonst
   `NICHT_MOEGLICH`) → Energie und Akku bis jetzt integrieren → Wallbox an → Akku-voll-Timer planen → `aenderung` →
   Wallbox- und Auto-Topic speichern → `bestaetigt`. Alle Browser: „+10.997 W · Wallbox (Carport)“, am Auto „lädt · voll in 2 h 44 min“.
2. Jeder Energie-Takt (≤ 60 s) schreibt den Akku fort, speichert ihn und sendet ihn in `energie.auto`. Browser rechnen dazwischen mit
   `akkuWhBei` hoch, nur zur Anzeige.
3. „Wegfahren“ → `auto zuhause:false`. Server: `pruefeRegel` (≥ 15 %) → integrieren → Auto unterwegs → `erzwingeLadeRegeln`
   schaltet die Wallbox aus → **eine** `aenderung` mit Auto und Wallbox → „−10.997 W · Elektroauto weggefahren, Laden beendet“.
4. Wird der Akku voll, schaltet der Akku-voll-Timer die Wallbox mit `ursache.art = 'akkuVoll'` aus.

Die Sonnenwahl läuft genauso über `aendere()`: `sonne` integriert die Energie mit der alten Stufe bis jetzt, setzt die neue Stufe,
sendet eine `aenderung` (mit `geraete: {}` und `sonne`) und speichert das Sonnen-Topic. Die Netzbilanz rechnet jeder Browser aus
Hausverbrauch und Erzeugung selbst; sie ist kein eigener Serverzustand.

**Leitlinien 2.1:** Auto und Sonne sind eigene Serverzustände neben `HausZustand`, aber es gibt weiterhin **einen** Änderungspfad
(`Zustandsdienst.aendere`) – eine Änderung = eine `aenderung` (AD-23). Akku und Tagesenergie werden im selben Schritt integriert, sodass
die geladene Energie genau der integrierten Wallbox-Energie entspricht (AD-24). Akku voll ist ein Server-Timer wie Auto-Aus (AD-25).
Fachliche Regelverstöße ergeben `NICHT_MOEGLICH` statt eines stillen `geaendert: false` (AD-27).

## Zuverlässigkeit

- **Start:** Retained Zustand 500 ms lang einlesen, ungültige Einträge ignorieren, fehlende Geräte im Ausgangszustand, Energie `v: 1`
  aus 2.0 als reinen Netzbezug übernehmen, Akku ab jetzt weiterrechnen (Ausfallzeit lädt nicht), Wallbox ausschalten, falls das Auto
  unterwegs oder der Akku voll ist, Auto-Aus-Restzeiten und Akku-voll-Timer neu planen, alles einmal neu speichern → bereit
  (`/api/health` 200).
- **Broker-Ausfall:** Health 503, alle WebSockets mit 1013 schließen, neue Upgrades mit 503 ablehnen. Timer laufen im Speicher weiter;
  nach der Wiederverbindung wird der Speicherstand komplett neu geschrieben.
- **Browser:** Backoff 1/2/4/8 s, danach alle 10 s; Neuverbindung nach 75 s ohne Nachricht und beim Zurückkehren in den Tab.
  Versionskonflikt → Banner „Neue Version verfügbar“, Schalter gesperrt (so sperren sich auch offene 2.0-Tabs nach dem Upgrade).
- **Energie:** ein Timer auf `min(60 s, nächste Mitternacht Berlin)`. Gerätezustände und Sonnenlage werden bei jeder Änderung
  gespeichert, Tagesenergie und Akku in diesem Takt und bei SIGTERM (der Akku zusätzlich bei jeder Auto- oder Wallbox-Änderung);
  Verlust bei Absturz höchstens 60 s. Zeitsprünge über 2 min zählen nicht als Verbrauch,
  `seit`-Werte aus der Zukunft werden beim Start auf „jetzt“ begrenzt, nicht endliche `wh` beim Einlesen ignoriert.

## Sicherheit

Keine Anmeldung (Heimnetz; für das Internet Reverse-Proxy mit Anmeldung, siehe README). Beim Upgrade: optionale Host-Allowlist
`ERLAUBTE_HOSTS` gegen DNS-Rebinding, Origin-Prüfung, höchstens 100 Verbindungen. Je Verbindung: nur fünf Befehlstypen mit strenger
Feldprüfung und fachlicher Regelprüfung, 4 KB fachlich / 64 KiB hart (Close 1009), Token-Bucket 100 + 20/s (`ZU_VIELE_BEFEHLE`), Abbruch bei > 1 MB Sendepuffer.
Security-Header aus `next.config.mjs` (`nosniff`, `DENY`, `strict-origin-when-cross-origin`, kein `X-Powered-By`; die Datei liegt dafür
im Laufzeit-Image), Logs ohne Nutzdaten, gehärtetes Image (UID 1000, keine Paketmanager und Download-Werkzeuge).

## Betrieb

Genau eine Instanz, weil der Zustand im Container lebt (siehe [KUBERNETES.md](../KUBERNETES.md#warum-genau-eine-replik)).
Details: [deployment-guide.md](./deployment-guide.md).
