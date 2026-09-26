// Rauchtest gegen den laufenden Container (CI-Job „container“).
//   node scripts/smoke-container.mjs schalten  → Health, Snapshot, PC einschalten
//   node scripts/smoke-container.mjs pruefen   → PC ist nach Neustart noch an (FR-17)
import fs from 'node:fs';
import { WebSocket } from 'ws';

const BASIS = process.env.SMOKE_BASIS || 'http://127.0.0.1:3000';
const GERAET = 'arbeitszimmer.pc';
const modus = process.argv[2];
const version = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

function fehler(text) {
  console.error(`Rauchtest fehlgeschlagen: ${text}`);
  process.exit(1);
}

const health = await fetch(`${BASIS}/api/health`);
const status = await health.json();
if (health.status !== 200 || status.status !== 'ok' || status.version !== version) {
  fehler(`Health ${health.status} ${JSON.stringify(status)}`);
}

// Security-Header aus next.config.mjs müssen im Image wirken (Review CR-05)
const seite = await fetch(`${BASIS}/`);
if (seite.status !== 200) fehler(`Startseite ${seite.status}`);
if (seite.headers.get('x-frame-options') !== 'DENY' || seite.headers.get('x-powered-by')) {
  fehler('Security-Header fehlen oder X-Powered-By ist gesetzt');
}

const ws = new WebSocket(`${BASIS.replace(/^http/, 'ws')}/mqtt`);
const abbruch = setTimeout(() => fehler('Zeitüberschreitung'), 10_000);
let snapshot = null;

ws.on('error', (e) => fehler(e.message));
ws.on('message', (daten) => {
  const n = JSON.parse(daten.toString());
  if (n.typ === 'snapshot') {
    snapshot = n;
    if (Object.keys(n.zustand).length !== 28) fehler('Snapshot hat nicht 28 Geräte');
    if (n.version !== version) fehler(`Version ${n.version} statt ${version}`);
    if (modus === 'schalten') {
      ws.send(JSON.stringify({ typ: 'schalten', id: 'smoke-1', geraet: GERAET, an: true }));
    } else if (modus === 'pruefen') {
      if (!n.zustand[GERAET].an) fehler('Zustand hat den Neustart nicht überstanden');
      fertig('Zustand nach Neustart erhalten');
    } else {
      fehler(`unbekannter Modus ${modus}`);
    }
  }
  if (n.typ === 'bestaetigt' && n.befehlId === 'smoke-1') fertig('Schalten bestätigt');
  if (n.typ === 'fehler') fehler(`Serverfehler ${n.code}`);
});

function fertig(text) {
  clearTimeout(abbruch);
  console.log(`Rauchtest ok: ${text} (Version ${snapshot?.version})`);
  ws.close();
  process.exit(0);
}
