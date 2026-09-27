// Tagesenergie mit Tageswechsel um 00:00 Uhr Europe/Berlin (PRD FR-10, Architektur §3.7).
import type { Energie } from './protokoll';

const ZEITZONE = 'Europe/Berlin';
const MS_PRO_STUNDE = 3_600_000;

const datumsFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZEITZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const teileFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: ZEITZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

/** Kalendertag in Berlin als YYYY-MM-DD. */
export function berlinDatum(ms: number): string {
  return datumsFormat.format(new Date(ms));
}

/** Abstand der Berliner Ortszeit zu UTC in ms zum Zeitpunkt `ms` (+1 h bzw. +2 h). */
function berlinVersatz(ms: number): number {
  const teile: Record<string, number> = {};
  for (const t of teileFormat.formatToParts(new Date(ms))) {
    if (t.type !== 'literal') teile[t.type] = Number(t.value);
  }
  const alsUtc = Date.UTC(teile.year, teile.month - 1, teile.day, teile.hour, teile.minute, teile.second);
  return alsUtc - Math.floor(ms / 1000) * 1000;
}

/** UTC-Zeitpunkt von 00:00 Uhr Berliner Zeit am Tag `datum` (YYYY-MM-DD). */
export function mitternachtBerlin(datum: string): number {
  const [j, m, t] = datum.split('-').map(Number);
  const utcMitternacht = Date.UTC(j, m - 1, t);
  const erster = utcMitternacht - berlinVersatz(utcMitternacht);
  return utcMitternacht - berlinVersatz(erster);
}

/** Beginn des nächsten Berliner Kalendertags nach `ms`. */
export function naechsteMitternachtBerlin(ms: number): number {
  const [j, m, t] = berlinDatum(ms).split('-').map(Number);
  const morgen = new Date(Date.UTC(j, m - 1, t + 1));
  return mitternachtBerlin(morgen.toISOString().slice(0, 10));
}

export function leererTag(datum: string): Energie {
  return { datum, wh: 0, bezugWh: 0, einspeisungWh: 0 };
}

/**
 * Integriert konstanten Verbrauch und konstante Solarerzeugung über [vonMs, bisMs] in drei Reihen:
 * Verbrauch, Netzbezug, Einspeisung (FR-10, FR-42). Liegt `bisMs` an einem anderen Berliner Tag als
 * `e.datum`, beginnt der Tag neu; nur die Zeit seit der letzten Mitternacht zählt (keine Historie).
 */
export function integriere(
  e: Energie,
  verbrauchW: number,
  erzeugungW: number,
  vonMs: number,
  bisMs: number,
): Energie {
  const datum = berlinDatum(bisMs);
  if (bisMs <= vonMs) {
    return datum === e.datum ? e : leererTag(datum);
  }
  const basis = datum === e.datum ? e : leererTag(datum);
  const start = datum === e.datum ? vonMs : Math.max(vonMs, mitternachtBerlin(datum));
  const stunden = (bisMs - start) / MS_PRO_STUNDE;
  return {
    datum,
    wh: basis.wh + verbrauchW * stunden,
    bezugWh: basis.bezugWh + Math.max(0, verbrauchW - erzeugungW) * stunden,
    einspeisungWh: basis.einspeisungWh + Math.max(0, erzeugungW - verbrauchW) * stunden,
  };
}
