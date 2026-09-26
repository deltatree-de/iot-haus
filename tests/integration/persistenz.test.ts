import http from 'node:http';
import mqtt from 'mqtt';
import { afterEach, describe, expect, it } from 'vitest';
import { starteBroker, starteServer, TestClient, warteBis } from './hilfen';

const aufraeumen: (() => Promise<void> | void)[] = [];
afterEach(async () => {
  while (aufraeumen.length) await aufraeumen.pop()!();
});

function health(port: number): Promise<number> {
  return new Promise((fertig) => {
    http
      .get({ host: '127.0.0.1', port, path: '/api/health' }, (res) => {
        res.resume();
        fertig(res.statusCode ?? 0);
      })
      .on('error', () => fertig(0));
  });
}

describe('Persistenz über Neustarts (FR-17)', () => {
  it('Serverneustart gegen denselben Broker stellt den Zustand wieder her', async () => {
    const broker = await starteBroker();
    aufraeumen.push(() => broker.stoppe());

    const s1 = await starteServer(broker.url);
    const a = await TestClient.verbinde(s1.port);
    a.sende({ typ: 'szene', id: 'n1', szene: 'filmabend' });
    a.sende({ typ: 'schalten', id: 'n2', geraet: 'kueche.kuehlschrank', an: false });
    await a.warte((n) => n.typ === 'bestaetigt' && n.befehlId === 'n2');
    const vorher = a.zustand();
    a.schliesse();
    await s1.schliessen();

    const s2 = await starteServer(broker.url);
    aufraeumen.push(() => s2.schliessen());
    const b = await TestClient.verbinde(s2.port);
    aufraeumen.push(() => b.schliesse());
    expect(b.zustand()).toEqual(vorher);
    expect(b.zustand()['wohnzimmer.fernseher']).toBe(true);
    expect(b.zustand()['kueche.kuehlschrank']).toBe(false);
  });

  it('ignoriert unbekannte und kaputte gespeicherte Nachrichten', async () => {
    const broker = await starteBroker();
    aufraeumen.push(() => broker.stoppe());
    const pub = await mqtt.connectAsync(broker.url);
    await pub.publishAsync('iot-haus/v2/geraet/keller.sauna/zustand', JSON.stringify({ v: 1, an: true, seit: 1 }), { retain: true, qos: 1 });
    await pub.publishAsync('iot-haus/v2/geraet/bad.foehn/zustand', 'kaputt', { retain: true, qos: 1 });
    await pub.publishAsync('iot-haus/v2/geraet/bad.deckenlampe/zustand', JSON.stringify({ v: 1, an: true, seit: -5 }), { retain: true, qos: 1 });
    await pub.publishAsync('iot-haus/v2/energie/heute', '{"v":1,"datum":"2026-09-26","wh":1e999,"stand":1}', { retain: true, qos: 1 });
    await pub.publishAsync('iot-haus/v2/geraet/bad.heizluefter/zustand', JSON.stringify({ v: 1, an: true, seit: Date.now() }), { retain: true, qos: 1 });
    await pub.endAsync();

    const s = await starteServer(broker.url);
    aufraeumen.push(() => s.schliessen());
    const c = await TestClient.verbinde(s.port);
    aufraeumen.push(() => c.schliesse());
    const z = c.zustand();
    expect(z['bad.foehn']).toBe(false);
    expect(z['bad.deckenlampe']).toBe(false);
    const snap = c.nachrichten[0];
    expect(snap.typ === 'snapshot' && Number.isFinite(snap.energie.wh)).toBe(true);
    expect(z['bad.heizluefter']).toBe(true);
    expect(Object.keys(z)).not.toContain('keller.sauna');
  });
});

describe('Broker-Ausfall (NFR-5, AD-06)', () => {
  it('schließt WebSockets, meldet 503 und wird nach Rückkehr wieder bereit', async () => {
    const broker = await starteBroker();
    const s = await starteServer(broker.url);
    aufraeumen.push(() => s.schliessen());
    const c = await TestClient.verbinde(s.port);
    c.sende({ typ: 'schalten', id: 'b1', geraet: 'arbeitszimmer.pc', an: true });
    await c.warte((n) => n.typ === 'bestaetigt');
    expect(await health(s.port)).toBe(200);

    await broker.stoppe();
    await warteBis(() => c.geschlossen !== null, 3000);
    expect(c.geschlossen?.code).toBe(1013);
    await warteBis(() => !s.istBereit());
    expect(await health(s.port)).toBe(503);

    // Neuer, leerer Broker auf demselben Port: Server publiziert seinen Speicherstand neu.
    const neu = await starteBroker(broker.port);
    aufraeumen.push(() => neu.stoppe());
    await warteBis(() => s.istBereit(), 5000);
    expect(await health(s.port)).toBe(200);
    const d = await TestClient.verbinde(s.port);
    aufraeumen.push(() => d.schliesse());
    expect(d.zustand()['arbeitszimmer.pc']).toBe(true);

    // Der neue Broker hat den Stand retained.
    const leser = await mqtt.connectAsync(neu.url);
    const payload = await new Promise<string>((fertig) => {
      leser.on('message', (_t, p) => fertig(p.toString()));
      void leser.subscribeAsync('iot-haus/v2/geraet/arbeitszimmer.pc/zustand');
    });
    await leser.endAsync();
    expect(JSON.parse(payload)).toMatchObject({ v: 1, an: true });
  });

  it('lehnt Upgrades ab, solange der Broker fehlt', async () => {
    const s = await starteServerOhneBereitschaft();
    aufraeumen.push(() => s.schliessen());
    const c = new TestClient(s.port);
    const status = await new Promise<number>((fertig) => c.ws.on('unexpected-response', (_q, r) => fertig(r.statusCode ?? 0)));
    expect(status).toBe(503);
    expect(await health(s.port)).toBe(503);
  });
});

async function starteServerOhneBereitschaft() {
  const { erstelleServer } = await import('../../server/app');
  const { stillerLog } = await import('../../server/log');
  return erstelleServer({
    port: 0,
    hostname: '127.0.0.1',
    mqttUrl: 'mqtt://127.0.0.1:1',
    strompreis: 0.35,
    version: '2.0.0',
    log: stillerLog,
  });
}

