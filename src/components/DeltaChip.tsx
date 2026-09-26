'use client';

// Kurzer Hinweis „+1.199 W“ neben dem Hausverbrauch, 1,2 s, dekorativ (UX Delta-Chip).
import type { LetzteAenderung } from '@/client/hausReducer';
import { wattDifferenz } from '@/domain/format';

export function DeltaChip({ aenderung }: { aenderung: LetzteAenderung | null }) {
  if (!aenderung || aenderung.differenzW === 0) return null;
  return (
    <span
      key={aenderung.nr}
      aria-hidden="true"
      className={`delta-chip zahlen pointer-events-none absolute -top-1 right-0 text-sm font-semibold lg:static lg:ml-2 ${
        aenderung.differenzW > 0 ? 'text-delta-up' : 'text-delta-down'
      }`}
    >
      {wattDifferenz(aenderung.differenzW)}
    </span>
  );
}
