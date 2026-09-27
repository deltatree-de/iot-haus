import { describe, expect, it } from 'vitest';
import { uebernimmGespeichert } from './mqtt-speicher';
import type { Gespeichert } from './zustandsdienst';

const leer = (): Gespeichert => ({ geraete: {}, energie: null, auto: null, sonne: null });
const b = (x: unknown) => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x));

describe('Restore gespeicherter Zustände (FR-17, 2.1)', () => {
  it('Auto und Sonne', () => {
    const g = leer();
    expect(uebernimmGespeichert(g, 'iot-haus/v2/auto/zustand', b({ v: 1, zuhause: false, akkuWh: 70000, stand: 5 }))).toBe(true);
    expect(g.auto).toEqual({ zuhause: false, akkuWh: 60000, stand: 5 });
    expect(uebernimmGespeichert(g, 'iot-haus/v2/solar/sonne', b({ v: 1, stufe: 'heiter', seit: 7 }))).toBe(true);
    expect(g.sonne).toEqual({ stufe: 'heiter', seit: 7 });
  });

  it.each([
    ['iot-haus/v2/auto/zustand', { v: 1, zuhause: 'ja', akkuWh: 1, stand: 1 }],
    ['iot-haus/v2/auto/zustand', { v: 1, zuhause: true, akkuWh: -1, stand: 1 }],
    ['iot-haus/v2/auto/zustand', { v: 2, zuhause: true, akkuWh: 1, stand: 1 }],
    ['iot-haus/v2/solar/sonne', { v: 1, stufe: 'gewitter', seit: 1 }],
    ['iot-haus/v2/energie/heute', { v: 2, datum: '2026-09-27', wh: 1 }],
    ['iot-haus/v2/energie/heute', { v: 3, datum: '2026-09-27', wh: 1, bezugWh: 1, einspeisungWh: 0 }],
    ['iot-haus/v2/energie/heute', 'kaputt'],
    ['iot-haus/v2/unbekannt', { v: 1 }],
  ])('ignoriert %s %j', (topic, payload) => {
    expect(uebernimmGespeichert(leer(), topic, b(payload))).toBe(false);
  });

  it('Energie v1 → Netzbezug, v2 vollständig (AC-18)', () => {
    const g = leer();
    expect(uebernimmGespeichert(g, 'iot-haus/v2/energie/heute', b({ v: 1, datum: '2026-09-27', wh: 3420, stand: 1 }))).toBe(true);
    expect(g.energie).toEqual({ datum: '2026-09-27', wh: 3420, bezugWh: 3420, einspeisungWh: 0 });
    expect(uebernimmGespeichert(g, 'iot-haus/v2/energie/heute', b({ v: 2, datum: '2026-09-27', wh: 1, bezugWh: 0.5, einspeisungWh: 2, stand: 1 }))).toBe(true);
    expect(g.energie).toEqual({ datum: '2026-09-27', wh: 1, bezugWh: 0.5, einspeisungWh: 2 });
  });
});
