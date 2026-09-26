'use client';

import { useSyncExternalStore } from 'react';

const ABFRAGE = '(prefers-reduced-motion: reduce)';

function abonniere(rueckruf: () => void): () => void {
  const mq = window.matchMedia(ABFRAGE);
  mq.addEventListener('change', rueckruf);
  return () => mq.removeEventListener('change', rueckruf);
}

/** true bei `prefers-reduced-motion: reduce`, live beobachtet. */
export function useReduzierteBewegung(): boolean {
  return useSyncExternalStore(
    abonniere,
    () => window.matchMedia(ABFRAGE).matches,
    () => false,
  );
}
