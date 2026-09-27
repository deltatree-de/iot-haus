import { describe, expect, it, vi } from 'vitest';
import { leseEinspeiseverguetung, leseKonfig, leseStrompreis } from './konfig';
import { stillerLog } from './log';
import { hostErlaubt, hostname, ursprungErlaubt } from './ursprung';

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

describe('Einspeisevergütung (2.1, AC-19)', () => {
  it.each([
    [undefined, 0.08, false],
    ['0', 0, false],
    ['0.1', 0.1, false],
    ['abc', 0.08, true],
    ['-1', 0.08, true],
    ['0,08', 0.08, true],
  ])('%s → %d', (wert, erwartet, warnt) => {
    const log = logSpion();
    expect(leseEinspeiseverguetung(wert, log)).toBe(erwartet);
    expect(log.warn.mock.calls.some((c) => c[0] === 'einspeiseverguetung_ungueltig')).toBe(warnt);
  });
});

describe('Konfiguration', () => {
  it('Standardwerte', () => {
    expect(leseKonfig({} as NodeJS.ProcessEnv)).toEqual({ erlaubteHosts: [], port: 3000, hostname: '0.0.0.0', mqttUrl: 'mqtt://127.0.0.1:1883', dev: true });
  });
  it('Umgebung', () => {
    expect(
      leseKonfig({ PORT: '8080', HOSTNAME: '127.0.0.1', MQTT_BROKER_HOST: 'broker', MQTT_BROKER_PORT: '1884', NODE_ENV: 'production', ERLAUBTE_HOSTS: 'Haus.local, 192.168.1.10' } as NodeJS.ProcessEnv),
    ).toEqual({ erlaubteHosts: ['haus.local', '192.168.1.10'], port: 8080, hostname: '127.0.0.1', mqttUrl: 'mqtt://broker:1884', dev: false });
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

describe('Host-Allowlist gegen DNS-Rebinding (Review CR-10)', () => {
  it('ohne Liste ist jeder Host erlaubt', () => {
    expect(hostErlaubt({ host: 'boese.example' }, [])).toBe(true);
  });
  it.each([
    [{ host: 'haus.local:3000' }, true],
    [{ host: 'HAUS.local' }, true],
    [{ host: '192.168.1.10:3000' }, true],
    [{ host: 'boese.example:3000' }, false],
    [{ host: 'intern:3000', 'x-forwarded-host': 'haus.local' }, false],
    [{ host: 'haus.local', 'x-forwarded-host': 'boese.example' }, false],
    [{}, false],
  ])('%j → %s', (headers, erwartet) => {
    expect(hostErlaubt(headers, ['haus.local', '192.168.1.10'])).toBe(erwartet);
  });
  it('Hostname ohne Port, IPv6 bleibt', () => {
    expect(hostname('[::1]:3000')).toBe('[::1]');
    expect(hostname('Haus:80')).toBe('haus');
  });
});
