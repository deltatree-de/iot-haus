// Befehlsprüfung und -anwendung (PRD FR-3, FR-18, FR-22, FR-27). Reine Funktionen.
import { GERAETE, GERAETE_IDS, istGeraetId, istRaumId, type GeraetId } from './katalog';
import { BEFEHL_ID_MUSTER, type Befehl, type FehlerCode, type HausZustand } from './protokoll';
import { istSzeneId, szenenZiele } from './szenen';

/** Ausgangszustand beim allerersten Start: nur Grundlastgeräte an (FR-4). */
export function ausgangszustand(jetzt: number): HausZustand {
  const zustand = {} as HausZustand;
  for (const g of GERAETE) zustand[g.id] = { an: g.grundlast, seit: jetzt };
  return zustand;
}

export type Pruefergebnis =
  | { ok: true; befehl: Befehl }
  | { ok: false; code: FehlerCode; befehlId: string | null };

const FELDER: Record<Befehl['typ'], string[]> = {
  schalten: ['typ', 'id', 'geraet', 'an'],
  szene: ['typ', 'id', 'szene'],
  raumAus: ['typ', 'id', 'raum'],
};

function istObjekt(wert: unknown): wert is Record<string, unknown> {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

/** Prüft eine geparste Client-Nachricht streng: genau die Felder des Typs, gültige IDs. */
export function pruefeBefehl(json: unknown): Pruefergebnis {
  if (!istObjekt(json)) return { ok: false, code: 'UNGUELTIGER_BEFEHL', befehlId: null };
  if ('type' in json) return { ok: false, code: 'ALTES_PROTOKOLL', befehlId: null };

  const befehlId = typeof json.id === 'string' && BEFEHL_ID_MUSTER.test(json.id) ? json.id : null;
  const typ = json.typ;
  if (typeof typ !== 'string' || !Object.hasOwn(FELDER, typ) || befehlId === null) {
    return { ok: false, code: 'UNGUELTIGER_BEFEHL', befehlId };
  }
  const erwartet = FELDER[typ as Befehl['typ']];
  const vorhanden = Object.keys(json);
  if (vorhanden.length !== erwartet.length || !erwartet.every((f) => vorhanden.includes(f))) {
    return { ok: false, code: 'UNGUELTIGER_BEFEHL', befehlId };
  }

  switch (typ) {
    case 'schalten':
      if (typeof json.an !== 'boolean') return { ok: false, code: 'UNGUELTIGER_BEFEHL', befehlId };
      if (!istGeraetId(json.geraet)) return { ok: false, code: 'UNBEKANNTES_GERAET', befehlId };
      return { ok: true, befehl: { typ, id: befehlId, geraet: json.geraet, an: json.an } };
    case 'szene':
      if (!istSzeneId(json.szene)) return { ok: false, code: 'UNBEKANNTE_SZENE', befehlId };
      return { ok: true, befehl: { typ, id: befehlId, szene: json.szene } };
    default:
      if (!istRaumId(json.raum)) return { ok: false, code: 'UNBEKANNTER_RAUM', befehlId };
      return { ok: true, befehl: { typ: 'raumAus', id: befehlId, raum: json.raum } };
  }
}

/** Zielzustände, die ein Befehl setzen will. Grundlast nur beim Einzelschalten. */
export function befehlsZiele(befehl: Befehl): Partial<Record<GeraetId, boolean>> {
  switch (befehl.typ) {
    case 'schalten':
      return { [befehl.geraet]: befehl.an };
    case 'szene':
      return szenenZiele(befehl.szene);
    case 'raumAus': {
      const ziele: Partial<Record<GeraetId, boolean>> = {};
      for (const g of GERAETE) {
        if (g.raum === befehl.raum && !g.grundlast) ziele[g.id] = false;
      }
      return ziele;
    }
  }
}

export interface Anwendung {
  zustand: HausZustand;
  geaendert: GeraetId[];
}

/** Setzt Zielzustände; unveränderte Geräte behalten ihr `seit` (Auto-Aus-Restzeit läuft weiter, FR-5). */
export function wendeZieleAn(
  zustand: HausZustand,
  ziele: Partial<Record<GeraetId, boolean>>,
  jetzt: number,
): Anwendung {
  const geaendert: GeraetId[] = [];
  let neu = zustand;
  for (const id of GERAETE_IDS) {
    const ziel = ziele[id];
    if (ziel === undefined || zustand[id].an === ziel) continue;
    if (neu === zustand) neu = { ...zustand };
    neu[id] = { an: ziel, seit: jetzt };
    geaendert.push(id);
  }
  return { zustand: neu, geaendert };
}

export function wendeAn(zustand: HausZustand, befehl: Befehl, jetzt: number): Anwendung {
  return wendeZieleAn(zustand, befehlsZiele(befehl), jetzt);
}
