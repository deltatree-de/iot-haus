import http from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { LaufenderServer } from '../../server/app';
import { GERAETE_IDS } from '../../src/domain/katalog';
import { MAX_NACHRICHT_BYTES, type ServerNachricht } from '../../src/domain/protokoll';
import { SZENEN } from '../../src/domain/szenen';
import { RAEUME } from '../../src/domain/katalog';
import { starteBroker, starteServer, TestClient, warteBis, type Broker } from './hilfen';

let broker: Broker;
let server: LaufenderServer;
const clients: TestClient[] = [];

async function client(): Promise<TestClient> {
  const c = await TestClient.verbinde(server.port);
  clients.push(c);
  return c;
}

function hole(pfad: string, headers: Record<string, string> = {}): Promise<{ status: number; body: string }> {
  return new Promise((fertig, fehler) => {
    http
      .get({ host: '127.0.0.1', port: server.port, path: pfad, headers }, (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => fertig({ status: res.statusCode ?? 0, body }));
      })
      .on('error', fehler);
  });
}

beforeAll(async () => {
  broker = await starteBroker();
  server = await starteServer(broker.url);
});

afterAll(async () => {
  for (const c of clients) c.schliesse();
  await server.schliessen();
  await broker.stoppe();
});

describe('Snapshot und Autorität (FR-14, FR-15)', () => {
  it('liefert sofort einen vollständigen Snapshot', async () => {
    const start = Date.now();
    const c = await client();
    expect(Date.now() - start).toBeLessThan(1000);
    const s = c.nachrichten[0];
    expect(s.typ).toBe('snapshot');
    if (s.typ !== 'snapshot') return;
    expect(Object.keys(s.zustand).sort()).toEqual([...GERAETE_IDS].sort());
    expect(s.version).toBe('2.0.0');
    expect(s.strompreis).toBe(0.35);
    expect(s.energie.datum).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof s.serverZeit).toBe('number');
  });

  it('ein neu verbundener Client ändert nichts', async () => {
    const a = await client();
    await client();
    await new Promise((f) => setTimeout(f, 100));
    expect(a.nachrichten.filter((n) => n.typ === 'aenderung')).toHaveLength(0);
  });
});

describe('Verteilung (FR-16, FR-19, FR-22)', () => {
  it('Befehl von A erreicht A, B und C; Bestätigung nur an A', async () => {
    const [a, b, c] = [await client(), await client(), await client()];
    a.sende({ typ: 'schalten', id: 'v1', geraet: 'kueche.mikrowelle', an: true });
    const best = await a.warte<Extract<ServerNachricht, { typ: 'bestaetigt' }>>((n) => n.typ === 'bestaetigt' && n.befehlId === 'v1');
    expect(best.geaendert).toBe(true);
    for (const x of [a, b, c]) {
      const n = await x.warte<Extract<ServerNachricht, { typ: 'aenderung' }>>((m) => m.typ === 'aenderung' && m.ursache.befehlId === 'v1');
      expect(n.geraete['kueche.mikrowelle']?.an).toBe(true);
    }
    // Reihenfolge: Änderung vor Bestätigung beim Absender
    const iAenderung = a.nachrichten.findIndex((n) => n.typ === 'aenderung' && n.ursache.befehlId === 'v1');
    const iBest = a.nachrichten.findIndex((n) => n.typ === 'bestaetigt' && n.befehlId === 'v1');
    expect(iAenderung).toBeLessThan(iBest);
    expect(b.nachrichten.some((n) => n.typ === 'bestaetigt')).toBe(false);
    a.sende({ typ: 'schalten', id: 'v2', geraet: 'kueche.mikrowelle', an: false });
    await a.warte((n) => n.typ === 'bestaetigt' && n.befehlId === 'v2');
  });

  it('Befehl ohne Änderung wird bestätigt, aber nicht verteilt', async () => {
    const [a, b] = [await client(), await client()];
    a.sende({ typ: 'szene', id: 'k1', szene: 'alles-aus' });
    await a.warte((n) => n.typ === 'bestaetigt' && n.befehlId === 'k1');
    a.sende({ typ: 'szene', id: 'k2', szene: 'alles-aus' });
    const best = await a.warte<Extract<ServerNachricht, { typ: 'bestaetigt' }>>((n) => n.typ === 'bestaetigt' && n.befehlId === 'k2');
    expect(best.geaendert).toBe(false);
    await new Promise((f) => setTimeout(f, 50));
    expect(b.nachrichten.some((n) => n.typ === 'aenderung' && n.ursache.befehlId === 'k2')).toBe(false);
  });

  it('p95 der Verteilzeit über 100 Befehle ≤ 250 ms', async () => {
    const [a, b, c] = [await client(), await client(), await client()];
    const dauer: number[] = [];
    for (let i = 0; i < 100; i++) {
      const id = `p${i}`;
      const start = performance.now();
      a.sende({ typ: 'schalten', id, geraet: 'wohnzimmer.stehlampe', an: i % 2 === 0 });
      await Promise.all(
        [b, c].map((x) => x.warte((n) => n.typ === 'aenderung' && n.ursache.befehlId === id)),
      );
      dauer.push(performance.now() - start);
    }
    dauer.sort((x, y) => x - y);
    expect(dauer[94]).toBeLessThanOrEqual(250);
  });

  it('200 zufällige Befehle von 3 Clients → 100 % konsistent (SM-1)', async () => {
    const cs = [await client(), await client(), await client()];
    const beobachter = await client();
    let zufall = 42;
    const naechste = () => (zufall = (zufall * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
    for (let i = 0; i < 200; i++) {
      const c = cs[i % 3];
      const r = naechste();
      if (r < 0.7) {
        c.sende({ typ: 'schalten', id: `z${i}`, geraet: GERAETE_IDS[Math.floor(naechste() * GERAETE_IDS.length)], an: naechste() < 0.5 });
      } else if (r < 0.85) {
        c.sende({ typ: 'szene', id: `z${i}`, szene: SZENEN[Math.floor(naechste() * SZENEN.length)].id });
      } else {
        c.sende({ typ: 'raumAus', id: `z${i}`, raum: RAEUME[Math.floor(naechste() * RAEUME.length)].id });
      }
    }
    const gesendet = [0, 1, 2].map((k) => Array.from({ length: 200 }, (_, i) => i).filter((i) => i % 3 === k).length);
    await warteBis(() => cs.every((c, k) => c.nachrichten.filter((n) => n.typ === 'bestaetigt').length === gesendet[k]), 5000);
    await new Promise((f) => setTimeout(f, 100));
    const frisch = await client();
    const soll = frisch.zustand();
    for (const c of [...cs, beobachter]) expect(c.zustand()).toEqual(soll);
  });
});

describe('Befehlsprüfung (FR-18)', () => {
  it.each([
    ['ungültiges JSON', '{kaputt', 'UNGUELTIGES_JSON'],
    ['zu groß', JSON.stringify({ typ: 'szene', id: 'x', szene: 'a'.repeat(MAX_NACHRICHT_BYTES) }), 'ZU_GROSS'],
    ['altes Protokoll', JSON.stringify({ type: 'publish', topic: 'smarthome/x/light', payload: '{}' }), 'ALTES_PROTOKOLL'],
    ['fremdes Abo', JSON.stringify({ type: 'subscribe', topic: '#' }), 'ALTES_PROTOKOLL'],
    ['unbekanntes Gerät', JSON.stringify({ typ: 'schalten', id: 'u1', geraet: 'keller.sauna', an: true }), 'UNBEKANNTES_GERAET'],
    ['Zusatzfeld', JSON.stringify({ typ: 'schalten', id: 'u2', geraet: 'bad.foehn', an: true, topic: 'x' }), 'UNGUELTIGER_BEFEHL'],
  ])('%s → %s, Zustand unverändert', async (_name, roh, code) => {
    const c = await client();
    const vorher = c.zustand();
    c.sende(roh);
    const f = await c.warte<Extract<ServerNachricht, { typ: 'fehler' }>>((n) => n.typ === 'fehler');
    expect(f.code).toBe(code);
    expect(f.meldung.length).toBeGreaterThan(0);
    await new Promise((r) => setTimeout(r, 30));
    expect(c.nachrichten.some((n) => n.typ === 'aenderung')).toBe(false);
    expect(c.zustand()).toEqual(vorher);
    expect(c.ws.readyState).toBe(c.ws.OPEN);
  });

  it('Ratenlimit: über 100 Befehle am Stück → ZU_VIELE_BEFEHLE, Server bleibt stabil (Review CR-01)', async () => {
    const c = await client();
    for (let i = 0; i < 130; i++) c.sende({ typ: 'schalten', id: `r${i}`, geraet: 'bad.foehn', an: i % 2 === 0 });
    await warteBis(() => c.nachrichten.filter((n) => n.typ === 'bestaetigt' || n.typ === 'fehler').length >= 130, 5000);
    const fehler = c.nachrichten.filter((n) => n.typ === 'fehler');
    expect(fehler.length).toBeGreaterThanOrEqual(25);
    expect(fehler.every((n) => n.typ === 'fehler' && n.code === 'ZU_VIELE_BEFEHLE' && n.befehlId?.startsWith('r'))).toBe(true);
    // nach kurzer Pause geht es weiter
    await new Promise((r) => setTimeout(r, 200));
    c.sende({ typ: 'schalten', id: 'danach', geraet: 'bad.foehn', an: false });
    await c.warte((n) => n.typ === 'bestaetigt' && n.befehlId === 'danach');
  });

  it('Fehler nennt die Befehlskennung', async () => {
    const c = await client();
    c.sende({ typ: 'szene', id: 'f1', szene: 'party' });
    const f = await c.warte<Extract<ServerNachricht, { typ: 'fehler' }>>((n) => n.typ === 'fehler');
    expect(f).toMatchObject({ befehlId: 'f1', code: 'UNBEKANNTE_SZENE' });
  });
});

describe('HTTP und Upgrade', () => {
  it('Health 200 mit Version', async () => {
    const r = await hole('/api/health');
    expect(r.status).toBe(200);
    expect(JSON.parse(r.body)).toEqual({ status: 'ok', mqtt: 'verbunden', version: '2.0.0' });
  });

  it('fremder Origin → 403, gleicher Origin → verbunden', async () => {
    const boese = new TestClient(server.port, { Origin: 'http://boese.example' });
    const status = await new Promise<number>((fertig) => boese.ws.on('unexpected-response', (_req, res) => fertig(res.statusCode ?? 0)));
    expect(status).toBe(403);
    const gut = new TestClient(server.port, { Origin: `http://127.0.0.1:${server.port}` });
    clients.push(gut);
    await gut.warte((n) => n.typ === 'snapshot');
  });

  it('andere Pfade werden nicht upgegradet, ohne Next 404', async () => {
    expect((await hole('/')).status).toBe(404);
  });
});
