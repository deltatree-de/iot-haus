// Persistenz des Serverzustands als retained MQTT-Nachrichten (Architektur §3.4, AD-04).
import { EventEmitter } from 'node:events';
import mqtt, { type MqttClient } from 'mqtt';
import { ELEKTROAUTO, type AutoZustand } from '../src/domain/elektroauto';
import { istGeraetId, type GeraetId } from '../src/domain/katalog';
import type { Energie, GeraeteZustand } from '../src/domain/protokoll';
import { istSonnenStufe, type SonnenZustand } from '../src/domain/solar';
import type { Logger } from './log';
import type { Gespeichert, Persistenz } from './zustandsdienst';

export const TOPIC_PRAEFIX = 'iot-haus/v2';
const GERAET_TOPIC = /^iot-haus\/v2\/geraet\/([^/]+)\/zustand$/;
const ENERGIE_TOPIC = `${TOPIC_PRAEFIX}/energie/heute`;
const AUTO_TOPIC = `${TOPIC_PRAEFIX}/auto/zustand`;
const SONNE_TOPIC = `${TOPIC_PRAEFIX}/solar/sonne`;
const DATUM = /^\d{4}-\d{2}-\d{2}$/;

export function geraetTopic(id: GeraetId): string {
  return `${TOPIC_PRAEFIX}/geraet/${id}/zustand`;
}

function parse(payload: Buffer): Record<string, unknown> | null {
  try {
    const wert: unknown = JSON.parse(payload.toString('utf8'));
    return typeof wert === 'object' && wert !== null && !Array.isArray(wert) ? (wert as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function endlichNichtNegativ(wert: unknown): wert is number {
  return typeof wert === 'number' && Number.isFinite(wert) && wert >= 0;
}

/** Übernimmt eine gespeicherte Nachricht in `ziel`; liefert false, wenn sie ignoriert wird (FR-17). */
export function uebernimmGespeichert(ziel: Gespeichert, topic: string, payload: Buffer): boolean {
  const daten = parse(payload);
  if (!daten) return false;
  if (topic === ENERGIE_TOPIC) return uebernimmEnergie(ziel, daten);
  if (daten.v !== 1) return false;
  if (topic === AUTO_TOPIC) {
    if (typeof daten.zuhause !== 'boolean' || !endlichNichtNegativ(daten.akkuWh) || !endlichNichtNegativ(daten.stand)) {
      return false;
    }
    ziel.auto = { zuhause: daten.zuhause, akkuWh: Math.min(ELEKTROAUTO.kapazitaetWh, daten.akkuWh), stand: daten.stand };
    return true;
  }
  if (topic === SONNE_TOPIC) {
    if (!istSonnenStufe(daten.stufe) || !endlichNichtNegativ(daten.seit)) return false;
    ziel.sonne = { stufe: daten.stufe, seit: daten.seit };
    return true;
  }
  const treffer = GERAET_TOPIC.exec(topic);
  if (treffer) {
    const id = treffer[1];
    if (!istGeraetId(id) || typeof daten.an !== 'boolean' || typeof daten.seit !== 'number' || !Number.isFinite(daten.seit) || daten.seit < 0) {
      return false;
    }
    ziel.geraete[id] = { an: daten.an, seit: daten.seit };
    return true;
  }
  return false;
}

/** Energie `v: 2` mit Bezug/Einspeisung; `v: 1` aus 2.0 wird als reiner Netzbezug gelesen (AD-26, AC-18). */
function uebernimmEnergie(ziel: Gespeichert, daten: Record<string, unknown>): boolean {
  if (typeof daten.datum !== 'string' || !DATUM.test(daten.datum) || !endlichNichtNegativ(daten.wh)) return false;
  if (daten.v === 1) {
    ziel.energie = { datum: daten.datum, wh: daten.wh, bezugWh: daten.wh, einspeisungWh: 0 };
    return true;
  }
  if (daten.v !== 2 || !endlichNichtNegativ(daten.bezugWh) || !endlichNichtNegativ(daten.einspeisungWh)) return false;
  ziel.energie = { datum: daten.datum, wh: daten.wh, bezugWh: daten.bezugWh, einspeisungWh: daten.einspeisungWh };
  return true;
}

/**
 * Einziger MQTT-Client des Servers. Ereignisse: `verbunden`, `getrennt`.
 */
export class MqttSpeicher extends EventEmitter implements Persistenz {
  private readonly client: MqttClient;
  private verbunden = false;

  constructor(url: string, private readonly log: Logger) {
    super();
    this.client = mqtt.connect(url, {
      clientId: `iot-haus-server-${process.pid}-${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 5000,
    });
    this.client.on('connect', () => {
      this.verbunden = true;
      this.log.info('mqtt_verbunden');
      this.emit('verbunden');
    });
    this.client.on('close', () => this.getrennt());
    this.client.on('offline', () => this.getrennt());
    this.client.on('error', (fehler) => this.log.warn('mqtt_fehler', { grund: fehler.message }));
  }

  private getrennt(): void {
    if (!this.verbunden) return;
    this.verbunden = false;
    this.log.warn('mqtt_getrennt');
    this.emit('getrennt');
  }

  istVerbunden(): boolean {
    return this.verbunden;
  }

  /** Liest alle retained Zustände: abonnieren, Ruhefenster sammeln, abbestellen. */
  async lade(fensterMs: number): Promise<Gespeichert> {
    const ergebnis: Gespeichert = { geraete: {}, energie: null, auto: null, sonne: null };
    const beiNachricht = (topic: string, payload: Buffer) => {
      if (!topic.startsWith(`${TOPIC_PRAEFIX}/`)) return;
      if (!uebernimmGespeichert(ergebnis, topic, payload)) this.log.warn('restore_ignoriert', { topic });
    };
    this.client.on('message', beiNachricht);
    try {
      await this.client.subscribeAsync(`${TOPIC_PRAEFIX}/#`, { qos: 1 });
      await new Promise((fertig) => setTimeout(fertig, fensterMs));
      await this.client.unsubscribeAsync(`${TOPIC_PRAEFIX}/#`);
    } finally {
      this.client.off('message', beiNachricht);
    }
    return ergebnis;
  }

  speichereGeraet(id: GeraetId, zustand: GeraeteZustand): void {
    const payload = JSON.stringify({ v: 1, an: zustand.an, seit: zustand.seit });
    this.client.publish(geraetTopic(id), payload, { qos: 1, retain: true }, (fehler) => {
      if (fehler) this.log.warn('speichern_fehlgeschlagen', { topic: geraetTopic(id) });
    });
  }

  speichereEnergie(energie: Energie, stand: number): Promise<void> {
    const { datum, wh, bezugWh, einspeisungWh } = energie;
    return this.speichere(ENERGIE_TOPIC, { v: 2, datum, wh, bezugWh, einspeisungWh, stand });
  }

  speichereAuto(auto: AutoZustand): Promise<void> {
    return this.speichere(AUTO_TOPIC, { v: 1, zuhause: auto.zuhause, akkuWh: auto.akkuWh, stand: auto.stand });
  }

  speichereSonne(sonne: SonnenZustand): void {
    void this.speichere(SONNE_TOPIC, { v: 1, stufe: sonne.stufe, seit: sonne.seit });
  }

  private speichere(topic: string, daten: object): Promise<void> {
    return new Promise((fertig) => {
      this.client.publish(topic, JSON.stringify(daten), { qos: 1, retain: true }, (fehler) => {
        if (fehler) this.log.warn('speichern_fehlgeschlagen', { topic });
        fertig();
      });
    });
  }

  async beende(): Promise<void> {
    this.verbunden = false;
    this.removeAllListeners();
    await this.client.endAsync(true);
  }
}

