// Farb-Tokens hell/dunkel (UX DESIGN.md) – Quelle für CSS-Variablen und den Kontrasttest (NFR-2).

export const TOKEN_NAMEN = [
  'bg',
  'surface',
  'surface-raised',
  'surface-sunken',
  'border',
  'ink',
  'ink-secondary',
  'ink-muted',
  'on',
  'on-contrast',
  'on-soft',
  'switch-off',
  'focus',
  'primary',
  'primary-contrast',
  'danger',
  'danger-contrast',
  'status-ok',
  'load-low',
  'load-low-bg',
  'load-mid',
  'load-mid-bg',
  'load-high',
  'load-high-bg',
  'delta-up',
  'delta-down',
  'banner-warn-bg',
  'banner-warn-ink',
  'banner-info-bg',
  'banner-info-ink',
  'room-off',
  'room-lit',
  'house-roof',
  'theme-color',
  'solar',
  'solar-soft',
] as const;

export type TokenName = (typeof TOKEN_NAMEN)[number];
export type Palette = Record<TokenName, string>;

export const HELL: Palette = {
  bg: '#F4F6F9',
  surface: '#FFFFFF',
  'surface-raised': '#FFFFFF',
  'surface-sunken': '#EDF0F5',
  border: '#D4DAE3',
  ink: '#111827',
  'ink-secondary': '#4B5563',
  'ink-muted': '#5F6B7A',
  on: '#B45309',
  'on-contrast': '#FFFFFF',
  'on-soft': '#FEF3C7',
  'switch-off': '#6B7280',
  focus: '#1D4ED8',
  primary: '#1D4ED8',
  'primary-contrast': '#FFFFFF',
  danger: '#B91C1C',
  'danger-contrast': '#FFFFFF',
  'status-ok': '#15803D',
  'load-low': '#166534',
  'load-low-bg': '#DCFCE7',
  'load-mid': '#9A3412',
  'load-mid-bg': '#FFEDD5',
  'load-high': '#B91C1C',
  'load-high-bg': '#FEE2E2',
  'delta-up': '#C2410C',
  'delta-down': '#15803D',
  'banner-warn-bg': '#FEF3C7',
  'banner-warn-ink': '#78350F',
  'banner-info-bg': '#DBEAFE',
  'banner-info-ink': '#1E3A8A',
  'room-off': '#E6EAF0',
  'room-lit': '#FDE68A',
  'house-roof': '#64748B',
  'theme-color': '#FFFFFF',
  solar: '#0F766E',
  'solar-soft': '#CCFBF1',
};

export const DUNKEL: Palette = {
  bg: '#0B1120',
  surface: '#131C2E',
  'surface-raised': '#1A2438',
  'surface-sunken': '#0F1729',
  border: '#2A364D',
  ink: '#F1F5F9',
  'ink-secondary': '#B6C0CF',
  'ink-muted': '#98A3B3',
  on: '#FBBF24',
  'on-contrast': '#111827',
  'on-soft': '#3A2C0C',
  'switch-off': '#8391A5',
  focus: '#93C5FD',
  primary: '#93C5FD',
  'primary-contrast': '#0B1120',
  danger: '#FCA5A5',
  'danger-contrast': '#0B1120',
  'status-ok': '#4ADE80',
  'load-low': '#4ADE80',
  'load-low-bg': '#0F2E1C',
  'load-mid': '#FDBA74',
  'load-mid-bg': '#3B2210',
  'load-high': '#FCA5A5',
  'load-high-bg': '#3F1717',
  'delta-up': '#FDBA74',
  'delta-down': '#4ADE80',
  'banner-warn-bg': '#3A2A0B',
  'banner-warn-ink': '#FDE68A',
  'banner-info-bg': '#172554',
  'banner-info-ink': '#BFDBFE',
  'room-off': '#1C263A',
  'room-lit': '#5B4312',
  'house-roof': '#64748B',
  'theme-color': '#131C2E',
  solar: '#2DD4BF',
  'solar-soft': '#0B2F2C',
};

/** Pflicht-Paare [Vordergrund, Hintergrund, Mindestkontrast] für beide Themes (DESIGN.md). */
export const KONTRAST_PAARE: readonly [TokenName, TokenName, number][] = [
  ['ink', 'bg', 4.5],
  ['ink', 'surface', 4.5],
  ['ink', 'surface-sunken', 4.5],
  ['ink', 'surface-raised', 4.5],
  ['ink-secondary', 'surface', 4.5],
  ['ink-secondary', 'bg', 4.5],
  ['ink-secondary', 'surface-raised', 4.5],
  ['ink-muted', 'surface', 4.5],
  ['ink-muted', 'surface-sunken', 4.5],
  ['on', 'surface', 4.5],
  ['on', 'bg', 3],
  ['on', 'on-soft', 3],
  ['on-contrast', 'on', 3],
  ['on', 'room-off', 3],
  ['on', 'room-lit', 3],
  ['on', 'surface-sunken', 3],
  ['switch-off', 'surface', 3],
  ['focus', 'bg', 3],
  ['focus', 'surface', 3],
  ['focus', 'room-lit', 3],
  ['focus', 'room-off', 3],
  ['primary-contrast', 'primary', 4.5],
  ['danger', 'surface', 4.5],
  ['danger', 'surface-raised', 4.5],
  ['danger-contrast', 'danger', 4.5],
  ['status-ok', 'surface', 4.5],
  ['load-low', 'load-low-bg', 4.5],
  ['load-mid', 'load-mid-bg', 4.5],
  ['load-high', 'load-high-bg', 4.5],
  ['delta-up', 'surface-raised', 4.5],
  ['delta-down', 'surface-raised', 4.5],
  ['delta-up', 'surface', 4.5],
  ['delta-down', 'surface', 4.5],
  ['banner-warn-ink', 'banner-warn-bg', 4.5],
  ['banner-info-ink', 'banner-info-bg', 4.5],
  ['primary', 'banner-warn-bg', 3],
  ['primary', 'banner-info-bg', 3],
  ['ink', 'room-off', 4.5],
  ['ink', 'room-lit', 4.5],
  ['ink-secondary', 'room-off', 4.5],
  ['ink-secondary', 'room-lit', 4.5],
  // 2.1: Solaranlage (Proposal §5.4.6)
  ['solar', 'surface', 4.5],
  ['solar', 'bg', 4.5],
  ['solar', 'surface-raised', 4.5],
  ['solar', 'surface-sunken', 4.5],
  ['solar', 'solar-soft', 4.5],
  ['solar', 'room-off', 4.5],
  ['ink', 'solar-soft', 4.5],
  ['ink-secondary', 'solar-soft', 4.5],
  ['focus', 'solar-soft', 3],
  ['ink-secondary', 'surface-sunken', 3],
];

function kanal(wert: number): number {
  const c = wert / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function leuchtdichte(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.2126 * kanal((n >> 16) & 255) + 0.7152 * kanal((n >> 8) & 255) + 0.0722 * kanal(n & 255);
}

/** WCAG-2.x-Kontrastverhältnis zweier Hex-Farben. */
export function kontrast(a: string, b: string): number {
  const [hell, dunkel] = [leuchtdichte(a), leuchtdichte(b)].sort((x, y) => y - x);
  return (hell + 0.05) / (dunkel + 0.05);
}

function variablen(p: Palette): string {
  return TOKEN_NAMEN.map((n) => `--c-${n}:${p[n]};`).join('');
}

/** CSS mit allen Tokens; `data-theme` wird vor dem ersten Paint gesetzt (FR-28). */
export function tokenCss(): string {
  return `:root,[data-theme="hell"]{${variablen(HELL)}color-scheme:light}[data-theme="dunkel"]{${variablen(DUNKEL)}color-scheme:dark}`;
}
