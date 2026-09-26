'use client';

// Eine höfliche Live-Region (FR-11): Änderungen 2 s sammeln, nur die letzte ansagen;
// Fehler, Hinweise und „Verbindung wiederhergestellt.“ sofort.
import { useEffect, useRef, useState } from 'react';
import { useHaus } from '@/hooks/useHaus';

export const SAMMEL_FENSTER_MS = 2000;

export function Ansager() {
  const { zustand } = useHaus();
  const [text, setText] = useState('');
  const ausstehend = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zuletzt = useRef<number | null>(null);

  useEffect(() => {
    const m = zustand.letzteAnsage;
    if (!m || !m.ansage || m.id === zuletzt.current) return;
    zuletzt.current = m.id;

    const sage = (t: string) => {
      // Leeren und im nächsten Frame setzen, damit auch gleiche Texte erneut angesagt werden
      setText('');
      requestAnimationFrame(() => setText(t));
    };

    if (!m.sammeln) {
      sage(m.ansage);
      return;
    }
    // Erste Änderung öffnet ein 2-s-Fenster; angesagt wird am Ende nur die letzte (PRD FR-11, K-Auflösung).
    ausstehend.current = m.ansage;
    if (!timer.current) {
      timer.current = setTimeout(() => {
        timer.current = null;
        if (ausstehend.current) sage(ausstehend.current);
        ausstehend.current = null;
      }, SAMMEL_FENSTER_MS);
    }
  }, [zustand.letzteAnsage]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {text}
    </div>
  );
}
