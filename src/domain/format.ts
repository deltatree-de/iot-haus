// de-DE-Formatierer (PRD FR-29). Gerundet wird erst hier, kaufmännisch.
import { runden } from './verbrauch';

/** Schmales geschütztes Leerzeichen zwischen Zahl und Einheit (UX Typografie, K-13). */
export const EINHEIT = '\u202F';

/** Zahl de-DE ohne Einheit, z. B. für Screenreader-Texte („1.274“, „0,45“). */
export function zahl(wert: number, stellen: number): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: stellen,
    maximumFractionDigits: stellen,
  }).format(runden(wert, stellen) + 0);
}

/** „1.200 W“ */
export function watt(w: number): string {
  return `${zahl(w, 0)}${EINHEIT}W`;
}

/** „1.274 Watt“ – für Screenreader-Ansagen */
export function wattGesprochen(w: number): string {
  return `${zahl(w, 0)} Watt`;
}

/** „0,5 W“ – eine Nachkommastelle (Standby) */
export function wattEineStelle(w: number): string {
  return `${zahl(w, 1)}${EINHEIT}W`;
}

/** „+1.199 W“ bzw. „−1.199 W“ (echtes Minuszeichen) */
export function wattDifferenz(dw: number): string {
  const betrag = zahl(Math.abs(dw), 0);
  return `${dw < 0 ? '−' : '+'}${betrag}${EINHEIT}W`;
}

/** „1,96 €/h“ */
export function euroProStunde(euro: number): string {
  return `${zahl(euro, 2)}${EINHEIT}€/h`;
}

/** „1,20 €“ */
export function euro(betrag: number): string {
  return `${zahl(betrag, 2)}${EINHEIT}€`;
}

/** „0,35 €/kWh“ */
export function strompreis(preis: number): string {
  return `${zahl(preis, 2)}${EINHEIT}€/kWh`;
}

/** „3,42 kWh“ aus Wh */
export function kwh(wh: number): string {
  return `${zahl(wh / 1000, 2)}${EINHEIT}kWh`;
}

/** „noch 2:48“ aus Restsekunden */
export function restzeit(sekunden: number): string {
  const s = Math.max(0, Math.ceil(sekunden));
  return `noch ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** „42 %“ */
export function prozent(anteil: number): string {
  return `${zahl(anteil * 100, 0)}${EINHEIT}%`;
}
