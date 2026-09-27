// Solaranlage und Sonnenlage (2.1, FR-40, E-15 bis E-18).

export const SOLARANLAGE = { spitzenleistungW: 9_800 } as const;

export const SONNENSTUFEN = [
  { id: 'nacht', name: 'Nacht', anteil: 0 },
  { id: 'bedeckt', name: 'Bedeckt', anteil: 0.1 },
  { id: 'wolkig', name: 'Wolkig', anteil: 0.35 },
  { id: 'heiter', name: 'Heiter', anteil: 0.65 },
  { id: 'sonnig', name: 'Sonnig', anteil: 0.85 },
] as const;

export type SonnenStufe = (typeof SONNENSTUFEN)[number]['id'];
export type SonnenStufeInfo = (typeof SONNENSTUFEN)[number];

export interface SonnenZustand {
  stufe: SonnenStufe;
  /** ms seit Epoch der letzten Änderung */
  seit: number;
}

const index = new Map<string, SonnenStufeInfo>(SONNENSTUFEN.map((s) => [s.id, s]));

export function istSonnenStufe(wert: unknown): wert is SonnenStufe {
  return typeof wert === 'string' && index.has(wert);
}

export function sonnenstufeById(id: SonnenStufe): SonnenStufeInfo {
  return index.get(id) as SonnenStufeInfo;
}

/** Aktuelle Erzeugung in W (ungerundet). */
export function erzeugung(stufe: SonnenStufe): number {
  return SOLARANLAGE.spitzenleistungW * sonnenstufeById(stufe).anteil;
}

export function ausgangsSonne(jetzt: number): SonnenZustand {
  return { stufe: 'nacht', seit: jetzt };
}
