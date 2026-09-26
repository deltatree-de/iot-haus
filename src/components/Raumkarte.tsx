'use client';

// Raumkarte: Geräteliste mit Schaltern und „Raum ausschalten“ (FR-7, FR-27).
import { anzeigeAn, istBeschaeftigt } from '@/client/hausReducer';
import { geraeteImRaum, type Geraet, type Raum } from '@/domain/katalog';
import { watt } from '@/domain/format';
import { anzahlAn, raumverbrauch, runden } from '@/domain/verbrauch';
import { useHaus } from '@/hooks/useHaus';
import { T } from '@/ui/texte';
import { GeraeteZeile } from './GeraeteZeile';
import { RaumAusKnopf } from './RaumAusKnopf';
import { Skeleton } from './Skeleton';

interface Props {
  raum: Raum;
  onAktivieren: (g: Geraet, el: HTMLButtonElement) => void;
}

export function Raumkarte({ raum, onAktivieren }: Props) {
  const { zustand, bedienbar, raumAus } = useHaus();
  const server = zustand.server;
  const geraete = geraeteImRaum(raum.id);
  const z = server?.zustand;
  const n = z ? anzahlAn(z, raum.id) : 0;
  const etwasAn = z ? geraete.some((g) => !g.grundlast && z[g.id].an) : false;
  const etage = T.haus.etage[raum.etage];
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
            <span aria-hidden="true">{T.raum.meta(raum.etage, n, geraete.length)}</span>
            <span className="sr-only">{T.raum.metaSr(etage, n, geraete.length)}</span>
          </p>
        </div>
        {z ? (
          <p className="zahlen text-lg font-semibold text-ink">
            <span className="sr-only">{T.raum.verbrauchSr}</span>
            {watt(runden(raumverbrauch(z, raum.id)))}
          </p>
        ) : (
          <Skeleton className="h-6 w-16" />
        )}
      </div>
      <ul className="flex flex-col gap-1">
        {geraete.map((g) =>
          server ? (
            <GeraeteZeile
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
              <Skeleton className="size-10 rounded-full" />
              <span className="flex-1 font-medium text-ink">{g.name}</span>
              <Skeleton className="h-[26px] w-11 rounded-full" />
            </li>
          ),
        )}
      </ul>
      <RaumAusKnopf
        raum={raum}
        etwasAn={etwasAn}
        bedienbar={bedienbar}
        beschaeftigt={istBeschaeftigt(zustand, 'raumAus', raum.id)}
        onAusschalten={() => raumAus(raum.id)}
      />
    </section>
  );
}
