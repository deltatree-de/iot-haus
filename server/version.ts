// Version aus package.json – Quelle für Health und Snapshot (FR-18, FR-30).
import fs from 'node:fs';
import path from 'node:path';

export function leseVersion(startVerzeichnis: string): string {
  let verzeichnis = startVerzeichnis;
  for (;;) {
    const datei = path.join(verzeichnis, 'package.json');
    if (fs.existsSync(datei)) {
      const paket = JSON.parse(fs.readFileSync(datei, 'utf8')) as { name?: string; version?: string };
      if (paket.name === 'iot-haus' && paket.version) return paket.version;
    }
    const oben = path.dirname(verzeichnis);
    if (oben === verzeichnis) throw new Error('package.json von iot-haus nicht gefunden');
    verzeichnis = oben;
  }
}
