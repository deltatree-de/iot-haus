'use client';

// Banner unten: „Neue Version verfügbar“ hat Vorrang vor „Verbindung getrennt“ (FR-18, FR-20).
import { useHaus } from '@/hooks/useHaus';
import { useSekundentakt } from '@/hooks/useSekundentakt';
import { Icon } from './Icon';

export function bannerArt(z: ReturnType<typeof useHaus>['zustand']): 'version' | 'getrennt' | null {
  if (z.versionKonflikt) return 'version';
  const getrennt = z.verbindung !== 'verbunden';
  if (getrennt && (z.server !== null || z.fehlversuche > 0)) return 'getrennt';
  return null;
}

function Countdown({ zeitpunkt }: { zeitpunkt: number }) {
  const jetzt = useSekundentakt(true) || Date.now();
  const s = Math.max(0, Math.ceil((zeitpunkt - jetzt) / 1000));
  return <>Nächster Versuch in {s} s</>;
}

export function Banner() {
  const { zustand, naechsterVersuch, neuVerbinden } = useHaus();
  const art = bannerArt(zustand);
  if (!art) return null;

  const version = art === 'version';
  const versucht = zustand.verbindung === 'verbinde';

  return (
    <div
      role="status"
      className={`fixed inset-x-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-[640px] flex-col gap-3 rounded-2xl p-3 px-4 ebene-2 min-[480px]:flex-row min-[480px]:items-center ${
        version ? 'bg-banner-info-bg text-banner-info-ink' : 'bg-banner-warn-bg text-banner-warn-ink'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon name={version ? 'info' : 'warnung'} groesse={20} className="mt-0.5 shrink-0" />
        <div className="min-w-0 text-sm min-[480px]:text-base">
          {version ? (
            <>
              <p className="font-semibold">Neue Version verfügbar</p>
              <p>Die App wurde aktualisiert. Bitte neu laden, um weiter zu schalten.</p>
            </>
          ) : (
            <>
              <p>Verbindung getrennt – Schalter sind gesperrt, bis die Verbindung wieder steht.</p>
              <p className="zahlen text-[13px] leading-4 font-medium" aria-hidden="true">
                {versucht || naechsterVersuch === null ? 'Verbinde …' : <Countdown zeitpunkt={naechsterVersuch} />}
              </p>
            </>
          )}
        </div>
      </div>
      <button
        type="button"
        aria-disabled={(!version && versucht) || undefined}
        onClick={() => {
          if (version) window.location.reload();
          else if (!versucht) neuVerbinden();
        }}
        className={`min-h-11 shrink-0 rounded-[10px] bg-primary px-4 font-medium text-primary-contrast ${
          !version && versucht ? 'opacity-55' : ''
        }`}
      >
        {version ? 'Neu laden' : 'Jetzt neu verbinden'}
      </button>
    </div>
  );
}
