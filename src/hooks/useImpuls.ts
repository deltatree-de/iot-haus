'use client';

import { useEffect, useRef } from 'react';

/** Startet eine CSS-Impulsanimation neu, sobald sich `ausloeser` ändert (ohne Neumontage, Fokus bleibt). */
export function useImpuls<T extends HTMLElement>(ausloeser: number | null, klasse: string) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || ausloeser === null) return;
    el.classList.remove(klasse);
    void el.offsetWidth;
    el.classList.add(klasse);
  }, [ausloeser, klasse]);
  return ref;
}
