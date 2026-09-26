import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GeraetId } from '../src/domain/katalog';
import type { Energie, GeraeteZustand, ServerNachricht } from '../src/domain/protokoll';
import { stillerLog } from './log';
import { Zustandsdienst, type Gespeichert } from './zustandsdienst';

const START = Date.parse('2026-09-26T10:00:00Z');

function baue(gespeichert: Gespeichert = { geraete: {}, energie: null }) {
  const nachrichten: ServerNachricht[] = [];
  const geraete = new Map<GeraetId, GeraeteZustand>();
  const energien: Energie[] = [];
  const dienst = new Zustandsdienst({
    gespeichert,
    persistenz: {
      speichereGeraet: (id, z) => void geraete.set(id, z),
      speichereEnergie: async (e) => void energien.push(e),
    },
    verteile: (n) => void nachrichten.push(n),
    jetzt: () => Date.now(),
    log: stillerLog,
  });
  dienst.starte();
  return { dienst, nachrichten, geraete, energien };
}

describe('Zustandsdienst', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });
  afterEach(() => vi.useRealTimers());

  it('startet im Ausgangszustand und speichert alles (FR-4, FR-17)', () => {
    const { dienst, geraete, energien } = baue();
    expect(geraete.size).toBe(28);
    expect(dienst.aktuellerZustand()['kueche.kuehlschrank'].an).toBe(true);
    expect(energien.at(-1)).toEqual({ datum: '2026-09-26', wh: 0 });
  });

  it('übernimmt gespeicherte Zustände und Energie desselben Tages', () => {
    const { dienst } = baue({
      geraete: { 'bad.foehn': { an: true, seit: START - 1000 } },
      energie: { datum: '2026-09-26', wh: 1234 },
    });
    expect(dienst.aktuellerZustand()['bad.foehn'].an).toBe(true);
    expect(dienst.aktuelleEnergie().wh).toBe(1234);
  });

  it('begrenzt Zeitpunkte aus der Zukunft auf jetzt (Review CR-11)', () => {
    const { dienst } = baue({ geraete: { 'kueche.wasserkocher': { an: true, seit: START + 3_600_000 } }, energie: null });
    expect(dienst.aktuellerZustand()['kueche.wasserkocher'].seit).toBe(START);
    vi.advanceTimersByTime(180_000);
    expect(dienst.aktuellerZustand()['kueche.wasserkocher'].an).toBe(false);
  });

  it('zählt Uhrsprünge nicht als Verbrauch (Review CR-12)', () => {
    const { dienst } = baue();
    vi.setSystemTime(START + 5 * 3_600_000); // Uhr springt 5 h vor, ohne dass Timer liefen
    dienst.fuehreAus({ typ: 'schalten', id: 'a', geraet: 'bad.foehn', an: true });
    // höchstens 2 min mit 75,3 W
    expect(dienst.aktuelleEnergie().wh).toBeCloseTo((75.3 * 2) / 60, 6);
  });

  it('verwirft Energie eines anderen Tages', () => {
    const { dienst } = baue({ geraete: {}, energie: { datum: '2026-09-25', wh: 999 } });
    expect(dienst.aktuelleEnergie()).toEqual({ datum: '2026-09-26', wh: 0 });
  });

  it('verteilt genau eine Änderung je Befehl und speichert geänderte Geräte', () => {
    const { dienst, nachrichten, geraete, energien } = baue();
    geraete.clear();
    const energieVorher = energien.length;
    expect(dienst.fuehreAus({ typ: 'szene', id: 'b1', szene: 'morgenroutine' })).toBe(true);
    expect(nachrichten).toHaveLength(1);
    const n = nachrichten[0];
    expect(n.typ).toBe('aenderung');
    if (n.typ === 'aenderung') {
      expect(n.ursache).toEqual({ art: 'szene', ref: 'morgenroutine', befehlId: 'b1' });
      expect(Object.keys(n.geraete)).toHaveLength(6);
    }
    expect(geraete.size).toBe(6);
    expect(energien.length).toBe(energieVorher); // Energie nur im Takt (Review CR-01)
    expect(dienst.fuehreAus({ typ: 'szene', id: 'b2', szene: 'morgenroutine' })).toBe(false);
    expect(nachrichten).toHaveLength(1);
  });

  it('Ursachen für Schalten und Raum ausschalten', () => {
    const { dienst, nachrichten } = baue();
    dienst.fuehreAus({ typ: 'schalten', id: 'a', geraet: 'kueche.backofen', an: true });
    dienst.fuehreAus({ typ: 'raumAus', id: 'b', raum: 'kueche' });
    expect(nachrichten.map((n) => (n.typ === 'aenderung' ? n.ursache : null))).toEqual([
      { art: 'geraet', ref: 'kueche.backofen', befehlId: 'a' },
      { art: 'raumAus', ref: 'kueche', befehlId: 'b' },
    ]);
  });

  it('integriert Energie mit der alten Leistung (FR-10)', () => {
    const { dienst } = baue();
    dienst.fuehreAus({ typ: 'schalten', id: 'a', geraet: 'kueche.backofen', an: true }); // +1.999 W
    vi.advanceTimersByTime(30 * 60_000);
    dienst.fuehreAus({ typ: 'schalten', id: 'b', geraet: 'kueche.backofen', an: false });
    // 30 min mit 75,3 W - 1 W Standby + 2.000 W = 2.074,3 W → 1.037,15 Wh
    expect(dienst.aktuelleEnergie().wh).toBeCloseTo(1037.15, 6);
  });

  it('sendet mindestens alle 60 s eine Energie-Nachricht', () => {
    const { nachrichten, energien } = baue();
    vi.advanceTimersByTime(60_000);
    expect(nachrichten.filter((n) => n.typ === 'energie')).toHaveLength(1);
    vi.advanceTimersByTime(60_000);
    expect(nachrichten.filter((n) => n.typ === 'energie')).toHaveLength(2);
    expect(energien.at(-1)!.wh).toBeCloseTo((75.3 * 2) / 60, 6);
  });

  it('setzt den Tagesverbrauch um Mitternacht (Berlin) zurück', () => {
    vi.setSystemTime(Date.parse('2026-09-26T21:59:30Z')); // 23:59:30 MESZ
    const { dienst, nachrichten } = baue({ geraete: {}, energie: { datum: '2026-09-26', wh: 5000 } });
    vi.advanceTimersByTime(30_000);
    const letzte = nachrichten.filter((n) => n.typ === 'energie').at(-1);
    expect(letzte && letzte.typ === 'energie' && letzte.energie).toEqual({ datum: '2026-09-27', wh: 0 });
    vi.advanceTimersByTime(60_000);
    expect(dienst.aktuelleEnergie().datum).toBe('2026-09-27');
    expect(dienst.aktuelleEnergie().wh).toBeCloseTo(75.3 / 60, 6);
  });

  it('Auto-Aus nach 180 s (FR-5)', () => {
    const { dienst, nachrichten } = baue();
    dienst.fuehreAus({ typ: 'schalten', id: 'a', geraet: 'kueche.wasserkocher', an: true });
    vi.advanceTimersByTime(179_000);
    expect(dienst.aktuellerZustand()['kueche.wasserkocher'].an).toBe(true);
    vi.advanceTimersByTime(1_000);
    expect(dienst.aktuellerZustand()['kueche.wasserkocher'].an).toBe(false);
    const letzte = nachrichten.filter((n) => n.typ === 'aenderung').at(-1);
    expect(letzte && letzte.typ === 'aenderung' && letzte.ursache).toEqual({
      art: 'autoAus',
      ref: 'kueche.wasserkocher',
      befehlId: null,
    });
  });

  it('Aus- und wieder Einschalten startet Auto-Aus neu; Szene lässt die Restzeit', () => {
    const { dienst } = baue();
    dienst.fuehreAus({ typ: 'schalten', id: 'a', geraet: 'kueche.mikrowelle', an: true });
    vi.advanceTimersByTime(100_000);
    dienst.fuehreAus({ typ: 'schalten', id: 'b', geraet: 'kueche.mikrowelle', an: false });
    dienst.fuehreAus({ typ: 'schalten', id: 'c', geraet: 'kueche.mikrowelle', an: true });
    vi.advanceTimersByTime(179_000);
    expect(dienst.aktuellerZustand()['kueche.mikrowelle'].an).toBe(true);
    vi.advanceTimersByTime(1_000);
    expect(dienst.aktuellerZustand()['kueche.mikrowelle'].an).toBe(false);

    dienst.fuehreAus({ typ: 'schalten', id: 'd', geraet: 'kueche.wasserkocher', an: true });
    vi.advanceTimersByTime(100_000);
    dienst.fuehreAus({ typ: 'szene', id: 'e', szene: 'morgenroutine' });
    vi.advanceTimersByTime(80_000);
    expect(dienst.aktuellerZustand()['kueche.wasserkocher'].an).toBe(false);
  });

  it('nach Neustart: Restzeit läuft weiter bzw. sofort aus', () => {
    const { dienst: a } = baue({ geraete: { 'kueche.wasserkocher': { an: true, seit: START - 170_000 } }, energie: null });
    vi.advanceTimersByTime(9_999);
    expect(a.aktuellerZustand()['kueche.wasserkocher'].an).toBe(true);
    vi.advanceTimersByTime(1);
    expect(a.aktuellerZustand()['kueche.wasserkocher'].an).toBe(false);

    const { dienst: b } = baue({ geraete: { 'kueche.mikrowelle': { an: true, seit: Date.now() - 999_000 } }, energie: null });
    vi.advanceTimersByTime(0);
    expect(b.aktuellerZustand()['kueche.mikrowelle'].an).toBe(false);
  });

  it('stoppe beendet Timer und sichert Energie', async () => {
    const { dienst, energien, nachrichten } = baue();
    dienst.fuehreAus({ typ: 'schalten', id: 'a', geraet: 'kueche.wasserkocher', an: true });
    vi.advanceTimersByTime(10_000);
    const vorher = energien.length;
    await dienst.stoppe();
    expect(energien.length).toBe(vorher + 1);
    const anzahl = nachrichten.length;
    vi.advanceTimersByTime(600_000);
    expect(nachrichten.length).toBe(anzahl);
  });

  it('Snapshot enthält Version, Strompreis und Serverzeit', () => {
    const { dienst } = baue();
    const s = dienst.snapshot('2.0.0', 0.35);
    expect(s).toMatchObject({ typ: 'snapshot', version: '2.0.0', strompreis: 0.35, serverZeit: START });
  });
});
