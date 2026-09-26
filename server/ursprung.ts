// Origin-Prüfung für das WebSocket-Upgrade (NFR-4, AD-07).
import type { IncomingHttpHeaders } from 'node:http';

function ersterWert(wert: string | string[] | undefined): string | undefined {
  const roh = Array.isArray(wert) ? wert[0] : wert;
  return roh?.split(',')[0]?.trim().toLowerCase() || undefined;
}

/** Erlaubt, wenn kein Origin gesendet wird oder dessen Host zum Host der App passt. */
export function ursprungErlaubt(headers: IncomingHttpHeaders): boolean {
  const origin = headers.origin;
  if (origin === undefined) return true;
  let host: string;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    host = url.host.toLowerCase();
  } catch {
    return false;
  }
  const erlaubt = [ersterWert(headers.host), ersterWert(headers['x-forwarded-host'])];
  return erlaubt.some((h) => h !== undefined && (h === host || ohneStandardPort(h) === host));
}

function ohneStandardPort(host: string): string {
  return host.replace(/:(80|443)$/, '');
}

/** Host ohne Port, klein geschrieben. IPv6-Literale in eckigen Klammern bleiben erhalten. */
export function hostname(host: string): string {
  const h = host.trim().toLowerCase();
  if (h.startsWith('[')) return h.slice(0, h.indexOf(']') + 1);
  return h.split(':')[0];
}

/**
 * Optionale Allowlist (ERLAUBTE_HOSTS) gegen DNS-Rebinding: Ist sie gesetzt, muss der Host-Header
 * (bzw. X-Forwarded-Host hinter einem Reverse-Proxy) darin stehen (Review CR-10).
 */
export function hostErlaubt(headers: IncomingHttpHeaders, erlaubt: string[]): boolean {
  if (erlaubt.length === 0) return true;
  const kandidaten = [ersterWert(headers['x-forwarded-host']), ersterWert(headers.host)].filter(
    (h): h is string => h !== undefined,
  );
  if (kandidaten.length === 0) return false;
  return kandidaten.every((h) => erlaubt.includes(hostname(h)));
}
