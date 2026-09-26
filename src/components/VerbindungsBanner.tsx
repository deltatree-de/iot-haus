'use client';

// „Verbindung getrennt“ mit Countdown und „Jetzt neu verbinden“ (FR-20).
import { useHaus } from '@/hooks/useHaus';
import { useSekundentakt } from '@/hooks/useSekundentakt';
import { T } from '@/ui/texte';
import { BannerRahmen } from './BannerRahmen';

function Countdown({ zeitpunkt }: { zeitpunkt: number }) {
  const jetzt = useSekundentakt(true) || Date.now();
  return <>{T.banner.countdown(Math.max(0, Math.ceil((zeitpunkt - jetzt) / 1000)))}</>;
}

export function VerbindungsBanner() {
  const { zustand, naechsterVersuch, neuVerbinden } = useHaus();
  const versucht = zustand.verbindung === 'verbinde';
  return (
    <BannerRahmen art="warn" aktion={{ text: T.banner.getrenntAktion, gesperrt: versucht, onClick: neuVerbinden }}>
      <p>{T.banner.getrennt}</p>
      <p className="zahlen text-[13px] leading-4 font-medium" aria-hidden="true">
        {versucht || naechsterVersuch === null ? T.banner.versuch : <Countdown zeitpunkt={naechsterVersuch} />}
      </p>
    </BannerRahmen>
  );
}
