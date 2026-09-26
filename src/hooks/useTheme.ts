'use client';

import { useCallback, useEffect, useState } from 'react';
import { THEME_FARBE, THEME_SCHLUESSEL, type Theme, type ThemeWahl } from '@/ui/themeSkript';

const DUNKEL_ABFRAGE = '(prefers-color-scheme: dark)';

function liesWahl(): ThemeWahl {
  try {
    const w = localStorage.getItem(THEME_SCHLUESSEL);
    return w === 'hell' || w === 'dunkel' ? w : 'system';
  } catch {
    return 'system';
  }
}

function wende(wahl: ThemeWahl): void {
  const theme: Theme =
    wahl === 'system' ? (window.matchMedia(DUNKEL_ABFRAGE).matches ? 'dunkel' : 'hell') : wahl;
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_FARBE[theme]);
}

/** Darstellung System/Hell/Dunkel (FR-28); das Inline-Skript hat sie vor dem Paint schon gesetzt. */
export function useTheme(): [ThemeWahl, (w: ThemeWahl) => void] {
  // null bis die gespeicherte Wahl gelesen ist – sonst würde kurz „System“ angewendet.
  const [wahl, setWahlState] = useState<ThemeWahl | null>(null);

  useEffect(() => {
    setWahlState(liesWahl());
  }, []);

  useEffect(() => {
    if (wahl === null) return;
    wende(wahl);
    if (wahl !== 'system') return;
    const mq = window.matchMedia(DUNKEL_ABFRAGE);
    const folgen = () => wende('system');
    mq.addEventListener('change', folgen);
    return () => mq.removeEventListener('change', folgen);
  }, [wahl]);

  const setWahl = useCallback((w: ThemeWahl) => {
    try {
      localStorage.setItem(THEME_SCHLUESSEL, w);
    } catch {
      // nur für diese Sitzung
    }
    setWahlState(w);
  }, []);

  return [wahl ?? 'system', setWahl];
}
