'use client';

// Seitenaufbau (FR-25, UX Information Architecture).
import type { ClientZustand } from '@/client/hausReducer';
import { CLIENT_VERSION, HausProvider, useHaus } from '@/hooks/useHaus';
import { T } from '@/ui/texte';
import { bannerArt } from './BannerRahmen';
import { Fehlergrenze } from './Fehlergrenze';
import { Fusszeile } from './Fusszeile';
import { Hausansicht } from './Hausansicht';
import { Kopfbereich } from './Kopfbereich';
import { LiveRegion } from './LiveRegion';
import { Meldungen } from './Meldungen';
import { Raeume } from './Raeume';
import { Erstfehler } from './Skeleton';
import { Sprunglink } from './Sprunglink';
import { Szenenleiste } from './Szenenleiste';
import { Uebersicht } from './Uebersicht';
import { VerbindungsBanner } from './VerbindungsBanner';
import { VerbrauchNachRaum } from './VerbrauchNachRaum';
import { VersionsBanner } from './VersionsBanner';

function Seite() {
  const { zustand } = useHaus();
  const laden = zustand.server === null;
  const banner = bannerArt(zustand);

  return (
    <>
      <Sprunglink />
      <Kopfbereich />
      <main
        aria-busy={laden || undefined}
        className={`mx-auto flex max-w-[1280px] flex-col gap-8 px-4 pt-4 md:px-6 ${banner ? 'pb-40' : 'pb-8'}`}
      >
        {laden && <p className="sr-only">{T.laden}</p>}
        {laden && zustand.fehlversuche > 0 && <Erstfehler titel={T.erstfehler.titel} text={T.erstfehler.text} />}
        <Uebersicht />
        <Szenenleiste />
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
      <Fusszeile version={CLIENT_VERSION} mitBanner={banner !== null} />
      <Meldungen ueberBanner={banner !== null} />
      {banner === 'version' && <VersionsBanner />}
      {banner === 'getrennt' && <VerbindungsBanner />}
      <LiveRegion />
    </>
  );
}

export function App({ startZustand }: { startZustand?: ClientZustand }) {
  return (
    <Fehlergrenze>
      <HausProvider startZustand={startZustand}>
        <Seite />
      </HausProvider>
    </Fehlergrenze>
  );
}
