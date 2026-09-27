// Client-Zustand als reine Funktion (Architektur §3.8, UX-Zustandsautomat). Kein React.
import { ausgangszustand } from '../domain/befehle';
import { akkuProzent, ausgangsAuto, ELEKTROAUTO, type AutoZustand } from '../domain/elektroauto';
import { geraetById, istGeraetId, istRaumId, raumById, type GeraetId, type RaumId } from '../domain/katalog';
import type { Energie, HausZustand, ServerNachricht, Ursache } from '../domain/protokoll';
import { ausgangsSonne, erzeugung, istSonnenStufe, sonnenstufeById, type SonnenStufe, type SonnenZustand } from '../domain/solar';
import { istSzeneId, szeneById } from '../domain/szenen';
import { T } from '../ui/texte';
import { hausverbrauch, netzbilanz, runden } from '../domain/verbrauch';
import { akku, EINHEIT, watt, wattDifferenz, wattGesprochen } from '../domain/format';

export type Verbindung = 'verbinde' | 'verbunden' | 'getrennt';

export interface Ausstehend {
  art: 'geraet' | 'szene' | 'raumAus' | 'sonne' | 'auto';
  /** Gerät, Szene, Raum, Sonnenstufe bzw. 'weg' | 'zurueck' */
  ref: string;
  /** nur bei Einzelgerät: Zielzustand für die sofortige Anzeige (FR-21) */
  ziel?: boolean;
}

export type MeldungsArt = 'plus' | 'minus' | 'info' | 'fehler' | 'solar';

export interface Meldung {
  id: number;
  art: MeldungsArt;
  /** hervorgehobene Differenz, z. B. „+1.199 W“ */
  delta: string | null;
  text: string;
  /** Screenreader-Ansage; `sammeln` = 2-s-Sammelfenster für Änderungen (FR-11) */
  ansage: string | null;
  sammeln: boolean;
  /** false = nur Ansage, keine sichtbare Meldung */
  sichtbar: boolean;
}

export interface LetzteAenderung {
  nr: number;
  differenzW: number;
  geraete: GeraetId[];
  raeume: RaumId[];
}

export interface ServerDaten {
  zustand: HausZustand;
  auto: AutoZustand;
  sonne: SonnenZustand;
  energie: Energie;
  strompreis: number;
  einspeiseverguetung: number;
  version: string;
}

export const STANDARD_VERGUETUNG = 0.08;

export interface ClientZustand {
  verbindung: Verbindung;
  /** Anzahl gescheiterter Versuche seit dem letzten Snapshot (Erstfehler/Banner) */
  fehlversuche: number;
  jeVerbunden: boolean;
  server: ServerDaten | null;
  uhrVersatzMs: number;
  ausstehend: Record<string, Ausstehend>;
  versionKonflikt: boolean;
  meldungen: Meldung[];
  naechsteMeldungId: number;
  letzteAenderung: LetzteAenderung | null;
  /** zuletzt erzeugte Meldung inkl. reiner Ansagen – Quelle der Live-Region */
  letzteAnsage: Meldung | null;
}

export type Aktion =
  | { typ: 'verbinde' }
  | { typ: 'getrennt' }
  | { typ: 'nachricht'; nachricht: ServerNachricht; jetzt: number; clientVersion: string }
  | { typ: 'gesendet'; befehlId: string; ausstehend: Ausstehend }
  | { typ: 'zeitueberschreitung'; befehlId: string }
  | { typ: 'meldungEntfernen'; id: number };

export const MAX_MELDUNGEN = 3;

export function anfangszustand(): ClientZustand {
  return {
    verbindung: 'verbinde',
    fehlversuche: 0,
    jeVerbunden: false,
    server: null,
    uhrVersatzMs: 0,
    ausstehend: {},
    versionKonflikt: false,
    meldungen: [],
    naechsteMeldungId: 1,
    letzteAenderung: null,
    letzteAnsage: null,
  };
}

/** Bedienbar ⇔ verbunden, Snapshot da, keine abweichende Version (Architektur §4.6). */
export function istBedienbar(z: ClientZustand): boolean {
  return z.verbindung === 'verbunden' && z.server !== null && !z.versionKonflikt;
}

/** Anzeigename; unbekannte Kennungen (z. B. neuerer Server) fallen auf die Kennung zurück (Review CR-06). */
function name(art: Ausstehend['art'] | Ursache['art'], ref: string): string {
  if (art === 'szene') return istSzeneId(ref) ? szeneById(ref).name : ref;
  if (art === 'sonne') return istSonnenStufe(ref) ? sonnenstufeById(ref).name : ref;
  if (art === 'auto') return ELEKTROAUTO.name;
  if (art === 'raumAus') return istRaumId(ref) ? raumById(ref).name : ref;
  return istGeraetId(ref) ? geraetById(ref).name : ref;
}

function geraetMitRaum(ref: string): string {
  if (!istGeraetId(ref)) return ref;
  const g = geraetById(ref);
  return `${g.name} (${raumById(g.raum).name})`;
}

function mitMeldung(z: ClientZustand, m: Omit<Meldung, 'id'>): ClientZustand {
  const meldung = { ...m, id: z.naechsteMeldungId };
  const meldungen = m.sichtbar ? [...z.meldungen, meldung].slice(-MAX_MELDUNGEN) : z.meldungen;
  return { ...z, meldungen, naechsteMeldungId: z.naechsteMeldungId + 1, letzteAnsage: meldung };
}

function fehlerMeldung(z: ClientZustand, a: Ausstehend): ClientZustand {
  const n = name(a.art, a.ref);
  const text =
    a.art === 'geraet'
      ? T.toast.fehlerGeraet(n)
      : a.art === 'szene'
        ? T.toast.fehlerSzene(n)
        : a.art === 'sonne'
          ? T.toast.fehlerSonne
          : a.art === 'auto'
            ? T.toast.fehlerAuto(a.ref === 'weg')
            : T.toast.fehlerRaum(n);
  return mitMeldung(z, { art: 'fehler', delta: null, text, ansage: text, sammeln: false, sichtbar: true });
}

/** Text und Ansage einer Änderung (FR-11, UX Toast-Texte nach Ursache). */
export function beschreibeAenderung(
  alt: HausZustand,
  neu: HausZustand,
  ursache: Ursache,
): { differenzW: number; delta: string; text: string; ansage: string } {
  const altW = runden(hausverbrauch(alt));
  const neuW = runden(hausverbrauch(neu));
  const differenzW = neuW - altW;
  const delta = differenzW === 0 ? `±0${EINHEIT}W` : wattDifferenz(differenzW);
  const haus = T.ansage.haus(wattGesprochen(neuW));
  switch (ursache.art) {
    case 'geraet': {
      const an = istGeraetId(ursache.ref) && neu[ursache.ref].an;
      return {
        differenzW,
        delta,
        text: geraetMitRaum(ursache.ref),
        ansage: T.ansage.geraet(name('geraet', ursache.ref), an, haus),
      };
    }
    case 'autoAus':
      return {
        differenzW,
        delta,
        text: T.toast.autoaus(geraetMitRaum(ursache.ref)),
        ansage: T.ansage.autoaus(name('autoAus', ursache.ref), haus),
      };
    case 'szene': {
      const n = name('szene', ursache.ref);
      return { differenzW, delta, text: T.toast.szene(n), ansage: T.ansage.szene(n, haus) };
    }
    case 'raumAus': {
      const n = name('raumAus', ursache.ref);
      return { differenzW, delta, text: T.toast.raum(n), ansage: T.ansage.raum(n, haus) };
    }
    default:
      return { differenzW, delta, text: ursache.ref, ansage: haus };
  }
}

const BEKANNTE_URSACHEN: string[] = ['geraet', 'szene', 'raumAus', 'autoAus', 'sonne', 'auto', 'akkuVoll'];

function vollstaendigeEnergie(e: Energie): Energie {
  return { ...e, bezugWh: e.bezugWh ?? e.wh, einspeisungWh: e.einspeisungWh ?? 0 };
}

/** Meldung und Ansage für alle Ursachen (FR-11, Proposal §5.4.5). */
export function meldungFuer(
  alt: ServerDaten,
  neu: ServerDaten,
  ursache: Ursache,
  geaendert: GeraetId[],
): { art: MeldungsArt; differenzW: number; delta: string | null; text: string; ansage: string } {
  const altW = runden(hausverbrauch(alt.zustand));
  const neuW = runden(hausverbrauch(neu.zustand));
  const differenzW = neuW - altW;
  const deltaArt: MeldungsArt = differenzW < 0 ? 'minus' : differenzW > 0 ? 'plus' : 'info';
  const haus = T.ansage.haus(wattGesprochen(neuW));
  switch (ursache.art) {
    case 'sonne': {
      const stufe = name('sonne', ursache.ref);
      const solar = runden(erzeugung(neu.sonne.stufe));
      const netz = netzbilanz(neuW, solar);
      const netzText =
        netz.einspeisungW > 0 ? T.ansage.netz('einspeisung', wattGesprochen(netz.einspeisungW)) : T.ansage.netz('bezug', wattGesprochen(netz.bezugW));
      return {
        art: 'solar',
        differenzW: 0,
        delta: null,
        text: T.toast.sonne(stufe, watt(solar)),
        ansage: T.ansage.sonne(stufe, wattGesprochen(solar), netzText),
      };
    }
    case 'auto': {
      if (neu.auto.zuhause) {
        const p = akkuProzent(neu.auto.akkuWh);
        return { art: 'info', differenzW: 0, delta: null, text: T.toast.autoZurueck(akku(p)), ansage: T.ansage.autoZurueck(String(p)) };
      }
      const ladenEndete = geaendert.includes(ELEKTROAUTO.ladegeraet);
      return {
        art: ladenEndete ? deltaArt : 'info',
        differenzW: ladenEndete ? differenzW : 0,
        delta: ladenEndete ? wattDifferenz(differenzW) : null,
        text: ladenEndete ? T.toast.autoWegLaden : T.toast.autoWeg,
        ansage: T.ansage.autoWeg(haus),
      };
    }
    case 'akkuVoll':
      return { art: deltaArt, differenzW, delta: wattDifferenz(differenzW), text: T.toast.akkuVoll, ansage: T.ansage.akkuVoll(haus) };
    default: {
      const b = beschreibeAenderung(alt.zustand, neu.zustand, ursache);
      return { art: deltaArt, differenzW: b.differenzW, delta: b.delta, text: b.text, ansage: b.ansage };
    }
  }
}

function verarbeite(z: ClientZustand, n: ServerNachricht, jetzt: number, clientVersion: string): ClientZustand {
  switch (n.typ) {
    case 'snapshot': {
      const wiederverbunden = z.jeVerbunden;
      const neu: ClientZustand = {
        ...z,
        verbindung: 'verbunden',
        fehlversuche: 0,
        jeVerbunden: true,
        server: {
          // Fehlende Geräte (älterer Server ohne Wallbox) mit dem Ausgangszustand auffüllen (CR21-02)
          zustand: { ...ausgangszustand(n.serverZeit), ...n.zustand },
          // Fehlende Felder (älterer Server) defensiv ergänzen (Proposal §5.3.2 Regel 2)
          auto: n.auto ?? ausgangsAuto(n.serverZeit),
          sonne: n.sonne ?? ausgangsSonne(n.serverZeit),
          energie: vollstaendigeEnergie(n.energie),
          strompreis: n.strompreis,
          einspeiseverguetung: n.einspeiseverguetung ?? STANDARD_VERGUETUNG,
          version: n.version,
        },
        uhrVersatzMs: n.serverZeit - jetzt,
        versionKonflikt: n.version !== clientVersion,
        ausstehend: {},
        // Snapshot ersetzt still: keine Zählanimation, keine Impulse (UX „Wieder verbunden“)
        letzteAenderung: null,
      };
      return wiederverbunden
        ? mitMeldung(neu, { art: 'info', delta: null, text: '', ansage: T.ansage.wiederVerbunden, sammeln: false, sichtbar: false })
        : neu;
    }
    case 'aenderung': {
      // Bei abweichender Serverversion nur noch Snapshot anzeigen, bis neu geladen wird (Review CR-06)
      if (!z.server || z.versionKonflikt) return z;
      const alt = z.server.zustand;
      const zustand = { ...alt };
      const geraete: GeraetId[] = [];
      for (const [id, g] of Object.entries(n.geraete) as [GeraetId, HausZustand[GeraetId] | undefined][]) {
        if (!g || !istGeraetId(id)) continue;
        zustand[id] = g;
        geraete.push(id);
      }
      const energie = vollstaendigeEnergie(n.energie);
      const neuServer: ServerDaten = {
        ...z.server,
        zustand,
        auto: n.auto ?? z.server.auto,
        sonne: n.sonne ?? z.server.sonne,
        energie,
      };
      if (geraete.length === 0 && !n.auto && !n.sonne) return { ...z, server: { ...z.server, energie } };
      if (!BEKANNTE_URSACHEN.includes(n.ursache?.art)) return { ...z, server: neuServer };
      const m = meldungFuer(z.server, neuServer, n.ursache, geraete);
      const raeume = [...new Set(geraete.map((id) => geraetById(id).raum))];
      if (n.auto && !raeume.includes('carport')) raeume.push('carport');
      const naechste: ClientZustand = {
        ...z,
        server: neuServer,
        letzteAenderung: { nr: (z.letzteAenderung?.nr ?? 0) + 1, differenzW: m.differenzW, geraete, raeume },
      };
      return mitMeldung(naechste, {
        art: m.art,
        delta: m.delta,
        text: m.text,
        ansage: m.ansage,
        sammeln: true,
        sichtbar: true,
      });
    }
    case 'bestaetigt': {
      const a = z.ausstehend[n.befehlId];
      if (!a) return z;
      const { [n.befehlId]: _erledigt, ...rest } = z.ausstehend;
      void _erledigt;
      const neu = { ...z, ausstehend: rest };
      if (!n.geaendert && (a.art === 'szene' || a.art === 'raumAus')) {
        const text = T.toast.keineAenderung(name(a.art, a.ref));
        return mitMeldung(neu, { art: 'info', delta: null, text, ansage: text, sammeln: false, sichtbar: true });
      }
      return neu;
    }
    case 'fehler': {
      if (n.befehlId === null || !z.ausstehend[n.befehlId]) return z;
      return zeitueberschritten(z, n.befehlId);
    }
    case 'energie': {
      if (!z.server || z.versionKonflikt) return z;
      return {
        ...z,
        uhrVersatzMs: n.serverZeit - jetzt,
        server: { ...z.server, energie: vollstaendigeEnergie(n.energie), auto: n.auto ?? z.server.auto },
      };
    }
  }
}

function zeitueberschritten(z: ClientZustand, befehlId: string): ClientZustand {
  const a = z.ausstehend[befehlId];
  if (!a) return z;
  const { [befehlId]: _weg, ...rest } = z.ausstehend;
  void _weg;
  return fehlerMeldung({ ...z, ausstehend: rest }, a);
}

export function hausReducer(z: ClientZustand, aktion: Aktion): ClientZustand {
  switch (aktion.typ) {
    case 'verbinde':
      return z.verbindung === 'verbinde' ? z : { ...z, verbindung: 'verbinde' };
    case 'getrennt': {
      let neu: ClientZustand = { ...z, verbindung: 'getrennt', fehlversuche: z.fehlversuche + 1 };
      // Offene Befehle sofort zurücksetzen und melden (UX Schalt-Ablauf 7)
      for (const id of Object.keys(z.ausstehend)) neu = zeitueberschritten(neu, id);
      return neu;
    }
    case 'nachricht':
      return verarbeite(z, aktion.nachricht, aktion.jetzt, aktion.clientVersion);
    case 'gesendet':
      return { ...z, ausstehend: { ...z.ausstehend, [aktion.befehlId]: aktion.ausstehend } };
    case 'zeitueberschreitung':
      return zeitueberschritten(z, aktion.befehlId);
    case 'meldungEntfernen':
      return { ...z, meldungen: z.meldungen.filter((m) => m.id !== aktion.id) };
  }
}

/** Anzeige-Zustand eines Geräts: Serverzustand, überlagert vom ausstehenden Ziel (FR-21). */
export function anzeigeAn(z: ClientZustand, id: GeraetId): { an: boolean; beschaeftigt: boolean } {
  const serverAn = z.server?.zustand[id].an ?? false;
  for (const a of Object.values(z.ausstehend)) {
    if (a.art === 'geraet' && a.ref === id && a.ziel !== undefined) return { an: a.ziel, beschaeftigt: true };
  }
  return { an: serverAn, beschaeftigt: false };
}

export function istBeschaeftigt(z: ClientZustand, art: Ausstehend['art'], ref: string): boolean {
  return Object.values(z.ausstehend).some((a) => a.art === art && a.ref === ref);
}

/** Anzeige der Sonnenlage: Serverwert, überlagert von der gerade gewählten Stufe (optimistisch, FR-21). */
export function anzeigeSonne(z: ClientZustand): { stufe: SonnenStufe | null; beschaeftigt: boolean } {
  // Die zuletzt gewählte Stufe gewinnt (Pfeiltasten, CR21-04); vor dem Snapshot ist nichts gewählt (CR21-05)
  const ausstehend = Object.values(z.ausstehend).filter((a) => a.art === 'sonne').at(-1);
  if (ausstehend && istSonnenStufe(ausstehend.ref)) return { stufe: ausstehend.ref, beschaeftigt: true };
  return { stufe: z.server?.sonne.stufe ?? null, beschaeftigt: false };
}

/** Ist gerade ein Auto-Befehl (Wegfahren/Zurückkommen) unterwegs? */
export function autoBeschaeftigt(z: ClientZustand): boolean {
  return Object.values(z.ausstehend).some((a) => a.art === 'auto');
}
