import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GeraetId } from '../src/domain/katalog';
import type { AutoZustand } from '../src/domain/elektroauto';
import type { Energie, GeraeteZustand, ServerNachricht } from '../src/domain/protokoll';
import type { SonnenZustand } from '../src/domain/solar';
import { stillerLog } from './log';
import { Zustandsdienst, type Gespeichert } from './zustandsdienst';

const START = Date.parse('2026-09-26T10:00:00Z');

const LEER: Gespeichert = { geraete: {}, energie: null, auto: null, sonne: null };

function baue(teil: Partial<Gespeichert> = {}) {
  const gespeichert: Gespeichert = { ...LEER, ...teil };
  const nachrichten: ServerNachricht[] = [];
  const geraete = new Map<GeraetId, GeraeteZustand>();
  const energien: Energie[] = [];
  const autos: AutoZustand[] = [];
  const sonnen: SonnenZustand[] = [];
  const dienst = new Zustandsdienst({
    gespeichert,
    persistenz: {
      speichereGeraet: (id, z) => void geraete.set(id, z),
      speichereEnergie: async (e) => void energien.push(e),
      speichereAuto: async (a) => void autos.push(a),
      speichereSonne: (s) => void sonnen.push(s),
    },
    verteile: (n) => void nachrichten.push(n),
    jetzt: () => Date.now(),
    log: stillerLog,
  });
  dienst.starte();
  return { dienst, nachrichten, geraete, energien, autos, sonnen };
}

describe('Zustandsdienst', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });
  afterEach(() => vi.useRealTimers());

  it('startet im Ausgangszustand und speichert alles (FR-4, FR-17)', () => {
    const { dienst, geraete, energien } = baue();
    expect(geraete.size).toBe(29);
    expect(dienst.aktuellerZustand()['kueche.kuehlschrank'].an).toBe(true);
    expect(energien.at(-1)).toEqual({ datum: '2026-09-26', wh: 0, bezugWh: 0, einspeisungWh: 0 });
  });

  it('übernimmt gespeicherte Zustände und Energie desselben Tages', () => {
    const { dienst } = baue({
      geraete: { 'bad.foehn': { an: true, seit: START - 1000 } },
      energie: { datum: '2026-09-26', wh: 1234, bezugWh: 1234, einspeisungWh: 0 },
    });
    expect(dienst.aktuellerZustand()['bad.foehn'].an).toBe(true);
    expect(dienst.aktuelleEnergie().wh).toBe(1234);
  });

  it('begrenzt Zeitpunkte aus der Zukunft auf jetzt (Review CR-11)', () => {
    const { dienst } = baue({ geraete: { 'kueche.wasserkocher': { an: true, seit: START + 3_600_000 } } });
    expect(dienst.aktuellerZustand()['kueche.wasserkocher'].seit).toBe(START);
    vi.advanceTimersByTime(180_000);
    expect(dienst.aktuellerZustand()['kueche.wasserkocher'].an).toBe(false);
  });

  it('zählt Uhrsprünge nicht als Verbrauch (Review CR-12)', () => {
    const { dienst } = baue();
    vi.setSystemTime(START + 5 * 3_600_000); // Uhr springt 5 h vor, ohne dass Timer liefen
    dienst.fuehreAus({ typ: 'schalten', id: 'a', geraet: 'bad.foehn', an: true });
    // höchstens 2 min mit 75,3 W
    expect(dienst.aktuelleEnergie().wh).toBeCloseTo((78.3 * 2) / 60, 6);
  });

  it('verwirft Energie eines anderen Tages', () => {
    const { dienst } = baue({ energie: { datum: '2026-09-25', wh: 999, bezugWh: 999, einspeisungWh: 0 } });
    expect(dienst.aktuelleEnergie()).toEqual({ datum: '2026-09-26', wh: 0, bezugWh: 0, einspeisungWh: 0 });
  });

  it('verteilt genau eine Änderung je Befehl und speichert geänderte Geräte', () => {
    const { dienst, nachrichten, geraete, energien } = baue();
    geraete.clear();
    const energieVorher = energien.length;
    expect(dienst.fuehreAus({ typ: 'szene', id: 'b1', szene: 'morgenroutine' })).toEqual({ ok: true, geaendert: true });
    expect(nachrichten).toHaveLength(1);
    const n = nachrichten[0];
    expect(n.typ).toBe('aenderung');
    if (n.typ === 'aenderung') {
      expect(n.ursache).toEqual({ art: 'szene', ref: 'morgenroutine', befehlId: 'b1' });
      expect(Object.keys(n.geraete)).toHaveLength(6);
    }
    expect(geraete.size).toBe(6);
    expect(energien.length).toBe(energieVorher); // Energie nur im Takt (Review CR-01)
    expect(dienst.fuehreAus({ typ: 'szene', id: 'b2', szene: 'morgenroutine' })).toEqual({ ok: true, geaendert: false });
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
    // 30 min mit 78,3 W - 1 W Standby + 2.000 W = 2.077,3 W → 1.038,65 Wh
    expect(dienst.aktuelleEnergie().wh).toBeCloseTo(1038.65, 6);
  });

  it('sendet mindestens alle 60 s eine Energie-Nachricht', () => {
    const { nachrichten, energien } = baue();
    vi.advanceTimersByTime(60_000);
    expect(nachrichten.filter((n) => n.typ === 'energie')).toHaveLength(1);
    vi.advanceTimersByTime(60_000);
    expect(nachrichten.filter((n) => n.typ === 'energie')).toHaveLength(2);
    expect(energien.at(-1)!.wh).toBeCloseTo((78.3 * 2) / 60, 6);
  });

  it('setzt den Tagesverbrauch um Mitternacht (Berlin) zurück', () => {
    vi.setSystemTime(Date.parse('2026-09-26T21:59:30Z')); // 23:59:30 MESZ
    const { dienst, nachrichten } = baue({ energie: { datum: '2026-09-26', wh: 5000, bezugWh: 5000, einspeisungWh: 0 } });
    vi.advanceTimersByTime(30_000);
    const letzte = nachrichten.filter((n) => n.typ === 'energie').at(-1);
    expect(letzte && letzte.typ === 'energie' && letzte.energie).toEqual({ datum: '2026-09-27', wh: 0, bezugWh: 0, einspeisungWh: 0 });
    vi.advanceTimersByTime(60_000);
    expect(dienst.aktuelleEnergie().datum).toBe('2026-09-27');
    expect(dienst.aktuelleEnergie().wh).toBeCloseTo(78.3 / 60, 6);
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
    const { dienst: a } = baue({ geraete: { 'kueche.wasserkocher': { an: true, seit: START - 170_000 } } });
    vi.advanceTimersByTime(9_999);
    expect(a.aktuellerZustand()['kueche.wasserkocher'].an).toBe(true);
    vi.advanceTimersByTime(1);
    expect(a.aktuellerZustand()['kueche.wasserkocher'].an).toBe(false);

    const { dienst: b } = baue({ geraete: { 'kueche.mikrowelle': { an: true, seit: Date.now() - 999_000 } } });
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
    const s = dienst.snapshot('2.1.0', 0.35, 0.08);
    expect(s).toMatchObject({ typ: 'snapshot', version: '2.1.0', strompreis: 0.35, einspeiseverguetung: 0.08, serverZeit: START, sonne: { stufe: 'nacht' }, auto: { zuhause: true, akkuWh: 30000 } });
  });

  describe('Elektroauto und Solaranlage (2.1)', () => {
    const WB = 'carport.wallbox';

    it('Laden: Akku steigt, bei 100 % schaltet der Server ab (AC-04)', () => {
      const { dienst, nachrichten } = baue();
      expect(dienst.fuehreAus({ typ: 'schalten', id: 'l', geraet: WB, an: true })).toEqual({ ok: true, geaendert: true });
      vi.advanceTimersByTime(3_600_000);
      expect(dienst.aktuellesAuto().akkuWh).toBeCloseTo(41000, 3);
      vi.advanceTimersByTime(9_818_182 - 3_600_000 - 1000);
      expect(dienst.aktuellerZustand()[WB].an).toBe(true);
      vi.advanceTimersByTime(2000);
      expect(dienst.aktuellerZustand()[WB].an).toBe(false);
      expect(dienst.aktuellesAuto().akkuWh).toBe(60000);
      const letzte = nachrichten.filter((n) => n.typ === 'aenderung').at(-1);
      expect(letzte && letzte.typ === 'aenderung' && letzte.ursache).toEqual({ art: 'akkuVoll', ref: WB, befehlId: null });
      expect(dienst.fuehreAus({ typ: 'schalten', id: 'l2', geraet: WB, an: true })).toEqual({ ok: false, code: 'NICHT_MOEGLICH' });
    });

    it('Wegfahren beendet das Laden in einer Änderung, Zurückkommen zieht 15 % ab (AC-06, AC-07)', () => {
      const { dienst, nachrichten, autos } = baue();
      dienst.fuehreAus({ typ: 'schalten', id: 'l', geraet: WB, an: true });
      vi.advanceTimersByTime(3_600_000);
      const vorher = nachrichten.length;
      expect(dienst.fuehreAus({ typ: 'auto', id: 'w', zuhause: false })).toEqual({ ok: true, geaendert: true });
      expect(nachrichten.length).toBe(vorher + 1);
      const n = nachrichten.at(-1)!;
      expect(n.typ === 'aenderung' && n.geraete[WB]?.an).toBe(false);
      expect(n.typ === 'aenderung' && n.auto?.zuhause).toBe(false);
      expect(n.typ === 'aenderung' && n.ursache).toEqual({ art: 'auto', ref: 'weg', befehlId: 'w' });
      const akku = dienst.aktuellesAuto().akkuWh;
      expect(akku).toBeCloseTo(41000, 3);
      expect(autos.at(-1)?.zuhause).toBe(false);
      // unterwegs: Laden nicht möglich, Akku bleibt
      expect(dienst.fuehreAus({ typ: 'schalten', id: 'l2', geraet: WB, an: true })).toEqual({ ok: false, code: 'NICHT_MOEGLICH' });
      vi.advanceTimersByTime(3_600_000);
      expect(dienst.aktuellesAuto().akkuWh).toBeCloseTo(41000, 3);
      expect(dienst.fuehreAus({ typ: 'auto', id: 'z', zuhause: true })).toEqual({ ok: true, geaendert: true });
      expect(dienst.aktuellesAuto()).toMatchObject({ zuhause: true });
      expect(dienst.aktuellesAuto().akkuWh).toBeCloseTo(32000, 3);
      expect(dienst.fuehreAus({ typ: 'auto', id: 'z2', zuhause: true })).toEqual({ ok: true, geaendert: false });
    });

    it('Schalten der Wallbox verteilt den aktuellen Akkustand mit (CR21-01)', () => {
      const { dienst, nachrichten } = baue();
      vi.advanceTimersByTime(50_000);
      dienst.fuehreAus({ typ: 'schalten', id: 'l', geraet: WB, an: true });
      const an = nachrichten.at(-1)!;
      expect(an.typ === 'aenderung' && an.auto).toEqual({ zuhause: true, akkuWh: 30000, stand: START + 50_000 });
      vi.advanceTimersByTime(50_000);
      dienst.fuehreAus({ typ: 'schalten', id: 'l2', geraet: WB, an: false });
      const aus = nachrichten.at(-1)!;
      expect(aus.typ === 'aenderung' && aus.auto?.akkuWh).toBeCloseTo(30000 + (11000 * 50) / 3600, 6);
      expect(aus.typ === 'aenderung' && aus.auto?.stand).toBe(START + 100_000);
    });

    it('Wegfahren unter 15 % ist nicht möglich (AC-08)', () => {
      const { dienst } = baue({ auto: { zuhause: true, akkuWh: 8000, stand: 0 } });
      expect(dienst.fuehreAus({ typ: 'auto', id: 'w', zuhause: false })).toEqual({ ok: false, code: 'NICHT_MOEGLICH' });
    });

    it('Szenen „Alles aus“ und „Gute Nacht“ beenden das Laden (AC-09)', () => {
      const { dienst } = baue();
      dienst.fuehreAus({ typ: 'schalten', id: 'l', geraet: WB, an: true });
      dienst.fuehreAus({ typ: 'szene', id: 's', szene: 'gute-nacht' });
      expect(dienst.aktuellerZustand()[WB].an).toBe(false);
    });

    it('Sonne ändert Erzeugung, Tagesbilanz und wird gespeichert (AC-12, AC-17)', () => {
      const { dienst, nachrichten, sonnen } = baue();
      expect(dienst.fuehreAus({ typ: 'sonne', id: 's', stufe: 'wolkig' })).toEqual({ ok: true, geaendert: true });
      const n = nachrichten.at(-1)!;
      expect(n.typ === 'aenderung' && n.sonne?.stufe).toBe('wolkig');
      expect(n.typ === 'aenderung' && Object.keys(n.geraete)).toEqual([]);
      expect(sonnen.at(-1)?.stufe).toBe('wolkig');
      vi.advanceTimersByTime(30 * 60_000);
      const e = dienst.aktuelleEnergie();
      expect(e.wh).toBeCloseTo(78.3 / 2, 6);
      expect(e.bezugWh).toBe(0);
      expect(e.einspeisungWh).toBeCloseTo((3430 - 78.3) / 2, 6);
      expect(dienst.fuehreAus({ typ: 'sonne', id: 's2', stufe: 'wolkig' })).toEqual({ ok: true, geaendert: false });
    });

    it('Neustart: Ausfallzeit lädt nicht, inkonsistente Wallbox wird ausgeschaltet (AC-10, AC-11)', () => {
      const { dienst: a } = baue({
        geraete: { [WB]: { an: true, seit: START - 60_000 } },
        auto: { zuhause: true, akkuWh: 40000, stand: START - 3_600_000 },
      });
      expect(a.aktuellesAuto()).toEqual({ zuhause: true, akkuWh: 40000, stand: START });
      expect(a.aktuellerZustand()[WB].an).toBe(true);
      const { dienst: b, geraete } = baue({
        geraete: { [WB]: { an: true, seit: START - 60_000 } },
        auto: { zuhause: false, akkuWh: 40000, stand: START },
        sonne: { stufe: 'heiter', seit: START + 999_999 },
      });
      expect(b.aktuellerZustand()[WB].an).toBe(false);
      expect(geraete.get(WB)?.an).toBe(false);
      expect(b.aktuelleSonne()).toEqual({ stufe: 'heiter', seit: START });
    });

    it('Energie-Takt sendet und speichert den Akku mit', () => {
      const { dienst, nachrichten, autos } = baue();
      dienst.fuehreAus({ typ: 'schalten', id: 'l', geraet: WB, an: true });
      vi.advanceTimersByTime(60_000);
      const e = nachrichten.filter((n) => n.typ === 'energie').at(-1);
      expect(e && e.typ === 'energie' && e.auto.akkuWh).toBeCloseTo(30000 + 11000 / 60, 3);
      expect(autos.at(-1)?.akkuWh).toBeCloseTo(30000 + 11000 / 60, 3);
    });
  });
});
