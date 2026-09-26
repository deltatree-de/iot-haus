// Umgebungsvariablen (Architektur §7).
import type { Logger } from './log';

export const STANDARD_STROMPREIS = 0.35;

/**
 * Strompreis in €/kWh aus `STROMPREIS_EUR_PRO_KWH` (Dezimalpunkt). Ungültige oder negative Werte
 * ergeben 0,35 und eine Warnung; ein fehlender Wert ist der normale Standardfall (Info-Zeile).
 */
export function leseStrompreis(wert: string | undefined, log: Logger): number {
  if (wert === undefined || wert.trim() === '') {
    log.info('strompreis', { quelle: 'standard', wert: STANDARD_STROMPREIS });
    return STANDARD_STROMPREIS;
  }
  const text = wert.trim();
  const zahl = Number(text);
  if (!/^\d+(\.\d+)?$/.test(text) || !Number.isFinite(zahl) || zahl < 0) {
    log.warn('strompreis_ungueltig', { wert: text.slice(0, 32), ersatz: STANDARD_STROMPREIS });
    return STANDARD_STROMPREIS;
  }
  log.info('strompreis', { quelle: 'umgebung', wert: zahl });
  return zahl;
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
