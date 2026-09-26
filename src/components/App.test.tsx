// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';
import { hausReducer } from '@/client/hausReducer';
import { snapshot, SERVER_ZEIT, verbundenerZustand } from '../../tests/fixtures/snapshot';
import { App } from './App';
import { GeraetSchalter } from './GeraetSchalter';
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
    // Grundlast 65 + Stehlampe 10 + Wasserkocher 2.200 + Standby 10,3 = 2.285,3 W
    expect(within(kopf).getByText('Hausverbrauch 2.285 Watt')).toBeTruthy();
    expect(kopf.textContent).toContain('hoch');
    expect(kopf.textContent).toContain('0,80 €/h');
    expect(kopf.textContent).toContain('Verbunden');
    expect(screen.getByText(/davon Standby 10,3 W/)).toBeTruthy();
    expect(screen.getByText(/Heute 3,42 kWh/).textContent).toContain('1,20 €');
    expect(screen.getByText('Strompreis 0,35 €/kWh')).toBeTruthy();
  });

  it('Schalter haben role, Zustand, Namen und Beschreibung (FR-27)', () => {
    render(<App startZustand={verbundenerZustand()} />);
    const schalter = screen.getAllByRole('switch');
    expect(schalter).toHaveLength(28);
    const mikro = screen.getByRole('switch', { name: 'Mikrowelle, Küche' });
    expect(mikro.getAttribute('aria-checked')).toBe('false');
    const beschreibung = document.getElementById(mikro.getAttribute('aria-describedby')!);
    expect(beschreibung?.textContent).toBe('Standby 1,5 Watt, schaltet nach 3 Minuten automatisch aus');
    const kocher = screen.getByRole('switch', { name: 'Wasserkocher, Küche' });
    expect(kocher.getAttribute('aria-checked')).toBe('true');
  });

  it('Hausansicht: Räume sind Schaltflächen mit Verbrauch (FR-26)', () => {
    render(<App startZustand={verbundenerZustand()} />);
    expect(screen.getByRole('button', { name: 'Wohnzimmer, 13 W, 1 Gerät an – zur Raumkarte' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Badezimmer, 0 W, 0 Geräte an – zur Raumkarte' })).toBeTruthy();
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
        energie: { datum: '2026-09-26', wh: 1 },
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
        energie: { datum: '2026-09-26', wh: 1 },
      },
      jetzt: SERVER_ZEIT,
      clientVersion: '2.0.0',
    });
    render(<App startZustand={z} />);
    const liste = screen.getByRole('region', { name: 'Meldungen' });
    expect(liste.textContent).toContain('+1.199 W · Mikrowelle (Küche)');
    await act(async () => {
      fireEvent.click(within(liste).getByRole('button', { name: 'Meldung schließen' }));
    });
    expect(liste.textContent).toBe('');
  });
});

describe('GeraetSchalter einzeln', () => {
  it('zeigt „wird geschaltet …“ und aria-busy', () => {
    render(
      <ul>
        <GeraetSchalter
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

  it('Snapshot-Fixture enthält alle Geräte', () => {
    const s = snapshot();
    expect(s.typ === 'snapshot' && Object.keys(s.zustand)).toHaveLength(28);
  });
});
