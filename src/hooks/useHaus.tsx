'use client';

// HausProvider: Client-Zustand, Verbindung und Befehle (Architektur §3.8).
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  anfangszustand,
  hausReducer,
  istBedienbar,
  istBeschaeftigt,
  type Ausstehend,
  type ClientZustand,
} from '@/client/hausReducer';
import { HausVerbindung, standardUrl } from '@/client/verbindung';
import type { GeraetId, RaumId } from '@/domain/katalog';
import type { Befehl } from '@/domain/protokoll';
import type { SonnenStufe } from '@/domain/solar';
import type { SzeneId } from '@/domain/szenen';

export const CLIENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';
export const BESTAETIGUNG_FRIST_MS = 5000;

export interface HausKontext {
  zustand: ClientZustand;
  bedienbar: boolean;
  /** Zeitpunkt (ms) des nächsten automatischen Verbindungsversuchs */
  naechsterVersuch: number | null;
  schalten(geraet: GeraetId, an: boolean): void;
  szene(szene: SzeneId): void;
  raumAus(raum: RaumId): void;
  sonne(stufe: SonnenStufe): void;
  /** Elektroauto wegfahren (false) bzw. zurückkommen (true) lassen */
  auto(zuhause: boolean): void;
  neuVerbinden(): void;
  meldungEntfernen(id: number): void;
}

type OhneId<T> = T extends unknown ? Omit<T, 'id'> : never;

const Kontext = createContext<HausKontext | null>(null);

export function HausProvider({
  children,
  startZustand,
}: {
  children: React.ReactNode;
  /** nur für Tests: vorbereiteter Zustand ohne Verbindung */
  startZustand?: ClientZustand;
}) {
  const [zustand, dispatch] = useReducer(hausReducer, startZustand ?? anfangszustand());
  const [naechsterVersuch, setNaechsterVersuch] = useState<number | null>(null);
  const verbindung = useRef<HausVerbindung | null>(null);
  const zaehler = useRef(0);
  const aktuell = useRef(zustand);
  aktuell.current = zustand;

  useEffect(() => {
    if (startZustand) return;
    const v = new HausVerbindung({
      url: standardUrl(window.location),
      beiNachricht: (nachricht) =>
        dispatch({ typ: 'nachricht', nachricht, jetzt: Date.now(), clientVersion: CLIENT_VERSION }),
      beiStatus: (status) => {
        if (status === 'getrennt') dispatch({ typ: 'getrennt' });
        if (status === 'verbinde') dispatch({ typ: 'verbinde' });
      },
      beiNaechsterVersuch: setNaechsterVersuch,
    });
    verbindung.current = v;
    v.starte();
    return () => {
      v.beende();
      verbindung.current = null;
    };
  }, [startZustand]);

  const sende = useCallback((befehl: OhneId<Befehl>, ausstehend: Ausstehend) => {
    const z = aktuell.current;
    // Sonne und Auto: höchstens ein offener Befehl je Art (eine Auswahl bzw. eine Fahrt zur Zeit)
    const eineJeArt = ausstehend.art === 'sonne' || ausstehend.art === 'auto';
    const belegt = eineJeArt
      ? Object.values(z.ausstehend).some((a) => a.art === ausstehend.art)
      : istBeschaeftigt(z, ausstehend.art, ausstehend.ref);
    if (!istBedienbar(z) || belegt) return;
    const id = `${Date.now().toString(36)}-${zaehler.current++}`;
    dispatch({ typ: 'gesendet', befehlId: id, ausstehend });
    const gesendet = verbindung.current?.sende({ ...befehl, id } as Befehl) ?? false;
    if (!gesendet) {
      dispatch({ typ: 'zeitueberschreitung', befehlId: id });
      return;
    }
    setTimeout(() => dispatch({ typ: 'zeitueberschreitung', befehlId: id }), BESTAETIGUNG_FRIST_MS);
  }, []);

  const schalten = useCallback(
    (geraet: GeraetId, an: boolean) => sende({ typ: 'schalten', geraet, an }, { art: 'geraet', ref: geraet, ziel: an }),
    [sende],
  );
  const szene = useCallback((s: SzeneId) => sende({ typ: 'szene', szene: s }, { art: 'szene', ref: s }), [sende]);
  const raumAus = useCallback((raum: RaumId) => sende({ typ: 'raumAus', raum }, { art: 'raumAus', ref: raum }), [sende]);
  const sonne = useCallback(
    (stufe: SonnenStufe) => sende({ typ: 'sonne', stufe }, { art: 'sonne', ref: stufe }),
    [sende],
  );
  const auto = useCallback(
    (zuhause: boolean) => sende({ typ: 'auto', zuhause }, { art: 'auto', ref: zuhause ? 'zurueck' : 'weg' }),
    [sende],
  );
  const neuVerbinden = useCallback(() => verbindung.current?.jetztVerbinden(), []);
  const meldungEntfernen = useCallback((id: number) => dispatch({ typ: 'meldungEntfernen', id }), []);

  const wert = useMemo<HausKontext>(
    () => ({
      zustand,
      bedienbar: istBedienbar(zustand),
      naechsterVersuch,
      schalten,
      szene,
      raumAus,
      sonne,
      auto,
      neuVerbinden,
      meldungEntfernen,
    }),
    [zustand, naechsterVersuch, schalten, szene, raumAus, sonne, auto, neuVerbinden, meldungEntfernen],
  );

  return <Kontext.Provider value={wert}>{children}</Kontext.Provider>;
}

export function useHaus(): HausKontext {
  const k = useContext(Kontext);
  if (!k) throw new Error('useHaus nur innerhalb von <HausProvider>');
  return k;
}
