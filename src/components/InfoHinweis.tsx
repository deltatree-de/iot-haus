'use client';

// Disclosure „Hinweis zu den Werten“: öffnet den Text inline, Escape schließt (FR-10).
import { useId, useState } from 'react';
import { T } from '@/ui/texte';
import { Symbol } from './Symbol';

export function InfoKnopf({ offen, steuert, onUmschalten }: { offen: boolean; steuert: string; onUmschalten: (offen: boolean) => void }) {
  return (
    <button
      type="button"
      aria-expanded={offen}
      aria-controls={steuert}
      onClick={() => onUmschalten(!offen)}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && offen) {
          e.preventDefault();
          e.stopPropagation();
          onUmschalten(false);
        }
      }}
      className="-my-3 inline-flex size-11 items-center justify-center rounded-full text-ink-secondary hover:text-ink"
    >
      <Symbol name="info" groesse={20} />
      <span className="sr-only">{T.uebersicht.infoKnopf}</span>
    </button>
  );
}

export function InfoText({ id, offen }: { id: string; offen: boolean }) {
  return (
    <p id={id} hidden={!offen} className="mt-2 rounded-[10px] bg-surface p-3 text-ink ebene-1">
      {T.uebersicht.infoText}
    </p>
  );
}

export function useInfoHinweis() {
  const [offen, setOffen] = useState(false);
  const id = useId();
  return { offen, setOffen, id };
}
