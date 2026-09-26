'use client';

// Raumkarten mit Geräteliste und „Raum ausschalten“, dazu der Grundlast-Dialog (FR-4, FR-7, FR-27).
import { useCallback, useEffect, useRef, useState } from 'react';
import { anzeigeAn, istBeschaeftigt } from '@/client/hausReducer';
import { geraeteImRaum, RAEUME, type Geraet, type Raum } from '@/domain/katalog';
import { watt } from '@/domain/format';
import { anzahlAn, raumverbrauch, runden } from '@/domain/verbrauch';
import { useHaus } from '@/hooks/useHaus';
import { GeraetSchalter } from './GeraetSchalter';
import { GrundlastDialog } from './GrundlastDialog';
import { Icon } from './Icon';

function Raumkarte({ raum, onAktivieren }: { raum: Raum; onAktivieren: (g: Geraet, el: HTMLButtonElement) => void }) {
  const { zustand, bedienbar, raumAus } = useHaus();
  const server = zustand.server;
  const geraete = geraeteImRaum(raum.id);
  const z = server?.zustand;
  const n = z ? anzahlAn(z, raum.id) : 0;
  const etwasAus = z ? geraete.some((g) => !g.grundlast && z[g.id].an) : false;
  const beschaeftigt = istBeschaeftigt(zustand, 'raumAus', raum.id);
  const knopfGesperrt = !bedienbar || !etwasAus;
  const etage = raum.etage === 'EG' ? 'Erdgeschoss' : 'Obergeschoss';
  const letzte = zustand.letzteAenderung;

  return (
    <section
      id={`raum-${raum.id}`}
      aria-labelledby={`raum-${raum.id}-titel`}
      className="relative scroll-mt-[calc(var(--kopf-h)+16px)] rounded-2xl border border-border bg-surface p-4 ebene-1"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`raum-${raum.id}-titel`} tabIndex={-1} className="silben text-[17px] leading-6 font-semibold text-ink">
            {raum.name}
          </h3>
          <p className="zahlen text-sm text-ink-secondary">
            <span aria-hidden="true">
              {raum.etage} · {n} von {geraete.length} an
            </span>
            <span className="sr-only">
              {etage}, {n} von {geraete.length} Geräten an
            </span>
          </p>
        </div>
        {z ? (
          <p className="zahlen text-lg font-semibold text-ink">
            <span className="sr-only">Raumverbrauch </span>
            {watt(runden(raumverbrauch(z, raum.id)))}
          </p>
        ) : (
          <span className="skeleton h-6 w-16" aria-hidden="true" />
        )}
      </div>
      <ul className="flex flex-col gap-1">
        {geraete.map((g) =>
          server ? (
            <GeraetSchalter
              key={g.id}
              geraet={g}
              {...anzeigeAn(zustand, g.id)}
              seit={server.zustand[g.id].seit}
              uhrVersatzMs={zustand.uhrVersatzMs}
              gesperrt={!bedienbar}
              impulsNr={letzte && letzte.geraete.includes(g.id) ? letzte.nr : null}
              onAktivieren={onAktivieren}
            />
          ) : (
            <li key={g.id} className="flex min-h-14 items-center gap-3 px-3 py-2">
              <span className="skeleton size-10 rounded-full" aria-hidden="true" />
              <span className="flex-1 font-medium text-ink">{g.name}</span>
              <span className="skeleton h-[26px] w-11 rounded-full" aria-hidden="true" />
            </li>
          ),
        )}
      </ul>
      <div className="mt-3 md:flex md:justify-end">
        <button
          type="button"
          aria-disabled={knopfGesperrt || undefined}
          aria-busy={beschaeftigt || undefined}
          aria-describedby={!etwasAus ? `raum-${raum.id}-aus-info` : undefined}
          onClick={() => {
            if (!knopfGesperrt && !beschaeftigt) raumAus(raum.id);
          }}
          className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-surface px-4 font-medium text-ink md:w-auto ${
            knopfGesperrt ? 'text-ink-secondary' : '[@media(hover:hover)]:hover:bg-surface-sunken'
          }`}
        >
          <Icon name={beschaeftigt ? 'verbinde' : 'power'} groesse={16} className={`${beschaeftigt ? 'drehen' : ''} ${knopfGesperrt ? 'opacity-55' : ''}`} />
          <span aria-hidden="true">{beschaeftigt ? 'Wird ausgeschaltet …' : 'Raum ausschalten'}</span>
          <span className="sr-only">{raum.name} ausschalten</span>
        </button>
        {!etwasAus && (
          <span id={`raum-${raum.id}-aus-info`} className="sr-only">
            Keine Geräte zum Ausschalten an
          </span>
        )}
      </div>
    </section>
  );
}

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
        Räume
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
