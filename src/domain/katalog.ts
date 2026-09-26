// Gerätekatalog IoT-Haus 2.0 – einzige Quelle für Räume und Geräte (PRD Anhang A).
// Leistungswerte sind typische Mittelwerte eines deutschen Haushalts (Schätzung).

export type Etage = 'EG' | 'OG';

export type Kategorie = 'licht' | 'kueche' | 'unterhaltung' | 'haushalt' | 'koerperpflege' | 'heizung' | 'it';

export type SymbolName =
  | 'deckenlampe'
  | 'stehlampe'
  | 'nachttischlampe'
  | 'spiegelleuchte'
  | 'schreibtischlampe'
  | 'fernseher'
  | 'soundbar'
  | 'spielkonsole'
  | 'kuehlschrank'
  | 'gefrierschrank'
  | 'mikrowelle'
  | 'backofen'
  | 'wasserkocher'
  | 'kaffeemaschine'
  | 'geschirrspueler'
  | 'waschmaschine'
  | 'waeschetrockner'
  | 'foehn'
  | 'heizluefter'
  | 'pc'
  | 'monitor'
  | 'router';

export const KATEGORIE_NAMEN: Record<Kategorie, string> = {
  licht: 'Licht',
  kueche: 'Küche',
  unterhaltung: 'Unterhaltung',
  haushalt: 'Haushalt',
  koerperpflege: 'Körperpflege',
  heizung: 'Heizung',
  it: 'IT',
};

export const RAEUME = [
  { id: 'wohnzimmer', name: 'Wohnzimmer', etage: 'EG' },
  { id: 'kueche', name: 'Küche', etage: 'EG' },
  { id: 'hwr', name: 'Hauswirtschaftsraum', etage: 'EG' },
  { id: 'schlafzimmer', name: 'Schlafzimmer', etage: 'OG' },
  { id: 'bad', name: 'Badezimmer', etage: 'OG' },
  { id: 'arbeitszimmer', name: 'Arbeitszimmer', etage: 'OG' },
] as const satisfies readonly { id: string; name: string; etage: Etage }[];

export type RaumId = (typeof RAEUME)[number]['id'];
export type Raum = (typeof RAEUME)[number];

interface GeraetDefinition {
  id: string;
  name: string;
  raum: RaumId;
  kategorie: Kategorie;
  symbol: SymbolName;
  betriebW: number;
  standbyW: number;
  grundlast: boolean;
  autoAusS: number | null;
}

const AUTO_AUS_S = 180;

export const GERAETE = [
  { id: 'wohnzimmer.deckenlampe', name: 'Deckenlampe', raum: 'wohnzimmer', kategorie: 'licht', symbol: 'deckenlampe', betriebW: 15, standbyW: 0, grundlast: false, autoAusS: null },
  { id: 'wohnzimmer.stehlampe', name: 'Stehlampe', raum: 'wohnzimmer', kategorie: 'licht', symbol: 'stehlampe', betriebW: 10, standbyW: 0, grundlast: false, autoAusS: null },
  { id: 'wohnzimmer.fernseher', name: 'Fernseher', raum: 'wohnzimmer', kategorie: 'unterhaltung', symbol: 'fernseher', betriebW: 90, standbyW: 0.5, grundlast: false, autoAusS: null },
  { id: 'wohnzimmer.soundbar', name: 'Soundbar', raum: 'wohnzimmer', kategorie: 'unterhaltung', symbol: 'soundbar', betriebW: 25, standbyW: 0.5, grundlast: false, autoAusS: null },
  { id: 'wohnzimmer.spielkonsole', name: 'Spielkonsole', raum: 'wohnzimmer', kategorie: 'unterhaltung', symbol: 'spielkonsole', betriebW: 180, standbyW: 1.5, grundlast: false, autoAusS: null },
  { id: 'kueche.deckenlampe', name: 'Deckenlampe', raum: 'kueche', kategorie: 'licht', symbol: 'deckenlampe', betriebW: 15, standbyW: 0, grundlast: false, autoAusS: null },
  { id: 'kueche.kuehlschrank', name: 'Kühlschrank', raum: 'kueche', kategorie: 'kueche', symbol: 'kuehlschrank', betriebW: 35, standbyW: 0, grundlast: true, autoAusS: null },
  { id: 'kueche.mikrowelle', name: 'Mikrowelle', raum: 'kueche', kategorie: 'kueche', symbol: 'mikrowelle', betriebW: 1200, standbyW: 1.5, grundlast: false, autoAusS: AUTO_AUS_S },
  { id: 'kueche.backofen', name: 'Backofen', raum: 'kueche', kategorie: 'kueche', symbol: 'backofen', betriebW: 2000, standbyW: 1, grundlast: false, autoAusS: null },
  { id: 'kueche.wasserkocher', name: 'Wasserkocher', raum: 'kueche', kategorie: 'kueche', symbol: 'wasserkocher', betriebW: 2200, standbyW: 0, grundlast: false, autoAusS: AUTO_AUS_S },
  { id: 'kueche.kaffeemaschine', name: 'Kaffeemaschine', raum: 'kueche', kategorie: 'kueche', symbol: 'kaffeemaschine', betriebW: 1300, standbyW: 1, grundlast: false, autoAusS: null },
  { id: 'kueche.geschirrspueler', name: 'Geschirrspüler', raum: 'kueche', kategorie: 'haushalt', symbol: 'geschirrspueler', betriebW: 600, standbyW: 0.5, grundlast: false, autoAusS: null },
  { id: 'hwr.deckenlampe', name: 'Deckenlampe', raum: 'hwr', kategorie: 'licht', symbol: 'deckenlampe', betriebW: 10, standbyW: 0, grundlast: false, autoAusS: null },
  { id: 'hwr.waschmaschine', name: 'Waschmaschine', raum: 'hwr', kategorie: 'haushalt', symbol: 'waschmaschine', betriebW: 500, standbyW: 0.5, grundlast: false, autoAusS: null },
  { id: 'hwr.waeschetrockner', name: 'Wäschetrockner', raum: 'hwr', kategorie: 'haushalt', symbol: 'waeschetrockner', betriebW: 700, standbyW: 0.5, grundlast: false, autoAusS: null },
  { id: 'hwr.gefrierschrank', name: 'Gefrierschrank', raum: 'hwr', kategorie: 'kueche', symbol: 'gefrierschrank', betriebW: 20, standbyW: 0, grundlast: true, autoAusS: null },
  { id: 'schlafzimmer.deckenlampe', name: 'Deckenlampe', raum: 'schlafzimmer', kategorie: 'licht', symbol: 'deckenlampe', betriebW: 12, standbyW: 0, grundlast: false, autoAusS: null },
  { id: 'schlafzimmer.nachttischlampe', name: 'Nachttischlampe', raum: 'schlafzimmer', kategorie: 'licht', symbol: 'nachttischlampe', betriebW: 5, standbyW: 0, grundlast: false, autoAusS: null },
  { id: 'schlafzimmer.fernseher', name: 'Fernseher', raum: 'schlafzimmer', kategorie: 'unterhaltung', symbol: 'fernseher', betriebW: 40, standbyW: 0.5, grundlast: false, autoAusS: null },
  { id: 'bad.deckenlampe', name: 'Deckenlampe', raum: 'bad', kategorie: 'licht', symbol: 'deckenlampe', betriebW: 10, standbyW: 0, grundlast: false, autoAusS: null },
  { id: 'bad.spiegelleuchte', name: 'Spiegelleuchte', raum: 'bad', kategorie: 'licht', symbol: 'spiegelleuchte', betriebW: 8, standbyW: 0, grundlast: false, autoAusS: null },
  { id: 'bad.foehn', name: 'Föhn', raum: 'bad', kategorie: 'koerperpflege', symbol: 'foehn', betriebW: 1800, standbyW: 0, grundlast: false, autoAusS: null },
  { id: 'bad.heizluefter', name: 'Heizlüfter', raum: 'bad', kategorie: 'heizung', symbol: 'heizluefter', betriebW: 2000, standbyW: 0, grundlast: false, autoAusS: null },
  { id: 'arbeitszimmer.deckenlampe', name: 'Deckenlampe', raum: 'arbeitszimmer', kategorie: 'licht', symbol: 'deckenlampe', betriebW: 12, standbyW: 0, grundlast: false, autoAusS: null },
  { id: 'arbeitszimmer.schreibtischlampe', name: 'Schreibtischlampe', raum: 'arbeitszimmer', kategorie: 'licht', symbol: 'schreibtischlampe', betriebW: 6, standbyW: 0, grundlast: false, autoAusS: null },
  { id: 'arbeitszimmer.pc', name: 'PC', raum: 'arbeitszimmer', kategorie: 'it', symbol: 'pc', betriebW: 150, standbyW: 2, grundlast: false, autoAusS: null },
  { id: 'arbeitszimmer.monitor', name: 'Monitor', raum: 'arbeitszimmer', kategorie: 'it', symbol: 'monitor', betriebW: 25, standbyW: 0.3, grundlast: false, autoAusS: null },
  { id: 'arbeitszimmer.router', name: 'Router', raum: 'arbeitszimmer', kategorie: 'it', symbol: 'router', betriebW: 10, standbyW: 0, grundlast: true, autoAusS: null },
] as const satisfies readonly GeraetDefinition[];

export type GeraetId = (typeof GERAETE)[number]['id'];

export type Geraet = GeraetDefinition & { id: GeraetId };

export const GERAETE_IDS: readonly GeraetId[] = GERAETE.map((g) => g.id);

const geraeteIndex = new Map<string, Geraet>(GERAETE.map((g) => [g.id, g]));
const raumIndex = new Map<string, Raum>(RAEUME.map((r) => [r.id, r]));

export function istGeraetId(wert: unknown): wert is GeraetId {
  return typeof wert === 'string' && geraeteIndex.has(wert);
}

export function istRaumId(wert: unknown): wert is RaumId {
  return typeof wert === 'string' && raumIndex.has(wert);
}

export function geraetById(id: GeraetId): Geraet {
  return geraeteIndex.get(id) as Geraet;
}

export function raumById(id: RaumId): Raum {
  return raumIndex.get(id) as Raum;
}

export function geraeteImRaum(raum: RaumId): Geraet[] {
  return GERAETE.filter((g) => g.raum === raum);
}
