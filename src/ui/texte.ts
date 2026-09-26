// Microcopy-Katalog (UX EXPERIENCE.md, verbindlich laut K-13). Geräte-, Raum- und Szenennamen kommen
// aus dem Gerätekatalog; Zahlen immer über src/domain/format.ts. „…“ = U+2026, Minus = U+2212.

export const T = {
  seite: {
    titel: 'IoT-Haus – Energie & Steuerung',
    beschreibung: 'Simuliertes Zuhause: Geräte schalten und live sehen, was das Haus gerade verbraucht und kostet.',
  },
  sprunglink: 'Zu den Räumen springen',
  kopf: {
    marke: 'IoT-Haus',
    verbrauchLabel: 'Hausverbrauch',
    verbrauchSr: (watt: string) => `Hausverbrauch ${watt} Watt`,
    laststufeSr: 'Laststufe ',
    kostenSr: (euro: string) => `Kosten ${euro} Euro pro Stunde`,
  },
  status: {
    verbunden: 'Verbunden',
    verbinde: 'Verbinde …',
    getrennt: 'Getrennt',
    sr: 'Verbindungsstatus: ',
  },
  uebersicht: {
    titel: 'Übersicht',
    standby: 'davon Standby',
    standbySr: (watt: string) => `davon Standby ${watt} Watt`,
    heute: 'Heute',
    heuteSr: (kwh: string, euro: string) => `Heute ${kwh} Kilowattstunden, ${euro} Euro`,
    infoKnopf: 'Hinweis zu den Werten',
    infoText: 'Schätzung auf Basis typischer Geräteleistungen, gezählt seit 00:00 Uhr.',
    strompreis: 'Strompreis',
    strompreisSr: (preis: string) => `Strompreis ${preis} Euro pro Kilowattstunde`,
  },
  theme: { legende: 'Darstellung', system: 'System', hell: 'Hell', dunkel: 'Dunkel' },
  szenen: {
    titel: 'Szenen',
    untertitel: {
      'alles-aus': 'Grundlast bleibt an',
      filmabend: 'Stehlampe, Fernseher, Soundbar',
      morgenroutine: 'Kaffee, Wasserkocher, Bad warm',
      'gute-nacht': 'Nur Nachttischlampe bleibt an',
    },
    busy: 'Wird ausgeführt …',
  },
  haus: {
    titel: 'Hausansicht',
    etage: { OG: 'Obergeschoss', EG: 'Erdgeschoss' },
    raumAn: (n: number) => `${n} an`,
    raumName: (raum: string, watt: string, n: number) =>
      `${raum}, ${watt}, ${n === 1 ? '1 Gerät an' : `${n} Geräte an`} – zur Raumkarte`,
    raumNameLaden: (raum: string) => `${raum} – zur Raumkarte`,
    legende: 'Warm leuchtend: Licht ist an.',
  },
  raeume: { titel: 'Räume' },
  raum: {
    meta: (etage: string, n: number, gesamt: number) => `${etage} · ${n} von ${gesamt} an`,
    metaSr: (etage: string, n: number, gesamt: number) => `${etage}, ${n} von ${gesamt} Geräten an`,
    verbrauchSr: 'Raumverbrauch ',
    aus: 'Raum ausschalten',
    ausSr: (raum: string) => `${raum} ausschalten`,
    ausBusy: 'Wird ausgeschaltet …',
    ausGesperrt: 'Keine Geräte zum Ausschalten an',
  },
  geraet: {
    name: (geraet: string, raum: string) => `${geraet}, ${raum}`,
    standby: (watt: string) => `Standby ${watt}`,
    aus: 'aus',
    busy: 'wird geschaltet …',
    busySr: 'wird geschaltet',
    restzeitSr: (s: number) => {
      const m = Math.floor(s / 60);
      const r = s % 60;
      return `noch ${m} ${m === 1 ? 'Minute' : 'Minuten'} ${r} ${r === 1 ? 'Sekunde' : 'Sekunden'}`;
    },
    restzeitEnde: 'schaltet aus …',
    restzeitEndeSr: 'schaltet gleich aus',
  },
  badge: {
    grundlast: 'Grundlast',
    grundlastSr: 'Grundlastgerät',
    autoaus: (min: number) => `Auto-Aus ${min} min`,
    autoausSr: (min: number) => `schaltet nach ${min} ${min === 1 ? 'Minute' : 'Minuten'} automatisch aus`,
  },
  verbrauch: {
    titel: 'Verbrauch nach Raum',
  },
  fuss: {
    hinweis: 'Alle Leistungs- und Kostenwerte sind Schätzungen auf Basis typischer Geräteleistungen.',
    version: (v: string) => `IoT-Haus ${v}`,
  },
  toast: {
    szene: (name: string) => `${name} aktiviert`,
    raum: (name: string) => `${name} ausgeschaltet`,
    autoaus: (geraetMitRaum: string) => `${geraetMitRaum} automatisch ausgeschaltet`,
    keineAenderung: (name: string) => `${name}: keine Änderung nötig`,
    fehlerGeraet: (name: string) => `${name} konnte nicht geschaltet werden. Bitte erneut versuchen.`,
    fehlerSzene: (name: string) => `${name} konnte nicht ausgeführt werden. Bitte erneut versuchen.`,
    fehlerRaum: (name: string) => `${name} konnte nicht ausgeschaltet werden. Bitte erneut versuchen.`,
    schliessen: 'Meldung schließen',
    liste: 'Meldungen',
  },
  ansage: {
    geraet: (name: string, an: boolean, haus: string) => `${name} ${an ? 'an' : 'aus'}. ${haus}`,
    szene: (name: string, haus: string) => `${name} aktiviert. ${haus}`,
    raum: (name: string, haus: string) => `${name} ausgeschaltet. ${haus}`,
    autoaus: (name: string, haus: string) => `${name} automatisch ausgeschaltet. ${haus}`,
    haus: (watt: string) => `Hausverbrauch ${watt}.`,
    wiederVerbunden: 'Verbindung wiederhergestellt.',
  },
  banner: {
    getrennt: 'Verbindung getrennt – Schalter sind gesperrt, bis die Verbindung wieder steht.',
    getrenntAktion: 'Jetzt neu verbinden',
    countdown: (s: number) => `Nächster Versuch in ${s} s`,
    versuch: 'Verbinde …',
    versionTitel: 'Neue Version verfügbar',
    versionText: 'Die App wurde aktualisiert. Bitte neu laden, um weiter zu schalten.',
    versionAktion: 'Neu laden',
  },
  laden: 'Hauszustand wird geladen …',
  erstfehler: {
    titel: 'Keine Verbindung zum Haus',
    text: 'Die App versucht es automatisch erneut. Bitte prüfen, ob der Server läuft.',
  },
  dialog: {
    titel: (geraet: string) => `${geraet} wirklich ausschalten?`,
    text: 'Es ist ein Grundlastgerät und läuft normalerweise dauerhaft.',
    abbrechen: 'Abbrechen',
    ausschalten: 'Ausschalten',
    offline: 'Verbindung getrennt – Ausschalten ist gerade nicht möglich.',
  },
  fehlergrenze: {
    titel: 'Die Anzeige konnte nicht aktualisiert werden',
    text: 'Der Zustand des Hauses ist unverändert. Bitte die Seite neu laden.',
    aktion: 'Neu laden',
  },
} as const;
