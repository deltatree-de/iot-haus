// Laststufe mit Text, Balkensymbol und Farbe – nie nur Farbe (FR-12).
import type { Laststufe } from '@/domain/verbrauch';
import { T } from '@/ui/texte';
import { Symbol } from './Symbol';

const STUFEN: Record<Laststufe, { klasse: string; symbol: 'laststufe-1' | 'laststufe-2' | 'laststufe-3' }> = {
  niedrig: { klasse: 'bg-load-low-bg text-load-low', symbol: 'laststufe-1' },
  mittel: { klasse: 'bg-load-mid-bg text-load-mid', symbol: 'laststufe-2' },
  hoch: { klasse: 'bg-load-high-bg text-load-high', symbol: 'laststufe-3' },
};

export function LaststufePille({ stufe }: { stufe: Laststufe }) {
  const s = STUFEN[stufe];
  return (
    <span className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[13px] leading-4 font-medium ${s.klasse}`}>
      <Symbol name={s.symbol} groesse={14} />
      <span className="sr-only">{T.kopf.laststufeSr}</span>
      {stufe}
    </span>
  );
}
