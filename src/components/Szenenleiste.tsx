'use client';

// Szenenleiste mit vier festen Szenen (FR-22, FR-23). Keine optimistische Anzeige.
import { istBeschaeftigt } from '@/client/hausReducer';
import { SZENEN } from '@/domain/szenen';
import { useHaus } from '@/hooks/useHaus';
import { T } from '@/ui/texte';
import { SzenenKnopf } from './SzenenKnopf';

export function Szenenleiste() {
  const { zustand, bedienbar, szene } = useHaus();
  return (
    <section aria-labelledby="szenen-titel">
      <h2 id="szenen-titel" className="mb-3 text-lg font-semibold text-ink">
        {T.szenen.titel}
      </h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {SZENEN.map((s) => (
          <li key={s.id} className="min-w-0">
            <SzenenKnopf
              szene={s}
              beschaeftigt={istBeschaeftigt(zustand, 'szene', s.id)}
              gesperrt={!bedienbar}
              onAusfuehren={() => szene(s.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
