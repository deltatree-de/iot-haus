'use client';

// Übersichtsbereich: Standby-Anteil, Tageswerte mit Info-Hinweis, Strompreis, Darstellung (FR-9, FR-10, FR-13, FR-28).
import { useId, useState } from 'react';
import { euro, kwh, strompreis as strompreisText, wattEineStelle } from '@/domain/format';
import { standbyAnteil } from '@/domain/verbrauch';
import { useHaus } from '@/hooks/useHaus';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeWahl } from '@/ui/themeSkript';
import { Icon, type IconName } from './Icon';

const OPTIONEN: { wert: ThemeWahl; text: string; icon: IconName }[] = [
  { wert: 'system', text: 'System', icon: 'monitor-system' },
  { wert: 'hell', text: 'Hell', icon: 'sonne' },
  { wert: 'dunkel', text: 'Dunkel', icon: 'mond' },
];

function ThemeWahlFeld() {
  const [wahl, setWahl] = useTheme();
  const name = useId();
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">Darstellung</legend>
      <span aria-hidden="true" className="text-sm text-ink-secondary">
        Darstellung
      </span>
      <div className="flex rounded-[10px] bg-surface-sunken p-1">
        {OPTIONEN.map((o) => (
          <label
            key={o.wert}
            className={`relative flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-sm transition-colors duration-[var(--m-schnell)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
              wahl === o.wert ? 'border-border bg-surface text-ink' : 'border-transparent text-ink-secondary'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.wert}
              checked={wahl === o.wert}
              onChange={() => setWahl(o.wert)}
              className="sr-only"
            />
            <Icon name={o.icon} groesse={16} />
            {o.text}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Uebersicht() {
  const { zustand } = useHaus();
  const [infoOffen, setInfoOffen] = useState(false);
  const infoId = useId();
  const server = zustand.server;

  const wert = (inhalt: React.ReactNode, breite: string) =>
    server ? inhalt : <span className={`skeleton inline-block h-3.5 align-middle ${breite}`} aria-hidden="true" />;

  return (
    <section aria-labelledby="uebersicht-titel" className="text-sm text-ink-secondary">
      <h2 id="uebersicht-titel" className="sr-only">
        Übersicht
      </h2>
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-2">
          <p className="zahlen">
            davon Standby {wert(server && wattEineStelle(standbyAnteil(server.zustand)), 'w-12')}
          </p>
          <span aria-hidden="true" className="hidden lg:inline">
            ·
          </span>
          <div className="flex items-center gap-1">
            <p className="zahlen">
              Heute {wert(server && kwh(server.energie.wh), 'w-16')} ·{' '}
              {wert(server && euro((server.energie.wh / 1000) * server.strompreis), 'w-12')}
            </p>
            <button
              type="button"
              aria-expanded={infoOffen}
              aria-controls={infoId}
              onClick={() => setInfoOffen((o) => !o)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && infoOffen) {
                  e.stopPropagation();
                  setInfoOffen(false);
                }
              }}
              className="-my-3 inline-flex size-11 items-center justify-center rounded-full text-ink-secondary hover:text-ink"
            >
              <Icon name="info" groesse={20} />
              <span className="sr-only">Hinweis zu den Werten</span>
            </button>
          </div>
          <span aria-hidden="true" className="hidden lg:inline">
            ·
          </span>
          <p className="zahlen">Strompreis {wert(server && strompreisText(server.strompreis), 'w-20')}</p>
        </div>
        <ThemeWahlFeld />
      </div>
      <p id={infoId} hidden={!infoOffen} className="mt-2 rounded-[10px] bg-surface p-3 text-ink ebene-1">
        Schätzung auf Basis typischer Geräteleistungen, gezählt seit 00:00 Uhr.
      </p>
    </section>
  );
}
