'use client';

// Hausverbrauch als animierte Zahl (FR-6): sr-only trägt immer den Zielwert, die sichtbare Zahl zählt.
import { zahl } from '@/domain/format';
import { useHochzaehlen } from '@/hooks/useHochzaehlen';
import { T } from '@/ui/texte';

export function Zaehler({ watt, animieren }: { watt: number; animieren: boolean }) {
  const angezeigt = useHochzaehlen(watt, animieren);
  return (
    <p className="relative">
      <span className="sr-only">{T.kopf.verbrauchSr(zahl(watt, 0))}</span>
      <span
        aria-hidden="true"
        className="zahlen inline-block min-w-[7ch] text-[40px] leading-[44px] font-bold tracking-[-0.02em] text-ink lg:text-[56px] lg:leading-[60px] [@media(max-height:500px)]:text-[28px] [@media(max-height:500px)]:leading-8"
      >
        {zahl(angezeigt, 0)}
        <small className="ml-1 text-lg font-semibold text-ink-secondary">W</small>
      </span>
    </p>
  );
}
