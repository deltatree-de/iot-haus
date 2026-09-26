// Verbrauchs- und Kostenrechnung (PRD FR-6 bis FR-13). Alle Summen mit ungerundeten Katalogwerten.
import { GERAETE, RAEUME, type Geraet, type RaumId } from './katalog';
import type { HausZustand } from './protokoll';

export type Laststufe = 'niedrig' | 'mittel' | 'hoch';

export function geraeteleistung(geraet: Geraet, an: boolean): number {
  return an ? geraet.betriebW : geraet.standbyW;
}

export function hausverbrauch(zustand: HausZustand): number {
  let summe = 0;
  for (const g of GERAETE) summe += geraeteleistung(g, zustand[g.id].an);
  return summe;
}

export function raumverbrauch(zustand: HausZustand, raum: RaumId): number {
  let summe = 0;
  for (const g of GERAETE) {
    if (g.raum === raum) summe += geraeteleistung(g, zustand[g.id].an);
  }
  return summe;
}

export function standbyAnteil(zustand: HausZustand): number {
  let summe = 0;
  for (const g of GERAETE) {
    if (!zustand[g.id].an) summe += g.standbyW;
  }
  return summe;
}

export function anzahlAn(zustand: HausZustand, raum: RaumId): number {
  return GERAETE.filter((g) => g.raum === raum && zustand[g.id].an).length;
}

export function lichtAn(zustand: HausZustand, raum: RaumId): boolean {
  return GERAETE.some((g) => g.raum === raum && g.kategorie === 'licht' && zustand[g.id].an);
}

/** Kaufmännisch runden (ab ,5 vom Betrag weg), robust gegen Binärbruch-Artefakte wie 1.005. */
export function runden(wert: number, stellen = 0): number {
  const faktor = 10 ** stellen;
  const betrag = Math.round(Math.abs(wert) * faktor + 1e-9) / faktor;
  return wert < 0 ? -betrag : betrag;
}

/** Laststufe auf Basis des angezeigten, auf ganze Watt gerundeten Hausverbrauchs (FR-12). */
export function laststufe(wattGerundet: number): Laststufe {
  if (wattGerundet < 500) return 'niedrig';
  if (wattGerundet < 2000) return 'mittel';
  return 'hoch';
}

export function kostenProStunde(watt: number, strompreis: number): number {
  return (watt / 1000) * strompreis;
}

export interface RaumAnteil {
  raum: RaumId;
  watt: number;
  anteil: number;
}

/** Räume absteigend nach Verbrauch (FR-7); bei Gleichstand Katalogreihenfolge. */
export function verbrauchNachRaum(zustand: HausZustand): RaumAnteil[] {
  const gesamt = hausverbrauch(zustand);
  return RAEUME.map((r, index) => ({ raum: r.id, watt: raumverbrauch(zustand, r.id), index }))
    .sort((a, b) => b.watt - a.watt || a.index - b.index)
    .map(({ raum, watt }) => ({ raum, watt, anteil: gesamt > 0 ? watt / gesamt : 0 }));
}
