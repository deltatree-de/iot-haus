// Microcopy-Katalog (UX EXPERIENCE.md, verbindlich laut K-13). Geräte-, Raum- und Szenennamen kommen
// aus dem Gerätekatalog; Zahlen immer über src/domain/format.ts. „…“ = U+2026, Minus = U+2212.

export const T = {
  seite: {
    titel: 'IoT-Haus – Energie & Steuerung',
    beschreibung:
      'Simuliertes Zuhause mit Solaranlage und Elektroauto: Geräte schalten und live sehen, was das Haus verbraucht, erzeugt und kostet.',
  },
  sprunglink: 'Zu den Räumen springen',
  kopf: {
    marke: 'IoT-Haus',
    verbrauchLabel: 'Hausverbrauch',
    verbrauchSr: (watt: string) => `Hausverbrauch ${watt} Watt`,
    laststufeSr: 'Laststufe ',
    kostenSr: (euro: string) => `Kosten ${euro} Euro pro Stunde`,
    solar: 'Solar',
    netzbezug: 'Netzbezug',
    einspeisung: 'Einspeisung',
    netzSr: (solar: string, art: 'bezug' | 'einspeisung', watt: string) =>
      `Solar ${solar} Watt, ${art === 'bezug' ? 'Netzbezug' : 'Einspeisung'} ${watt} Watt`,
    ertrag: 'Ertrag',
    ertragSr: (euro: string) => `Ertrag ${euro} Euro pro Stunde`,
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
    heuteSr: (kwh: string, euro: string, ertrag: boolean) =>
      `Heute ${kwh} Kilowattstunden, ${ertrag ? 'Ertrag ' : ''}${euro} Euro`,
    heuteErtrag: 'Ertrag',
    netzHeute: (bezug: string, einsp: string) => `Netz heute: Bezug ${bezug} · Einspeisung ${einsp}`,
    netzHeuteSr: (bezug: string, einsp: string) =>
      `Netz heute: Bezug ${bezug} Kilowattstunden, Einspeisung ${einsp} Kilowattstunden`,
    verguetung: 'Einspeisevergütung',
    verguetungSr: (preis: string) => `Einspeisevergütung ${preis} Euro pro Kilowattstunde`,
    infoKnopf: 'Hinweis zu den Werten',
    infoText:
      'Schätzung auf Basis typischer Geräteleistungen und der eingestellten Sonne, gezählt seit 00:00 Uhr. Kosten = Netzbezug × Strompreis abzüglich Einspeisung × Einspeisevergütung.',
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
    etage: { OG: 'Obergeschoss', EG: 'Erdgeschoss', Außen: 'Außenbereich' },
    aussen: 'Außen',
    raumAn: (n: number) => `${n} an`,
    raumName: (raum: string, watt: string, n: number) =>
      `${raum}, ${watt}, ${n === 1 ? '1 Gerät an' : `${n} Geräte an`} – zur Raumkarte`,
    raumNameLaden: (raum: string) => `${raum} – zur Raumkarte`,
    legende: 'Warm leuchtend: Licht ist an. Blitz: Auto lädt.',
    carportAuto: (zustand: 'laedt' | 'zuhause' | 'unterwegs', p: string) =>
      zustand === 'unterwegs' ? 'Auto unterwegs' : `Auto ${zustand === 'laedt' ? 'lädt' : 'zu Hause'} ${p}`,
    carportAutoSr: (zustand: 'laedt' | 'zuhause' | 'unterwegs', p: number) =>
      zustand === 'unterwegs'
        ? 'Elektroauto unterwegs'
        : `Elektroauto ${zustand === 'laedt' ? 'lädt' : 'zu Hause'}, Akku ${p} %`,
    carportName: (watt: string, auto: string) => `Carport, ${watt}, ${auto} – zur Raumkarte`,
  },
  solar: {
    titel: 'Solaranlage',
    erzeugung: 'Erzeugung',
    erzeugungSr: (watt: string) => `Erzeugung ${watt} Watt`,
    spitzenleistungSr: (kwp: string) => `Spitzenleistung ${kwp} Kilowatt-Peak`,
    heuteErzeugt: 'Heute erzeugt',
    heuteErzeugtSr: (kwh: string) => `Heute erzeugt ${kwh} Kilowattstunden`,
    sonneLegende: 'Sonne gerade',
    stufeSr: (name: string, watt: string) => `${name}, ${watt} Watt`,
    busy: 'wird eingestellt …',
    dach: (watt: string) => `Solar ${watt}`,
    dachSr: (watt: string) => `Solaranlage ${watt} Watt`,
  },
  auto: {
    name: 'Elektroauto',
    zuhause: 'zu Hause',
    unterwegs: 'unterwegs',
    laedt: 'lädt',
    akku: (p: string) => `Akku ${p}`,
    akkuAbfahrt: (p: string) => `Akku ${p} bei Abfahrt`,
    vollIn: (h: number, m: number) => (h > 0 ? `voll in ${h} h ${m} min` : `voll in ${m} min`),
    vollInSr: (h: number, m: number) =>
      `voll in ${h > 0 ? `${h} ${h === 1 ? 'Stunde' : 'Stunden'} ` : ''}${m} ${m === 1 ? 'Minute' : 'Minuten'}`,
    voll: 'Akku voll',
    statusSr: (ort: string, p: number, laedt: boolean) =>
      `Elektroauto ${ort}, Akku ${p} Prozent${laedt ? ', lädt' : ''}`,
    wegfahren: 'Wegfahren',
    zurueckkommen: 'Zurückkommen',
    wegfahrenSr: 'Elektroauto wegfahren lassen',
    zurueckSr: 'Elektroauto zurückkommen lassen',
    busy: 'Wird ausgeführt …',
    zuLeer: 'Akku zu leer zum Wegfahren (mindestens 15 %).',
    fahrtHinweis: 'Eine Fahrt verbraucht 15 % Akku.',
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
    sperreUnterwegs: 'Auto unterwegs',
    sperreVoll: 'Akku voll',
    sperreSr: (grund: string) => `nicht verfügbar: ${grund}`,
    sperreUnterwegsSr: 'Elektroauto ist unterwegs',
    sperreVollSr: 'Akku ist voll',
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
    sonne: (stufe: string, watt: string) => `Sonne: ${stufe} · Solar ${watt}`,
    autoWeg: 'Elektroauto weggefahren',
    autoWegLaden: 'Elektroauto weggefahren, Laden beendet',
    autoZurueck: (p: string) => `Elektroauto zurück · Akku ${p}`,
    akkuVoll: 'Akku voll – Laden beendet (Carport)',
    fehlerSonne: 'Sonne konnte nicht eingestellt werden. Bitte erneut versuchen.',
    fehlerAuto: (weg: boolean) =>
      `Elektroauto konnte nicht ${weg ? 'wegfahren' : 'zurückkommen'}. Bitte erneut versuchen.`,
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
    sonne: (stufe: string, solar: string, netz: string) => `Sonne: ${stufe}. Solar ${solar}. ${netz}`,
    netz: (art: 'bezug' | 'einspeisung', watt: string) => `${art === 'bezug' ? 'Netzbezug' : 'Einspeisung'} ${watt}.`,
    autoWeg: (haus: string) => `Elektroauto weggefahren. ${haus}`,
    autoZurueck: (p: string) => `Elektroauto zurück, Akku ${p} Prozent.`,
    akkuVoll: (haus: string) => `Akku voll, Laden beendet. ${haus}`,
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
