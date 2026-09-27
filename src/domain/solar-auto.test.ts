import { describe, expect, it } from 'vitest';
import { ausgangszustand, erzwingeLadeRegeln, pruefeBefehl, pruefeRegel, wendeAn, wendeZieleAn } from './befehle';
import {
  akkuProzent,
  akkuWhBei,
  ausgangsAuto,
  darfLaden,
  darfWegfahren,
  ELEKTROAUTO,
  istVoll,
  ladeleistungW,
  nachRueckkehr,
  restLadezeitMs,
} from './elektroauto';
import { GERAETE, type GeraetId } from './katalog';
import { ausgangsSonne, erzeugung, istSonnenStufe, SONNENSTUFEN, sonnenstufeById } from './solar';
import { SZENEN } from './szenen';

const T0 = Date.parse('2026-09-27T10:00:00Z');
const WB = 'carport.wallbox' as GeraetId;

describe('Solaranlage (FR-40)', () => {
  it('Erzeugung je Stufe 0 / 980 / 3.430 / 6.370 / 8.330 W', () => {
    expect(SONNENSTUFEN.map((s) => Math.round(erzeugung(s.id)))).toEqual([0, 980, 3430, 6370, 8330]);
    expect(SONNENSTUFEN.map((s) => s.name)).toEqual(['Nacht', 'Bedeckt', 'Wolkig', 'Heiter', 'Sonnig']);
  });
  it('Stufen prüfen, Ausgang Nacht', () => {
    expect(istSonnenStufe('heiter')).toBe(true);
    expect(istSonnenStufe('Heiter')).toBe(false);
    expect(istSonnenStufe(1)).toBe(false);
    expect(sonnenstufeById('wolkig').anteil).toBe(0.35);
    expect(ausgangsSonne(5)).toEqual({ stufe: 'nacht', seit: 5 });
  });
});

describe('Elektroauto (FR-37 bis FR-39)', () => {
  it('Ausgangszustand zu Hause mit 50 %', () => {
    const a = ausgangsAuto(T0);
    expect(a).toEqual({ zuhause: true, akkuWh: 30000, stand: T0 });
    expect(akkuProzent(a.akkuWh)).toBe(50);
    expect(ladeleistungW()).toBe(11000);
  });

  it('Laden schreibt den Akku fort, gedeckelt bei 60 kWh', () => {
    const a = ausgangsAuto(T0);
    expect(akkuWhBei(a, true, T0 + 3_600_000)).toBeCloseTo(41000, 6);
    expect(akkuWhBei(a, false, T0 + 3_600_000)).toBe(30000);
    expect(akkuWhBei({ ...a, zuhause: false }, true, T0 + 3_600_000)).toBe(30000);
    expect(akkuWhBei(a, true, T0 + 10 * 3_600_000)).toBe(60000);
    expect(akkuWhBei(a, true, T0 - 1000)).toBe(30000);
  });

  it('Prozent abgerundet, 100 nur wenn voll (E-08)', () => {
    expect(akkuProzent(30599)).toBe(50);
    expect(akkuProzent(59999)).toBe(99);
    expect(akkuProzent(59999.6)).toBe(100);
    expect(akkuProzent(0)).toBe(0);
    expect(istVoll(60000)).toBe(true);
  });

  it('Restladezeit ab 50 %: 2 h 43 min 38 s', () => {
    const ms = restLadezeitMs(ausgangsAuto(T0), true, T0)!;
    expect(Math.round(ms / 1000)).toBe(9818);
    expect(restLadezeitMs(ausgangsAuto(T0), false, T0)).toBeNull();
  });

  it('Laden und Wegfahren nur, wenn möglich', () => {
    const a = ausgangsAuto(T0);
    expect(darfLaden(a, T0)).toBe(true);
    expect(darfLaden({ ...a, zuhause: false }, T0)).toBe(false);
    expect(darfLaden({ ...a, akkuWh: 60000 }, T0)).toBe(false);
    expect(darfWegfahren(a, false, T0)).toBe(true);
    expect(darfWegfahren({ ...a, akkuWh: 8999 }, false, T0)).toBe(false);
    expect(darfWegfahren({ ...a, akkuWh: 9000 }, false, T0)).toBe(true);
    expect(darfWegfahren({ ...a, zuhause: false }, false, T0)).toBe(false);
    expect(nachRueckkehr(38400)).toBe(29400);
    expect(nachRueckkehr(5000)).toBe(0);
    expect(ELEKTROAUTO.fahrtWh / ELEKTROAUTO.kapazitaetWh).toBe(0.15);
  });
});

describe('Befehle sonne/auto und Regeln (FR-18, FR-38, FR-39)', () => {
  it('prüft sonne und auto streng', () => {
    expect(pruefeBefehl({ typ: 'sonne', id: 's1', stufe: 'sonnig' })).toEqual({ ok: true, befehl: { typ: 'sonne', id: 's1', stufe: 'sonnig' } });
    expect(pruefeBefehl({ typ: 'auto', id: 'a1', zuhause: false })).toEqual({ ok: true, befehl: { typ: 'auto', id: 'a1', zuhause: false } });
    expect(pruefeBefehl({ typ: 'sonne', id: 's2', stufe: 'gewitter' })).toEqual({ ok: false, code: 'UNGUELTIGER_BEFEHL', befehlId: 's2' });
    expect(pruefeBefehl({ typ: 'auto', id: 'a2', zuhause: 'ja' })).toEqual({ ok: false, code: 'UNGUELTIGER_BEFEHL', befehlId: 'a2' });
    expect(pruefeBefehl({ typ: 'auto', id: 'a3', zuhause: true, akku: 100 })).toEqual({ ok: false, code: 'UNGUELTIGER_BEFEHL', befehlId: 'a3' });
  });

  it('sonne/auto ändern keine Geräte direkt', () => {
    const z = ausgangszustand(T0);
    expect(wendeAn(z, { typ: 'sonne', id: 'x', stufe: 'sonnig' }, T0).geaendert).toEqual([]);
    expect(wendeAn(z, { typ: 'auto', id: 'x', zuhause: false }, T0).geaendert).toEqual([]);
  });

  it('Laden unterwegs oder voll → NICHT_MOEGLICH', () => {
    const z = ausgangszustand(T0);
    const a = ausgangsAuto(T0);
    const laden = { typ: 'schalten', id: 'l', geraet: WB, an: true } as const;
    expect(pruefeRegel(z, a, laden, T0)).toBeNull();
    expect(pruefeRegel(z, { ...a, zuhause: false }, laden, T0)).toBe('NICHT_MOEGLICH');
    expect(pruefeRegel(z, { ...a, akkuWh: 60000 }, laden, T0)).toBe('NICHT_MOEGLICH');
    // Ausschalten ist immer erlaubt
    expect(pruefeRegel(z, { ...a, zuhause: false }, { ...laden, an: false }, T0)).toBeNull();
  });

  it('Wegfahren unter 15 % → NICHT_MOEGLICH; Zurückkommen immer', () => {
    const z = ausgangszustand(T0);
    const a = { ...ausgangsAuto(T0), akkuWh: 8400 };
    expect(pruefeRegel(z, a, { typ: 'auto', id: 'w', zuhause: false }, T0)).toBe('NICHT_MOEGLICH');
    expect(pruefeRegel(z, { ...a, zuhause: false }, { typ: 'auto', id: 'z', zuhause: true }, T0)).toBeNull();
    // lädt gerade über 15 %: Wegfahren erlaubt
    const laedt = wendeZieleAn(z, { [WB]: true }, T0).zustand;
    expect(pruefeRegel(laedt, { ...a, stand: T0 }, { typ: 'auto', id: 'w', zuhause: false }, T0 + 3_600_000)).toBeNull();
  });

  it('erzwingeLadeRegeln schaltet die Wallbox aus, wenn unterwegs oder voll', () => {
    const laedt = wendeZieleAn(ausgangszustand(T0), { [WB]: true }, T0).zustand;
    const a = ausgangsAuto(T0);
    expect(erzwingeLadeRegeln(laedt, a, T0)).toEqual({});
    expect(erzwingeLadeRegeln(laedt, { ...a, zuhause: false }, T0)).toEqual({ [WB]: false });
    expect(erzwingeLadeRegeln(laedt, a, T0 + 3 * 3_600_000)).toEqual({ [WB]: false });
    expect(erzwingeLadeRegeln(ausgangszustand(T0), { ...a, zuhause: false }, T0)).toEqual({});
  });

  it('keine Szene startet das Laden (E-11)', () => {
    for (const s of SZENEN) {
      const r = wendeAn(ausgangszustand(T0), { typ: 'szene', id: 'x', szene: s.id }, T0);
      expect(r.zustand[WB].an).toBe(false);
    }
    expect(GERAETE.find((g) => g.id === WB)?.grundlast).toBe(false);
  });
});
