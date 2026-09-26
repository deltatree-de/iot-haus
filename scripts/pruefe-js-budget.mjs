// Prüft „First Load JS“ der Route / aus der Ausgabe von `next build` (NFR-1, Budget 200 kB).
import fs from 'node:fs';

const BUDGET_KB = 200;
const datei = process.argv[2];
if (!datei) {
  console.error('Aufruf: node scripts/pruefe-js-budget.mjs build.log');
  process.exit(2);
}

const text = fs.readFileSync(datei, 'utf8').replace(/\x1b\[[0-9;]*m/g, '');
const zeile = text.split('\n').find((z) => /^[┌├└]\s+[○●ƒλ]\s+\/\s/.test(z));
if (!zeile) {
  console.error('Zeile der Route / in der Build-Ausgabe nicht gefunden.');
  process.exit(1);
}

const groessen = [...zeile.matchAll(/([\d.]+)\s*(B|kB|MB)\b/g)];
if (groessen.length === 0) {
  console.error(`Keine Größenangabe in: ${zeile}`);
  process.exit(1);
}
const [, wert, einheit] = groessen.at(-1);
const kb = Number(wert) * (einheit === 'MB' ? 1000 : einheit === 'B' ? 0.001 : 1);
console.log(`First Load JS für /: ${kb} kB (Budget ${BUDGET_KB} kB)`);
if (kb > BUDGET_KB) {
  console.error('Budget überschritten.');
  process.exit(1);
}
