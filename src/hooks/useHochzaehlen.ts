'use client';

import { useEffect, useRef, useState } from 'react';
import { useReduzierteBewegung } from './useReduzierteBewegung';

/** Kurve motion.zaehlen: cubic-bezier(0.22, 1, 0.36, 1) ≈ easeOutQuint */
function kurve(t: number): number {
  return 1 - (1 - t) ** 5;
}

/**
 * Zählt vom aktuell angezeigten Wert zum Ziel (FR-6, 600 ms). `animieren = false` springt sofort
 * (Snapshot-Ersatz, reduzierte Bewegung).
 */
export function useHochzaehlen(ziel: number, animieren: boolean, dauerMs = 600): number {
  const [wert, setWert] = useState(ziel);
  const angezeigt = useRef(ziel);
  const reduziert = useReduzierteBewegung();

  useEffect(() => {
    const start = angezeigt.current;
    if (!animieren || reduziert || start === ziel) {
      angezeigt.current = ziel;
      setWert(ziel);
      return;
    }
    let rahmen = 0;
    const beginn = performance.now();
    const schritt = (jetzt: number) => {
      const t = Math.min(1, (jetzt - beginn) / dauerMs);
      const w = Math.round(start + (ziel - start) * kurve(t));
      angezeigt.current = w;
      setWert(w);
      if (t < 1) rahmen = requestAnimationFrame(schritt);
    };
    rahmen = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(rahmen);
  }, [ziel, animieren, reduziert, dauerMs]);

  return wert;
}
