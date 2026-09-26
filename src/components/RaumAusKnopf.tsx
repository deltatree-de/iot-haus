// „Raum ausschalten“: schaltet alle Nicht-Grundlastgeräte des Raums aus (FR-27, D-13).
import type { Raum } from '@/domain/katalog';
import { T } from '@/ui/texte';
import { Symbol } from './Symbol';

interface Props {
  raum: Raum;
  /** mindestens ein Nicht-Grundlastgerät ist an */
  etwasAn: boolean;
  bedienbar: boolean;
  beschaeftigt: boolean;
  onAusschalten: () => void;
}

export function RaumAusKnopf({ raum, etwasAn, bedienbar, beschaeftigt, onAusschalten }: Props) {
  const gesperrt = !bedienbar || !etwasAn;
  const infoId = `raum-${raum.id}-aus-info`;
  return (
    <div className="mt-3 md:flex md:justify-end">
      <button
        type="button"
        aria-disabled={gesperrt || undefined}
        aria-busy={beschaeftigt || undefined}
        aria-describedby={!etwasAn ? infoId : undefined}
        onClick={() => {
          if (!gesperrt && !beschaeftigt) onAusschalten();
        }}
        className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-surface px-4 font-medium text-ink md:w-auto ${
          gesperrt ? 'text-ink-secondary' : '[@media(hover:hover)]:hover:bg-surface-sunken'
        }`}
      >
        <Symbol
          name={beschaeftigt ? 'verbinde' : 'power'}
          groesse={16}
          className={`${beschaeftigt ? 'drehen' : ''} ${gesperrt ? 'opacity-55' : ''}`}
        />
        <span aria-hidden="true">{beschaeftigt ? T.raum.ausBusy : T.raum.aus}</span>
        <span className="sr-only">{T.raum.ausSr(raum.name)}</span>
      </button>
      {!etwasAn && (
        <span id={infoId} className="sr-only">
          {T.raum.ausGesperrt}
        </span>
      )}
    </div>
  );
}
