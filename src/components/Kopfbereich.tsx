'use client';

// Sticky Kopfbereich: Hausverbrauch, Laststufe, Kosten pro Stunde, Verbindungsstatus (FR-6, FR-9, FR-12, FR-20).
import { useEffect, useRef } from 'react';
import { euroProStunde, wattDifferenz } from '@/domain/format';
import { hausverbrauch, kostenProStunde, laststufe, runden, type Laststufe } from '@/domain/verbrauch';
import { useHaus } from '@/hooks/useHaus';
import { useHochzaehlen } from '@/hooks/useHochzaehlen';
import { Icon } from './Icon';

const ZAHL = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });

const STUFEN: Record<Laststufe, { klasse: string; icon: 'laststufe-1' | 'laststufe-2' | 'laststufe-3' }> = {
  niedrig: { klasse: 'bg-load-low-bg text-load-low', icon: 'laststufe-1' },
  mittel: { klasse: 'bg-load-mid-bg text-load-mid', icon: 'laststufe-2' },
  hoch: { klasse: 'bg-load-high-bg text-load-high', icon: 'laststufe-3' },
};

export function LaststufePille({ stufe }: { stufe: Laststufe }) {
  const s = STUFEN[stufe];
  return (
    <span className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[13px] leading-4 font-medium ${s.klasse}`}>
      <Icon name={s.icon} groesse={14} />
      <span className="sr-only">Laststufe </span>
      {stufe}
    </span>
  );
}

export function Verbindungsstatus() {
  const { zustand } = useHaus();
  const v = zustand.verbindung;
  const text = v === 'verbunden' ? 'Verbunden' : v === 'verbinde' ? 'Verbinde …' : 'Getrennt';
  const farbe = v === 'verbunden' ? 'text-status-ok' : v === 'verbinde' ? 'text-ink-secondary' : 'text-danger';
  return (
    <p className={`flex min-h-6 items-center gap-1.5 text-[13px] leading-4 font-medium ${farbe}`}>
      <Icon
        name={v === 'verbunden' ? 'verbunden' : v === 'verbinde' ? 'verbinde' : 'getrennt'}
        groesse={v === 'verbunden' ? 10 : 14}
        className={v === 'verbinde' ? 'drehen' : undefined}
      />
      <span className="sr-only">Verbindungsstatus: </span>
      <span className="max-[360px]:sr-only">{text}</span>
    </p>
  );
}

function Hausverbrauch({ watt, animieren }: { watt: number; animieren: boolean }) {
  const angezeigt = useHochzaehlen(watt, animieren);
  return (
    <p className="relative">
      <span className="sr-only">Hausverbrauch {ZAHL.format(watt)} Watt</span>
      <span
        aria-hidden="true"
        className="zahlen inline-block min-w-[7ch] text-[40px] leading-[44px] font-bold tracking-[-0.02em] text-ink lg:text-[56px] lg:leading-[60px] [@media(max-height:500px)]:text-[28px] [@media(max-height:500px)]:leading-8"
      >
        {ZAHL.format(angezeigt)}
        <small className="ml-1 text-lg font-semibold text-ink-secondary">W</small>
      </span>
    </p>
  );
}

function DeltaChip() {
  const { zustand } = useHaus();
  const a = zustand.letzteAenderung;
  if (!a || a.differenzW === 0) return null;
  return (
    <span
      key={a.nr}
      aria-hidden="true"
      className={`delta-chip zahlen pointer-events-none absolute -top-1 right-0 text-sm font-semibold lg:static lg:ml-2 ${
        a.differenzW > 0 ? 'text-delta-up' : 'text-delta-down'
      }`}
    >
      {wattDifferenz(a.differenzW)}
    </span>
  );
}

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

  return (
    <header
      ref={ref}
      className="sticky top-0 z-20 border-b border-border bg-surface pt-[env(safe-area-inset-top)]"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-2 md:px-6 lg:flex lg:min-h-[88px] lg:gap-6 [@media(max-height:500px)]:flex [@media(max-height:500px)]:py-1">
        <h1 className="flex items-center gap-1.5 text-[13px] leading-4 font-semibold text-ink [@media(max-height:500px)]:sr-only">
          <Icon name="haus" groesse={16} />
          IoT-Haus
        </h1>
        <div className="justify-self-end lg:order-last lg:ml-auto">
          <Verbindungsstatus />
        </div>
        <div className="relative min-w-0 lg:flex lg:items-baseline lg:gap-3">
          <p className="text-[13px] leading-4 font-medium text-ink-secondary [@media(max-height:500px)]:sr-only">
            Hausverbrauch
          </p>
          {server ? (
            <div className="relative flex items-baseline">
              <Hausverbrauch watt={watt} animieren={zustand.letzteAenderung !== null} />
              <DeltaChip />
            </div>
          ) : (
            <div className="skeleton my-1 h-10 w-[5ch] text-[40px]" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-col items-end gap-1 lg:flex-row lg:items-center lg:gap-4 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:items-center">
          {server ? (
            <>
              <LaststufePille stufe={laststufe(watt)} />
              <p className="zahlen text-sm text-ink">
                <span className="sr-only">Kosten </span>
                {euroProStunde(kostenProStunde(watt, server.strompreis))}
              </p>
            </>
          ) : (
            <>
              <span className="skeleton h-6 w-20 rounded-full" aria-hidden="true" />
              <span className="skeleton h-4 w-16" aria-hidden="true" />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
