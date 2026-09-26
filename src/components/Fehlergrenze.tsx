'use client';

// Letzte Verteidigungslinie: unerwartete Renderfehler zeigen einen verständlichen Hinweis statt einer leeren Seite.
import { Component, type ReactNode } from 'react';
import { T } from '@/ui/texte';

export class Fehlergrenze extends Component<{ children: ReactNode }, { fehler: boolean }> {
  state = { fehler: false };

  static getDerivedStateFromError() {
    return { fehler: true };
  }

  componentDidCatch(fehler: unknown) {
    console.error(fehler);
  }

  render() {
    if (!this.state.fehler) return this.props.children;
    return (
      <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
        <h1 className="text-lg font-semibold text-ink">{T.fehlergrenze.titel}</h1>
        <p className="text-ink-secondary">{T.fehlergrenze.text}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-11 self-start rounded-[10px] bg-primary px-4 font-medium text-primary-contrast"
        >
          {T.fehlergrenze.aktion}
        </button>
      </main>
    );
  }
}
