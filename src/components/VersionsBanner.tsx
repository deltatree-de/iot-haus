'use client';

// „Neue Version verfügbar“ mit „Neu laden“; Schalter bleiben bis dahin gesperrt (FR-18).
import { T } from '@/ui/texte';
import { BannerRahmen } from './BannerRahmen';

export function VersionsBanner() {
  return (
    <BannerRahmen art="info" aktion={{ text: T.banner.versionAktion, onClick: () => window.location.reload() }}>
      <p className="font-semibold">{T.banner.versionTitel}</p>
      <p>{T.banner.versionText}</p>
    </BannerRahmen>
  );
}
