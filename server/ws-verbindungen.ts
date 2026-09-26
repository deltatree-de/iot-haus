// WebSocket-Schicht: Befehle prüfen, an den Zustandsdienst geben, Nachrichten verteilen (Architektur §3.5, §3.6).
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocket, WebSocketServer, type RawData } from 'ws';
import { pruefeBefehl } from '../src/domain/befehle';
import { MAX_NACHRICHT_BYTES, type FehlerCode, type ServerNachricht } from '../src/domain/protokoll';
import type { Logger } from './log';
import type { Zustandsdienst } from './zustandsdienst';

const HERZSCHLAG_MS = 30_000;
/** Token-Bucket je Verbindung: 100 Befehle am Stück, danach 20 pro Sekunde (Review CR-01). */
export const BEFEHLE_VORRAT = 100;
export const BEFEHLE_PRO_SEKUNDE = 20;
/** Liest ein Client nicht mehr mit, wird er getrennt, bevor der Server-Speicher wächst. */
export const MAX_PUFFER_BYTES = 1_000_000;
export const MAX_VERBINDUNGEN = 100;

const MELDUNGEN: Record<FehlerCode, string> = {
  UNGUELTIGES_JSON: 'Nachricht ist kein gültiges JSON.',
  ZU_GROSS: `Nachricht ist größer als ${MAX_NACHRICHT_BYTES} Byte.`,
  UNGUELTIGER_BEFEHL: 'Befehl ist ungültig.',
  UNBEKANNTES_GERAET: 'Unbekanntes Gerät.',
  UNBEKANNTE_SZENE: 'Unbekannte Szene.',
  UNBEKANNTER_RAUM: 'Unbekannter Raum.',
  ALTES_PROTOKOLL: 'Veraltetes Protokoll. Bitte die Seite neu laden.',
  ZU_VIELE_BEFEHLE: 'Zu viele Befehle. Bitte kurz warten.',
};

type Lebendig = WebSocket & { lebendig?: boolean; vorrat?: number; stand?: number };

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
    ws.stand = Date.now();
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

  /** Token-Bucket: true, wenn der Befehl verarbeitet werden darf. */
  private darf(ws: Lebendig): boolean {
    const jetzt = Date.now();
    const vorrat = Math.min(BEFEHLE_VORRAT, (ws.vorrat ?? BEFEHLE_VORRAT) + ((jetzt - (ws.stand ?? jetzt)) / 1000) * BEFEHLE_PRO_SEKUNDE);
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
    if (!this.darf(ws)) return this.fehler(ws, 'ZU_VIELE_BEFEHLE', ergebnis.befehl.id);

    const dienst = this.dienst();
    if (!dienst) {
      ws.close(1013, 'nicht bereit');
      return;
    }
    const geaendert = dienst.fuehreAus(ergebnis.befehl);
    this.log.info('befehl', { typ: ergebnis.befehl.typ, ergebnis: geaendert ? 'ok' : 'keine_aenderung' });
    this.sende(ws, { typ: 'bestaetigt', befehlId: ergebnis.befehl.id, geaendert });
  }

  private fehler(ws: WebSocket, code: FehlerCode, befehlId: string | null): void {
    this.log.warn('befehl', { ergebnis: code });
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
