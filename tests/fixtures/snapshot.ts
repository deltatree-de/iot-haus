// Snapshot-Fixture für Reducer- und Komponententests.
import { ausgangszustand, wendeZieleAn } from '../../src/domain/befehle';
import type { ServerNachricht } from '../../src/domain/protokoll';
import type { SonnenStufe } from '../../src/domain/solar';
import { anfangszustand, hausReducer, type ClientZustand } from '../../src/client/hausReducer';

export const SERVER_ZEIT = Date.parse('2026-09-26T06:30:00Z');

export function snapshot(extra: Partial<Extract<ServerNachricht, { typ: 'snapshot' }>> = {}): ServerNachricht {
  const zustand = wendeZieleAn(
    ausgangszustand(SERVER_ZEIT - 60_000),
    { 'wohnzimmer.stehlampe': true, 'kueche.wasserkocher': true },
    SERVER_ZEIT - 12_000,
  ).zustand;
  return {
    typ: 'snapshot',
    version: '2.1.0',
    zustand,
    auto: { zuhause: true, akkuWh: 30000, stand: SERVER_ZEIT },
    sonne: { stufe: 'nacht', seit: SERVER_ZEIT - 60_000 },
    energie: { datum: '2026-09-26', wh: 3420, bezugWh: 3420, einspeisungWh: 0 },
    strompreis: 0.35,
    einspeiseverguetung: 0.08,
    serverZeit: SERVER_ZEIT,
    ...extra,
  };
}

/** Zweite Fixture (Proposal T-13/AC-22): Auto lädt bei 64 %, Sonne „Heiter“. */
export function snapshotLaedt(stufe: SonnenStufe = 'heiter'): ServerNachricht {
  const basis = snapshot();
  if (basis.typ !== 'snapshot') throw new Error('Fixture');
  return {
    ...basis,
    zustand: wendeZieleAn(basis.zustand, { 'carport.wallbox': true }, SERVER_ZEIT - 5000).zustand,
    auto: { zuhause: true, akkuWh: 38400, stand: SERVER_ZEIT },
    sonne: { stufe, seit: SERVER_ZEIT - 5000 },
    energie: { datum: '2026-09-26', wh: 5200, bezugWh: 2100, einspeisungWh: 4300 },
  };
}

export function verbundenerZustand(version = '2.1.0', nachricht: ServerNachricht = snapshot()): ClientZustand {
  return hausReducer(anfangszustand(), {
    typ: 'nachricht',
    nachricht,
    jetzt: SERVER_ZEIT,
    clientVersion: version,
  });
}
