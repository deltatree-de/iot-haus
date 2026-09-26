---
title: Addendum zum PRD IoT-Haus 2.0
created: 2026-09-26
updated: 2026-09-26
status: final
---

# Addendum zum PRD „IoT-Haus 2.0 – Best UX ever“

Dieses Addendum sammelt technische Leitplanken und Begründungen, die für Architektur (Winston), UX (Sally) und Umsetzung (Amelia) wichtig sind, aber nicht ins PRD gehören. Es ist **Vorgabe mit Architektur-Spielraum**: Winston darf Details ändern, wenn das PRD (FR/NFR) weiterhin erfüllt ist, und protokolliert Abweichungen in seinem eigenen Entscheidungsprotokoll.

## A-1 Befund des Ist-Code-Scans (Stand `c837822`)

| Bereich | Befund | Adressiert durch |
|---|---|---|
| `src/app/page.tsx` | Zustand in localStorage; beim Connect publiziert jeder Client alle Räume → überschreibt fremde Zustände | FR-14, FR-15 |
| `server.js` | Reiner Proxy: Browser dürfen beliebige Topics abonnieren/publizieren; kein Zustand, keine Validierung; loggt jede Nachricht | FR-18, FR-35, NFR-4 |
| `useMqtt.ts` / `useMockMqtt.ts` | `shouldUseMock = false`, Mock ist toter Code, wird trotzdem instanziiert | FR-35 |
| `useWebSocketMqtt.ts` | Feste Reconnect-Logik ohne Backoff, viele `console.log` | FR-20, FR-35 |
| `layout.tsx` | `user-scalable=no`, `maximum-scale=1` (WCAG 1.4.4), englischer Titel, feste `themeColor` | NFR-2, FR-28, FR-29 |
| `src/app/api/health/route.ts` | Immer „healthy“, auch ohne Broker; Version-Fallback `1.0.0` | FR-30 |
| `docker-compose*.yml` | Healthcheck mit `curl` (existiert im gehärteten Image nicht) → Container nie healthy | FR-31 |
| `docker/mosquitto.conf` | `autosave_interval 1800`, `autosave_on_changes false` → retained Zustand bis zu 30 min Verlust bei Absturz | FR-17 |
| `.github/workflows` | Kein Lint/Test; Publish läuft ohne Qualitätsgate | FR-32 |
| Root `test-*.js` | Manuelle Skripte, nicht in CI | FR-35, NFR-6 |
| Komponenten | Keine `role="switch"`/`aria-*`; Buttons ohne Namen mit Raumbezug | NFR-2, FR-27 |

## A-2 Empfohlenes Zustands- und Topic-Modell

**Verantwortung:** `server.js` (bzw. ein daraus importiertes Modul, z. B. `server/state.js` in reinem JS oder kompiliertem TS) wird vom Proxy zum **Zustandsdienst**. Er ist der einzige MQTT-Client, der Zustands-Topics schreibt.

**Topics (MQTT, nur intern 127.0.0.1):**

| Topic | Richtung | retained | Inhalt |
|---|---|---|---|
| `iot-haus/v2/geraet/<geraete-id>/zustand` | Server → Broker | ja | `{ "an": bool, "seit": <ms epoch>, "v": 1 }` |
| `iot-haus/v2/energie/heute` | Server → Broker | ja | `{ "datum": "YYYY-MM-DD", "wh": number, "stand": <ms epoch> }` |

Beim Start abonniert der Server `iot-haus/v2/#`, liest die retained Nachrichten (Timeout z. B. 1 s), baut daraus den Serverzustand (unbekannte IDs ignorieren, fehlende → Ausgangszustand) und ist erst dann „bereit“. Der Punkt in Geräte-IDs (`kueche.mikrowelle`) ist in MQTT-Topics erlaubt.

**Alte Topics** `smarthome/<room>/light` werden nicht mehr verwendet; sie waren nie retained, es gibt nichts zu migrieren.

**Mosquitto:** `autosave_on_changes true` mit `autosave_interval 1` (Persistenz nach jeder Änderung; bei der geringen Nachrichtenrate unkritisch), damit FR-17 auch direkt nach einer Änderung gilt. Rest der Konfiguration bleibt.

**Herunterfahren:** Der Server fängt SIGTERM ab, schreibt den Tagesverbrauch retained und beendet sich dann (FR-10). In `supervisord.conf` ggf. `stopsignal=TERM` und `stopwaitsecs=5` setzen.

## A-3 WebSocket-Protokoll (Browser ↔ Server, Pfad `/mqtt` bleibt)

Der Pfad `/mqtt` bleibt aus Kompatibilitätsgründen (Reverse-Proxy-Konfigurationen der Betreiber). Nachrichten sind JSON, max. 4 KB.

Client → Server:
```json
{ "typ": "schalten", "id": "c-123", "geraet": "kueche.mikrowelle", "an": true }
{ "typ": "szene",    "id": "c-124", "szene": "filmabend" }
{ "typ": "raumAus",  "id": "c-125", "raum": "kueche" }
```

Server → Client:
```json
{ "typ": "snapshot", "version": "2.0.0", "zustand": { "<geraete-id>": { "an": true, "seit": 1758900000000 } }, "energie": { "datum": "2026-09-26", "wh": 3420 }, "strompreis": 0.35, "serverZeit": 1758900000000 }
{ "typ": "aenderung", "ursache": { "art": "geraet|szene|raumAus|autoAus", "ref": "kueche.mikrowelle", "befehlId": "c-123" }, "geraete": { "kueche.mikrowelle": { "an": true, "seit": 1758900000000 } }, "energie": { "datum": "2026-09-26", "wh": 3421 } }
{ "typ": "bestaetigt", "befehlId": "c-123" }
{ "typ": "fehler", "befehlId": "c-123", "code": "UNBEKANNTES_GERAET", "meldung": "…" }
{ "typ": "energie", "energie": { "datum": "2026-09-26", "wh": 3425 } }
```

- `serverZeit` erlaubt dem Client, Uhrabweichungen für die Auto-Aus-Restzeit auszugleichen (FR-5).
- Leistungsdifferenz und Meldungstext berechnet der Client aus Katalog + altem/neuem Zustand (FR-11), damit der Server keine UI-Texte kennt.
- `energie`-Nachricht alle 60 s (FR-10).
- `version` im Snapshot für den Versionsabgleich (FR-18); Nachrichten mit Feld `type` (altes Protokoll) → Fehler `ALTES_PROTOKOLL`.
- Origin-Prüfung beim Upgrade (NFR-4) im `upgrade`-Handler bzw. `verifyClient` von `ws`.

## A-4 Domänenlogik als reine Funktionen

Empfohlen: ein Modul `src/domain/` (TypeScript, ohne React/Node-Abhängigkeiten), das Server und Client importieren:

- `katalog.ts` – Räume, Geräte, Szenen (Anhang A, FR-23) als `as const`-Daten.
- `verbrauch.ts` – `hausverbrauch(zustand)`, `raumverbrauch(zustand, raum)`, `standbyAnteil(zustand)`, `laststufe(w)`, `kostenProStunde(w, preis)`.
- `energie.ts` – `integriere(energie, leistungW, vonMs, bisMs, zeitzone='Europe/Berlin')` mit Tageswechsel-Split an Mitternacht.
- `befehle.ts` – `pruefeBefehl(json)` und `wendeAn(zustand, befehl, jetzt)` → `{ neuerZustand, geaenderteGeraete }`.
- `format.ts` – de-DE-Formatierer (FR-29).

Da `server.js` CommonJS ist und ohne Build läuft: Entweder `server.js` → `server.ts` mit Kompilierung im Build-Stage (`tsc` bzw. `tsx`-freie Ausgabe nach `dist/`), oder Domänenmodul als JS mit JSDoc-Typen. Entscheidung liegt bei der Architektur; Randbedingung NFR-4: kein zusätzliches Laufzeitwerkzeug wie `tsx`/`ts-node` im Runtime-Image.

## A-5 Test- und CI-Werkzeuge

- **Vitest** für Unit- und Integrationstests (schnell, ESM/TS ohne Babel).
- **@testing-library/react** + **jsdom** für Komponententests; **vitest-axe** (bzw. axe-core direkt) für NFR-2 in Hell und Dunkel.
- **Integrationstest Mehrclient:** Server-Modul im Test starten (ephemerer Port), 3 `ws`-Clients, Broker über GitHub-Actions-Service-Container `eclipse-mosquitto:2` (lokal: `docker run`). Alternative ohne externen Broker: In-Memory-Broker `aedes` nur als devDependency – beides erfüllt FR-32.
- **Fake-Timer** (Vitest) für Auto-Aus (FR-5) und Tagesintegration inkl. Sommerzeit (FR-10: Testfälle 2026-03-29 und 2026-10-25).
- **Ein Workflow** (z. B. `docker-publish.yml` erweitert zu `ci-release.yml`), Trigger PR + Push main:
  1. Job `qualitaet`: Node 22, `npm ci`, `npm run lint -- --max-warnings=0`, `npx tsc --noEmit`, `npm test -- --coverage`, `npm run build` + Skript, das „First Load JS“ ≤ 200 kB prüft, `npm audit --omit=dev --audit-level=high`.
  2. Job `image` (`needs: qualitaet`, nur Push main): Multi-Arch-Build, Tags `:latest` und `:sha-‹kurz›`.
  3. Job `release` (`needs: image`, nur Push main): Version aus `package.json`; wenn Tag `v‹version›` fehlt → Tag setzen, `:‹version›` per `docker buildx imagetools create` aus dem eben gebauten Digest nachziehen, GitHub Release (`gh release create --generate-notes` + Upgrade-Hinweis) erzeugen. Alles mit `GITHUB_TOKEN` im selben Workflow – keine Folge-Trigger nötig.
  - `release.yml` (Tag-Trigger) wird entfernt; `metadata-action`-Regeln für `type=ref,event=branch` und `semver` major/minor entfallen (FR-33).
- **Kontrasttest:** Farb-Tokens (CSS-Variablen) in einer TS-Datei definieren, aus der CSS erzeugt bzw. referenziert wird, damit der Test die Paare direkt berechnen kann (NFR-2).
- **ESLint:** `no-console` (warn → dank `--max-warnings=0` faktisch Fehler) für `src/`, Ausnahme `console.error`.

## A-6 Healthcheck-Befehl

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
```
Node 22 bringt `fetch` mit; kein curl/wget nötig. Compose-Dateien können den Healthcheck-Block entfernen (Erbe aus Dockerfile) oder denselben Befehl setzen. `/api/health` sollte direkt in `server.js` beantwortet werden, weil nur dort der Brokerstatus bekannt ist; die Next-Route `src/app/api/health/route.ts` entfällt dann.

## A-7 UX-Hinweise für Sally

- **Tonalität:** ruhig, klar, freundlich; Du-Form vermeiden, neutrale Formulierungen („Verbindung getrennt“), keine Emojis als einziges Bedeutungselement (Emojis dürfen dekorativ bleiben, dann `aria-hidden`).
- **Visuelle Hierarchie:** Hausverbrauch ist die größte Zahl der Seite; Laststufe als farbige Pille mit Text; Kosten und Tageswerte kleiner darunter.
- **Animationen:** Zahl hochzählen (600 ms, ease-out), kurzer Glow am geschalteten Gerät und Raum in der Hausansicht; alles unter `prefers-reduced-motion` abschalten.
- **Symbole:** Eigene Inline-SVG-Icons (ca. 20 Stück, eine Komponente), keine neue Laufzeitabhängigkeit (NFR-4). Emojis nur dekorativ mit `aria-hidden`.
- **Dunkelmodus:** Tailwind 4 `@custom-variant dark` über `data-theme` am `<html>`, gesetzt durch ein kleines Inline-Skript im `<head>` vor dem ersten Paint (FR-28, kein Aufblitzen).

## A-8 Umfangsabschätzung (ein Tag, eine Person)

| Block | Aufwand |
|---|---|
| Domänenmodul + Unit-Tests (Katalog, Verbrauch, Energie, Szenen, Befehle) | 2,0 h |
| Server: Zustandsdienst, Protokoll, Retained-Persistenz, Auto-Aus, Health | 1,5 h |
| Client: Hook für Protokoll, Kopfbereich, Szenen, Hausansicht, Raumkarten, Dialog, Toasts, Theme, Versions-Banner | 2,75 h |
| A11y-Feinschliff + axe-Tests + Komponententests | 1,0 h |
| Integrationstests Mehrclient + Kontrasttest | 0,5 h |
| CI/Release-Workflow, Dockerfile-Healthcheck, Compose, Mosquitto-Konfig | 0,75 h |
| Doku, Aufräumen, Abnahme-Checkliste | 0,75 h |
| Puffer (CI-Fehlersuche, arm64-Build, Review-Runden) | 1,25 h |
| **Summe** | **10,5 h** |

Ein langer, aber realistischer Arbeitstag mit ausgewiesenem Puffer. Nach Review H-4 wurden Raumleiste, abgestufte Raumfüllung und die lokale Hochrechnung des Tageswerts gestrichen (PRD §6, D-31).
