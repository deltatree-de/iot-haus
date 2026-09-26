import { describe, expect, it } from 'vitest';
import { berlinDatum, integriere, mitternachtBerlin, naechsteMitternachtBerlin } from './energie';
import * as f from './format';

const STUNDE = 3_600_000;

describe('Tagesenergie (FR-10)', () => {
  it('2.000 W über 30 min = 1,00 kWh', () => {
    const start = Date.parse('2026-09-26T08:00:00Z');
    const e = integriere({ datum: '2026-09-26', wh: 0 }, 2000, start, start + STUNDE / 2);
    expect(e.wh).toBeCloseTo(1000, 6);
    expect(f.kwh(e.wh)).toBe('1,00 kWh');
  });

  it('addiert am selben Tag', () => {
    const t = Date.parse('2026-09-26T10:00:00Z');
    expect(integriere({ datum: '2026-09-26', wh: 500 }, 1000, t, t + STUNDE)).toEqual({ datum: '2026-09-26', wh: 1500 });
  });

  it('keine vergangene Zeit ändert nichts, anderer Tag setzt zurück', () => {
    const t = Date.parse('2026-09-26T10:00:00Z');
    const e = { datum: '2026-09-26', wh: 5 };
    expect(integriere(e, 1000, t, t)).toBe(e);
    expect(integriere({ datum: '2026-09-25', wh: 5 }, 1000, t, t)).toEqual({ datum: '2026-09-26', wh: 0 });
  });

  it('Berliner Datum und Mitternacht (Sommerzeit)', () => {
    // 2026-09-26 22:30 UTC = 2026-09-27 00:30 MESZ
    expect(berlinDatum(Date.parse('2026-09-26T22:30:00Z'))).toBe('2026-09-27');
    expect(berlinDatum(Date.parse('2026-09-26T21:59:59Z'))).toBe('2026-09-26');
    expect(mitternachtBerlin('2026-09-27')).toBe(Date.parse('2026-09-26T22:00:00Z'));
    expect(naechsteMitternachtBerlin(Date.parse('2026-09-26T12:00:00Z'))).toBe(Date.parse('2026-09-26T22:00:00Z'));
  });

  it('Winterzeit: Mitternacht ist 23:00 UTC', () => {
    expect(mitternachtBerlin('2026-12-24')).toBe(Date.parse('2026-12-23T23:00:00Z'));
  });

  it('Integration über Mitternacht zählt nur den neuen Tag', () => {
    const von = Date.parse('2026-09-26T21:30:00Z'); // 23:30 MESZ
    const bis = Date.parse('2026-09-26T22:30:00Z'); // 00:30 MESZ
    expect(integriere({ datum: '2026-09-26', wh: 999 }, 1000, von, bis)).toEqual({ datum: '2026-09-27', wh: 500 });
  });

  it('Umstellung auf Sommerzeit 2026-03-29: 23-h-Tag', () => {
    const beginn = mitternachtBerlin('2026-03-29');
    const ende = naechsteMitternachtBerlin(beginn);
    expect(beginn).toBe(Date.parse('2026-03-28T23:00:00Z'));
    expect(ende - beginn).toBe(23 * STUNDE);
    const e = integriere({ datum: '2026-03-29', wh: 0 }, 1000, beginn, ende - 1);
    expect(e.datum).toBe('2026-03-29');
    expect(e.wh).toBeCloseTo(23000, 0);
  });

  it('Umstellung auf Winterzeit 2026-10-25: 25-h-Tag', () => {
    const beginn = mitternachtBerlin('2026-10-25');
    const ende = naechsteMitternachtBerlin(beginn);
    expect(beginn).toBe(Date.parse('2026-10-24T22:00:00Z'));
    expect(ende - beginn).toBe(25 * STUNDE);
    expect(berlinDatum(ende)).toBe('2026-10-26');
  });
});

describe('Formatierung de-DE (FR-29)', () => {
  it('formatiert Leistung, Kosten, Energie', () => {
    expect(f.watt(1200)).toBe('1.200 W');
    expect(f.watt(75.3)).toBe('75 W');
    expect(f.watt(0.5)).toBe('1 W');
    expect(f.wattGesprochen(1274)).toBe('1.274 Watt');
    expect(f.wattEineStelle(0.5)).toBe('0,5 W');
    expect(f.wattEineStelle(10.3)).toBe('10,3 W');
    expect(f.wattDifferenz(1199)).toBe('+1.199 W');
    expect(f.wattDifferenz(-2200)).toBe('−2.200 W');
    expect(f.euroProStunde(1.96)).toBe('1,96 €/h');
    expect(f.euroProStunde(0.026355)).toBe('0,03 €/h');
    expect(f.euro(1.2)).toBe('1,20 €');
    expect(f.strompreis(0.35)).toBe('0,35 €/kWh');
    expect(f.kwh(3420)).toBe('3,42 kWh');
    expect(f.prozent(0.425)).toBe('43 %');
  });

  it('formatiert die Restzeit', () => {
    expect(f.restzeit(168)).toBe('noch 2:48');
    expect(f.restzeit(180)).toBe('noch 3:00');
    expect(f.restzeit(0.2)).toBe('noch 0:01');
    expect(f.restzeit(-5)).toBe('noch 0:00');
  });

  it('kein negatives Null', () => {
    expect(f.wattEineStelle(-0.01)).toBe('0,0 W');
  });
});
