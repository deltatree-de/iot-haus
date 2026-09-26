'use client';

// Hausansicht: 2 Etagen × 3 Räume als Schaltflächen, Sprung zur Raumkarte (FR-7, FR-26, AD-12, K-10).
import { useCallback } from 'react';
import { RAEUME, type RaumId } from '@/domain/katalog';
import { useHaus } from '@/hooks/useHaus';
import { useReduzierteBewegung } from '@/hooks/useReduzierteBewegung';
import { T } from '@/ui/texte';
import { RaumFlaeche } from './RaumFlaeche';
import { Symbol } from './Symbol';

const ETAGEN = (['OG', 'EG'] as const).map((etage) => ({ etage, raeume: RAEUME.filter((r) => r.etage === etage) }));

export function springeZuRaum(raum: RaumId, reduziert: boolean): void {
  const karte = document.getElementById(`raum-${raum}`);
  const titel = document.getElementById(`raum-${raum}-titel`);
  if (!karte || !titel) return;
  karte.scrollIntoView({ behavior: reduziert ? 'auto' : 'smooth', block: 'start' });
  titel.focus({ preventScroll: true });
  karte.classList.remove('impuls');
  void karte.offsetWidth;
  karte.classList.add('impuls');
}

export function Hausansicht() {
  const { zustand } = useHaus();
  const reduziert = useReduzierteBewegung();
  const sprung = useCallback((raum: RaumId) => springeZuRaum(raum, reduziert), [reduziert]);
  // Impuls nur für Räume der letzten Änderung; ein Snapshot setzt letzteAenderung zurück.
  const a = zustand.letzteAenderung;
  const z = zustand.server?.zustand ?? null;

  return (
    <section aria-labelledby="haus-titel">
      <h2 id="haus-titel" className="mb-3 text-lg font-semibold text-ink">
        {T.haus.titel}
      </h2>
      <div role="group" aria-label={T.haus.titel} className="mx-auto max-w-xl">
        <svg viewBox="0 0 300 60" className="ml-7 block w-[calc(100%-28px)] text-house-roof" aria-hidden="true" focusable="false">
          <path d="M4 58 150 6l146 52" fill="var(--c-surface-sunken)" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <div className="flex flex-col">
          {ETAGEN.map(({ etage, raeume }) => (
            <div key={etage} role="group" aria-label={T.haus.etage[etage]} className="flex items-stretch">
              <span aria-hidden="true" className="w-7 shrink-0 self-center text-[13px] leading-4 font-medium text-ink-secondary">
                {etage}
              </span>
              <div
                className={`grid min-w-0 flex-1 grid-cols-3 gap-1 border-x-2 border-house-roof p-1 ${
                  etage === 'OG' ? 'border-t-2' : 'border-b-2'
                }`}
              >
                {raeume.map((r) => (
                  <RaumFlaeche
                    key={r.id}
                    raum={r.id}
                    zustand={z}
                    impulsNr={a && a.raeume.includes(r.id) ? a.nr : null}
                    onSprung={sprung}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[13px] leading-4 text-ink-secondary">
        <Symbol name="birne" groesse={14} className="text-on" />
        {T.haus.legende}
      </p>
    </section>
  );
}
