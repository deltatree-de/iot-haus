import { describe, expect, it } from 'vitest';
import { GERAETE, KATEGORIE_NAMEN, RAEUME, geraeteImRaum, istGeraetId, istRaumId } from './katalog';

// PRD Anhang A als Fixture: id, Name, Raum, Kategorie, Betrieb, Standby, Merkmal
const ANHANG_A: [string, string, string, string, number, number, '' | 'G' | 'A'][] = [
  ['wohnzimmer.deckenlampe', 'Deckenlampe', 'wohnzimmer', 'licht', 15, 0, ''],
  ['wohnzimmer.stehlampe', 'Stehlampe', 'wohnzimmer', 'licht', 10, 0, ''],
  ['wohnzimmer.fernseher', 'Fernseher', 'wohnzimmer', 'unterhaltung', 90, 0.5, ''],
  ['wohnzimmer.soundbar', 'Soundbar', 'wohnzimmer', 'unterhaltung', 25, 0.5, ''],
  ['wohnzimmer.spielkonsole', 'Spielkonsole', 'wohnzimmer', 'unterhaltung', 180, 1.5, ''],
  ['kueche.deckenlampe', 'Deckenlampe', 'kueche', 'licht', 15, 0, ''],
  ['kueche.kuehlschrank', 'Kühlschrank', 'kueche', 'kueche', 35, 0, 'G'],
  ['kueche.mikrowelle', 'Mikrowelle', 'kueche', 'kueche', 1200, 1.5, 'A'],
  ['kueche.backofen', 'Backofen', 'kueche', 'kueche', 2000, 1, ''],
  ['kueche.wasserkocher', 'Wasserkocher', 'kueche', 'kueche', 2200, 0, 'A'],
  ['kueche.kaffeemaschine', 'Kaffeemaschine', 'kueche', 'kueche', 1300, 1, ''],
  ['kueche.geschirrspueler', 'Geschirrspüler', 'kueche', 'haushalt', 600, 0.5, ''],
  ['hwr.deckenlampe', 'Deckenlampe', 'hwr', 'licht', 10, 0, ''],
  ['hwr.waschmaschine', 'Waschmaschine', 'hwr', 'haushalt', 500, 0.5, ''],
  ['hwr.waeschetrockner', 'Wäschetrockner', 'hwr', 'haushalt', 700, 0.5, ''],
  ['hwr.gefrierschrank', 'Gefrierschrank', 'hwr', 'kueche', 20, 0, 'G'],
  ['schlafzimmer.deckenlampe', 'Deckenlampe', 'schlafzimmer', 'licht', 12, 0, ''],
  ['schlafzimmer.nachttischlampe', 'Nachttischlampe', 'schlafzimmer', 'licht', 5, 0, ''],
  ['schlafzimmer.fernseher', 'Fernseher', 'schlafzimmer', 'unterhaltung', 40, 0.5, ''],
  ['bad.deckenlampe', 'Deckenlampe', 'bad', 'licht', 10, 0, ''],
  ['bad.spiegelleuchte', 'Spiegelleuchte', 'bad', 'licht', 8, 0, ''],
  ['bad.foehn', 'Föhn', 'bad', 'koerperpflege', 1800, 0, ''],
  ['bad.heizluefter', 'Heizlüfter', 'bad', 'heizung', 2000, 0, ''],
  ['arbeitszimmer.deckenlampe', 'Deckenlampe', 'arbeitszimmer', 'licht', 12, 0, ''],
  ['arbeitszimmer.schreibtischlampe', 'Schreibtischlampe', 'arbeitszimmer', 'licht', 6, 0, ''],
  ['arbeitszimmer.pc', 'PC', 'arbeitszimmer', 'it', 150, 2, ''],
  ['arbeitszimmer.monitor', 'Monitor', 'arbeitszimmer', 'it', 25, 0.3, ''],
  ['arbeitszimmer.router', 'Router', 'arbeitszimmer', 'it', 10, 0, 'G'],
];

describe('Gerätekatalog (FR-1, FR-2)', () => {
  it('hat genau 6 Räume mit IDs, Namen und Etagen', () => {
    expect(RAEUME.map((r) => [r.id, r.name, r.etage])).toEqual([
      ['wohnzimmer', 'Wohnzimmer', 'EG'],
      ['kueche', 'Küche', 'EG'],
      ['hwr', 'Hauswirtschaftsraum', 'EG'],
      ['schlafzimmer', 'Schlafzimmer', 'OG'],
      ['bad', 'Badezimmer', 'OG'],
      ['arbeitszimmer', 'Arbeitszimmer', 'OG'],
    ]);
  });

  it('entspricht exakt Anhang A', () => {
    const ist = GERAETE.map((g) => [
      g.id,
      g.name,
      g.raum,
      g.kategorie,
      g.betriebW,
      g.standbyW,
      g.grundlast ? 'G' : g.autoAusS ? 'A' : '',
    ]);
    expect(ist).toEqual(ANHANG_A);
  });

  it('hat eindeutige IDs und gültige Leistungswerte', () => {
    expect(new Set(GERAETE.map((g) => g.id)).size).toBe(28);
    for (const g of GERAETE) {
      expect(g.betriebW).toBeGreaterThan(0);
      expect(g.standbyW).toBeGreaterThanOrEqual(0);
      expect(g.standbyW).toBeLessThan(g.betriebW);
      expect(Object.keys(KATEGORIE_NAMEN)).toContain(g.kategorie);
      expect(g.id.startsWith(`${g.raum}.`)).toBe(true);
    }
  });

  it('hat mindestens 3 Geräte je Raum und die Kontrollsummen', () => {
    const anzahl = RAEUME.map((r) => geraeteImRaum(r.id).length);
    expect(anzahl).toEqual([5, 7, 4, 3, 4, 5]);
    expect(Math.min(...anzahl)).toBeGreaterThanOrEqual(3);
  });

  it('Auto-Aus nur für Wasserkocher und Mikrowelle mit 180 s', () => {
    const autoAus = GERAETE.filter((g) => g.autoAusS !== null);
    expect(autoAus.map((g) => [g.id, g.autoAusS])).toEqual([
      ['kueche.mikrowelle', 180],
      ['kueche.wasserkocher', 180],
    ]);
  });

  it('erkennt gültige und ungültige IDs', () => {
    expect(istGeraetId('kueche.mikrowelle')).toBe(true);
    expect(istGeraetId('kueche.toaster')).toBe(false);
    expect(istGeraetId(42)).toBe(false);
    expect(istRaumId('bad')).toBe(true);
    expect(istRaumId('keller')).toBe(false);
  });
});
