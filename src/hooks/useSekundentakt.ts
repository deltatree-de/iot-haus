'use client';

import { useSyncExternalStore } from 'react';

// Ein gemeinsamer Sekundentakt für Restzeiten und Countdown (UX Auto-Aus-Anzeige).
let jetzt = Date.now();
const hoerer = new Set<() => void>();
let intervall: ReturnType<typeof setInterval> | null = null;

function abonniere(rueckruf: () => void): () => void {
  hoerer.add(rueckruf);
  if (!intervall) {
    jetzt = Date.now();
    intervall = setInterval(() => {
      jetzt = Date.now();
      for (const h of hoerer) h();
    }, 1000);
  }
  return () => {
    hoerer.delete(rueckruf);
    if (hoerer.size === 0 && intervall) {
      clearInterval(intervall);
      intervall = null;
    }
  };
}

/** Aktuelle Zeit in ms, sekündlich aktualisiert; nur aktiv, solange `aktiv` gesetzt ist. */
export function useSekundentakt(aktiv: boolean): number {
  return useSyncExternalStore(
    aktiv ? abonniere : keinAbo,
    () => (aktiv ? jetzt : 0),
    () => 0,
  );
}

function keinAbo(): () => void {
  return () => {};
}
