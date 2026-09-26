'use client';

// Bestätigung vor dem Ausschalten eines Grundlastgeräts (FR-4). Natives <dialog>: Fokusfalle, Escape = Abbrechen.
import { useEffect, useRef } from 'react';
import type { Geraet } from '@/domain/katalog';
import { T } from '@/ui/texte';

interface Props {
  geraet: Geraet | null;
  /** Verbindung steht – sonst ist „Ausschalten“ gesperrt */
  bedienbar: boolean;
  onAbbrechen: () => void;
  onAusschalten: () => void;
}

export function GrundlastDialog({ geraet, bedienbar, onAbbrechen, onAusschalten }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const abbrechenRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (geraet && !d.open) {
      d.showModal();
      abbrechenRef.current?.focus();
    } else if (!geraet && d.open) {
      d.close();
    }
  }, [geraet]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="grundlast-titel"
      aria-describedby="grundlast-text"
      onCancel={(e) => {
        e.preventDefault();
        onAbbrechen();
      }}
      onClick={(e) => {
        // Klick auf den Hintergrund (::backdrop) schließt ohne Befehl
        if (e.target === e.currentTarget) onAbbrechen();
      }}
      className="m-auto w-[min(100%-32px,420px)] rounded-2xl border border-border bg-surface-raised p-0 text-ink ebene-2"
    >
      {geraet && (
        <div className="p-6">
          <h2 id="grundlast-titel" className="text-lg font-semibold">
            {T.dialog.titel(geraet.name)}
          </h2>
          <p id="grundlast-text" className="mt-2 text-ink-secondary">
            {T.dialog.text}
          </p>
          {!bedienbar && (
            <p className="mt-3 text-sm text-danger">{T.dialog.offline}</p>
          )}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              ref={abbrechenRef}
              type="button"
              autoFocus
              onClick={onAbbrechen}
              className="min-h-11 rounded-[10px] border border-border bg-surface px-4 font-medium text-ink"
            >
              {T.dialog.abbrechen}
            </button>
            <button
              type="button"
              aria-disabled={!bedienbar || undefined}
              onClick={() => {
                if (bedienbar) onAusschalten();
              }}
              className={`min-h-11 rounded-[10px] bg-danger px-4 font-medium text-danger-contrast ${bedienbar ? '' : 'opacity-55'}`}
            >
              {T.dialog.ausschalten}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
