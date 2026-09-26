// WebSocket-Schicht: Befehle prüfen, an den Zustandsdienst geben, Nachrichten verteilen (Architektur §3.5, §3.6).
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocket, WebSocketServer, type RawData } from 'ws';
import { pruefeBefehl } from '../src/domain/befehle';
import { MAX_NACHRICHT_BYTES, type FehlerCode, type ServerNachricht } from '../src/domain/protokoll';
import type { Logger } from './log';
import type { Zustandsdienst } from './zustandsdienst';

const HERZSCHLAG_MS = 30_000;

const MELDUNGEN: Record<FehlerCode, string> = {
  UNGUELTIGES_JSON: 'Nachricht ist kein gültiges JSON.',
  ZU_GROSS: `Nachricht ist größer als ${MAX_NACHRICHT_BYTES} Byte.`,
  UNGUELTIGER_BEFEHL: 'Befehl ist ungültig.',
  UNBEKANNTES_GERAET: 'Unbekanntes Gerät.',
  UNBEKANNTE_SZENE: 'Unbekannte Szene.',
  UNBEKANNTER_RAUM: 'Unbekannter Raum.',
  ALTES_PROTOKOLL: 'Veraltetes Protokoll. Bitte die Seite neu laden.',
};

type Lebendig = WebSocket & { lebendig?: boolean };

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
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(text);
    }
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

  private nachricht(ws: WebSocket, daten: RawData, istBinaer: boolean): void {
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
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(nachricht));
  }
}
