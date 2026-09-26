import { describe, expect, it } from 'vitest';
import { ausgangszustand, pruefeBefehl, wendeAn, wendeZieleAn } from './befehle';
import { GERAETE, type GeraetId } from './katalog';
import type { HausZustand } from './protokoll';
import { SZENEN, istSzeneId, szenenZiele } from './szenen';
import { hausverbrauch, runden } from './verbrauch';

function allesAn(): HausZustand {
  const ziele: Partial<Record<GeraetId, boolean>> = {};
  for (const g of GERAETE) ziele[g.id] = true;
  return wendeZieleAn(ausgangszustand(0), ziele, 0).zustand;
}

function eingeschaltet(z: HausZustand): string[] {
  return GERAETE.filter((g) => z[g.id].an).map((g) => g.id);
}

describe('Ausgangszustand (FR-4)', () => {
  it('nur Grundlastgeräte sind an', () => {
    expect(eingeschaltet(ausgangszustand(123))).toEqual([
      'kueche.kuehlschrank',
      'hwr.gefrierschrank',
      'arbeitszimmer.router',
    ]);
    expect(ausgangszustand(123)['kueche.mikrowelle'].seit).toBe(123);
  });
});

describe('pruefeBefehl (FR-18)', () => {
  it('akzeptiert die drei gültigen Befehle', () => {
    expect(pruefeBefehl({ typ: 'schalten', id: 'a-1', geraet: 'kueche.mikrowelle', an: true })).toEqual({
      ok: true,
      befehl: { typ: 'schalten', id: 'a-1', geraet: 'kueche.mikrowelle', an: true },
    });
    expect(pruefeBefehl({ typ: 'szene', id: 'a-2', szene: 'filmabend' }).ok).toBe(true);
    expect(pruefeBefehl({ typ: 'raumAus', id: 'a_3', raum: 'kueche' }).ok).toBe(true);
  });

  it.each([
    ['kein Objekt', 'hallo', 'UNGUELTIGER_BEFEHL', null],
    ['null', null, 'UNGUELTIGER_BEFEHL', null],
    ['Array', [], 'UNGUELTIGER_BEFEHL', null],
    ['altes Protokoll', { type: 'publish', topic: 'x', payload: '{}' }, 'ALTES_PROTOKOLL', null],
    ['unbekannter Typ', { typ: 'loeschen', id: 'x1' }, 'UNGUELTIGER_BEFEHL', 'x1'],
    ['fehlende id', { typ: 'szene', szene: 'filmabend' }, 'UNGUELTIGER_BEFEHL', null],
    ['ungültige id', { typ: 'szene', id: 'a b', szene: 'filmabend' }, 'UNGUELTIGER_BEFEHL', null],
    ['zu lange id', { typ: 'szene', id: 'x'.repeat(65), szene: 'filmabend' }, 'UNGUELTIGER_BEFEHL', null],
    ['Zusatzfeld', { typ: 'szene', id: 'x2', szene: 'filmabend', mehr: 1 }, 'UNGUELTIGER_BEFEHL', 'x2'],
    ['fehlendes Feld', { typ: 'schalten', id: 'x3', geraet: 'kueche.mikrowelle' }, 'UNGUELTIGER_BEFEHL', 'x3'],
    ['falscher Typ an', { typ: 'schalten', id: 'x4', geraet: 'kueche.mikrowelle', an: 'ja' }, 'UNGUELTIGER_BEFEHL', 'x4'],
    ['unbekanntes Gerät', { typ: 'schalten', id: 'x5', geraet: 'kueche.toaster', an: true }, 'UNBEKANNTES_GERAET', 'x5'],
    ['unbekannte Szene', { typ: 'szene', id: 'x6', szene: 'party' }, 'UNBEKANNTE_SZENE', 'x6'],
    ['unbekannter Raum', { typ: 'raumAus', id: 'x7', raum: 'keller' }, 'UNBEKANNTER_RAUM', 'x7'],
    ['Prototyp-Name', { typ: 'toString', id: 'x8' }, 'UNGUELTIGER_BEFEHL', 'x8'],
  ])('%s → %s', (_name, json, code, befehlId) => {
    expect(pruefeBefehl(json)).toEqual({ ok: false, code, befehlId });
  });
});

describe('wendeAn (FR-3, FR-27)', () => {
  it('Schalten ändert genau ein Gerät', () => {
    const z0 = ausgangszustand(0);
    const { zustand, geaendert } = wendeAn(z0, { typ: 'schalten', id: 'a', geraet: 'bad.foehn', an: true }, 5);
    expect(geaendert).toEqual(['bad.foehn']);
    expect(zustand['bad.foehn']).toEqual({ an: true, seit: 5 });
    for (const g of GERAETE) if (g.id !== 'bad.foehn') expect(zustand[g.id]).toBe(z0[g.id]);
  });

  it('Schalten in den gleichen Zustand ändert nichts', () => {
    const z0 = ausgangszustand(0);
    const r = wendeAn(z0, { typ: 'schalten', id: 'a', geraet: 'bad.foehn', an: false }, 5);
    expect(r.geaendert).toEqual([]);
    expect(r.zustand).toBe(z0);
  });

  it('Grundlastgerät lässt sich einzeln ausschalten', () => {
    const r = wendeAn(ausgangszustand(0), { typ: 'schalten', id: 'a', geraet: 'kueche.kuehlschrank', an: false }, 1);
    expect(r.geaendert).toEqual(['kueche.kuehlschrank']);
  });

  it('Raum ausschalten schaltet alle Nicht-Grundlastgeräte des Raums aus', () => {
    const r = wendeAn(allesAn(), { typ: 'raumAus', id: 'a', raum: 'kueche' }, 1);
    expect(r.geaendert).toEqual([
      'kueche.deckenlampe',
      'kueche.mikrowelle',
      'kueche.backofen',
      'kueche.wasserkocher',
      'kueche.kaffeemaschine',
      'kueche.geschirrspueler',
    ]);
    expect(r.zustand['kueche.kuehlschrank'].an).toBe(true);
  });
});

describe('Szenen (FR-22 bis FR-24)', () => {
  it('es gibt genau vier Szenen', () => {
    expect(SZENEN.map((s) => s.id)).toEqual(['alles-aus', 'filmabend', 'morgenroutine', 'gute-nacht']);
    expect(istSzeneId('filmabend')).toBe(true);
    expect(istSzeneId('party')).toBe(false);
  });

  it('Alles aus aus „alles an“: nur Grundlast bleibt, 75 W', () => {
    const z = wendeAn(allesAn(), { typ: 'szene', id: 'a', szene: 'alles-aus' }, 1).zustand;
    expect(eingeschaltet(z)).toEqual(['kueche.kuehlschrank', 'hwr.gefrierschrank', 'arbeitszimmer.router']);
    expect(runden(hausverbrauch(z))).toBe(75);
  });

  it('Gute Nacht aus „alles an“: Grundlast + Nachttischlampe', () => {
    const z = wendeAn(allesAn(), { typ: 'szene', id: 'a', szene: 'gute-nacht' }, 1).zustand;
    expect(eingeschaltet(z)).toEqual([
      'kueche.kuehlschrank',
      'hwr.gefrierschrank',
      'schlafzimmer.nachttischlampe',
      'arbeitszimmer.router',
    ]);
  });

  it('Morgenroutine aus Ausgangszustand: +5.532 W', () => {
    const z0 = ausgangszustand(0);
    const { zustand, geaendert } = wendeAn(z0, { typ: 'szene', id: 'a', szene: 'morgenroutine' }, 1);
    expect(geaendert).toHaveLength(6);
    expect(zustand['kueche.wasserkocher'].an).toBe(true);
    expect(runden(hausverbrauch(zustand)) - runden(hausverbrauch(z0))).toBe(5532);
  });

  it('Filmabend aus Ausgangszustand: +124 W, aus „alles an“ Decken aus', () => {
    const z0 = ausgangszustand(0);
    const z1 = wendeAn(z0, { typ: 'szene', id: 'a', szene: 'filmabend' }, 1).zustand;
    expect(runden(hausverbrauch(z1)) - runden(hausverbrauch(z0))).toBe(124);
    const z2 = wendeAn(allesAn(), { typ: 'szene', id: 'a', szene: 'filmabend' }, 1).zustand;
    expect(z2['wohnzimmer.deckenlampe'].an).toBe(false);
    expect(z2['kueche.deckenlampe'].an).toBe(false);
    expect(z2['wohnzimmer.spielkonsole'].an).toBe(true);
  });

  it('Szenen sind idempotent und ändern nie Grundlast', () => {
    for (const s of SZENEN) {
      for (const start of [ausgangszustand(0), allesAn()]) {
        const einmal = wendeAn(start, { typ: 'szene', id: 'a', szene: s.id }, 1).zustand;
        const zweimal = wendeAn(einmal, { typ: 'szene', id: 'b', szene: s.id }, 2);
        expect(zweimal.geaendert).toEqual([]);
        for (const g of GERAETE.filter((x) => x.grundlast)) expect(einmal[g.id].an).toBe(start[g.id].an);
      }
      expect(Object.keys(szenenZiele(s.id))).not.toContain('kueche.kuehlschrank');
    }
  });

  it('Szene lässt ein bereits eingeschaltetes Auto-Aus-Gerät unverändert (seit bleibt)', () => {
    const z1 = wendeAn(ausgangszustand(0), { typ: 'schalten', id: 'a', geraet: 'kueche.wasserkocher', an: true }, 10).zustand;
    const z2 = wendeAn(z1, { typ: 'szene', id: 'b', szene: 'morgenroutine' }, 50).zustand;
    expect(z2['kueche.wasserkocher'].seit).toBe(10);
  });
});
