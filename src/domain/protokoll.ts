// WebSocket-Protokoll zwischen Browser und Server (Architektur §3.5).
import type { GeraetId, RaumId } from './katalog';
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
  /** Energie seit 00:00 Uhr in Wh (ungerundet) */
  wh: number;
}

export type Befehl =
  | { typ: 'schalten'; id: string; geraet: GeraetId; an: boolean }
  | { typ: 'szene'; id: string; szene: SzeneId }
  | { typ: 'raumAus'; id: string; raum: RaumId };

export type UrsachenArt = 'geraet' | 'szene' | 'raumAus' | 'autoAus';

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
  | 'ZU_VIELE_BEFEHLE';

export type ServerNachricht =
  | {
      typ: 'snapshot';
      version: string;
      zustand: HausZustand;
      energie: Energie;
      strompreis: number;
      serverZeit: number;
    }
  | { typ: 'aenderung'; ursache: Ursache; geraete: Partial<HausZustand>; energie: Energie }
  | { typ: 'bestaetigt'; befehlId: string; geaendert: boolean }
  | { typ: 'fehler'; befehlId: string | null; code: FehlerCode; meldung: string }
  | { typ: 'energie'; energie: Energie; serverZeit: number };

export const BEFEHL_ID_MUSTER = /^[A-Za-z0-9_-]{1,64}$/;
