'use client';

// „Verbrauch nach Raum“: alle Räume absteigend mit Balken und Prozent (FR-7).
import { useId } from 'react';
import { RAEUME, raumById } from '@/domain/katalog';
import { prozent, watt } from '@/domain/format';
import { runden, verbrauchNachRaum } from '@/domain/verbrauch';
import { useHaus } from '@/hooks/useHaus';
import { T } from '@/ui/texte';

export function VerbrauchNachRaum({ className }: { className?: string }) {
  const { zustand } = useHaus();
  const titelId = useId();
  const z = zustand.server?.zustand;

  return (
    <section aria-labelledby={titelId} className={className}>
      <h2 id={titelId} className="mb-3 text-lg font-semibold text-ink">
        {T.verbrauch.titel}
      </h2>
      <div className="rounded-2xl border border-border bg-surface p-4 ebene-1">
        {z ? (
          <ol className="flex flex-col gap-3">
            {verbrauchNachRaum(z).map((r) => (
              <li key={r.raum}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-ink">{raumById(r.raum).name}</span>
                  <span className="zahlen flex gap-3 text-sm">
                    <span className="font-semibold text-ink">{watt(runden(r.watt))}</span>
                    <span className="w-[4ch] text-right text-ink-secondary">{prozent(r.anteil)}</span>
                  </span>
                </div>
                <div role="presentation" className="mt-1 h-2 overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full origin-left rounded-full bg-on transition-transform duration-[var(--m-basis)]"
                    style={{ transform: `scaleX(${r.anteil})` }}
                  />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex flex-col gap-3" aria-hidden="true">
            {RAEUME.map((r, i) => (
              <div key={r.id + i} className="skeleton h-8" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
