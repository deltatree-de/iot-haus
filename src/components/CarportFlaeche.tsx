'use client';

// Carport in der Hausansicht: Sprung zur Raumkarte, Verbrauch und Zustand des Elektroautos (FR-43).
import { akkuProzent, akkuWhBei, ELEKTROAUTO, type AutoZustand } from '@/domain/elektroauto';
import { akku, watt } from '@/domain/format';
import { raumById, type RaumId } from '@/domain/katalog';
import type { HausZustand } from '@/domain/protokoll';
import { raumverbrauch, runden } from '@/domain/verbrauch';
import { useImpuls } from '@/hooks/useImpuls';
import { useSekundentakt } from '@/hooks/useSekundentakt';
import { T } from '@/ui/texte';
import { Skeleton } from './Skeleton';
import { Symbol } from './Symbol';

interface Props {
  raum: RaumId;
  zustand: HausZustand | null;
  auto: AutoZustand | null;
  uhrVersatzMs: number;
  impulsNr: number | null;
  onSprung: (raum: RaumId) => void;
}

export function CarportFlaeche({ raum: id, zustand: z, auto, uhrVersatzMs, impulsNr, onSprung }: Props) {
  const ref = useImpuls<HTMLButtonElement>(impulsNr, 'impuls');
  const raum = raumById(id);
  const w = z ? runden(raumverbrauch(z, id)) : 0;
  const laedt = !!z && !!auto && z[ELEKTROAUTO.ladegeraet].an && auto.zuhause;
  const art: 'laedt' | 'zuhause' | 'unterwegs' = !auto || !auto.zuhause ? 'unterwegs' : laedt ? 'laedt' : 'zuhause';
  // beim Laden mitzählen wie die Carport-Karte (CR21-03)
  const jetzt = useSekundentakt(laedt) || Date.now();
  const p = auto ? akkuProzent(akkuWhBei(auto, laedt, jetzt + uhrVersatzMs)) : 0;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={z ? T.haus.carportName(watt(w), T.haus.carportAutoSr(art, p)) : T.haus.raumNameLaden(raum.name)}
      onClick={() => onSprung(id)}
      className={`relative flex min-h-[72px] min-w-0 flex-col items-start gap-0.5 rounded-md border-2 p-2 text-left transition-colors duration-[var(--m-basis)] ${
        laedt ? 'border-on bg-room-off' : 'border-transparent bg-room-off [@media(hover:hover)]:hover:border-ink-muted'
      }`}
    >
      {laedt && <Symbol name="blitz" groesse={14} className="absolute top-1.5 right-1.5 text-on" />}
      <span className="w-full pr-4 text-[13px] leading-4 font-semibold text-ink">{raum.name}</span>
      {z ? (
        <>
          <span className="zahlen text-sm font-semibold text-ink">{watt(w)}</span>
          <span className="zahlen flex items-center gap-1 text-[13px] leading-4 text-ink-secondary">
            <Symbol name="auto" groesse={14} />
            {T.haus.carportAuto(art, akku(p))}
          </span>
        </>
      ) : (
        <Skeleton className="mt-1 h-3.5 w-12" />
      )}
    </button>
  );
}
