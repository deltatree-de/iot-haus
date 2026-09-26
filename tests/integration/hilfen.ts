// Hilfen für Integrationstests: aedes-Broker im Testprozess, echter Server, ws-Clients.
import net from 'node:net';
import { Aedes } from 'aedes';
import { WebSocket } from 'ws';
import { erstelleServer, type LaufenderServer } from '../../server/app';
import { stillerLog } from '../../server/log';
import type { Befehl, ServerNachricht } from '../../src/domain/protokoll';

export interface Broker {
  url: string;
  port: number;
  stoppe(): Promise<void>;
}

export async function starteBroker(port = 0, aedes?: Aedes): Promise<Broker & { aedes: Aedes }> {
  const instanz = aedes ?? (await Aedes.createBroker());
  const server = net.createServer(instanz.handle);
  const sockets = new Set<net.Socket>();
  server.on('connection', (s) => {
    sockets.add(s);
    s.on('close', () => sockets.delete(s));
  });
  await new Promise<void>((fertig) => server.listen(port, '127.0.0.1', fertig));
  const echterPort = (server.address() as net.AddressInfo).port;
  return {
    aedes: instanz,
    port: echterPort,
    url: `mqtt://127.0.0.1:${echterPort}`,
    async stoppe() {
      for (const s of sockets) s.destroy();
      await new Promise<void>((fertig) => server.close(() => fertig()));
    },
  };
}

export async function starteServer(mqttUrl: string, extra: { jetzt?: () => number } = {}): Promise<LaufenderServer> {
  const server = await erstelleServer({
    port: 0,
    hostname: '127.0.0.1',
    mqttUrl,
    strompreis: 0.35,
    version: '2.0.0',
    log: stillerLog,
    restoreFensterMs: 50,
    ...extra,
  });
  await warteBis(() => server.istBereit(), 5000);
  return server;
}

export async function warteBis(bedingung: () => boolean, timeoutMs = 3000): Promise<void> {
  const ende = Date.now() + timeoutMs;
  while (!bedingung()) {
    if (Date.now() > ende) throw new Error('Zeitüberschreitung beim Warten');
    await new Promise((f) => setTimeout(f, 5));
  }
}

export class TestClient {
  readonly nachrichten: ServerNachricht[] = [];
  readonly ws: WebSocket;
  geschlossen: { code: number } | null = null;

  constructor(port: number, headers: Record<string, string> = {}) {
    this.ws = new WebSocket(`ws://127.0.0.1:${port}/mqtt`, { headers });
    this.ws.on('message', (daten) => this.nachrichten.push(JSON.parse(daten.toString())));
    this.ws.on('close', (code) => {
      this.geschlossen = { code };
    });
    this.ws.on('error', () => {});
  }

  static async verbinde(port: number): Promise<TestClient> {
    const c = new TestClient(port);
    await c.warte((n) => n.typ === 'snapshot');
    return c;
  }

  sende(befehl: Befehl | Record<string, unknown> | string): void {
    this.ws.send(typeof befehl === 'string' ? befehl : JSON.stringify(befehl));
  }

  async warte<T extends ServerNachricht>(pruefe: (n: ServerNachricht) => boolean, timeoutMs = 2000): Promise<T> {
    let gefunden: ServerNachricht | undefined;
    await warteBis(() => (gefunden = this.nachrichten.find(pruefe)) !== undefined, timeoutMs);
    return gefunden as T;
  }

  /** Aktueller Zustand aus Snapshot + allen Änderungen. */
  zustand(): Record<string, boolean> {
    const z: Record<string, boolean> = {};
    for (const n of this.nachrichten) {
      if (n.typ === 'snapshot') for (const [id, g] of Object.entries(n.zustand)) z[id] = g.an;
      if (n.typ === 'aenderung') for (const [id, g] of Object.entries(n.geraete)) if (g) z[id] = g.an;
    }
    return z;
  }

  schliesse(): void {
    this.ws.terminate();
  }
}
