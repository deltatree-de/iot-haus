# IoT-Haus 2.1 – Datenmodelle

## Stammdaten (`src/domain/katalog.ts`, `szenen.ts`, `elektroauto.ts`, `solar.ts`)

```ts
type Etage = 'EG' | 'OG' | 'Außen';
type Kategorie = 'licht' | 'kueche' | 'unterhaltung' | 'haushalt' | 'koerperpflege' | 'heizung' | 'it' | 'mobilitaet';

RAEUME: { id, name, etage }[]            // 7 Bereiche: wohnzimmer, kueche, hwr (EG); schlafzimmer, bad, arbeitszimmer (OG);
                                         // carport (Außen, als letzter Eintrag)
HAUS_ETAGEN = ['OG', 'EG']               // Raster der Hausansicht; 'Außen' wird darunter separat gezeigt
GERAETE: {
  id: `${raum}.${geraet}`,               // z. B. 'kueche.mikrowelle', 'carport.wallbox'
  name, raum, kategorie, symbol,
  betriebW: number,                      // Leistung eingeschaltet
  standbyW: number,                      // Leistung ausgeschaltet
  grundlast: boolean,                    // Kühlschrank, Gefrierschrank, Router
  autoAusS: 180 | null,                  // Wasserkocher, Mikrowelle
}[]                                      // 29 Geräte; Wallbox: 11.000 W, Standby 3 W, keine Grundlast, kein Auto-Aus
SZENEN: { id, name, symbol, allesAus: boolean, ziele: Partial<Record<GeraetId, boolean>> }[]

ELEKTROAUTO = {
  name: 'Elektroauto',
  kapazitaetWh: 60_000,
  fahrtWh: 9_000,                        // je Fahrt, abgezogen beim Zurückkommen; zugleich Mindeststand zum Wegfahren (15 %)
  startAkkuWh: 30_000,                   // 50 % beim ersten Start
  ladegeraet: 'carport.wallbox',         // Ladeleistung = betriebW der Wallbox
}

SOLARANLAGE = { spitzenleistungW: 9_800 }
SONNENSTUFEN = [                         // Erzeugung = 9.800 W × anteil
  { id: 'nacht',   name: 'Nacht',   anteil: 0 },     //     0 W
  { id: 'bedeckt', name: 'Bedeckt', anteil: 0.10 },  //   980 W
  { id: 'wolkig',  name: 'Wolkig',  anteil: 0.35 },  // 3.430 W
  { id: 'heiter',  name: 'Heiter',  anteil: 0.65 },  // 6.370 W
  { id: 'sonnig',  name: 'Sonnig',  anteil: 0.85 },  // 8.330 W
]
```

`GeraetId`, `RaumId`, `SzeneId` und `SonnenStufe` sind aus den Konstanten abgeleitete Literal-Typen. Eine Tabelle aller Geräte steht im
[README](../README.md#gerätekatalog). Spitzenleistung, Akku und Wallbox sind Katalogwerte, keine Umgebungsvariablen.

## Zustand (`src/domain/protokoll.ts`, `elektroauto.ts`, `solar.ts`)

```ts
type GeraeteZustand = { an: boolean; seit: number };     // seit = ms seit Epoch der letzten Änderung
type HausZustand    = Record<GeraetId, GeraeteZustand>;  // immer alle 29 Geräte
type AutoZustand    = { zuhause: boolean; akkuWh: number; stand: number };  // akkuWh ungerundet 0…60.000, integriert bis stand
type SonnenZustand  = { stufe: SonnenStufe; seit: number };
type Energie        = { datum: string; wh: number; bezugWh: number; einspeisungWh: number };
                      // datum YYYY-MM-DD (Europe/Berlin); Verbrauch, Netzbezug, Einspeisung in Wh, ungerundet
```

Ausgangszustand beim ersten Start: nur Grundlastgeräte an (`ausgangszustand` in `befehle.ts`), Auto zu Hause mit 30.000 Wh
(`ausgangsAuto`), Sonne „Nacht“ (`ausgangsSonne`). Hausverbrauch 78,3 W („78 W“), davon 13,3 W Standby.

## Rechenregeln (`src/domain/verbrauch.ts`, `energie.ts`, `elektroauto.ts`)

- Geräteleistung = `an ? betriebW : standbyW`; Hausverbrauch = Summe aller 29 Geräte (inkl. Wallbox); Raumverbrauch analog.
- Standby-Anteil = Summe `standbyW` der ausgeschalteten Geräte.
- Laststufe auf den gerundeten Hausverbrauch: < 500 niedrig, < 2.000 mittel, sonst hoch. Die Netzbilanz ändert daran nichts.
- **Netzbilanz** (`netzbilanz`) aus gerundetem Hausverbrauch V und gerundeter Erzeugung E: Netzbezug = max(0, V − E),
  Einspeisung = max(0, E − V). So gilt sichtbar exakt V − Solar = Netzbezug bzw. −Einspeisung.
- Kosten pro Stunde = Netzbezug / 1000 × Strompreis. Ist die Einspeisung > 0, zeigt die App stattdessen
  Ertrag pro Stunde = Einspeisung / 1000 × Einspeisevergütung (`ertragProStunde`). Beispiel: 78 W bei „Sonnig“ → Einspeisung 8.252 W,
  Ertrag 0,66 €/h.
- Tagesenergie: Der Server integriert stückweise konstant drei Reihen (`integriere`): `wh += V·t`, `bezugWh += max(0, V − E)·t`,
  `einspeisungWh += max(0, E − V)·t` (ungerundete Werte). Neustart um 00:00 Uhr Europe/Berlin (auch an 23- und 25-Stunden-Tagen).
  Je Integrationsschritt zählen höchstens 2 Minuten; größere Zeitsprünge gelten nicht als Verbrauch.
- Heute erzeugt = `wh − bezugWh + einspeisungWh` (`tagesErzeugungWh`).
- Tageskosten netto = `bezugWh`/1000 × Strompreis − `einspeisungWh`/1000 × Einspeisevergütung (`tagesKosten`). Negativ → Anzeige
  „Ertrag ‹x› €“. Beispiel: 2.000 W bei „Wolkig“ 30 min → 1,00 kWh, Bezug 0, Einspeisung 715 Wh, erzeugt 1,72 kWh, „Ertrag 0,06 €“.
- **Akku:** Lädt die Wallbox und ist das Auto zu Hause, steigt `akkuWh` um 11.000 W × Zeit (verlustfrei), höchstens bis 60.000 Wh.
  Der Server schreibt ihn im selben Schritt wie die Tagesenergie fort; Browser extrapolieren mit `akkuWhBei` nur für die Anzeige.
  Prozent = abgerundet (`akkuProzent`), 100 nur bei vollem Akku (Toleranz 0,5 Wh). Restladezeit ab 50 %: 9.818 s („voll in 2 h 44 min“).
- **Regeln:** `darfLaden` = zu Hause und nicht voll; `darfWegfahren` = zu Hause und ≥ 9.000 Wh; `nachRueckkehr` = max(0, akkuWh − 9.000).
  `erzwingeLadeRegeln` schaltet die Wallbox aus, wenn das Auto unterwegs oder der Akku voll ist (Wegfahren, Akku voll, Start).
- Anzeige: Zwischen Zahl und Einheit steht U+202F (schmales geschütztes Leerzeichen), z. B. „1.274 W“, „64 %“, „9,8 kWp“.
- Gerundet wird nur bei der Anzeige (`format.ts`, de-DE; neu `akku`, `kwp`).

## Wo liegen Daten

| Ort | Inhalt | Lebensdauer |
|---|---|---|
| Speicher des Node-Servers | autoritativer `HausZustand`, `AutoZustand`, `SonnenZustand`, `Energie`, Auto-Aus- und Akku-voll-Timer | Prozess |
| Mosquitto (retained, Volume `mosquitto-data`) | `iot-haus/v2/geraet/<id>/zustand` (bei jeder Änderung), `iot-haus/v2/solar/sonne` (bei Änderung), `iot-haus/v2/auto/zustand` (bei Änderung von Auto/Wallbox, 60-s-Takt, SIGTERM), `iot-haus/v2/energie/heute` `v: 2` (60-s-Takt, SIGTERM) | dauerhaft |
| Browser-Speicher | Kopie des Serverzustands im Reducer (inkl. Auto, Sonne, Einspeisevergütung) | Tab |
| `localStorage` | nur `iot-haus.theme` (`system`/`hell`/`dunkel`); Altschlüssel `smart-home-state` wird gelöscht | dauerhaft im Browser |

Ein Energie-Payload `v: 1` aus 2.0 wird beim Start als `bezugWh = wh`, `einspeisungWh = 0` übernommen.
Payload-Schemas der Topics: [API.md](../API.md#3-mqtt-topic-schema-intern).
