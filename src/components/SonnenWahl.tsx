'use client';

// Sonnenwahl: fünf Stufen als native Radios im Segment-Look (FR-40, E-16). Auswahl ist optimistisch,
// der Server bestätigt oder die Auswahl springt zurück (FR-21, AC-16).
import { useId } from 'react';
import { anzeigeSonne } from '@/client/hausReducer';
import { watt, zahl } from '@/domain/format';
import { erzeugung, SONNENSTUFEN } from '@/domain/solar';
import { runden } from '@/domain/verbrauch';
import { useHaus } from '@/hooks/useHaus';
import { T } from '@/ui/texte';

export function SonnenWahl() {
  const { zustand, bedienbar, sonne } = useHaus();
  const name = useId();
  const hinweisId = useId();
  const { stufe, beschaeftigt } = anzeigeSonne(zustand);
  const gesperrt = !bedienbar;

  return (
    <fieldset aria-busy={beschaeftigt || undefined} aria-describedby={beschaeftigt ? hinweisId : undefined} className="min-w-0">
      <legend className="mb-2 text-sm text-ink-secondary">{T.solar.sonneLegende}</legend>
      <div className="flex flex-wrap gap-1 rounded-[10px] bg-surface-sunken p-1">
        {SONNENSTUFEN.map((s) => {
          const w = runden(erzeugung(s.id));
          const gewaehlt = stufe === s.id;
          return (
            <label
              key={s.id}
              className={`relative flex min-h-11 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center rounded-md border px-2 text-sm transition-colors duration-[var(--m-schnell)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                gewaehlt ? 'border-solar bg-surface font-medium text-ink' : 'border-transparent text-ink-secondary'
              } ${gesperrt ? 'cursor-not-allowed opacity-55' : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={s.id}
                checked={gewaehlt}
                aria-disabled={gesperrt || undefined}
                aria-label={T.solar.stufeSr(s.name, zahl(w, 0))}
                onChange={() => {
                  if (!gesperrt) sonne(s.id);
                }}
                className="sr-only"
              />
              <span aria-hidden="true">{s.name}</span>
              <span aria-hidden="true" className="zahlen text-[13px] leading-4 text-ink-secondary">
                {watt(w)}
              </span>
            </label>
          );
        })}
      </div>
      {beschaeftigt && (
        <p id={hinweisId} className="mt-1 text-[13px] leading-4 text-ink-secondary">
          {T.solar.busy}
        </p>
      )}
    </fieldset>
  );
}
