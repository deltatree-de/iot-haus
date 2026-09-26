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
