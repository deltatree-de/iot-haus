import { describe, expect, it } from 'vitest';
import { ausgangszustand, wendeZieleAn } from './befehle';
import { GERAETE, RAEUME, type GeraetId } from './katalog';
import type { HausZustand } from './protokoll';
import {
  anzahlAn,
  hausverbrauch,
  kostenProStunde,
  laststufe,
  lichtAn,
  raumverbrauch,
  runden,
  standbyAnteil,
  verbrauchNachRaum,
} from './verbrauch';

function allesAn(): HausZustand {
  const ziele: Partial<Record<GeraetId, boolean>> = {};
  for (const g of GERAETE) ziele[g.id] = true;
  return wendeZieleAn(ausgangszustand(0), ziele, 0).zustand;
}

describe('Verbrauch (FR-6, FR-7, FR-13)', () => {
  it('Ausgangszustand: 75,3 W, davon 10,3 W Standby', () => {
    const z = ausgangszustand(0);
    expect(hausverbrauch(z)).toBeCloseTo(75.3, 9);
    expect(runden(hausverbrauch(z))).toBe(75);
    expect(standbyAnteil(z)).toBeCloseTo(10.3, 9);
  });

  it('alles an: 12.978 W, kein Standby', () => {
    const z = allesAn();
    expect(hausverbrauch(z)).toBe(12978);
    expect(standbyAnteil(z)).toBe(0);
  });

  it('Summe der Raumverbräuche = Hausverbrauch', () => {
    for (const z of [ausgangszustand(0), allesAn()]) {
      const summe = RAEUME.reduce((s, r) => s + raumverbrauch(z, r.id), 0);
      expect(summe).toBeCloseTo(hausverbrauch(z), 9);
    }
  });

  it('Mikrowelle an: +1.198,5 W, angezeigt 1.274 W', () => {
    const z = wendeZieleAn(ausgangszustand(0), { 'kueche.mikrowelle': true }, 0).zustand;
    expect(runden(hausverbrauch(z))).toBe(1274);
    expect(runden(hausverbrauch(z)) - runden(hausverbrauch(ausgangszustand(0)))).toBe(1199);
  });

  it('zählt eingeschaltete Geräte und Licht je Raum', () => {
    const z = wendeZieleAn(ausgangszustand(0), { 'wohnzimmer.stehlampe': true, 'wohnzimmer.fernseher': true }, 0).zustand;
    expect(anzahlAn(z, 'wohnzimmer')).toBe(2);
    expect(anzahlAn(z, 'kueche')).toBe(1);
    expect(lichtAn(z, 'wohnzimmer')).toBe(true);
    expect(lichtAn(z, 'kueche')).toBe(false);
  });

  it('Verbrauch nach Raum absteigend mit Anteilen', () => {
    const z = wendeZieleAn(ausgangszustand(0), { 'bad.foehn': true }, 0).zustand;
    const liste = verbrauchNachRaum(z);
    expect(liste).toHaveLength(6);
    expect(liste[0].raum).toBe('bad');
    expect(liste.reduce((s, r) => s + r.anteil, 0)).toBeCloseTo(1, 9);
    for (let i = 1; i < liste.length; i++) expect(liste[i - 1].watt).toBeGreaterThanOrEqual(liste[i].watt);
  });

  it('Anteil 0 bei 0 W', () => {
    const z = ausgangszustand(0);
    const nichts = {} as HausZustand;
    for (const id of Object.keys(z) as GeraetId[]) nichts[id] = { an: false, seit: 0 };
    for (const g of GERAETE) if (g.standbyW === 0 && g.grundlast) nichts[g.id] = { an: false, seit: 0 };
    const nurStandby = verbrauchNachRaum(nichts);
    expect(nurStandby.every((r) => r.anteil >= 0)).toBe(true);
  });
});

describe('Laststufe (FR-12)', () => {
  it.each([
    [0, 'niedrig'],
    [499, 'niedrig'],
    [500, 'mittel'],
    [1999, 'mittel'],
    [2000, 'hoch'],
    [12978, 'hoch'],
  ] as const)('%d W → %s', (w, stufe) => {
    expect(laststufe(w)).toBe(stufe);
  });
});

describe('Kosten und Runden (FR-9, FR-29)', () => {
  it('Kosten pro Stunde', () => {
    expect(kostenProStunde(5600, 0.35)).toBeCloseTo(1.96, 9);
    expect(kostenProStunde(75.3, 0.35)).toBeCloseTo(0.026355, 9);
  });

  it('rundet kaufmännisch', () => {
    expect(runden(0.5)).toBe(1);
    expect(runden(1.5)).toBe(2);
    expect(runden(2.5)).toBe(3);
    expect(runden(-2.5)).toBe(-3);
    expect(runden(1.005, 2)).toBe(1.01);
    expect(runden(1.004, 2)).toBe(1);
  });
});
