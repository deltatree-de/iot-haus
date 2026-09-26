// Snapshot-Fixture für Reducer- und Komponententests.
import { ausgangszustand, wendeZieleAn } from '../../src/domain/befehle';
import type { ServerNachricht } from '../../src/domain/protokoll';
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
    version: '2.0.0',
    zustand,
    energie: { datum: '2026-09-26', wh: 3420 },
    strompreis: 0.35,
    serverZeit: SERVER_ZEIT,
    ...extra,
  };
}

export function verbundenerZustand(version = '2.0.0'): ClientZustand {
  return hausReducer(anfangszustand(), {
    typ: 'nachricht',
    nachricht: snapshot(),
    jetzt: SERVER_ZEIT,
    clientVersion: version,
  });
}
