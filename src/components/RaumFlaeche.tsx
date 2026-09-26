'use client';

// Ein Raum in der Hausansicht: Schaltfläche mit Name, Verbrauch, Anzahl an; leuchtet bei Licht (FR-26).
import { GERAETE, raumById, type RaumId } from '@/domain/katalog';
import type { HausZustand } from '@/domain/protokoll';
import { watt } from '@/domain/format';
import { anzahlAn, lichtAn, raumverbrauch, runden } from '@/domain/verbrauch';
import { useImpuls } from '@/hooks/useImpuls';
import { T } from '@/ui/texte';
import { Skeleton } from './Skeleton';
import { GERAETE_SYMBOL, Symbol } from './Symbol';

interface Props {
  raum: RaumId;
  zustand: HausZustand | null;
  impulsNr: number | null;
  onSprung: (raum: RaumId) => void;
}

export function RaumFlaeche({ raum: id, zustand: z, impulsNr, onSprung }: Props) {
  const ref = useImpuls<HTMLButtonElement>(impulsNr, 'impuls');
  const raum = raumById(id);
  const w = z ? runden(raumverbrauch(z, id)) : 0;
  const n = z ? anzahlAn(z, id) : 0;
  const licht = z ? lichtAn(z, id) : false;
  const eingeschaltet = z ? GERAETE.filter((g) => g.raum === id && z[g.id].an) : [];

  return (
    <button
      ref={ref}
      type="button"
      aria-label={z ? T.haus.raumName(raum.name, watt(w), n) : T.haus.raumNameLaden(raum.name)}
      onClick={() => onSprung(id)}
      className={`relative flex min-h-[72px] min-w-0 flex-col items-start gap-0.5 rounded-md border-2 p-2 text-left transition-colors duration-[var(--m-basis)] lg:min-h-24 ${
        licht
          ? 'border-on bg-room-lit shadow-[inset_0_-12px_24px_var(--c-on-soft)]'
          : 'border-transparent bg-room-off [@media(hover:hover)]:hover:border-ink-muted'
      }`}
    >
      {licht && <Symbol name="birne" groesse={14} className="absolute top-1.5 right-1.5 text-on" />}
      <span className="silben w-full pr-4 text-[13px] leading-4 font-semibold text-ink">{raum.name}</span>
      {z ? (
        <>
          <span className="zahlen text-sm font-semibold text-ink">{watt(w)}</span>
          <span className="flex w-full items-center justify-between gap-1 text-[13px] leading-4 text-ink-secondary">
            <span className="zahlen">{T.haus.raumAn(n)}</span>
            <span className="flex gap-0.5">
              {eingeschaltet.slice(0, 3).map((g) => (
                <Symbol key={g.id} name={GERAETE_SYMBOL[g.symbol]} groesse={14} />
              ))}
              {eingeschaltet.length > 3 && <span className="zahlen">+{eingeschaltet.length - 3}</span>}
            </span>
          </span>
        </>
      ) : (
        <Skeleton className="mt-1 h-3.5 w-12" />
      )}
    </button>
  );
}
