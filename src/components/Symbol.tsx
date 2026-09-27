// Eigene Inline-SVG-Symbole im Lucide-Stil (24 × 24, Kontur currentColor), immer dekorativ (aria-hidden).
import type { SymbolName as GeraeteSymbol } from '@/domain/katalog';

const PFADE = {
  lampe: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z',
  stehlampe: 'M8 2h8l2 7H6l2-7zM12 9v13M8 22h8',
  fernseher: 'M3 6h18v11H3zM8 21h8M12 17v4',
  soundbar: 'M2 10h20v5H2zM6 12.5h.01M10 12.5h.01M14 12.5h.01M18 12.5h.01',
  spielkonsole: 'M6 11h4M8 9v4M15 12h.01M18 10h.01M17.3 5H6.7a4 4 0 0 0-4 3.6L2 15a3 3 0 0 0 5.2 2L9 15h6l1.8 2a3 3 0 0 0 5.2-2l-.7-6.4A4 4 0 0 0 17.3 5z',
  kuehlschrank: 'M6 2h12v20H6zM6 10h12M9 5v2M9 13v3',
  gefrierschrank: 'M5 4h14v16H5zM12 7v10M8 9l8 6M16 9l-8 6',
  mikrowelle: 'M2 5h20v14H2zM5 8h10v8H5zM18 9h.01M18 13h.01M6 19v2M18 19v2',
  backofen: 'M4 3h16v18H4zM4 8h16M7 5.5h.01M11 5.5h.01M8 12h8v5H8z',
  wasserkocher: 'M6 21h12M7 21l1-12h8l1 12M16 11l3-1v5l-2 1M9 9l.5-4h5l.5 4',
  kaffeemaschine: 'M4 3h14v4H4zM6 7v11h10V7M9 21h4M8 12h6v4a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z',
  geschirrspueler: 'M4 3h16v18H4zM4 8h16M7 5.5h.01M10 5.5h.01M9 13c1 1 2 1 3 0s2-1 3 0M9 16c1 1 2 1 3 0s2-1 3 0',
  waschmaschine: 'M4 2h16v20H4zM4 7h16M7 4.5h.01M10 4.5h.01M12 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  trockner: 'M4 2h16v20H4zM4 7h16M7 4.5h.01M12 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM10 14c1-1 3 1 4 0',
  foehn: 'M13 6a5 5 0 1 0 0 10h8V6zM9 11h.01M11 16l-2 6h3l2-6',
  heizluefter: 'M4 4h16v16H4zM12 8v2M12 14v2M8 12h2M14 12h2M12 12h.01M9.2 9.2l1.4 1.4M13.4 13.4l1.4 1.4M9.2 14.8l1.4-1.4M13.4 10.6l1.4-1.4',
  pc: 'M6 2h8v20H6zM9 6h2M9 9h2M10 18h.01M17 8v12',
  monitor: 'M2 4h20v13H2zM8 21h8M12 17v4',
  router: 'M3 14h18v6H3zM7 17h.01M11 17h.01M17 14V9M8.5 9.5a5 5 0 0 1 7 0M6 7a8.5 8.5 0 0 1 12 0',
  wallbox: 'M6 3h9v18H6zM9 7h3M10.5 11l-1.5 3h3l-1.5 3M15 8h2a2 2 0 0 1 2 2v6a2 2 0 0 0 2 2',
  auto: 'M5 17h14M3 13l2-6a2 2 0 0 1 2-1.5h10A2 2 0 0 1 19 7l2 6v4h-2M5 17H3v-4h18M7 17a2 2 0 1 0 4 0M13 17a2 2 0 1 0 4 0M7 13h.01M17 13h.01',
  blitz: 'M13 2 4 14h7l-1 8 9-12h-7z',
  solar: 'M3 20 6 8h12l3 12zM4.5 14h15M12 8v12M8 8l-1.5 12M16 8l1.5 12',
  haus: 'M3 11l9-8 9 8M5 9.5V21h14V9.5M10 21v-6h4v6',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-5M12 8h.01',
  schliessen: 'M18 6L6 18M6 6l12 12',
  'pfeil-hoch': 'M12 19V5M5 12l7-7 7 7',
  'pfeil-runter': 'M12 5v14M19 12l-7 7-7-7',
  warnung: 'M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
  uhr: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  schild: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  power: 'M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0',
  film: 'M3 3h18v18H3zM7 3v18M17 3v18M3 7.5h4M3 12h18M3 16.5h4M17 7.5h4M17 16.5h4',
  sonnenaufgang: 'M12 2v6M4.9 10.9l1.4 1.4M2 18h2M20 18h2M17.7 12.3l1.4-1.4M22 22H2M8 6l4-4 4 4M16 18a4 4 0 0 0-8 0',
  mond: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z',
  sonne: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4',
  'monitor-system': 'M2 4h20v13H2zM8 21h8M12 17v4',
  verbunden: 'M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0',
  verbinde: 'M21 12a9 9 0 1 1-6.2-8.6',
  getrennt: 'M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 4.2-2.7M10.7 5.1A15 15 0 0 1 22 8.8M5 12.9a10 10 0 0 1 5.2-2.8M19 12.9a10 10 0 0 0-1.6-1.3M12 20h.01',
  haekchen: 'M20 6L9 17l-5-5',
  birne: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z',
} as const;

export type SymbolName = keyof typeof PFADE | 'laststufe-1' | 'laststufe-2' | 'laststufe-3';

/** Gerätesymbol aus dem Katalog → Zeichnung (fünf Lampen teilen sich eine, K-11) */
export const GERAETE_SYMBOL: Record<GeraeteSymbol, SymbolName> = {
  deckenlampe: 'lampe',
  stehlampe: 'stehlampe',
  nachttischlampe: 'lampe',
  spiegelleuchte: 'lampe',
  schreibtischlampe: 'lampe',
  fernseher: 'fernseher',
  soundbar: 'soundbar',
  spielkonsole: 'spielkonsole',
  kuehlschrank: 'kuehlschrank',
  gefrierschrank: 'gefrierschrank',
  mikrowelle: 'mikrowelle',
  backofen: 'backofen',
  wasserkocher: 'wasserkocher',
  kaffeemaschine: 'kaffeemaschine',
  geschirrspueler: 'geschirrspueler',
  waschmaschine: 'waschmaschine',
  waeschetrockner: 'trockner',
  foehn: 'foehn',
  heizluefter: 'heizluefter',
  pc: 'pc',
  monitor: 'monitor',
  router: 'router',
  wallbox: 'wallbox',
};

interface SymbolProps {
  name: SymbolName;
  groesse?: number;
  className?: string;
}

export function Symbol({ name, groesse = 24, className }: SymbolProps) {
  const gemeinsam = {
    width: groesse,
    height: groesse,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
    focusable: false,
    className,
  } as const;

  if (name.startsWith('laststufe-')) {
    const stufe = Number(name.slice(-1));
    return (
      <svg {...gemeinsam} fill="currentColor">
        {[0, 1, 2].map((i) => (
          <rect
            key={i}
            x={3 + i * 7}
            y={16 - i * 6}
            width={4}
            height={6 + i * 6}
            rx={1}
            opacity={i < stufe ? 1 : 0.3}
          />
        ))}
      </svg>
    );
  }

  const gefuellt = name === 'verbunden';
  return (
    <svg
      {...gemeinsam}
      fill={gefuellt ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PFADE[name as keyof typeof PFADE]} />
    </svg>
  );
}
