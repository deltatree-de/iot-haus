// HTTP-Server, Health, WebSocket-Upgrade und Verdrahtung (Architektur §3.9, §3.10).
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import type { Duplex } from 'node:stream';
import type { Logger } from './log';
import { MqttSpeicher } from './mqtt-speicher';
import { hostErlaubt, ursprungErlaubt } from './ursprung';
import { MAX_VERBINDUNGEN, WsVerbindungen } from './ws-verbindungen';
import { Zustandsdienst } from './zustandsdienst';

export const WS_PFAD = '/mqtt';

export interface ServerOptionen {
  port: number;
  hostname?: string;
  mqttUrl: string;
  strompreis: number;
  version: string;
  log: Logger;
  /** Optionale Host-Allowlist gegen DNS-Rebinding (ERLAUBTE_HOSTS); leer = jeder Host */
  erlaubteHosts?: string[];
  /** Next-Request-Handler; fehlt er (Tests), antwortet der Server mit 404. */
  requestHandler?: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
  /** Nur im Dev-Modus: andere Upgrades (HMR) an Next weiterreichen. */
  upgradeHandler?: (req: IncomingMessage, socket: Duplex, head: Buffer) => void;
  restoreFensterMs?: number;
  jetzt?: () => number;
}

export interface LaufenderServer {
  port: number;
  istBereit(): boolean;
  schliessen(): Promise<void>;
}

function pfad(req: IncomingMessage): string {
  return (req.url ?? '/').split('?')[0];
}

function lehneAb(socket: Duplex, status: number, text: string): void {
  socket.end(`HTTP/1.1 ${status} ${text}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
}

export async function erstelleServer(opts: ServerOptionen): Promise<LaufenderServer> {
  const { log, version, strompreis } = opts;
  const jetzt = opts.jetzt ?? Date.now;
  const speicher = new MqttSpeicher(opts.mqttUrl, log);
  let dienst: Zustandsdienst | null = null;
  let bereit = false;
  let laedt = false;
  let geschlossen = false;

  const verbindungen = new WsVerbindungen(
    () => (bereit ? dienst : null),
    () => (bereit && dienst ? dienst.snapshot(version, strompreis) : null),
    log,
  );

  speicher.on('verbunden', async () => {
    if (dienst) {
      // Server lief weiter: Speicherstand ist aktueller als der Broker.
      dienst.speichereAlles();
      bereit = true;
      log.info('bereit', { quelle: 'speicher' });
      return;
    }
    if (laedt) return;
    laedt = true;
    try {
      const gespeichert = await speicher.lade(opts.restoreFensterMs ?? 500);
      if (geschlossen) return;
      dienst = new Zustandsdienst({
        gespeichert,
        persistenz: speicher,
        verteile: (nachricht) => verbindungen.verteile(nachricht),
        jetzt,
        log,
      });
      dienst.starte();
      bereit = speicher.istVerbunden();
      log.info('bereit', { quelle: 'broker', geraete: Object.keys(gespeichert.geraete).length });
    } catch (fehler) {
      log.fehler('restore_fehlgeschlagen', { grund: fehler instanceof Error ? fehler.message : 'unbekannt' });
    } finally {
      laedt = false;
    }
  });

  speicher.on('getrennt', () => {
    bereit = false;
    verbindungen.schliesseAlle(1013, 'Broker nicht erreichbar');
  });

  const server = http.createServer((req, res) => {
    if (pfad(req) === '/api/health' && (req.method === 'GET' || req.method === 'HEAD')) {
      const ok = bereit && speicher.istVerbunden();
      const body = JSON.stringify({
        status: ok ? 'ok' : 'fehler',
        mqtt: speicher.istVerbunden() ? 'verbunden' : 'getrennt',
        version,
      });
      res.writeHead(ok ? 200 : 503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : body);
      return;
    }
    if (!opts.requestHandler) {
      res.writeHead(404).end();
      return;
    }
    Promise.resolve(opts.requestHandler(req, res)).catch((fehler: unknown) => {
      log.fehler('http_fehler', { grund: fehler instanceof Error ? fehler.message : 'unbekannt' });
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
  });

  server.on('upgrade', (req, socket, head) => {
    if (pfad(req) !== WS_PFAD) {
      if (opts.upgradeHandler) opts.upgradeHandler(req, socket, head);
      else socket.destroy();
      return;
    }
    if (!hostErlaubt(req.headers, opts.erlaubteHosts ?? [])) {
      log.warn('ws_abgelehnt', { grund: 'host' });
      lehneAb(socket, 403, 'Forbidden');
      return;
    }
    if (!ursprungErlaubt(req.headers)) {
      log.warn('ws_abgelehnt', { grund: 'origin' });
      lehneAb(socket, 403, 'Forbidden');
      return;
    }
    if (!bereit || verbindungen.anzahl() >= MAX_VERBINDUNGEN) {
      log.warn('ws_abgelehnt', { grund: bereit ? 'zu_viele_verbindungen' : 'nicht_bereit' });
      lehneAb(socket, 503, 'Service Unavailable');
      return;
    }
    verbindungen.uebernimm(req, socket, head);
  });

  await new Promise<void>((fertig, fehler) => {
    server.once('error', fehler);
    server.listen(opts.port, opts.hostname ?? '0.0.0.0', () => {
      server.off('error', fehler);
      fertig();
    });
  });
  const adresse = server.address();
  const port = typeof adresse === 'object' && adresse ? adresse.port : opts.port;
  log.info('start', { port, version });

  return {
    port,
    istBereit: () => bereit,
    async schliessen() {
      geschlossen = true;
      bereit = false;
      if (dienst) {
        await Promise.race([dienst.stoppe(), new Promise((fertig) => setTimeout(fertig, 2000))]);
      }
      verbindungen.schliesseAlle(1012, 'Server startet neu');
      verbindungen.beende();
      server.closeAllConnections();
      await new Promise<void>((fertig) => server.close(() => fertig()));
      await speicher.beende();
      log.info('stopp');
    },
  };
}
