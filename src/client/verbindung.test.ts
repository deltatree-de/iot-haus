import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HausVerbindung, standardUrl, wartezeit, type Status } from './verbindung';

class FakeSocket {
  static alle: FakeSocket[] = [];
  readyState = 0;
  gesendet: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  constructor(public url: string) {
    FakeSocket.alle.push(this);
  }
  send(d: string) {
    this.gesendet.push(d);
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  oeffne() {
    this.readyState = 1;
    this.onopen?.();
  }
  empfange(n: object) {
    this.onmessage?.({ data: JSON.stringify(n) });
  }
}

function baue() {
  const status: Status[] = [];
  const nachrichten: unknown[] = [];
  const v = new HausVerbindung({
    url: 'ws://haus/mqtt',
    beiNachricht: (n) => nachrichten.push(n),
    beiStatus: (s) => status.push(s),
    erzeugeSocket: (u) => new FakeSocket(u) as unknown as WebSocket,
  });
  return { v, status, nachrichten };
}

describe('HausVerbindung (FR-20)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeSocket.alle = [];
  });
  afterEach(() => vi.useRealTimers());

  it('URL folgt dem eigenen Host', () => {
    expect(standardUrl({ protocol: 'http:', host: 'haus:3000' })).toBe('ws://haus:3000/mqtt');
    expect(standardUrl({ protocol: 'https:', host: 'haus.example' })).toBe('wss://haus.example/mqtt');
  });

  it('Backoff 1, 2, 4, 8, dann 10 s', () => {
    expect([0, 1, 2, 3, 4, 9].map(wartezeit)).toEqual([1000, 2000, 4000, 8000, 10000, 10000]);
  });

  it('verbindet, meldet verbunden erst mit Snapshot und sendet nur dann', () => {
    const { v, status, nachrichten } = baue();
    v.starte();
    const s = FakeSocket.alle[0];
    expect(v.sende({ typ: 'szene', id: 'a', szene: 'filmabend' })).toBe(false);
    s.oeffne();
    expect(status).toEqual(['verbinde']);
    s.empfange({ typ: 'snapshot' });
    expect(status).toEqual(['verbinde', 'verbunden']);
    expect(nachrichten).toHaveLength(1);
    expect(v.sende({ typ: 'szene', id: 'a', szene: 'filmabend' })).toBe(true);
    expect(s.gesendet).toHaveLength(1);
    v.beende();
  });

  it('verbindet nach Trennung mit Backoff neu', () => {
    const { v, status } = baue();
    v.starte();
    FakeSocket.alle[0].close();
    expect(status.at(-1)).toBe('getrennt');
    vi.advanceTimersByTime(999);
    expect(FakeSocket.alle).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(FakeSocket.alle).toHaveLength(2);
    FakeSocket.alle[1].close();
    vi.advanceTimersByTime(2000);
    expect(FakeSocket.alle).toHaveLength(3);
    v.beende();
  });

  it('ohne Snapshot binnen 5 s bzw. ohne Lebenszeichen 75 s → schließen', () => {
    const { v, status } = baue();
    v.starte();
    FakeSocket.alle[0].oeffne();
    vi.advanceTimersByTime(5000);
    expect(status.at(-1)).toBe('getrennt');
    vi.advanceTimersByTime(1000);
    const s = FakeSocket.alle[1];
    s.oeffne();
    s.empfange({ typ: 'snapshot' });
    vi.advanceTimersByTime(74_000);
    expect(status.at(-1)).toBe('verbunden');
    vi.advanceTimersByTime(1000);
    expect(status.at(-1)).toBe('getrennt');
    v.beende();
  });

  it('„Jetzt neu verbinden“ versucht sofort; ignoriert kaputtes JSON', () => {
    const { v, nachrichten } = baue();
    v.starte();
    FakeSocket.alle[0].close();
    v.jetztVerbinden();
    expect(FakeSocket.alle).toHaveLength(2);
    v.jetztVerbinden(); // läuft schon
    expect(FakeSocket.alle).toHaveLength(2);
    FakeSocket.alle[1].onmessage?.({ data: '{kaputt' });
    expect(nachrichten).toHaveLength(0);
    v.beende();
    vi.advanceTimersByTime(60_000);
    expect(FakeSocket.alle).toHaveLength(2);
  });
});
