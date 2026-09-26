'use client';

import { useSekundentakt } from './useSekundentakt';

/**
 * Restzeit eines Auto-Aus-Geräts in Sekunden (FR-5): aus dem Server-Einschaltzeitpunkt und dem
 * Uhrversatz berechnet, damit alle Clients dieselbe Zeit zeigen. Nutzt den gemeinsamen Sekundentakt.
 */
export function useRestzeit(seit: number, dauerS: number, uhrVersatzMs: number, aktiv: boolean): number {
  const jetzt = useSekundentakt(aktiv) || Date.now();
  return (seit + dauerS * 1000 - (jetzt + uhrVersatzMs)) / 1000;
}
