import { describe, expect, it } from 'vitest';
import { snapshot, SERVER_ZEIT, verbundenerZustand } from '../../tests/fixtures/snapshot';
import { anfangszustand, anzeigeAn, hausReducer, istBedienbar, istBeschaeftigt, type ClientZustand } from './hausReducer';

const V = '2.0.0';

function aenderung(z: ClientZustand, geraete: Record<string, boolean>, ursache: { art: 'geraet' | 'szene' | 'raumAus' | 'autoAus'; ref: string; befehlId: string | null }) {
  const g: Record<string, { an: boolean; seit: number }> = {};
  for (const [id, an] of Object.entries(geraete)) g[id] = { an, seit: SERVER_ZEIT };
  return hausReducer(z, {
    typ: 'nachricht',
    nachricht: { typ: 'aenderung', ursache, geraete: g, energie: { datum: '2026-09-26', wh: 3500 } },
    jetzt: SERVER_ZEIT,
    clientVersion: V,
  });
}

describe('hausReducer', () => {
  it('startet ohne Serverdaten und nicht bedienbar (FR-15)', () => {
    const z = anfangszustand();
    expect(z.server).toBeNull();
    expect(istBedienbar(z)).toBe(false);
  });

  it('Snapshot macht bedienbar, Uhrversatz wird berechnet', () => {
    const z = hausReducer(anfangszustand(), { typ: 'nachricht', nachricht: snapshot(), jetzt: SERVER_ZEIT - 500, clientVersion: V });
    expect(z.verbindung).toBe('verbunden');
    expect(z.uhrVersatzMs).toBe(500);
    expect(istBedienbar(z)).toBe(true);
    expect(z.letzteAnsage).toBeNull();
  });

  it('abweichende Version sperrt (FR-18)', () => {
    const z = verbundenerZustand('1.9.0');
    expect(z.versionKonflikt).toBe(true);
    expect(istBedienbar(z)).toBe(false);
  });

  it('Änderung erzeugt Meldung mit Differenz und Ansage (FR-11)', () => {
    let z = verbundenerZustand();
    z = aenderung(z, { 'kueche.mikrowelle': true }, { art: 'geraet', ref: 'kueche.mikrowelle', befehlId: null });
    const m = z.meldungen.at(-1)!;
    expect(m).toMatchObject({ art: 'plus', delta: '+1.199 W', text: 'Mikrowelle (Küche)', sammeln: true });
    expect(m.ansage).toMatch(/^Mikrowelle an\. Hausverbrauch [\d.]+ Watt\.$/);
    expect(z.letzteAenderung).toMatchObject({ nr: 1, differenzW: 1199, geraete: ['kueche.mikrowelle'], raeume: ['kueche'] });
    expect(z.server!.energie.wh).toBe(3500);
  });

  it('Texte für Szene, Raum aus und Auto-Aus', () => {
    let z = verbundenerZustand();
    z = aenderung(z, { 'kueche.wasserkocher': false }, { art: 'autoAus', ref: 'kueche.wasserkocher', befehlId: null });
    expect(z.meldungen.at(-1)).toMatchObject({ art: 'minus', delta: '−2.200 W', text: 'Wasserkocher (Küche) automatisch ausgeschaltet' });
    z = aenderung(z, { 'wohnzimmer.fernseher': true }, { art: 'szene', ref: 'filmabend', befehlId: 'x' });
    expect(z.meldungen.at(-1)!.text).toBe('Filmabend aktiviert');
    z = aenderung(z, { 'wohnzimmer.fernseher': false }, { art: 'raumAus', ref: 'wohnzimmer', befehlId: 'y' });
    expect(z.meldungen.at(-1)!.text).toBe('Wohnzimmer ausgeschaltet');
    expect(z.meldungen).toHaveLength(3);
    z = aenderung(z, { 'wohnzimmer.fernseher': true }, { art: 'szene', ref: 'filmabend', befehlId: 'z' });
    expect(z.meldungen).toHaveLength(3); // höchstens 3
  });

  it('±0 W bei gerundeter Differenz 0', () => {
    // Stehlampe aus (−10 W), Bad-Deckenlampe an (+10 W)
    const z = aenderung(verbundenerZustand(), { 'wohnzimmer.stehlampe': false, 'bad.deckenlampe': true }, { art: 'szene', ref: 'filmabend', befehlId: null });
    expect(z.meldungen.at(-1)).toMatchObject({ art: 'info', delta: '±0 W' });
  });

  it('ausstehender Schaltbefehl: Anzeige sofort, Bestätigung räumt auf (FR-21)', () => {
    let z = verbundenerZustand();
    z = hausReducer(z, { typ: 'gesendet', befehlId: 'b1', ausstehend: { art: 'geraet', ref: 'bad.foehn', ziel: true } });
    expect(anzeigeAn(z, 'bad.foehn')).toEqual({ an: true, beschaeftigt: true });
    expect(istBeschaeftigt(z, 'geraet', 'bad.foehn')).toBe(true);
    z = hausReducer(z, { typ: 'nachricht', nachricht: { typ: 'bestaetigt', befehlId: 'b1', geaendert: true }, jetzt: 0, clientVersion: V });
    expect(anzeigeAn(z, 'bad.foehn')).toEqual({ an: false, beschaeftigt: false });
    expect(z.meldungen).toHaveLength(0);
  });

  it('Zeitüberschreitung und Fehler → Fehlermeldung, Rücksprung', () => {
    let z = verbundenerZustand();
    z = hausReducer(z, { typ: 'gesendet', befehlId: 'b1', ausstehend: { art: 'geraet', ref: 'bad.foehn', ziel: true } });
    z = hausReducer(z, { typ: 'zeitueberschreitung', befehlId: 'b1' });
    expect(anzeigeAn(z, 'bad.foehn').beschaeftigt).toBe(false);
    expect(z.meldungen.at(-1)).toMatchObject({ art: 'fehler', text: 'Föhn konnte nicht geschaltet werden. Bitte erneut versuchen.' });
    // doppelte Zeitüberschreitung ist wirkungslos
    const vorher = z;
    expect(hausReducer(z, { typ: 'zeitueberschreitung', befehlId: 'b1' })).toBe(vorher);

    z = hausReducer(z, { typ: 'gesendet', befehlId: 'b2', ausstehend: { art: 'szene', ref: 'filmabend' } });
    z = hausReducer(z, { typ: 'nachricht', nachricht: { typ: 'fehler', befehlId: 'b2', code: 'UNBEKANNTE_SZENE', meldung: 'x' }, jetzt: 0, clientVersion: V });
    expect(z.meldungen.at(-1)!.text).toBe('Filmabend konnte nicht ausgeführt werden. Bitte erneut versuchen.');
    z = hausReducer(z, { typ: 'gesendet', befehlId: 'b3', ausstehend: { art: 'raumAus', ref: 'bad' } });
    z = hausReducer(z, { typ: 'zeitueberschreitung', befehlId: 'b3' });
    expect(z.meldungen.at(-1)!.text).toBe('Badezimmer konnte nicht ausgeschaltet werden. Bitte erneut versuchen.');
  });

  it('keine Änderung nötig nur für Szene/Raum beim Absender (FR-22)', () => {
    let z = verbundenerZustand();
    z = hausReducer(z, { typ: 'gesendet', befehlId: 's1', ausstehend: { art: 'szene', ref: 'alles-aus' } });
    z = hausReducer(z, { typ: 'nachricht', nachricht: { typ: 'bestaetigt', befehlId: 's1', geaendert: false }, jetzt: 0, clientVersion: V });
    expect(z.meldungen.at(-1)).toMatchObject({ art: 'info', text: 'Alles aus: keine Änderung nötig' });
    z = hausReducer(z, { typ: 'gesendet', befehlId: 'g1', ausstehend: { art: 'geraet', ref: 'bad.foehn', ziel: false } });
    const anzahl = z.meldungen.length;
    z = hausReducer(z, { typ: 'nachricht', nachricht: { typ: 'bestaetigt', befehlId: 'g1', geaendert: false }, jetzt: 0, clientVersion: V });
    expect(z.meldungen).toHaveLength(anzahl);
  });

  it('Trennung setzt offene Befehle zurück, Wiederverbindung sagt an (FR-20)', () => {
    let z = verbundenerZustand();
    z = hausReducer(z, { typ: 'gesendet', befehlId: 'b1', ausstehend: { art: 'geraet', ref: 'bad.foehn', ziel: true } });
    z = hausReducer(z, { typ: 'getrennt' });
    expect(z.verbindung).toBe('getrennt');
    expect(z.ausstehend).toEqual({});
    expect(z.meldungen.at(-1)!.art).toBe('fehler');
    expect(istBedienbar(z)).toBe(false);
    expect(z.server).not.toBeNull(); // letzter Zustand bleibt sichtbar
    z = hausReducer(z, { typ: 'verbinde' });
    expect(z.verbindung).toBe('verbinde');
    expect(hausReducer(z, { typ: 'verbinde' })).toBe(z);
    z = hausReducer(z, { typ: 'nachricht', nachricht: snapshot(), jetzt: SERVER_ZEIT, clientVersion: V });
    expect(z.letzteAnsage).toMatchObject({ ansage: 'Verbindung wiederhergestellt.', sichtbar: false });
    expect(z.letzteAenderung).toBeNull();
    expect(z.fehlversuche).toBe(0);
  });

  it('Energie-Nachricht aktualisiert Tageswert und Uhrversatz', () => {
    let z = verbundenerZustand();
    z = hausReducer(z, { typ: 'nachricht', nachricht: { typ: 'energie', energie: { datum: '2026-09-26', wh: 4000 }, serverZeit: 2000 }, jetzt: 1000, clientVersion: V });
    expect(z.server!.energie.wh).toBe(4000);
    expect(z.uhrVersatzMs).toBe(1000);
    expect(hausReducer(anfangszustand(), { typ: 'nachricht', nachricht: { typ: 'energie', energie: { datum: 'x', wh: 1 }, serverZeit: 1 }, jetzt: 1, clientVersion: V }).server).toBeNull();
  });

  it('robust gegen unbekannte Kennungen und bei Versionskonflikt (Review CR-06)', () => {
    let z = verbundenerZustand();
    z = aenderung(z, { 'keller.sauna': true, 'bad.foehn': true }, { art: 'szene', ref: 'party', befehlId: null });
    expect(z.meldungen.at(-1)!.text).toBe('party aktiviert');
    expect(z.server!.zustand['bad.foehn'].an).toBe(true);
    z = aenderung(z, { 'bad.foehn': false }, { art: 'geraet', ref: 'keller.sauna', befehlId: null });
    expect(z.meldungen.at(-1)!.text).toBe('keller.sauna');
    z = aenderung(z, { 'bad.foehn': true }, { art: 'unbekannt' as 'geraet', ref: 'x', befehlId: null });
    expect(z.server!.zustand['bad.foehn'].an).toBe(true);
    const alt = verbundenerZustand('1.0.0');
    expect(aenderung(alt, { 'bad.foehn': true }, { art: 'geraet', ref: 'bad.foehn', befehlId: null })).toBe(alt);
  });

  it('Meldung entfernen; Änderung ohne Snapshot wird ignoriert', () => {
    let z = aenderung(verbundenerZustand(), { 'bad.foehn': true }, { art: 'geraet', ref: 'bad.foehn', befehlId: null });
    z = hausReducer(z, { typ: 'meldungEntfernen', id: z.meldungen[0].id });
    expect(z.meldungen).toHaveLength(0);
    const leer = anfangszustand();
    expect(aenderung(leer, { 'bad.foehn': true }, { art: 'geraet', ref: 'bad.foehn', befehlId: null })).toBe(leer);
  });
});
