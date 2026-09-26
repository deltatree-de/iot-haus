// Eine Szenen-Schaltfläche: Name + Untertitel, beschäftigt/gesperrt ohne „aktiv“-Markierung (FR-22).
import type { Szene } from '@/domain/szenen';
import { T } from '@/ui/texte';
import { Symbol, type SymbolName } from './Symbol';

const SYMBOLE: Record<Szene['symbol'], SymbolName> = {
  'alles-aus': 'power',
  filmabend: 'film',
  morgenroutine: 'sonnenaufgang',
  'gute-nacht': 'mond',
};

interface Props {
  szene: Szene;
  beschaeftigt: boolean;
  gesperrt: boolean;
  onAusfuehren: () => void;
}

export function SzenenKnopf({ szene, beschaeftigt, gesperrt, onAusfuehren }: Props) {
  const beschreibung = `szene-${szene.id}-text`;
  return (
    <button
      type="button"
      aria-disabled={gesperrt || undefined}
      aria-busy={beschaeftigt || undefined}
      aria-describedby={beschreibung}
      onClick={() => {
        if (!gesperrt && !beschaeftigt) onAusfuehren();
      }}
      className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left ebene-1 transition-colors duration-[var(--m-schnell)] active:bg-surface-sunken [@media(hover:hover)]:hover:border-ink-muted"
    >
      <span className={`shrink-0 text-ink-secondary ${gesperrt ? 'opacity-55' : ''}`}>
        {beschaeftigt ? <Symbol name="verbinde" className="drehen" /> : <Symbol name={SYMBOLE[szene.symbol]} />}
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-ink">{szene.name}</span>
        <span id={beschreibung} className="block truncate text-sm text-ink-secondary">
          {beschaeftigt ? T.szenen.busy : T.szenen.untertitel[szene.symbol]}
        </span>
      </span>
    </button>
  );
}
