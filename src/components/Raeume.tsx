'use client';

// Abschnitt „Räume“: alle Raumkarten und der Grundlast-Dialog mit Fokus-Rückgabe (FR-4).
import { useCallback, useEffect, useRef, useState } from 'react';
import { RAEUME, type Geraet } from '@/domain/katalog';
import { useHaus } from '@/hooks/useHaus';
import { T } from '@/ui/texte';
import { GrundlastDialog } from './GrundlastDialog';
import { Raumkarte } from './Raumkarte';

export function Raeume() {
  const { zustand, bedienbar, schalten } = useHaus();
  const [dialogGeraet, setDialogGeraet] = useState<Geraet | null>(null);
  const ausloeser = useRef<HTMLButtonElement | null>(null);

  const onAktivieren = useCallback(
    (g: Geraet, el: HTMLButtonElement) => {
      const an = el.getAttribute('aria-checked') === 'true';
      if (g.grundlast && an) {
        ausloeser.current = el;
        setDialogGeraet(g);
        return;
      }
      schalten(g.id, !an);
    },
    [schalten],
  );

  const schliessen = useCallback(() => {
    setDialogGeraet(null);
    const el = ausloeser.current;
    ausloeser.current = null;
    requestAnimationFrame(() => el?.focus());
  }, []);

  // Wird das Gerät anderweitig ausgeschaltet, schließt sich der Dialog selbst (UX Grundlast-Dialog)
  const dialogGeraetAn = dialogGeraet ? zustand.server?.zustand[dialogGeraet.id].an : undefined;
  useEffect(() => {
    if (dialogGeraet && dialogGeraetAn === false) schliessen();
  }, [dialogGeraet, dialogGeraetAn, schliessen]);

  return (
    <section aria-labelledby="raeume" className="min-w-0">
      <h2 id="raeume" tabIndex={-1} className="mb-3 scroll-mt-[calc(var(--kopf-h)+16px)] text-lg font-semibold text-ink">
        {T.raeume.titel}
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {RAEUME.map((r) => (
          <Raumkarte key={r.id} raum={r} onAktivieren={onAktivieren} />
        ))}
      </div>
      <GrundlastDialog
        geraet={dialogGeraet}
        bedienbar={bedienbar}
        onAbbrechen={schliessen}
        onAusschalten={() => {
          const g = dialogGeraet;
          schliessen();
          if (g) schalten(g.id, false);
        }}
      />
    </section>
  );
}
