// Einzeilen-Logger (NFR-7). Einzige Stelle im Server mit console.*; nie Nutzdaten loggen.
type Stufe = 'INFO' | 'WARN' | 'FEHLER';
type Felder = Record<string, string | number | boolean | null | undefined>;

function zeile(stufe: Stufe, ereignis: string, felder: Felder = {}): string {
  const teile = Object.entries(felder)
    .filter(([, wert]) => wert !== undefined)
    .map(([schluessel, wert]) => `${schluessel}=${String(wert).replace(/\s+/g, '_')}`);
  return [new Date().toISOString(), stufe, ereignis, ...teile].join(' ');
}

export interface Logger {
  info(ereignis: string, felder?: Felder): void;
  warn(ereignis: string, felder?: Felder): void;
  fehler(ereignis: string, felder?: Felder): void;
}

export const log: Logger = {
  info: (ereignis, felder) => console.log(zeile('INFO', ereignis, felder)),
  warn: (ereignis, felder) => console.warn(zeile('WARN', ereignis, felder)),
  fehler: (ereignis, felder) => console.error(zeile('FEHLER', ereignis, felder)),
};

export const stillerLog: Logger = { info: () => {}, warn: () => {}, fehler: () => {} };
