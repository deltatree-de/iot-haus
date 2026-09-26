// Autoritativer Serverzustand: Befehle, Energie-Integration, Auto-Aus (Architektur §3.4, §3.7, §4.4).
import { ausgangszustand, befehlsZiele, wendeZieleAn } from '../src/domain/befehle';
import { berlinDatum, integriere, naechsteMitternachtBerlin } from '../src/domain/energie';
import { GERAETE, GERAETE_IDS, geraetById, type GeraetId } from '../src/domain/katalog';
import type { Befehl, Energie, HausZustand, ServerNachricht, Ursache } from '../src/domain/protokoll';
import { hausverbrauch } from '../src/domain/verbrauch';
import type { Logger } from './log';

export const ENERGIE_TAKT_MS = 60_000;

export interface Persistenz {
  speichereGeraet(id: GeraetId, zustand: HausZustand[GeraetId]): void;
  speichereEnergie(energie: Energie, stand: number): Promise<void>;
}

export interface Gespeichert {
  geraete: Partial<HausZustand>;
  energie: Energie | null;
}

export interface ZustandsdienstOptionen {
  gespeichert: Gespeichert;
  persistenz: Persistenz;
  verteile: (nachricht: ServerNachricht) => void;
  jetzt: () => number;
  log: Logger;
}

export class Zustandsdienst {
  private zustand: HausZustand;
  private energie: Energie;
  private energieStand: number;
  private readonly autoAusTimer = new Map<GeraetId, NodeJS.Timeout>();
  private energieTimer: NodeJS.Timeout | null = null;
  private gestoppt = false;

  constructor(private readonly opts: ZustandsdienstOptionen) {
    const jetzt = opts.jetzt();
    this.zustand = { ...ausgangszustand(jetzt), ...opts.gespeichert.geraete };
    const heute = berlinDatum(jetzt);
    this.energie =
      opts.gespeichert.energie && opts.gespeichert.energie.datum === heute
        ? opts.gespeichert.energie
        : { datum: heute, wh: 0 };
    // Zeit ohne laufenden Server zählt nicht (FR-10).
    this.energieStand = jetzt;
  }

  /** Normalisiert den gespeicherten Stand, startet Auto-Aus- und Energie-Timer. */
  starte(): void {
    this.speichereAlles();
    for (const g of GERAETE) {
      if (g.autoAusS !== null && this.zustand[g.id].an) this.planeAutoAus(g.id);
    }
    this.planeEnergieTakt();
  }

  aktuellerZustand(): HausZustand {
    return this.zustand;
  }

  aktuelleEnergie(): Energie {
    return this.energie;
  }

  snapshot(version: string, strompreis: number): ServerNachricht {
    return {
      typ: 'snapshot',
      version,
      zustand: this.zustand,
      energie: this.energie,
      strompreis,
      serverZeit: this.opts.jetzt(),
    };
  }

  /** Einziger Änderungspfad für Nutzerbefehle (FR-16, FR-19). Liefert, ob sich etwas geändert hat. */
  fuehreAus(befehl: Befehl): boolean {
    const ref = befehl.typ === 'schalten' ? befehl.geraet : befehl.typ === 'szene' ? befehl.szene : befehl.raum;
    const art = befehl.typ === 'schalten' ? 'geraet' : befehl.typ;
    return this.aendere(befehlsZiele(befehl), { art, ref, befehlId: befehl.id });
  }

  private aendere(ziele: Partial<Record<GeraetId, boolean>>, ursache: Ursache): boolean {
    const jetzt = this.opts.jetzt();
    const { zustand, geaendert } = wendeZieleAn(this.zustand, ziele, jetzt);
    if (geaendert.length === 0) return false;

    this.integriereBis(jetzt);
    this.zustand = zustand;

    const geraete: Partial<HausZustand> = {};
    for (const id of geaendert) {
      geraete[id] = zustand[id];
      if (geraetById(id).autoAusS !== null) {
        if (zustand[id].an) this.planeAutoAus(id);
        else this.loescheAutoAus(id);
      }
    }
    this.opts.verteile({ typ: 'aenderung', ursache, geraete, energie: this.energie });
    for (const id of geaendert) this.opts.persistenz.speichereGeraet(id, zustand[id]);
    void this.opts.persistenz.speichereEnergie(this.energie, this.energieStand);
    return true;
  }

  private integriereBis(jetzt: number): void {
    this.energie = integriere(this.energie, hausverbrauch(this.zustand), this.energieStand, jetzt);
    this.energieStand = Math.max(this.energieStand, jetzt);
  }

  private planeAutoAus(id: GeraetId): void {
    this.loescheAutoAus(id);
    const dauerMs = (geraetById(id).autoAusS ?? 0) * 1000;
    const rest = Math.max(0, this.zustand[id].seit + dauerMs - this.opts.jetzt());
    const timer = setTimeout(() => {
      this.autoAusTimer.delete(id);
      if (this.gestoppt || !this.zustand[id].an) return;
      this.opts.log.info('auto_aus', { geraet: id });
      this.aendere({ [id]: false }, { art: 'autoAus', ref: id, befehlId: null });
    }, rest);
    this.autoAusTimer.set(id, timer);
  }

  private loescheAutoAus(id: GeraetId): void {
    const timer = this.autoAusTimer.get(id);
    if (timer) clearTimeout(timer);
    this.autoAusTimer.delete(id);
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
      this.opts.verteile({ typ: 'energie', energie: this.energie, serverZeit: zeit });
      this.planeEnergieTakt();
    }, warte);
  }

  /** Schreibt den kompletten Stand (Start, nach Broker-Wiederverbindung). */
  speichereAlles(): void {
    for (const id of GERAETE_IDS) this.opts.persistenz.speichereGeraet(id, this.zustand[id]);
    void this.opts.persistenz.speichereEnergie(this.energie, this.energieStand);
  }

  /** Beendet alle Timer und liefert den bis jetzt integrierten Energiestand zum Sichern (SIGTERM). */
  stoppe(): Promise<void> {
    this.gestoppt = true;
    for (const id of [...this.autoAusTimer.keys()]) this.loescheAutoAus(id);
    if (this.energieTimer) clearTimeout(this.energieTimer);
    this.energieTimer = null;
    this.integriereBis(this.opts.jetzt());
    return this.opts.persistenz.speichereEnergie(this.energie, this.energieStand);
  }
}
