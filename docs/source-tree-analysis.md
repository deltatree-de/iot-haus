# IoT-Haus 2.0 – Quellbaum

```
iot-haus/
├── .github/
│   ├── workflows/ci-release.yml       einziger Workflow: qualitaet → container → image → release
│   ├── release-hinweise/v2.0.0.md     Text des GitHub Release (inkl. Upgrade-Hinweis)
│   └── copilot-instructions.md        Regeln für KI-Assistenten
├── docker/
│   ├── mosquitto.conf                 Listener nur 127.0.0.1:1883, Persistenz mit autosave je Änderung
│   ├── supervisord.conf               Mosquitto + node dist/server/index.js, Stoppreihenfolge
│   └── start.sh                       startet supervisord
├── docs/                              diese Dokumentation, abnahme-2.0.md, abnahme/*.png (Screenshots)
├── public/                            icon.svg, apple-touch-icon.png
├── scripts/
│   ├── dev-broker.mjs                 aedes-Broker für die lokale Entwicklung (npm run dev:broker)
│   ├── pruefe-js-budget.mjs           CI: First Load JS von „/“ ≤ 200 kB
│   ├── smoke-container.mjs            CI: Rauchtest gegen den laufenden Container
│   └── warte-healthy.sh               CI: wartet bis der Container healthy ist (sonst Log + Fehler)
├── server/                            Node-Server (TypeScript → dist/server)
│   ├── index.ts                       ★ Einstieg: Env lesen, Next vorbereiten, Server starten, SIGTERM/SIGINT
│   ├── app.ts                         HTTP-Server, /api/health, WS-Upgrade /mqtt, Verdrahtung
│   ├── zustandsdienst.ts              autoritativer Zustand, fuehreAus, Energie-Takt, Auto-Aus
│   ├── mqtt-speicher.ts               MQTT-Client: Restore, retained Publish (iot-haus/v2/…)
│   ├── ws-verbindungen.ts             WebSocket-Clients, Prüfung, Fehlercodes, Befehlsrate, Puffergrenze, Broadcast, Heartbeat
│   ├── ursprung.ts                    Host-Allowlist (ERLAUBTE_HOSTS) und Origin-Prüfung
│   ├── konfig.ts                      PORT, HOSTNAME, Broker, STROMPREIS_EUR_PRO_KWH, ERLAUBTE_HOSTS
│   ├── version.ts                     Version aus package.json
│   └── log.ts                         Einzeilen-Logger
├── src/
│   ├── domain/                        gemeinsam für Server und Browser, ohne Framework-Importe
│   │   ├── katalog.ts                 ★ RAEUME, GERAETE (einzige Quelle)
│   │   ├── szenen.ts                  SZENEN
│   │   ├── verbrauch.ts               Summen, Standby, Laststufe
│   │   ├── energie.ts                 Tagesintegration, Mitternacht Europe/Berlin
│   │   ├── befehle.ts                 Befehlsprüfung und -anwendung, Ausgangszustand
│   │   ├── protokoll.ts               ★ WebSocket-Vertrag (Befehl, ServerNachricht, FehlerCode)
│   │   └── format.ts                  de-DE-Formatierer
│   ├── client/                        hausReducer.ts, verbindung.ts (ohne React)
│   ├── hooks/                         useHaus.tsx (HausProvider), useRestzeit, useSekundentakt, useHochzaehlen,
│   │                                  useImpuls, useTheme, useReduzierteBewegung
│   ├── components/                    eine Komponente je Datei (siehe component-inventory.md):
│   │                                  App, Fehlergrenze, Sprunglink, Kopfbereich, Zaehler, DeltaChip, LaststufePille,
│   │                                  VerbindungsStatus, Uebersicht, InfoHinweis, ThemeWahl, Szenenleiste, SzenenKnopf,
│   │                                  Hausansicht, RaumFlaeche, VerbrauchNachRaum, Raeume, Raumkarte, GeraeteZeile,
│   │                                  Schalter, RaumAusKnopf, GrundlastDialog, Meldungen, BannerRahmen, VersionsBanner,
│   │                                  VerbindungsBanner, LiveRegion, Skeleton, Fusszeile, Symbol
│   ├── ui/                            texte.ts (alle UI-Texte), farbtokens.ts (hell/dunkel + Kontrastpaare), themeSkript.ts
│   └── app/                           layout.tsx, page.tsx (<App />), globals.css, favicon.ico
├── tests/
│   ├── integration/                   protokoll.test.ts, persistenz.test.ts, hilfen.ts (aedes + echte ws-Clients)
│   ├── architektur/                   regeln.test.ts, kontrast.test.ts
│   └── fixtures/snapshot.ts
├── Dockerfile                         4 Stufen, Härtung, HEALTHCHECK per node (Port aus PORT), next.config.mjs im Laufzeit-Image
├── docker-compose.yml                 lokal bauen
├── docker-compose.prod.yml            Produktion mit ghcr.io/…:latest
├── package.json                       Version 2.0.0 = Release-Quelle
├── tsconfig.json / tsconfig.server.json
├── vitest.config.mts / vitest.setup.ts
├── eslint.config.mjs / next.config.mjs / postcss.config.mjs
└── README.md, API.md, DOCKER-SETUP.md, KUBERNETES.md, GITHUB-ACTIONS.md
```

★ = guter Einstiegspunkt beim Lesen. Unit-Tests liegen jeweils neben der Datei (`*.test.ts(x)`).

Gebaut, nicht eingecheckt: `.next/` (Next-Build), `dist/` (Server-Kompilat: `dist/server/**`, `dist/src/domain/**`), `coverage/`.
