'use client';

// Erstes fokussierbares Element: springt zur Überschrift „Räume“ (FR-25, UJ-4).
import { T } from '@/ui/texte';

export function Sprunglink() {
  return (
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
      {T.sprunglink}
    </a>
  );
}
