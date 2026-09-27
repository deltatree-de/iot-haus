// Elektroauto mit Akku, geladen über die Wallbox im Carport (2.1, FR-37 bis FR-39, E-03 bis E-10).
import { geraetById, type GeraetId } from './katalog';

export const ELEKTROAUTO = {
  name: 'Elektroauto',
  kapazitaetWh: 60_000,
  /** pauschal je Fahrt, bei Rückkehr abgezogen; zugleich Mindeststand zum Wegfahren (15 %) */
  fahrtWh: 9_000,
  startAkkuWh: 30_000,
  ladegeraet: 'carport.wallbox' as GeraetId,
} as const;

/** Toleranz, ab der ein Akku als voll gilt (Rundung der Integration). */
const VOLL_TOLERANZ_WH = 0.5;

export interface AutoZustand {
  zuhause: boolean;
  /** Akkustand in Wh zum Zeitpunkt `stand` (ungerundet, 0 … Kapazität) */
  akkuWh: number;
  /** ms seit Epoch, bis wann akkuWh integriert ist */
  stand: number;
}

export function ladeleistungW(): number {
  return geraetById(ELEKTROAUTO.ladegeraet).betriebW;
}

/** Akkustand zum Zeitpunkt `jetzt`, bei laufendem Laden linear fortgeschrieben. */
export function akkuWhBei(auto: AutoZustand, laedt: boolean, jetzt: number): number {
  if (!laedt || !auto.zuhause) return auto.akkuWh;
  const dauer = Math.max(0, jetzt - auto.stand);
  return Math.min(ELEKTROAUTO.kapazitaetWh, auto.akkuWh + (ladeleistungW() * dauer) / 3_600_000);
}

/** Ganze Prozent, abgerundet; 100 nur wenn wirklich voll (E-08). */
export function akkuProzent(wh: number): number {
  if (wh >= ELEKTROAUTO.kapazitaetWh - VOLL_TOLERANZ_WH) return 100;
  return Math.max(0, Math.min(99, Math.floor((wh / ELEKTROAUTO.kapazitaetWh) * 100 + 1e-9)));
}

export function istVoll(wh: number): boolean {
  return wh >= ELEKTROAUTO.kapazitaetWh - VOLL_TOLERANZ_WH;
}

/** Restladezeit bis 100 % in ms, null wenn nicht geladen wird. */
export function restLadezeitMs(auto: AutoZustand, laedt: boolean, jetzt: number): number | null {
  if (!laedt || !auto.zuhause) return null;
  const fehlend = ELEKTROAUTO.kapazitaetWh - akkuWhBei(auto, true, jetzt);
  return Math.max(0, (fehlend / ladeleistungW()) * 3_600_000);
}

export function darfLaden(auto: AutoZustand, jetzt: number): boolean {
  return auto.zuhause && !istVoll(akkuWhBei(auto, false, jetzt));
}

export function darfWegfahren(auto: AutoZustand, laedt: boolean, jetzt: number): boolean {
  return auto.zuhause && akkuWhBei(auto, laedt, jetzt) >= ELEKTROAUTO.fahrtWh;
}

export function nachRueckkehr(akkuWh: number): number {
  return Math.max(0, akkuWh - ELEKTROAUTO.fahrtWh);
}

export function ausgangsAuto(jetzt: number): AutoZustand {
  return { zuhause: true, akkuWh: ELEKTROAUTO.startAkkuWh, stand: jetzt };
}
