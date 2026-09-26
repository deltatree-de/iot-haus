// Gemeinsame Optik der Banner unten (K-23): höchstens eines sichtbar, role="status".
import type { ReactNode } from 'react';
import { Symbol } from './Symbol';

interface Props {
  art: 'warn' | 'info';
  children: ReactNode;
  aktion: { text: string; gesperrt?: boolean; onClick: () => void };
}

export function BannerRahmen({ art, children, aktion }: Props) {
  return (
    <div
      role="status"
      className={`fixed inset-x-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-[640px] flex-col gap-3 rounded-2xl p-3 px-4 ebene-2 min-[480px]:flex-row min-[480px]:items-center ${
        art === 'info' ? 'bg-banner-info-bg text-banner-info-ink' : 'bg-banner-warn-bg text-banner-warn-ink'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Symbol name={art === 'info' ? 'info' : 'warnung'} groesse={20} className="mt-0.5 shrink-0" />
        <div className="min-w-0 text-sm min-[480px]:text-base">{children}</div>
      </div>
      <button
        type="button"
        aria-disabled={aktion.gesperrt || undefined}
        onClick={() => {
          if (!aktion.gesperrt) aktion.onClick();
        }}
        className={`min-h-11 shrink-0 rounded-[10px] bg-primary px-4 font-medium text-primary-contrast ${
          aktion.gesperrt ? 'opacity-55' : ''
        }`}
      >
        {aktion.text}
      </button>
    </div>
  );
}

/** Welches Banner gilt? „Neue Version“ hat Vorrang vor „Getrennt“ (FR-18, FR-20). */
export function bannerArt(z: {
  versionKonflikt: boolean;
  verbindung: string;
  server: unknown;
  fehlversuche: number;
}): 'version' | 'getrennt' | null {
  if (z.versionKonflikt) return 'version';
  if (z.verbindung !== 'verbunden' && (z.server !== null || z.fehlversuche > 0)) return 'getrennt';
  return null;
}
