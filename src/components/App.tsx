'use client';

// Seitenaufbau (FR-25, UX Information Architecture).
import type { ClientZustand } from '@/client/hausReducer';
import { CLIENT_VERSION, HausProvider, useHaus } from '@/hooks/useHaus';
import { Ansager } from './Ansager';
import { Banner, bannerArt } from './Banner';
import { Hausansicht } from './Hausansicht';
import { Kopfbereich } from './Kopfbereich';
import { Meldungen } from './Meldungen';
import { Raeume } from './Raeume';
import { SzenenLeiste } from './SzenenLeiste';
import { Uebersicht } from './Uebersicht';
import { VerbrauchNachRaum } from './VerbrauchNachRaum';

function Seite() {
  const { zustand } = useHaus();
  const laden = zustand.server === null;
  const erstfehler = laden && zustand.fehlversuche > 0;
  const mitBanner = bannerArt(zustand) !== null;

  return (
    <>
      <a
        href="#raeume"
        onClick={(e) => {
          e.preventDefault();
          const ziel = document.getElementById('raeume');
          ziel?.scrollIntoView({ block: 'start' });
          ziel?.focus({ preventScroll: true });
        }}
        className="sr-only z-50 rounded-[10px] bg-surface-raised px-4 py-3 font-medium text-ink ebene-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Zu den Räumen springen
      </a>
      <Kopfbereich />
      <main
        aria-busy={laden || undefined}
        className={`mx-auto flex max-w-[1280px] flex-col gap-8 px-4 pt-4 md:px-6 ${mitBanner ? 'pb-40' : 'pb-8'}`}
      >
        {laden && <p className="sr-only">Hauszustand wird geladen …</p>}
        {erstfehler && (
          <div className="rounded-2xl border border-border bg-surface p-4 ebene-1">
            <p className="font-semibold text-ink">Keine Verbindung zum Haus</p>
            <p className="text-sm text-ink-secondary">
              Die App versucht es automatisch erneut. Bitte prüfen, ob der Server läuft.
            </p>
          </div>
        )}
        <Uebersicht />
        <SzenenLeiste />
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
          {/* Schmal: Hausansicht, Räume, Verbrauch nach Raum (FR-25) – die linke Spalte löst sich per
              display:contents auf, „Verbrauch nach Raum“ rückt per order ans Ende (nicht interaktiv,
              Fokusreihenfolge unverändert). Ab 1024 px: linke Spalte mit Haus und Verbrauch, sticky. */}
          <div className="contents lg:col-span-5 lg:flex lg:min-w-0 lg:flex-col lg:gap-8 lg:self-start [@media(min-width:1024px)_and_(min-height:860px)]:sticky [@media(min-width:1024px)_and_(min-height:860px)]:top-[calc(var(--kopf-h)+16px)]">
            <Hausansicht />
            <VerbrauchNachRaum className="order-last min-w-0 lg:order-none" />
          </div>
          <div className="min-w-0 lg:col-span-7">
            <Raeume />
          </div>
        </div>
      </main>
      <footer className={`mx-auto max-w-[1280px] px-4 text-[13px] leading-5 text-ink-secondary md:px-6 ${mitBanner ? 'pb-40' : 'pb-8'}`}>
        <p>Alle Leistungs- und Kostenwerte sind Schätzungen auf Basis typischer Geräteleistungen.</p>
        <p>IoT-Haus {CLIENT_VERSION}</p>
      </footer>
      <Meldungen ueberBanner={mitBanner} />
      <Banner />
      <Ansager />
    </>
  );
}

export function App({ startZustand }: { startZustand?: ClientZustand }) {
  return (
    <HausProvider startZustand={startZustand}>
      <Seite />
    </HausProvider>
  );
}
