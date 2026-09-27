// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hausReducer } from '@/client/hausReducer';
import { snapshot, snapshotLaedt, SERVER_ZEIT, verbundenerZustand } from '../../tests/fixtures/snapshot';
import { App } from './App';
import { GeraeteZeile } from './GeraeteZeile';
import { geraetById } from '@/domain/katalog';

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
});

async function axeVerstoesse(): Promise<axe.Result[]> {
  const ergebnis = await axe.run(document.body, {
    rules: { 'color-contrast': { enabled: false } }, // Kontraste prüft kontrast.test.ts
  });
  return ergebnis.violations;
}

describe('Seite mit Snapshot (NFR-2, FR-25)', () => {
  it.each(['hell', 'dunkel'])('axe: 0 Verstöße im Theme %s', async (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    render(<App startZustand={verbundenerZustand()} />);
    const verstoesse = await axeVerstoesse();
    expect(verstoesse.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });

  it('axe: 0 Verstöße im Ladezustand', async () => {
    render(<App startZustand={hausReducer(verbundenerZustand(), { typ: 'getrennt' })} />);
    expect(await axeVerstoesse()).toEqual([]);
  });

  it('Sprunglink ist das erste fokussierbare Element', () => {
    render(<App startZustand={verbundenerZustand()} />);
    const erstes = document.querySelector('a, button, input, [tabindex]:not([tabindex="-1"])');
    expect(erstes?.textContent).toBe('Zu den Räumen springen');
  });

  it('Kopfbereich zeigt Hausverbrauch, Laststufe, Kosten, Status', () => {
    render(<App startZustand={verbundenerZustand()} />);
    const kopf = screen.getByRole('banner');
    // Grundlast 65 + Stehlampe 10 + Wasserkocher 2.200 + Standby 10,3 = 2.285,3 W
    expect(within(kopf).getByText('Hausverbrauch 2.288 Watt')).toBeTruthy();
    expect(kopf.textContent).toContain('hoch');
    expect(kopf.textContent).toContain('0,80 €/h');
    expect(kopf.textContent).toContain('Verbunden');
    expect(screen.getByText('davon Standby 13,3 W')).toBeTruthy();
    expect(screen.getByText(/Heute 3,42 kWh/).textContent).toContain('1,20 €');
    expect(screen.getByText(/^Strompreis 0,35 €\/kWh ·$/)).toBeTruthy();
    expect(screen.getByText('Einspeisevergütung 0,08 €/kWh')).toBeTruthy();
  });

  it('Schalter haben role, Zustand, Namen und Beschreibung (FR-27)', () => {
    render(<App startZustand={verbundenerZustand()} />);
    const schalter = screen.getAllByRole('switch');
    expect(schalter).toHaveLength(29);
    const mikro = screen.getByRole('switch', { name: 'Mikrowelle, Küche' });
    expect(mikro.getAttribute('aria-checked')).toBe('false');
    const beschreibung = document.getElementById(mikro.getAttribute('aria-describedby')!);
    expect(beschreibung?.textContent).toBe('Standby 1,5 Watt, schaltet nach 3 Minuten automatisch aus');
    const kocher = screen.getByRole('switch', { name: 'Wasserkocher, Küche' });
    expect(kocher.getAttribute('aria-checked')).toBe('true');
  });

  it('Hausansicht: Räume sind Schaltflächen mit Verbrauch (FR-26)', () => {
    render(<App startZustand={verbundenerZustand()} />);
    expect(screen.getByRole('button', { name: 'Wohnzimmer, 13 W, 1 Gerät an – zur Raumkarte' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Badezimmer, 0 W, 0 Geräte an – zur Raumkarte' })).toBeTruthy();
  });

  it('„Raum ausschalten“ ist gesperrt, wenn nur Grundlast an ist', () => {
    render(<App startZustand={verbundenerZustand()} />);
    expect(screen.getByRole('button', { name: 'Badezimmer ausschalten' }).getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('button', { name: 'Küche ausschalten' }).getAttribute('aria-disabled')).toBeNull();
  });
});

describe('Grundlast-Dialog (FR-4)', () => {
  it('öffnet beim Ausschalten, Abbrechen ist fokussiert, Escape bricht ab', () => {
    render(<App startZustand={verbundenerZustand()} />);
    const kuehl = screen.getByRole('switch', { name: 'Kühlschrank, Küche' });
    fireEvent.click(kuehl);
    const dialog = document.querySelector('dialog')!;
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(within(dialog).getByText('Kühlschrank wirklich ausschalten?')).toBeTruthy();
    expect(within(dialog).getByText('Es ist ein Grundlastgerät und läuft normalerweise dauerhaft.')).toBeTruthy();
    expect(document.activeElement?.textContent).toBe('Abbrechen');
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(kuehl.getAttribute('aria-checked')).toBe('true');
  });

  it('Einschalten eines Grundlastgeräts ohne Dialog', () => {
    const z = verbundenerZustand();
    const aus = hausReducer(z, {
      typ: 'nachricht',
      nachricht: {
        typ: 'aenderung',
        ursache: { art: 'geraet', ref: 'hwr.gefrierschrank', befehlId: null },
        geraete: { 'hwr.gefrierschrank': { an: false, seit: SERVER_ZEIT } },
        energie: { datum: '2026-09-26', wh: 1, bezugWh: 1, einspeisungWh: 0 },
      },
      jetzt: SERVER_ZEIT,
      clientVersion: '2.0.0',
    });
    render(<App startZustand={aus} />);
    fireEvent.click(screen.getByRole('switch', { name: 'Gefrierschrank, Hauswirtschaftsraum' }));
    expect(document.querySelector('dialog')!.hasAttribute('open')).toBe(false);
  });
});

describe('Verbindung und Version (FR-18, FR-20)', () => {
  it('Getrennt: Banner, Status, Schalter gesperrt', () => {
    render(<App startZustand={hausReducer(verbundenerZustand(), { typ: 'getrennt' })} />);
    expect(screen.getByRole('status').textContent).toContain(
      'Verbindung getrennt – Schalter sind gesperrt, bis die Verbindung wieder steht.',
    );
    expect(screen.getByRole('button', { name: 'Jetzt neu verbinden' })).toBeTruthy();
    expect(screen.getByRole('banner').textContent).toContain('Getrennt');
    for (const s of screen.getAllByRole('switch')) expect(s.getAttribute('aria-disabled')).toBe('true');
    // gesperrter Schalter löst nichts aus
    const kuehl = screen.getByRole('switch', { name: 'Kühlschrank, Küche' });
    fireEvent.click(kuehl);
    expect(document.querySelector('dialog')!.hasAttribute('open')).toBe(false);
  });

  it('Neue Version: Info-Banner mit „Neu laden“', () => {
    render(<App startZustand={verbundenerZustand('1.0.0')} />);
    expect(screen.getByRole('status').textContent).toContain('Neue Version verfügbar');
    expect(screen.getByRole('button', { name: 'Neu laden' })).toBeTruthy();
  });

  it('Ladezustand: keine Schalter, Skeleton, aria-busy', () => {
    render(<App startZustand={hausReducer(hausReducer(verbundenerZustand(), { typ: 'getrennt' }), { typ: 'verbinde' })} />);
    cleanup();
    const { container } = render(<App startZustand={{ ...verbundenerZustand(), server: null }} />);
    expect(screen.queryAllByRole('switch')).toHaveLength(0);
    expect(container.ownerDocument.querySelector('main')?.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Hauszustand wird geladen …')).toBeTruthy();
  });
});

describe('Meldungen (FR-11)', () => {
  it('zeigt die Änderungsmeldung und schließt per Schaltfläche', async () => {
    const z = hausReducer(verbundenerZustand(), {
      typ: 'nachricht',
      nachricht: {
        typ: 'aenderung',
        ursache: { art: 'geraet', ref: 'kueche.mikrowelle', befehlId: null },
        geraete: { 'kueche.mikrowelle': { an: true, seit: SERVER_ZEIT } },
        energie: { datum: '2026-09-26', wh: 1, bezugWh: 1, einspeisungWh: 0 },
      },
      jetzt: SERVER_ZEIT,
      clientVersion: '2.0.0',
    });
    render(<App startZustand={z} />);
    const liste = screen.getByRole('region', { name: 'Meldungen' });
    expect(liste.textContent).toContain('+1.199 W · Mikrowelle (Küche)');
    await act(async () => {
      fireEvent.click(within(liste).getByRole('button', { name: 'Meldung schließen' }));
    });
    expect(liste.textContent).toBe('');
  });
});

describe('GeraeteZeile einzeln (K-07)', () => {
  it('zeigt „wird geschaltet …“ und aria-busy', () => {
    render(
      <ul>
        <GeraeteZeile
          geraet={geraetById('bad.foehn')}
          an
          seit={0}
          uhrVersatzMs={0}
          beschaeftigt
          gesperrt={false}
          impulsNr={null}
          onAktivieren={() => {}}
        />
      </ul>,
    );
    const s = screen.getByRole('switch', { name: 'Föhn, Badezimmer' });
    expect(s.getAttribute('aria-busy')).toBe('true');
    expect(s.textContent).toContain('wird geschaltet …');
  });

  it('Beschreibung nennt die laufende Auto-Aus-Restzeit (Review CR-13)', () => {
    const jetzt = Date.now();
    render(
      <ul>
        <GeraeteZeile
          geraet={geraetById('kueche.wasserkocher')}
          an
          seit={jetzt - 12_000}
          uhrVersatzMs={0}
          beschaeftigt={false}
          gesperrt={false}
          impulsNr={null}
          onAktivieren={() => {}}
        />
      </ul>,
    );
    const s = screen.getByRole('switch', { name: 'Wasserkocher, Küche' });
    const beschreibung = document.getElementById(s.getAttribute('aria-describedby')!)!.textContent;
    expect(beschreibung).toMatch(/^2\.200 Watt, schaltet nach 3 Minuten automatisch aus, noch 2 Minuten 4[89] Sekunden$/);
    expect(s.textContent).toMatch(/noch 2:4[89]/);
  });

  it('Snapshot-Fixture enthält alle Geräte', () => {
    const s = snapshot();
    expect(s.typ === 'snapshot' && Object.keys(s.zustand)).toHaveLength(29);
  });
});

describe('2.1: Solaranlage, Netzbilanz, Carport (T-13)', () => {
  // Feste Uhr: Akku-Extrapolation rechnet ab Serverzeit der Fixture
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(SERVER_ZEIT);
  });
  afterEach(() => vi.useRealTimers());

  it.each(['hell', 'dunkel'])('axe: 0 Verstöße mit „Auto lädt, Heiter“ im Theme %s (AC-22)', async (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    render(<App startZustand={verbundenerZustand('2.1.0', snapshotLaedt())} />);
    const verstoesse = await axeVerstoesse();
    expect(verstoesse.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });

  it('Kopf: Netzbezug bei Nacht, Einspeisung und Ertrag bei Sonne (AC-12 bis AC-14)', () => {
    const { unmount } = render(<App startZustand={verbundenerZustand()} />);
    const kopf = screen.getByRole('banner');
    expect(within(kopf).getByText('Solar 0 Watt, Netzbezug 2.288 Watt')).toBeTruthy();
    expect(kopf.textContent).toContain('Kosten 0,80 Euro pro Stunde');
    unmount();
    render(<App startZustand={verbundenerZustand('2.1.0', snapshot({ sonne: { stufe: 'sonnig', seit: SERVER_ZEIT } }))} />);
    const kopf2 = screen.getByRole('banner');
    expect(within(kopf2).getByText('Solar 8.330 Watt, Einspeisung 6.042 Watt')).toBeTruthy();
    // 6.042 W × 0,08 €/kWh = 0,48 €/h
    expect(kopf2.textContent).toContain('Ertrag 0,48 Euro pro Stunde');
  });

  it('Laden bei „Heiter“: Netzbezug, Kosten aus dem Bezug (AC-13)', () => {
    render(<App startZustand={verbundenerZustand('2.1.0', snapshotLaedt('heiter'))} />);
    const kopf = screen.getByRole('banner');
    // 13.285 W (2.288 − 3 Standby + 11.000) − 6.370 W = 6.915 W Bezug
    expect(within(kopf).getByText('Hausverbrauch 13.285 Watt')).toBeTruthy();
    expect(within(kopf).getByText('Solar 6.370 Watt, Netzbezug 6.915 Watt')).toBeTruthy();
    expect(kopf.textContent).toContain('Kosten 2,42 Euro pro Stunde');
  });

  it('Sonnenwahl: fünf Radios mit Namen und Leistung, aktuelle Stufe gewählt', () => {
    render(<App startZustand={verbundenerZustand('2.1.0', snapshotLaedt('heiter'))} />);
    const gruppe = screen.getByRole('group', { name: 'Sonne gerade' });
    const radios = within(gruppe).getAllByRole('radio');
    expect(radios.map((r) => r.getAttribute('aria-label'))).toEqual([
      'Nacht, 0 Watt',
      'Bedeckt, 980 Watt',
      'Wolkig, 3.430 Watt',
      'Heiter, 6.370 Watt',
      'Sonnig, 8.330 Watt',
    ]);
    expect((radios[3] as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText('Heute erzeugt 7,40 Kilowattstunden')).toBeTruthy();
  });

  it('Carport: Elektroauto-Bereich, Wegfahren, kein „Raum ausschalten“', () => {
    render(<App startZustand={verbundenerZustand('2.1.0', snapshotLaedt())} />);
    const karte = document.getElementById('raum-carport')!;
    expect(within(karte).getByText(/Elektroauto zu Hause, Akku 64 Prozent, lädt/)).toBeTruthy();
    expect(within(karte).getByRole('button', { name: 'Elektroauto wegfahren lassen' })).toBeTruthy();
    expect(within(karte).queryByRole('button', { name: 'Carport ausschalten' })).toBeNull();
    expect(within(karte).getByRole('switch', { name: 'Wallbox, Carport' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('button', { name: /^Carport, 11\.000\u202fW, Elektroauto lädt, Akku 64 % – zur Raumkarte$/ })).toBeTruthy();
  });

  it('Auto unterwegs: Wallbox gesperrt mit Grund, Zurückkommen (AC-05)', () => {
    render(<App startZustand={verbundenerZustand('2.1.0', snapshot({ auto: { zuhause: false, akkuWh: 38400, stand: SERVER_ZEIT } }))} />);
    const wallbox = screen.getByRole('switch', { name: 'Wallbox, Carport' });
    expect(wallbox.getAttribute('aria-disabled')).toBe('true');
    expect(document.getElementById(wallbox.getAttribute('aria-describedby')!)!.textContent).toBe(
      'Standby 3,0 Watt, nicht verfügbar: Elektroauto ist unterwegs',
    );
    expect(wallbox.textContent).toContain('Auto unterwegs');
    expect(screen.getByRole('button', { name: 'Elektroauto zurückkommen lassen' })).toBeTruthy();
    expect(screen.getByText('Eine Fahrt verbraucht 15 % Akku.')).toBeTruthy();
  });

  it('Akku unter 15 %: Wegfahren gesperrt mit sichtbarem Grund (AC-08)', () => {
    render(<App startZustand={verbundenerZustand('2.1.0', snapshot({ auto: { zuhause: true, akkuWh: 8400, stand: SERVER_ZEIT } }))} />);
    const knopf = screen.getByRole('button', { name: 'Elektroauto wegfahren lassen' });
    expect(knopf.getAttribute('aria-disabled')).toBe('true');
    expect(document.getElementById(knopf.getAttribute('aria-describedby')!)!.textContent).toBe(
      'Akku zu leer zum Wegfahren (mindestens 15 %).',
    );
  });
});
