import { describe, expect, it } from 'vitest';
import { DUNKEL, HELL, KONTRAST_PAARE, TOKEN_NAMEN, kontrast } from '../../src/ui/farbtokens';

describe('Kontraste aller Token-Paare (NFR-2)', () => {
  it('Formel stimmt (Schwarz/Weiß = 21:1)', () => {
    expect(kontrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(kontrast('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('36 Rollen je Theme (2.1: + solar, solar-soft)', () => {
    expect(TOKEN_NAMEN).toHaveLength(36);
  });

  it('beide Paletten sind vollständig und gültig', () => {
    for (const p of [HELL, DUNKEL]) {
      for (const n of TOKEN_NAMEN) expect(p[n]).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  for (const [theme, palette] of [
    ['hell', HELL],
    ['dunkel', DUNKEL],
  ] as const) {
    it.each(KONTRAST_PAARE)(`${theme}: %s auf %s ≥ %d:1`, (vorne, hinten, minimum) => {
      expect(kontrast(palette[vorne], palette[hinten])).toBeGreaterThanOrEqual(minimum);
    });
  }
});
