# Auftrag des Stakeholders (Deltatree), 2026-09-26

Wörtlich: "deep dive scan des projektes - dann pimpe es zu bestuserxperience ever - es soll z.B. auch angezeigt werden,
was das haus gerade verbraucht, wenn man was anschaltet - adde auch nicht nur lichter sondern auch mikrowelle, fernseher,
und viele weitere sachen - lass dies das bmad team analysieren und planen - es wird nichts vertagt! 100% autonom bis prod
ausbringen per github action! reviews durch bmad team und alle fragen beantwortet dieses team"

## Spielregeln für das BMAD-Team
- Der Stakeholder steht NICHT für Rückfragen zur Verfügung. Jede offene Frage entscheidet das Team selbst
  (begründet, im jeweiligen Artefakt als Entscheidung dokumentiert). Headless-Modus verwenden.
- "Es wird nichts vertagt": kein "Phase 2", kein "Out of scope later", kein "Future work" für Dinge, die zum Auftrag gehören.
  Alles, was geplant wird, wird in diesem Release umgesetzt. Scope daher so wählen, dass er vollständig lieferbar ist.
- Sprache der Artefakte und der UI: Deutsch.
- Prod = Push auf main -> GitHub Action baut Multi-Arch-Image ghcr.io/deltatree-de/iot-haus:latest (wird produktiv
  per docker-compose mit :latest betrieben) + Release-Tag v* erzeugt GitHub Release.
- Sicherheitshärtung aus PR #1/#2 (Node 22, USER 1000:1000, kein npm/wget/curl im Runtime-Image) darf nicht zurückgedreht werden.

## Ist-Zustand (Kurzfassung, Details: Code lesen)
- Next.js 15.5 (App Router, React 19, Tailwind 4, TS), Custom server.js mit WebSocket-MQTT-Proxy (/mqtt), Mosquitto im
  selben Container (supervisord). Keine Tests, kein Lint in CI.
- Haus: 2 Etagen x 2 Räume (Wohnzimmer, Küche, Schlafzimmer, Bad), pro Raum nur ein Licht (boolean).
- Topics smarthome/<roomId>/light, Payload {roomId,isOn,timestamp,clientId}.
- Zustand je Browser in localStorage; beim Connect publiziert JEDER Client seinen lokalen Stand -> überschreibt fremden
  Zustand (Bug: kein autoritativer Server-Zustand, keine retained messages).
- Viele console.logs, toter Code (useMockMqtt, shouldUseMock=false), Doku (README etc.) teils veraltet.
- docker-compose.prod.yml healthcheck nutzt curl, das im gehärteten Image nicht existiert.
