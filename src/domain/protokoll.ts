// WebSocket-Protokoll zwischen Browser und Server (Architektur §3.5).
import type { AutoZustand } from './elektroauto';
import type { GeraetId, RaumId } from './katalog';
import type { SonnenStufe, SonnenZustand } from './solar';
import type { SzeneId } from './szenen';

export const MAX_NACHRICHT_BYTES = 4096;

export interface GeraeteZustand {
  an: boolean;
  /** ms seit Epoch der letzten Zustandsänderung */
  seit: number;
}

export type HausZustand = Record<GeraetId, GeraeteZustand>;

export interface Energie {
  /** Kalendertag in Europe/Berlin, YYYY-MM-DD */
  datum: string;
  /** Verbrauch des Hauses seit 00:00 Uhr in Wh (ungerundet) */
  wh: number;
  /** davon aus dem Netz bezogen (Wh) */
  bezugWh: number;
  /** ins Netz eingespeiste Solarenergie (Wh) */
  einspeisungWh: number;
}

export type Befehl =
  | { typ: 'schalten'; id: string; geraet: GeraetId; an: boolean }
  | { typ: 'szene'; id: string; szene: SzeneId }
  | { typ: 'raumAus'; id: string; raum: RaumId }
  | { typ: 'sonne'; id: string; stufe: SonnenStufe }
  | { typ: 'auto'; id: string; zuhause: boolean };

/** ref: sonne → Stufe; auto → 'weg' | 'zurueck'; akkuVoll → Geräte-ID der Wallbox */
export type UrsachenArt = 'geraet' | 'szene' | 'raumAus' | 'autoAus' | 'sonne' | 'auto' | 'akkuVoll';

export interface Ursache {
  art: UrsachenArt;
  ref: string;
  befehlId: string | null;
}

export type FehlerCode =
  | 'UNGUELTIGES_JSON'
  | 'ZU_GROSS'
  | 'UNGUELTIGER_BEFEHL'
  | 'UNBEKANNTES_GERAET'
  | 'UNBEKANNTE_SZENE'
  | 'UNBEKANNTER_RAUM'
  | 'ALTES_PROTOKOLL'
  | 'ZU_VIELE_BEFEHLE'
  | 'NICHT_MOEGLICH';

export type ServerNachricht =
  | {
      typ: 'snapshot';
      version: string;
      zustand: HausZustand;
      auto: AutoZustand;
      sonne: SonnenZustand;
      energie: Energie;
      strompreis: number;
      einspeiseverguetung: number;
      serverZeit: number;
    }
  | {
      typ: 'aenderung';
      ursache: Ursache;
      geraete: Partial<HausZustand>;
      /** nur bei Änderung */
      auto?: AutoZustand;
      sonne?: SonnenZustand;
      energie: Energie;
    }
  | { typ: 'bestaetigt'; befehlId: string; geaendert: boolean }
  | { typ: 'fehler'; befehlId: string | null; code: FehlerCode; meldung: string }
  | { typ: 'energie'; energie: Energie; auto: AutoZustand; serverZeit: number };

export const BEFEHL_ID_MUSTER = /^[A-Za-z0-9_-]{1,64}$/;
