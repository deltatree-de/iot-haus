'use client';

// Toast-Stapel (FR-11): max. 3, je 4 s, pausiert bei Hover/Fokus, Escape schließt die neueste.
import { useEffect, useRef, useState } from 'react';
import type { Meldung } from '@/client/hausReducer';
import { useHaus } from '@/hooks/useHaus';
import { T } from '@/ui/texte';
import { Symbol, type SymbolName } from './Symbol';

export const MELDUNG_DAUER_MS = 4000;

const SYMBOL: Record<Meldung['art'], { symbol: SymbolName; farbe: string }> = {
  plus: { symbol: 'pfeil-hoch', farbe: 'text-delta-up' },
  minus: { symbol: 'pfeil-runter', farbe: 'text-delta-down' },
  info: { symbol: 'info', farbe: 'text-ink-secondary' },
  fehler: { symbol: 'warnung', farbe: 'text-danger' },
};

function Toast({ meldung, onSchliessen }: { meldung: Meldung; onSchliessen: () => void }) {
  const [pausiert, setPausiert] = useState(false);
  const rest = useRef(MELDUNG_DAUER_MS);
  const schliessen = useRef(onSchliessen);
  schliessen.current = onSchliessen;

  useEffect(() => {
    if (pausiert) return;
    const start = Date.now();
    const timer = setTimeout(() => schliessen.current(), rest.current);
    return () => {
      clearTimeout(timer);
      rest.current -= Date.now() - start;
    };
  }, [pausiert]);

  const s = SYMBOL[meldung.art];
  return (
    <li
      onMouseEnter={() => setPausiert(true)}
      onMouseLeave={() => setPausiert(false)}
      onFocus={() => setPausiert(true)}
      onBlur={() => setPausiert(false)}
      className="toast-ein pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-surface-raised py-1 pr-1 pl-4 text-sm text-ink ebene-2"
    >
      <Symbol name={s.symbol} groesse={20} className={`shrink-0 ${s.farbe}`} />
      <p className="zahlen min-w-0 flex-1 py-2">
        {meldung.delta && <span className={`font-semibold ${s.farbe}`}>{meldung.delta}</span>}
        {meldung.delta && ' · '}
        {meldung.text}
      </p>
      <button
        type="button"
        onClick={onSchliessen}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-secondary hover:text-ink"
      >
        <Symbol name="schliessen" groesse={16} />
        <span className="sr-only">{T.toast.schliessen}</span>
      </button>
    </li>
  );
}

export function Meldungen({ ueberBanner }: { ueberBanner: boolean }) {
  const { zustand, meldungEntfernen } = useHaus();
  const meldungen = zustand.meldungen;

  // Escape schließt die neueste Meldung, sofern kein Dialog offen ist (UX Priorität)
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || meldungen.length === 0) return;
      if (document.querySelector('dialog[open]')) return;
      meldungEntfernen(meldungen[meldungen.length - 1].id);
    };
    document.addEventListener('keydown', taste);
    return () => document.removeEventListener('keydown', taste);
  }, [meldungen, meldungEntfernen]);

  return (
    <section aria-label={T.toast.liste}>
      <ol
        className={`pointer-events-none fixed inset-x-0 z-30 mx-auto flex w-[min(100%-32px,380px)] flex-col gap-2 md:right-4 md:left-auto md:mx-0 ${
          ueberBanner ? 'bottom-[calc(96px+env(safe-area-inset-bottom))] min-[480px]:bottom-[calc(80px+env(safe-area-inset-bottom))]' : 'bottom-[calc(16px+env(safe-area-inset-bottom))]'
        }`}
      >
        {meldungen.map((m) => (
          <Toast key={m.id} meldung={m} onSchliessen={() => meldungEntfernen(m.id)} />
        ))}
      </ol>
    </section>
  );
}
