// Umgebungsvariablen (Architektur §7).
import type { Logger } from './log';

export const STANDARD_STROMPREIS = 0.35;
export const STANDARD_EINSPEISEVERGUETUNG = 0.08;

/**
 * Betrag in €/kWh aus einer Umgebungsvariable (Dezimalpunkt). Ungültige oder negative Werte ergeben
 * den Standard und eine Warnung `‹ereignis›_ungueltig`; ein fehlender Wert ist der normale Standardfall.
 */
export function leseEuroProKwh(ereignis: string, wert: string | undefined, standard: number, log: Logger): number {
  if (wert === undefined || wert.trim() === '') {
    log.info(ereignis, { quelle: 'standard', wert: standard });
    return standard;
  }
  const text = wert.trim();
  const zahl = Number(text);
  if (!/^\d+(\.\d+)?$/.test(text) || !Number.isFinite(zahl) || zahl < 0) {
    log.warn(`${ereignis}_ungueltig`, { wert: text.slice(0, 32), ersatz: standard });
    return standard;
  }
  log.info(ereignis, { quelle: 'umgebung', wert: zahl });
  return zahl;
}

/** Strompreis aus `STROMPREIS_EUR_PRO_KWH` (FR-9). */
export function leseStrompreis(wert: string | undefined, log: Logger): number {
  return leseEuroProKwh('strompreis', wert, STANDARD_STROMPREIS, log);
}

/** Einspeisevergütung aus `EINSPEISEVERGUETUNG_EUR_PRO_KWH` (2.1, E-22). */
export function leseEinspeiseverguetung(wert: string | undefined, log: Logger): number {
  return leseEuroProKwh('einspeiseverguetung', wert, STANDARD_EINSPEISEVERGUETUNG, log);
}

export interface Konfig {
  erlaubteHosts: string[];
  port: number;
  hostname: string;
  mqttUrl: string;
  dev: boolean;
}

export function leseKonfig(env: NodeJS.ProcessEnv): Konfig {
  const port = Number.parseInt(env.PORT ?? '', 10);
  return {
    erlaubteHosts: (env.ERLAUBTE_HOSTS ?? '')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
    port: Number.isInteger(port) && port > 0 ? port : 3000,
    hostname: env.HOSTNAME || '0.0.0.0',
    mqttUrl: `mqtt://${env.MQTT_BROKER_HOST || '127.0.0.1'}:${env.MQTT_BROKER_PORT || '1883'}`,
    dev: env.NODE_ENV !== 'production',
  };
}
