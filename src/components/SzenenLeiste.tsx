'use client';

// Szenenleiste mit vier festen Szenen (FR-22, FR-23). Keine optimistische Anzeige, keine „aktiv“-Markierung.
import { istBeschaeftigt } from '@/client/hausReducer';
import { SZENEN, type SzenenSymbol } from '@/domain/szenen';
import { useHaus } from '@/hooks/useHaus';
import { Icon, type IconName } from './Icon';

const DARSTELLUNG: Record<SzenenSymbol, { icon: IconName; untertitel: string }> = {
  'alles-aus': { icon: 'power', untertitel: 'Grundlast bleibt an' },
  filmabend: { icon: 'film', untertitel: 'Stehlampe, Fernseher, Soundbar' },
  morgenroutine: { icon: 'sonnenaufgang', untertitel: 'Kaffee, Wasserkocher, Bad warm' },
  'gute-nacht': { icon: 'mond', untertitel: 'Nur Nachttischlampe bleibt an' },
};

export function SzenenLeiste() {
  const { zustand, bedienbar, szene } = useHaus();

  return (
    <section aria-labelledby="szenen-titel">
      <h2 id="szenen-titel" className="mb-3 text-lg font-semibold text-ink">
        Szenen
      </h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {SZENEN.map((s) => {
          const d = DARSTELLUNG[s.symbol];
          const beschaeftigt = istBeschaeftigt(zustand, 'szene', s.id);
          const gesperrt = !bedienbar;
          const beschreibung = `szene-${s.id}-text`;
          return (
            <li key={s.id} className="min-w-0">
              <button
                type="button"
                aria-disabled={gesperrt || undefined}
                aria-busy={beschaeftigt || undefined}
                aria-describedby={beschreibung}
                onClick={() => {
                  if (!gesperrt && !beschaeftigt) szene(s.id);
                }}
                className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left ebene-1 transition-colors duration-[var(--m-schnell)] active:bg-surface-sunken [@media(hover:hover)]:hover:border-ink-muted"
              >
                <span className={`shrink-0 text-ink-secondary ${gesperrt ? 'opacity-55' : ''}`}>
                  {beschaeftigt ? <Icon name="verbinde" className="drehen" /> : <Icon name={d.icon} />}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-ink">{s.name}</span>
                  <span id={beschreibung} className="block truncate text-sm text-ink-secondary">
                    {beschaeftigt ? 'Wird ausgeführt …' : d.untertitel}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
