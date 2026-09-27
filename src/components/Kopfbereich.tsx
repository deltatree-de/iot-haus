'use client';

// Sticky Kopfbereich: Hausverbrauch, Laststufe, Kosten pro Stunde, Verbindungsstatus (FR-6, FR-9, FR-12, FR-20).
import { useEffect, useRef } from 'react';
import { euroProStunde, zahl } from '@/domain/format';
import { erzeugung } from '@/domain/solar';
import { ertragProStunde, hausverbrauch, kostenProStunde, laststufe, netzbilanz, runden } from '@/domain/verbrauch';
import { useHaus } from '@/hooks/useHaus';
import { T } from '@/ui/texte';
import { DeltaChip } from './DeltaChip';
import { LaststufePille } from './LaststufePille';
import { NetzZeile } from './NetzZeile';
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
  const bilanz = netzbilanz(watt, server ? runden(erzeugung(server.sonne.stufe)) : 0);
  // Kosten aus dem Netzbezug; bei Einspeisung steht dort der Ertrag (FR-9, FR-41, E-21)
  const ertrag = bilanz.einspeisungW > 0;
  const betrag = server
    ? ertrag
      ? ertragProStunde(bilanz.einspeisungW, server.einspeiseverguetung)
      : kostenProStunde(bilanz.bezugW, server.strompreis)
    : 0;

  return (
    <header ref={ref} className="sticky top-0 z-20 border-b border-border bg-surface pt-[env(safe-area-inset-top)]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-2 md:px-6 lg:flex lg:min-h-[88px] lg:flex-wrap lg:gap-x-6 xl:flex-nowrap [@media(max-height:500px)]:flex [@media(max-height:500px)]:py-1">
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
                <span className="sr-only">{ertrag ? T.kopf.ertragSr(zahl(betrag, 2)) : T.kopf.kostenSr(zahl(betrag, 2))}</span>
                <span aria-hidden="true">{ertrag ? `${T.kopf.ertrag} ${euroProStunde(betrag)}` : euroProStunde(betrag)}</span>
              </p>
            </>
          ) : (
            <>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </>
          )}
        </div>
        <div className="col-span-2 lg:order-3 lg:w-full xl:w-auto [@media(max-height:500px)]:order-3 [@media(max-height:500px)]:w-auto">
          {server ? <NetzZeile bilanz={bilanz} /> : <Skeleton className="h-4 w-48" />}
        </div>
      </div>
    </header>
  );
}
