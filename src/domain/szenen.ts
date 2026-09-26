// Feste Szenen (PRD FR-23). Grundlastgeräte werden nie verändert (FR-24).
import { GERAETE, type GeraetId } from './katalog';

export type SzenenSymbol = 'alles-aus' | 'filmabend' | 'morgenroutine' | 'gute-nacht';

export interface Szene {
  id: string;
  name: string;
  symbol: SzenenSymbol;
  /** true: zuerst alle Nicht-Grundlastgeräte aus, danach `ziele` anwenden */
  allesAus: boolean;
  ziele: Partial<Record<GeraetId, boolean>>;
}

export const SZENEN = [
  { id: 'alles-aus', name: 'Alles aus', symbol: 'alles-aus', allesAus: true, ziele: {} },
  {
    id: 'filmabend',
    name: 'Filmabend',
    symbol: 'filmabend',
    allesAus: false,
    ziele: {
      'wohnzimmer.deckenlampe': false,
      'wohnzimmer.stehlampe': true,
      'wohnzimmer.fernseher': true,
      'wohnzimmer.soundbar': true,
      'kueche.deckenlampe': false,
    },
  },
  {
    id: 'morgenroutine',
    name: 'Morgenroutine',
    symbol: 'morgenroutine',
    allesAus: false,
    ziele: {
      'kueche.deckenlampe': true,
      'kueche.kaffeemaschine': true,
      'kueche.wasserkocher': true,
      'bad.deckenlampe': true,
      'bad.spiegelleuchte': true,
      'bad.heizluefter': true,
    },
  },
  {
    id: 'gute-nacht',
    name: 'Gute Nacht',
    symbol: 'gute-nacht',
    allesAus: true,
    ziele: { 'schlafzimmer.nachttischlampe': true },
  },
] as const satisfies readonly Szene[];

export type SzeneId = (typeof SZENEN)[number]['id'];

const szenenIndex = new Map<string, Szene>(SZENEN.map((s) => [s.id, s]));

export function istSzeneId(wert: unknown): wert is SzeneId {
  return typeof wert === 'string' && szenenIndex.has(wert);
}

export function szeneById(id: SzeneId): Szene {
  return szenenIndex.get(id) as Szene;
}

/** Zielzustände einer Szene für alle betroffenen Geräte (ohne Grundlast). */
export function szenenZiele(id: SzeneId): Partial<Record<GeraetId, boolean>> {
  const szene = szeneById(id);
  const ziele: Partial<Record<GeraetId, boolean>> = {};
  if (szene.allesAus) {
    for (const g of GERAETE) {
      if (!g.grundlast) ziele[g.id] = false;
    }
  }
  for (const [id, an] of Object.entries(szene.ziele) as [GeraetId, boolean][]) {
    ziele[id] = an;
  }
  for (const g of GERAETE) {
    if (g.grundlast) delete ziele[g.id];
  }
  return ziele;
}
