'use client';

// Darstellung System/Hell/Dunkel als native Radios im Segment-Look (FR-28).
import { useId } from 'react';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeWahl as Wahl } from '@/ui/themeSkript';
import { T } from '@/ui/texte';
import { Symbol, type SymbolName } from './Symbol';

const OPTIONEN: { wert: Wahl; text: string; symbol: SymbolName }[] = [
  { wert: 'system', text: T.theme.system, symbol: 'monitor-system' },
  { wert: 'hell', text: T.theme.hell, symbol: 'sonne' },
  { wert: 'dunkel', text: T.theme.dunkel, symbol: 'mond' },
];

export function ThemeWahl() {
  const [wahl, setWahl] = useTheme();
  const name = useId();
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{T.theme.legende}</legend>
      <span aria-hidden="true" className="text-sm text-ink-secondary">
        {T.theme.legende}
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
            <Symbol name={o.symbol} groesse={16} />
            {o.text}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
