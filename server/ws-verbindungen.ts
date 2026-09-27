// WebSocket-Schicht: Befehle prüfen, an den Zustandsdienst geben, Nachrichten verteilen (Architektur §3.5, §3.6).
import type { IncomingMessage } from 'node:http';
import { performance } from 'node:perf_hooks';
import type { Duplex } from 'node:stream';
import { WebSocket, WebSocketServer, type RawData } from 'ws';
import { pruefeBefehl } from '../src/domain/befehle';
import { BEFEHL_ID_MUSTER, MAX_NACHRICHT_BYTES, type FehlerCode, type ServerNachricht } from '../src/domain/protokoll';
import type { Logger } from './log';
import type { Zustandsdienst } from './zustandsdienst';

const HERZSCHLAG_MS = 30_000;
/** Token-Bucket je Verbindung: 100 Befehle am Stück, danach 20 pro Sekunde (Review CR-01). */
export const BEFEHLE_VORRAT = 100;
export const BEFEHLE_PRO_SEKUNDE = 20;
/** Liest ein Client nicht mehr mit, wird er getrennt, bevor der Server-Speicher wächst. */
export const MAX_PUFFER_BYTES = 1_000_000;
export const MAX_VERBINDUNGEN = 100;
/** Bleibt ein Client so viele Nachrichten in Folge über dem Limit, wird er getrennt (Review RR-01). */
export const MAX_ABLEHNUNGEN_IN_FOLGE = 2 * BEFEHLE_VORRAT;
/** Abgelehnte Nachrichten loggen wir je Verbindung höchstens alle 10 s (Review RR-01). */
const LOG_PAUSE_MS = 10_000;

const MELDUNGEN: Record<FehlerCode, string> = {
  UNGUELTIGES_JSON: 'Nachricht ist kein gültiges JSON.',
  ZU_GROSS: `Nachricht ist größer als ${MAX_NACHRICHT_BYTES} Byte.`,
  UNGUELTIGER_BEFEHL: 'Befehl ist ungültig.',
  UNBEKANNTES_GERAET: 'Unbekanntes Gerät.',
  UNBEKANNTE_SZENE: 'Unbekannte Szene.',
  UNBEKANNTER_RAUM: 'Unbekannter Raum.',
  ALTES_PROTOKOLL: 'Veraltetes Protokoll. Bitte die Seite neu laden.',
  ZU_VIELE_BEFEHLE: 'Zu viele Befehle. Bitte kurz warten.',
  NICHT_MOEGLICH: 'Aktion ist im aktuellen Zustand nicht möglich.',
};

/** Befehlskennung einer (kleinen) Nachricht, damit auch abgelehnte Befehle zugeordnet werden können. */
function befehlIdAus(puffer: Buffer): string | null {
  if (puffer.byteLength > MAX_NACHRICHT_BYTES) return null;
  try {
    const json: unknown = JSON.parse(puffer.toString('utf8'));
    const id = typeof json === 'object' && json !== null ? (json as { id?: unknown }).id : undefined;
    return typeof id === 'string' && BEFEHL_ID_MUSTER.test(id) ? id : null;
  } catch {
    return null;
  }
}

type Lebendig = WebSocket & {
  lebendig?: boolean;
  vorrat?: number;
  stand?: number;
  ablehnungen?: number;
  logBis?: number;
  unterdrueckt?: number;
};

export class WsVerbindungen {
  private readonly wss = new WebSocketServer({ noServer: true, maxPayload: 65_536 });
  private readonly herzschlag: NodeJS.Timeout;

  constructor(
    private readonly dienst: () => Zustandsdienst | null,
    private readonly snapshot: () => ServerNachricht | null,
    private readonly log: Logger,
  ) {
    this.wss.on('connection', (ws: Lebendig) => this.verbunden(ws));
    this.herzschlag = setInterval(() => {
      for (const client of this.wss.clients as Set<Lebendig>) {
        if (client.lebendig === false) {
          client.terminate();
          continue;
        }
        client.lebendig = false;
        client.ping();
      }
    }, HERZSCHLAG_MS);
    this.herzschlag.unref();
  }

  anzahl(): number {
    return this.wss.clients.size;
  }

  uebernimm(req: IncomingMessage, socket: Duplex, head: Buffer): void {
    this.wss.handleUpgrade(req, socket, head, (ws) => this.wss.emit('connection', ws, req));
  }

  verteile(nachricht: ServerNachricht): void {
    const text = JSON.stringify(nachricht);
    for (const client of this.wss.clients) this.sendeText(client, text);
  }

  /** Schließt alle Verbindungen, z. B. bei Broker-Ausfall (1013) oder Herunterfahren (1012). */
  schliesseAlle(code: number, grund: string): void {
    for (const client of this.wss.clients) client.close(code, grund);
  }

  beende(): void {
    clearInterval(this.herzschlag);
    for (const client of this.wss.clients) client.terminate();
    this.wss.close();
  }

  private verbunden(ws: Lebendig): void {
    ws.lebendig = true;
    ws.vorrat = BEFEHLE_VORRAT;
    ws.stand = performance.now();
    ws.ablehnungen = 0;
    ws.on('pong', () => {
      ws.lebendig = true;
    });
    ws.on('error', () => ws.terminate());
    ws.on('message', (daten, istBinaer) => {
      try {
        this.nachricht(ws, daten, istBinaer);
      } catch (fehler) {
        this.log.fehler('befehl_ausnahme', { grund: fehler instanceof Error ? fehler.message : 'unbekannt' });
        this.sende(ws, { typ: 'fehler', befehlId: null, code: 'UNGUELTIGER_BEFEHL', meldung: MELDUNGEN.UNGUELTIGER_BEFEHL });
      }
    });
    const snapshot = this.snapshot();
    if (snapshot) this.sende(ws, snapshot);
    else ws.close(1013, 'nicht bereit');
  }

  /**
   * Token-Bucket über alle eingehenden Nachrichten (auch ungültige). Monotone Uhr, damit ein
   * Zurückstellen der Systemzeit nicht sperrt (Review RR-02).
   */
  private darf(ws: Lebendig): boolean {
    const jetzt = performance.now();
    const vergangen = Math.max(0, jetzt - (ws.stand ?? jetzt));
    const vorrat = Math.min(BEFEHLE_VORRAT, (ws.vorrat ?? BEFEHLE_VORRAT) + (vergangen / 1000) * BEFEHLE_PRO_SEKUNDE);
    ws.stand = jetzt;
    if (vorrat < 1) {
      ws.vorrat = vorrat;
      return false;
    }
    ws.vorrat = vorrat - 1;
    return true;
  }

  private nachricht(ws: Lebendig, daten: RawData, istBinaer: boolean): void {
    const puffer = Array.isArray(daten) ? Buffer.concat(daten) : Buffer.from(daten as ArrayBuffer);
    if (!this.darf(ws)) {
      ws.ablehnungen = (ws.ablehnungen ?? 0) + 1;
      if (ws.ablehnungen > MAX_ABLEHNUNGEN_IN_FOLGE) {
        this.log.warn('ws_getrennt', { grund: 'zu_viele_nachrichten' });
        ws.close(1008, 'zu viele Nachrichten');
        return;
      }
      return this.fehler(ws, 'ZU_VIELE_BEFEHLE', befehlIdAus(puffer));
    }
    ws.ablehnungen = 0;
    if (puffer.byteLength > MAX_NACHRICHT_BYTES) return this.fehler(ws, 'ZU_GROSS', null);
    if (istBinaer) return this.fehler(ws, 'UNGUELTIGES_JSON', null);

    let json: unknown;
    try {
      json = JSON.parse(puffer.toString('utf8'));
    } catch {
      return this.fehler(ws, 'UNGUELTIGES_JSON', null);
    }

    const ergebnis = pruefeBefehl(json);
    if (!ergebnis.ok) return this.fehler(ws, ergebnis.code, ergebnis.befehlId);

    const dienst = this.dienst();
    if (!dienst) {
      ws.close(1013, 'nicht bereit');
      return;
    }
    const ausfuehrung = dienst.fuehreAus(ergebnis.befehl);
    if (!ausfuehrung.ok) return this.fehler(ws, ausfuehrung.code, ergebnis.befehl.id, ergebnis.befehl.typ);
    this.log.info('befehl', { typ: ergebnis.befehl.typ, ergebnis: ausfuehrung.geaendert ? 'ok' : 'keine_aenderung' });
    this.sende(ws, { typ: 'bestaetigt', befehlId: ergebnis.befehl.id, geaendert: ausfuehrung.geaendert });
  }

  private fehler(ws: Lebendig, code: FehlerCode, befehlId: string | null, typ?: string): void {
    const jetzt = performance.now();
    if (jetzt >= (ws.logBis ?? 0)) {
      this.log.warn('befehl', { typ, ergebnis: code, unterdrueckt: ws.unterdrueckt || undefined });
      ws.logBis = jetzt + LOG_PAUSE_MS;
      ws.unterdrueckt = 0;
    } else {
      ws.unterdrueckt = (ws.unterdrueckt ?? 0) + 1;
    }
    this.sende(ws, { typ: 'fehler', befehlId, code, meldung: MELDUNGEN[code] });
  }

  private sende(ws: WebSocket, nachricht: ServerNachricht): void {
    this.sendeText(ws, JSON.stringify(nachricht));
  }

  private sendeText(ws: WebSocket, text: string): void {
    if (ws.readyState !== WebSocket.OPEN) return;
    if (ws.bufferedAmount > MAX_PUFFER_BYTES) {
      this.log.warn('ws_getrennt', { grund: 'liest_nicht' });
      ws.terminate();
      return;
    }
    ws.send(text);
  }
}
