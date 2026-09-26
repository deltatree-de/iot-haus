import { describe, expect, it, vi } from 'vitest';
import { leseKonfig, leseStrompreis } from './konfig';
import { stillerLog } from './log';
import { ursprungErlaubt } from './ursprung';

function logSpion() {
  return { info: vi.fn(), warn: vi.fn(), fehler: vi.fn() };
}

describe('Strompreis (FR-9)', () => {
  it.each([
    ['0.32', 0.32],
    [' 0.4 ', 0.4],
    ['0', 0],
    ['1', 1],
  ])('%s → %d', (wert, erwartet) => {
    const log = logSpion();
    expect(leseStrompreis(wert, log)).toBe(erwartet);
    expect(log.warn).not.toHaveBeenCalled();
  });

  it.each(['-0.1', 'abc', '0,32', '1e3', 'Infinity', 'NaN'])('ungültig %s → 0,35 mit Warnung', (wert) => {
    const log = logSpion();
    expect(leseStrompreis(wert, log)).toBe(0.35);
    expect(log.warn).toHaveBeenCalledWith('strompreis_ungueltig', expect.anything());
  });

  it('fehlt → 0,35 ohne Warnung', () => {
    const log = logSpion();
    expect(leseStrompreis(undefined, log)).toBe(0.35);
    expect(leseStrompreis('', stillerLog)).toBe(0.35);
    expect(log.warn).not.toHaveBeenCalled();
  });
});

describe('Konfiguration', () => {
  it('Standardwerte', () => {
    expect(leseKonfig({} as NodeJS.ProcessEnv)).toEqual({ port: 3000, hostname: '0.0.0.0', mqttUrl: 'mqtt://127.0.0.1:1883', dev: true });
  });
  it('Umgebung', () => {
    expect(
      leseKonfig({ PORT: '8080', HOSTNAME: '127.0.0.1', MQTT_BROKER_HOST: 'broker', MQTT_BROKER_PORT: '1884', NODE_ENV: 'production' } as NodeJS.ProcessEnv),
    ).toEqual({ port: 8080, hostname: '127.0.0.1', mqttUrl: 'mqtt://broker:1884', dev: false });
  });
});

describe('Origin-Prüfung (NFR-4)', () => {
  it.each([
    [{ host: 'haus.local:3000' }, true],
    [{ host: 'haus.local:3000', origin: 'http://haus.local:3000' }, true],
    [{ host: 'HAUS.local:3000', origin: 'http://haus.local:3000' }, true],
    [{ host: 'haus.example', origin: 'https://haus.example' }, true],
    [{ host: 'haus.example:443', origin: 'https://haus.example' }, true],
    [{ host: 'intern:3000', 'x-forwarded-host': 'haus.example', origin: 'https://haus.example' }, true],
    [{ host: 'intern:3000', 'x-forwarded-host': 'haus.example, proxy', origin: 'https://haus.example' }, true],
    [{ host: 'haus.local:3000', origin: 'http://boese.example' }, false],
    [{ host: 'haus.local:3000', origin: 'null' }, false],
    [{ host: 'haus.local:3000', origin: 'file:///x' }, false],
    [{ origin: 'http://haus.local:3000' }, false],
  ])('%j → %s', (headers, erwartet) => {
    expect(ursprungErlaubt(headers)).toBe(erwartet);
  });
});
