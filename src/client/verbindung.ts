// WebSocket-Transport ohne React: Backoff, Lebenszeichen, Sichtbarkeit (FR-20, Architektur §3.8).
import type { Befehl, ServerNachricht } from '../domain/protokoll';

export const BACKOFF_MS = [1000, 2000, 4000, 8000];
export const BACKOFF_DAUER_MS = 10_000;
export const SNAPSHOT_FRIST_MS = 5000;
export const LEBENSZEICHEN_MS = 75_000;

export type Status = 'verbinde' | 'verbunden' | 'getrennt';

export interface VerbindungsOptionen {
  url: string;
  beiNachricht: (n: ServerNachricht) => void;
  beiStatus: (s: Status) => void;
  /** Zeitpunkt (ms) des nächsten automatischen Versuchs, null während eines Versuchs */
  beiNaechsterVersuch?: (zeitpunkt: number | null) => void;
  erzeugeSocket?: (url: string) => WebSocket;
}

export function wartezeit(versuch: number): number {
  return BACKOFF_MS[versuch] ?? BACKOFF_DAUER_MS;
}

export function standardUrl(ort: Pick<Location, 'protocol' | 'host'>): string {
  return `${ort.protocol === 'https:' ? 'wss' : 'ws'}://${ort.host}/mqtt`;
}

export class HausVerbindung {
  private socket: WebSocket | null = null;
  private versuch = 0;
  private wiederTimer: ReturnType<typeof setTimeout> | null = null;
  private lebensTimer: ReturnType<typeof setTimeout> | null = null;
  private snapshotDa = false;
  private beendet = false;
  private readonly sichtbarkeit = () => {
    if (document.visibilityState === 'visible' && !this.offen()) this.jetztVerbinden();
  };

  constructor(private readonly opts: VerbindungsOptionen) {}

  starte(): void {
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this.sichtbarkeit);
    this.oeffne();
  }

  beende(): void {
    this.beendet = true;
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.sichtbarkeit);
    this.stoppeTimer();
    const s = this.socket;
    this.socket = null;
    if (s) {
      s.onclose = null;
      s.close();
    }
  }

  offen(): boolean {
    return this.socket?.readyState === 1;
  }

  /** Sendet nur bei offener Verbindung; keine Warteschlange (FR-20). */
  sende(befehl: Befehl): boolean {
    if (!this.socket || this.socket.readyState !== 1 || !this.snapshotDa) return false;
    this.socket.send(JSON.stringify(befehl));
    return true;
  }

  jetztVerbinden(): void {
    if (this.beendet || (this.socket && this.socket.readyState <= 1)) return;
    if (this.wiederTimer) clearTimeout(this.wiederTimer);
    this.wiederTimer = null;
    this.oeffne();
  }

  private stoppeTimer(): void {
    if (this.wiederTimer) clearTimeout(this.wiederTimer);
    if (this.lebensTimer) clearTimeout(this.lebensTimer);
    this.wiederTimer = null;
    this.lebensTimer = null;
  }

  private beobachteLeben(fristMs: number): void {
    if (this.lebensTimer) clearTimeout(this.lebensTimer);
    this.lebensTimer = setTimeout(() => this.socket?.close(), fristMs);
  }

  private oeffne(): void {
    this.opts.beiStatus('verbinde');
    this.opts.beiNaechsterVersuch?.(null);
    this.snapshotDa = false;
    let socket: WebSocket;
    try {
      socket = (this.opts.erzeugeSocket ?? ((u) => new WebSocket(u)))(this.opts.url);
    } catch {
      this.plane();
      return;
    }
    this.socket = socket;
    socket.onopen = () => this.beobachteLeben(SNAPSHOT_FRIST_MS);
    socket.onmessage = (ereignis) => {
      let nachricht: ServerNachricht;
      try {
        nachricht = JSON.parse(String(ereignis.data)) as ServerNachricht;
      } catch {
        return;
      }
      if (nachricht.typ === 'snapshot') {
        this.snapshotDa = true;
        this.versuch = 0;
        this.opts.beiStatus('verbunden');
      }
      this.beobachteLeben(LEBENSZEICHEN_MS);
      this.opts.beiNachricht(nachricht);
    };
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.snapshotDa = false;
      if (this.lebensTimer) clearTimeout(this.lebensTimer);
      this.lebensTimer = null;
      if (this.beendet) return;
      this.opts.beiStatus('getrennt');
      this.plane();
    };
  }

  private plane(): void {
    if (this.beendet) return;
    const warte = wartezeit(this.versuch++);
    this.opts.beiNaechsterVersuch?.(Date.now() + warte);
    this.wiederTimer = setTimeout(() => {
      this.wiederTimer = null;
      this.oeffne();
    }, warte);
  }
}
