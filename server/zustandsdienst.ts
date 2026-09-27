// Autoritativer Serverzustand: Befehle, Energie-Integration, Auto-Aus, Elektroauto, Sonnenlage
// (Architektur §3.4, §3.7, §3.12, §4.4).
import { ausgangszustand, befehlsZiele, erzwingeLadeRegeln, pruefeRegel, wendeZieleAn } from '../src/domain/befehle';
import {
  ausgangsAuto,
  ELEKTROAUTO,
  istVoll,
  ladeleistungW,
  nachRueckkehr,
  type AutoZustand,
} from '../src/domain/elektroauto';
import { berlinDatum, integriere, leererTag, naechsteMitternachtBerlin } from '../src/domain/energie';
import { GERAETE, GERAETE_IDS, geraetById, type GeraetId } from '../src/domain/katalog';
import type { Befehl, Energie, HausZustand, ServerNachricht, Ursache } from '../src/domain/protokoll';
import { ausgangsSonne, erzeugung, type SonnenStufe, type SonnenZustand } from '../src/domain/solar';
import { hausverbrauch } from '../src/domain/verbrauch';
import type { Logger } from './log';

export const ENERGIE_TAKT_MS = 60_000;
/**
 * Längste Zeitspanne, die auf einmal integriert wird. Der Takt integriert spätestens alle 60 s;
 * größere Sprünge (Uhr vorgestellt, Prozess eingefroren) zählen nicht als Verbrauch (Review CR-12).
 */
export const MAX_INTEGRATION_MS = 2 * ENERGIE_TAKT_MS;

const WALLBOX = ELEKTROAUTO.ladegeraet;

export interface Persistenz {
  speichereGeraet(id: GeraetId, zustand: HausZustand[GeraetId]): void;
  speichereEnergie(energie: Energie, stand: number): Promise<void>;
  speichereAuto(auto: AutoZustand): Promise<void>;
  speichereSonne(sonne: SonnenZustand): void;
}

export interface Gespeichert {
  geraete: Partial<HausZustand>;
  energie: Energie | null;
  auto: AutoZustand | null;
  sonne: SonnenZustand | null;
}

export interface ZustandsdienstOptionen {
  gespeichert: Gespeichert;
  persistenz: Persistenz;
  verteile: (nachricht: ServerNachricht) => void;
  jetzt: () => number;
  log: Logger;
}

export type Ausfuehrung = { ok: true; geaendert: boolean } | { ok: false; code: 'NICHT_MOEGLICH' };

interface Aenderung {
  ziele?: Partial<Record<GeraetId, boolean>>;
  /** liefert dasselbe Objekt, wenn sich am Auto nichts ändert */
  auto?: (a: AutoZustand) => AutoZustand;
  sonne?: SonnenStufe;
}

export class Zustandsdienst {
  private zustand: HausZustand;
  private energie: Energie;
  private energieStand: number;
  private auto: AutoZustand;
  private sonne: SonnenZustand;
  private readonly autoAusTimer = new Map<GeraetId, NodeJS.Timeout>();
  private energieTimer: NodeJS.Timeout | null = null;
  private akkuVollTimer: NodeJS.Timeout | null = null;
  private gestoppt = false;

  constructor(private readonly opts: ZustandsdienstOptionen) {
    const jetzt = opts.jetzt();
    this.zustand = ausgangszustand(jetzt);
    for (const [id, g] of Object.entries(opts.gespeichert.geraete) as [GeraetId, HausZustand[GeraetId]][]) {
      // Zeitpunkte aus der Zukunft (Uhr zurückgestellt) auf jetzt begrenzen (Review CR-11)
      this.zustand[id] = { an: g.an, seit: Math.min(g.seit, jetzt) };
    }
    const heute = berlinDatum(jetzt);
    this.energie =
      opts.gespeichert.energie && opts.gespeichert.energie.datum === heute ? opts.gespeichert.energie : leererTag(heute);
    // Zeit ohne laufenden Server zählt nicht – weder als Verbrauch noch als Ladung (FR-10, E-10).
    this.energieStand = jetzt;
    const auto = opts.gespeichert.auto;
    this.auto = auto
      ? { zuhause: auto.zuhause, akkuWh: Math.min(ELEKTROAUTO.kapazitaetWh, Math.max(0, auto.akkuWh)), stand: jetzt }
      : ausgangsAuto(jetzt);
    const sonne = opts.gespeichert.sonne;
    this.sonne = sonne ? { stufe: sonne.stufe, seit: Math.min(sonne.seit, jetzt) } : ausgangsSonne(jetzt);
  }

  /** Normalisiert den gespeicherten Stand, startet Auto-Aus-, Akku- und Energie-Timer. */
  starte(): void {
    // Inkonsistenter Altbestand (Wallbox an, Auto unterwegs oder Akku voll) → Wallbox aus (AC-11)
    const jetzt = this.opts.jetzt();
    this.zustand = wendeZieleAn(this.zustand, erzwingeLadeRegeln(this.zustand, this.auto, jetzt), jetzt).zustand;
    this.speichereAlles();
    for (const g of GERAETE) {
      if (g.autoAusS !== null && this.zustand[g.id].an) this.planeAutoAus(g.id);
    }
    this.planeAkkuVoll();
    this.planeEnergieTakt();
  }

  aktuellerZustand(): HausZustand {
    return this.zustand;
  }

  aktuelleEnergie(): Energie {
    return this.energie;
  }

  aktuellesAuto(): AutoZustand {
    return this.auto;
  }

  aktuelleSonne(): SonnenZustand {
    return this.sonne;
  }

  snapshot(version: string, strompreis: number, einspeiseverguetung: number): ServerNachricht {
    return {
      typ: 'snapshot',
      version,
      zustand: this.zustand,
      auto: this.auto,
      sonne: this.sonne,
      energie: this.energie,
      strompreis,
      einspeiseverguetung,
      serverZeit: this.opts.jetzt(),
    };
  }

  /** Einziger Einstieg für Nutzerbefehle (FR-16, FR-19); fachliche Regeln vor jeder Änderung (FR-38/39). */
  fuehreAus(befehl: Befehl): Ausfuehrung {
    const jetzt = this.opts.jetzt();
    if (pruefeRegel(this.zustand, this.auto, befehl, jetzt)) return { ok: false, code: 'NICHT_MOEGLICH' };

    switch (befehl.typ) {
      case 'sonne':
        return { ok: true, geaendert: this.aendere({ sonne: befehl.stufe }, { art: 'sonne', ref: befehl.stufe, befehlId: befehl.id }) };
      case 'auto': {
        const zuhause = befehl.zuhause;
        const auto = (a: AutoZustand): AutoZustand =>
          a.zuhause === zuhause ? a : zuhause ? { ...a, zuhause, akkuWh: nachRueckkehr(a.akkuWh) } : { ...a, zuhause };
        const ursache: Ursache = { art: 'auto', ref: zuhause ? 'zurueck' : 'weg', befehlId: befehl.id };
        return { ok: true, geaendert: this.aendere({ auto }, ursache) };
      }
      default: {
        const ref = befehl.typ === 'schalten' ? befehl.geraet : befehl.typ === 'szene' ? befehl.szene : befehl.raum;
        const art = befehl.typ === 'schalten' ? 'geraet' : befehl.typ;
        return { ok: true, geaendert: this.aendere({ ziele: befehlsZiele(befehl) }, { art, ref, befehlId: befehl.id }) };
      }
    }
  }

  /** Einziger Änderungspfad (Architektur §4.4, AD-23): eine Änderung = eine `aenderung`-Nachricht. */
  private aendere(aenderung: Aenderung, ursache: Ursache): boolean {
    const jetzt = this.opts.jetzt();
    // Erst mit der alten Leistung/Sonne bis jetzt integrieren (Energie und Akku)
    this.integriereBis(jetzt);

    const auto = aenderung.auto ? aenderung.auto(this.auto) : this.auto;
    const sonne =
      aenderung.sonne && aenderung.sonne !== this.sonne.stufe ? { stufe: aenderung.sonne, seit: jetzt } : this.sonne;
    const zwischen = wendeZieleAn(this.zustand, aenderung.ziele ?? {}, jetzt);
    // Laden endet, wenn das Auto wegfährt oder der Akku voll ist – in derselben Änderung (E-06)
    const regel = wendeZieleAn(zwischen.zustand, erzwingeLadeRegeln(zwischen.zustand, auto, jetzt), jetzt);
    const geaendert = [...new Set([...zwischen.geaendert, ...regel.geaendert])];
    const autoGeaendert = auto !== this.auto;
    const sonneGeaendert = sonne !== this.sonne;
    if (geaendert.length === 0 && !autoGeaendert && !sonneGeaendert) return false;

    this.zustand = regel.zustand;
    this.auto = autoGeaendert ? { ...auto, stand: jetzt } : this.auto;
    this.sonne = sonne;

    const geraete: Partial<HausZustand> = {};
    for (const id of geaendert) {
      geraete[id] = this.zustand[id];
      if (geraetById(id).autoAusS !== null) {
        if (this.zustand[id].an) this.planeAutoAus(id);
        else this.loescheAutoAus(id);
      }
    }
    this.planeAkkuVoll();
    this.opts.verteile({
      typ: 'aenderung',
      ursache,
      geraete,
      ...(autoGeaendert ? { auto: this.auto } : {}),
      ...(sonneGeaendert ? { sonne: this.sonne } : {}),
      energie: this.energie,
    });
    // Sofort sichern (FR-17); Energie nur im 60-s-Takt und beim Stopp (FR-10, Review CR-01)
    for (const id of geaendert) this.opts.persistenz.speichereGeraet(id, this.zustand[id]);
    if (autoGeaendert || geaendert.includes(WALLBOX)) void this.opts.persistenz.speichereAuto(this.auto);
    if (sonneGeaendert) this.opts.persistenz.speichereSonne(this.sonne);
    return true;
  }

  /** Integriert Energie (Verbrauch, Bezug, Einspeisung) und Akku im selben Schritt (AD-24). */
  private integriereBis(jetzt: number): void {
    const von = Math.max(this.energieStand, jetzt - MAX_INTEGRATION_MS);
    this.energie = integriere(this.energie, hausverbrauch(this.zustand), erzeugung(this.sonne.stufe), von, jetzt);
    this.energieStand = Math.max(this.energieStand, jetzt);
    const laedt = this.zustand[WALLBOX].an && this.auto.zuhause;
    const dauer = Math.max(0, jetzt - von);
    this.auto = {
      ...this.auto,
      akkuWh: laedt
        ? Math.min(ELEKTROAUTO.kapazitaetWh, this.auto.akkuWh + (ladeleistungW() * dauer) / 3_600_000)
        : this.auto.akkuWh,
      stand: Math.max(this.auto.stand, jetzt),
    };
  }

  private planeAutoAus(id: GeraetId): void {
    this.loescheAutoAus(id);
    const dauerMs = (geraetById(id).autoAusS ?? 0) * 1000;
    const rest = Math.max(0, this.zustand[id].seit + dauerMs - this.opts.jetzt());
    const timer = setTimeout(() => {
      this.autoAusTimer.delete(id);
      if (this.gestoppt || !this.zustand[id].an) return;
      this.opts.log.info('auto_aus', { geraet: id });
      this.aendere({ ziele: { [id]: false } }, { art: 'autoAus', ref: id, befehlId: null });
    }, rest);
    this.autoAusTimer.set(id, timer);
  }

  private loescheAutoAus(id: GeraetId): void {
    const timer = this.autoAusTimer.get(id);
    if (timer) clearTimeout(timer);
    this.autoAusTimer.delete(id);
  }

  /** Akku-voll-Timer analog Auto-Aus (AD-25): schaltet die Wallbox bei 100 % selbst ab. */
  private planeAkkuVoll(): void {
    if (this.akkuVollTimer) clearTimeout(this.akkuVollTimer);
    this.akkuVollTimer = null;
    if (this.gestoppt || !this.zustand[WALLBOX].an || !this.auto.zuhause) return;
    const jetzt = this.opts.jetzt();
    const bisher = this.auto.akkuWh + (ladeleistungW() * Math.max(0, jetzt - this.auto.stand)) / 3_600_000;
    const restMs = Math.max(0, ((ELEKTROAUTO.kapazitaetWh - bisher) / ladeleistungW()) * 3_600_000);
    this.akkuVollTimer = setTimeout(() => {
      this.akkuVollTimer = null;
      if (this.gestoppt || !this.zustand[WALLBOX].an) return;
      this.integriereBis(this.opts.jetzt());
      if (!istVoll(this.auto.akkuWh)) {
        this.planeAkkuVoll();
        return;
      }
      this.opts.log.info('akku_voll');
      this.aendere(
        { ziele: { [WALLBOX]: false }, auto: (a) => ({ ...a, akkuWh: ELEKTROAUTO.kapazitaetWh }) },
        { art: 'akkuVoll', ref: WALLBOX, befehlId: null },
      );
    }, Math.ceil(restMs));
  }

  private planeEnergieTakt(): void {
    if (this.gestoppt) return;
    const jetzt = this.opts.jetzt();
    const warte = Math.max(1, Math.min(ENERGIE_TAKT_MS, naechsteMitternachtBerlin(jetzt) - jetzt));
    this.energieTimer = setTimeout(() => {
      this.energieTimer = null;
      const zeit = this.opts.jetzt();
      this.integriereBis(zeit);
      void this.opts.persistenz.speichereEnergie(this.energie, this.energieStand);
      void this.opts.persistenz.speichereAuto(this.auto);
      this.opts.verteile({ typ: 'energie', energie: this.energie, auto: this.auto, serverZeit: zeit });
      this.planeAkkuVoll();
      this.planeEnergieTakt();
    }, warte);
  }

  /** Schreibt den kompletten Stand (Start, nach Broker-Wiederverbindung). */
  speichereAlles(): void {
    for (const id of GERAETE_IDS) this.opts.persistenz.speichereGeraet(id, this.zustand[id]);
    void this.opts.persistenz.speichereEnergie(this.energie, this.energieStand);
    void this.opts.persistenz.speichereAuto(this.auto);
    this.opts.persistenz.speichereSonne(this.sonne);
  }

  /** Beendet alle Timer und sichert Energie und Akku (SIGTERM). */
  stoppe(): Promise<void> {
    this.gestoppt = true;
    for (const id of [...this.autoAusTimer.keys()]) this.loescheAutoAus(id);
    if (this.energieTimer) clearTimeout(this.energieTimer);
    if (this.akkuVollTimer) clearTimeout(this.akkuVollTimer);
    this.energieTimer = null;
    this.akkuVollTimer = null;
    this.integriereBis(this.opts.jetzt());
    return Promise.all([
      this.opts.persistenz.speichereEnergie(this.energie, this.energieStand),
      this.opts.persistenz.speichereAuto(this.auto),
    ]).then(() => undefined);
  }
}
