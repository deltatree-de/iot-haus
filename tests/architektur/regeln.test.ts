import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GERAETE_IDS } from '../../src/domain/katalog';

const WURZEL = path.resolve(import.meta.dirname, '../..');

function dateien(verzeichnis: string, endungen: string[]): string[] {
  const ergebnis: string[] = [];
  for (const eintrag of fs.readdirSync(path.join(WURZEL, verzeichnis), { withFileTypes: true })) {
    const relativ = path.join(verzeichnis, eintrag.name);
    if (eintrag.isDirectory()) ergebnis.push(...dateien(relativ, endungen));
    else if (endungen.some((e) => eintrag.name.endsWith(e))) ergebnis.push(relativ);
  }
  return ergebnis;
}

const QUELLEN = [...dateien('src', ['.ts', '.tsx']), ...dateien('server', ['.ts'])].filter(
  (d) => !/\.test\.tsx?$/.test(d),
);

describe('Architekturregeln', () => {
  it('Geräte-IDs stehen nur im Domänenmodul (FR-2)', () => {
    const verstoesse: string[] = [];
    for (const datei of QUELLEN.filter((d) => !d.startsWith(path.join('src', 'domain')))) {
      const text = fs.readFileSync(path.join(WURZEL, datei), 'utf8');
      for (const id of GERAETE_IDS) if (text.includes(`'${id}'`) || text.includes(`"${id}"`)) verstoesse.push(`${datei}: ${id}`);
    }
    expect(verstoesse).toEqual([]);
  });

  it('Domänenmodul importiert nichts außerhalb von sich selbst (Architektur §4.2)', () => {
    for (const datei of dateien(path.join('src', 'domain'), ['.ts'])) {
      const text = fs.readFileSync(path.join(WURZEL, datei), 'utf8');
      const importe = [...text.matchAll(/from '([^']+)'/g)].map((m) => m[1]);
      for (const i of importe) expect(i.startsWith('./') || i === 'vitest', `${datei} importiert ${i}`).toBe(true);
    }
  });

  it('keine englischen Resttexte der Vorversion in der Oberfläche (FR-29)', () => {
    const verboten = ['Smart Home Control', 'Control System', 'Connected', 'Disconnected', 'Loading', 'Light Control'];
    for (const datei of QUELLEN.filter((d) => d.startsWith('src'))) {
      const text = fs.readFileSync(path.join(WURZEL, datei), 'utf8');
      for (const v of verboten) expect(text.includes(v), `${datei} enthält „${v}“`).toBe(false);
    }
  });

  it('Toter Code und Altskripte sind entfernt (FR-35)', () => {
    for (const alt of [
      'src/hooks/useMockMqtt.ts',
      'src/hooks/useMqtt.ts',
      'src/hooks/useWebSocketMqtt.ts',
      'server.js',
      'test-container-mqtt.js',
      'test-container-mqtt-detailed.js',
      'test-container-publish.js',
      'test-multi-device.js',
      'MOBILE-OPTIMIZATION.md',
      'BUILD-OPTIMIZATION.md',
      '.github/workflows/release.yml',
      '.github/workflows/docker-publish.yml',
    ]) {
      expect(fs.existsSync(path.join(WURZEL, alt)), alt).toBe(false);
    }
    const alles = QUELLEN.map((d) => fs.readFileSync(path.join(WURZEL, d), 'utf8')).join('\n');
    expect(alles).not.toContain('shouldUseMock');
    expect(alles).not.toContain('localStorage.setItem(\'smart-home-state\'');
  });

  it('Komponenten nach Architektur §5.1 / K-06 vorhanden', () => {
    for (const k of [
      'App', 'Sprunglink', 'VersionsBanner', 'VerbindungsBanner', 'Kopfbereich', 'Zaehler', 'DeltaChip', 'LaststufePille',
      'VerbindungsStatus', 'Uebersicht', 'ThemeWahl', 'InfoHinweis', 'Szenenleiste', 'SzenenKnopf', 'Hausansicht',
      'RaumFlaeche', 'VerbrauchNachRaum', 'Raumkarte', 'GeraeteZeile', 'Schalter', 'RaumAusKnopf', 'GrundlastDialog',
      'Meldungen', 'LiveRegion', 'Skeleton', 'Symbol', 'Fusszeile',
    ]) {
      expect(fs.existsSync(path.join(WURZEL, 'src/components', `${k}.tsx`)), k).toBe(true);
    }
    for (const h of ['useHaus.tsx', 'useHochzaehlen.ts', 'useRestzeit.ts', 'useSekundentakt.ts', 'useTheme.ts', 'useReduzierteBewegung.ts']) {
      expect(fs.existsSync(path.join(WURZEL, 'src/hooks', h)), h).toBe(true);
    }
  });

  it('schmales geschütztes Leerzeichen vor Einheiten (K-13)', () => {
    const format = fs.readFileSync(path.join(WURZEL, 'src/domain/format.ts'), 'utf8');
    expect(format).toContain("EINHEIT = '\\u202F'");
    expect(format).not.toMatch(/\} (W\b|kWh|€)/);
  });

  it('kein console.log im Client (FR-35)', () => {
    for (const datei of QUELLEN.filter((d) => d.startsWith('src'))) {
      expect(fs.readFileSync(path.join(WURZEL, datei), 'utf8'), datei).not.toMatch(/console\.(log|info|debug|warn)\(/);
    }
  });

  it('Layout ohne Zoom-Sperre, deutscher Titel (NFR-2, FR-29)', () => {
    const layout = fs.readFileSync(path.join(WURZEL, 'src/app/layout.tsx'), 'utf8');
    expect(layout).not.toMatch(/user-scalable|maximum-scale|maximumScale|userScalable/);
    expect(layout).toContain('lang="de"');
    expect(layout).toContain('T.seite.titel');
    expect(fs.readFileSync(path.join(WURZEL, 'src/ui/texte.ts'), 'utf8')).toContain("titel: 'IoT-Haus – Energie & Steuerung'");
  });

  it('Dockerfile: Healthcheck ohne curl, Härtung unverändert (FR-31, NFR-4)', () => {
    const docker = fs.readFileSync(path.join(WURZEL, 'Dockerfile'), 'utf8');
    expect(docker).toMatch(/HEALTHCHECK[\s\S]*node", "-e", "fetch\('http:\/\/127\.0\.0\.1:'\+\(process\.env\.PORT\|\|3000\)\+'\/api\/health'\)/);
    expect(docker).toContain('COPY package.json next.config.mjs ./');
    expect(docker).toContain('USER 1000:1000');
    expect(docker).toContain('FROM node:22-alpine AS runtime');
    for (const compose of ['docker-compose.yml', 'docker-compose.prod.yml']) {
      expect(fs.readFileSync(path.join(WURZEL, compose), 'utf8')).not.toMatch(/^\s*healthcheck:/m);
    }
  });
});
