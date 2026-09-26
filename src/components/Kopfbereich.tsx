'use client';

// Sticky Kopfbereich: Hausverbrauch, Laststufe, Kosten pro Stunde, Verbindungsstatus (FR-6, FR-9, FR-12, FR-20).
import { useEffect, useRef } from 'react';
import { euroProStunde, zahl } from '@/domain/format';
import { hausverbrauch, kostenProStunde, laststufe, runden } from '@/domain/verbrauch';
import { useHaus } from '@/hooks/useHaus';
import { T } from '@/ui/texte';
import { DeltaChip } from './DeltaChip';
import { LaststufePille } from './LaststufePille';
import { Skeleton } from './Skeleton';
import { Symbol } from './Symbol';
import { VerbindungsStatus } from './VerbindungsStatus';
import { Zaehler } from './Zaehler';

export function Kopfbereich() {
  const { zustand } = useHaus();
  const ref = useRef<HTMLElement>(null);
  const server = zustand.server;

  // Kopfhöhe als CSS-Variable für scroll-margin und die sticky linke Spalte
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const beobachter = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--kopf-h', `${el.offsetHeight}px`);
    });
    beobachter.observe(el);
    return () => beobachter.disconnect();
  }, []);

  const watt = server ? runden(hausverbrauch(server.zustand)) : 0;
  const kosten = server ? kostenProStunde(watt, server.strompreis) : 0;

  return (
    <header ref={ref} className="sticky top-0 z-20 border-b border-border bg-surface pt-[env(safe-area-inset-top)]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-2 md:px-6 lg:flex lg:min-h-[88px] lg:gap-6 [@media(max-height:500px)]:flex [@media(max-height:500px)]:py-1">
        <h1 className="flex items-center gap-1.5 text-[13px] leading-4 font-semibold text-ink [@media(max-height:500px)]:sr-only">
          <Symbol name="haus" groesse={16} />
          {T.kopf.marke}
        </h1>
        <div className="justify-self-end lg:order-last lg:ml-auto">
          <VerbindungsStatus verbindung={zustand.verbindung} />
        </div>
        <div className="relative min-w-0 lg:flex lg:items-baseline lg:gap-3">
          <p className="text-[13px] leading-4 font-medium text-ink-secondary [@media(max-height:500px)]:sr-only">
            {T.kopf.verbrauchLabel}
          </p>
          {server ? (
            <div className="relative flex items-baseline">
              <Zaehler watt={watt} animieren={zustand.letzteAenderung !== null} />
              <DeltaChip aenderung={zustand.letzteAenderung} />
            </div>
          ) : (
            <Skeleton className="my-1 h-10 w-[5ch] text-[40px]" />
          )}
        </div>
        <div className="flex flex-col items-end gap-1 lg:flex-row lg:items-center lg:gap-4 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:items-center">
          {server ? (
            <>
              <LaststufePille stufe={laststufe(watt)} />
              <p className="zahlen text-sm text-ink">
                <span className="sr-only">{T.kopf.kostenSr(zahl(kosten, 2))}</span>
                <span aria-hidden="true">{euroProStunde(kosten)}</span>
              </p>
            </>
          ) : (
            <>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
