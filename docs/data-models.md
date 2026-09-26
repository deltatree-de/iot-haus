# IoT-Haus 2.0 – Datenmodelle

## Stammdaten (`src/domain/katalog.ts`, `src/domain/szenen.ts`)

```ts
type Etage = 'EG' | 'OG';
type Kategorie = 'licht' | 'kueche' | 'unterhaltung' | 'haushalt' | 'koerperpflege' | 'heizung' | 'it';

RAEUME: { id, name, etage }[]            // 6 Räume: wohnzimmer, kueche, hwr (EG); schlafzimmer, bad, arbeitszimmer (OG)
GERAETE: {
  id: `${raum}.${geraet}`,               // z. B. 'kueche.mikrowelle'
  name, raum, kategorie, symbol,
  betriebW: number,                      // Leistung eingeschaltet
  standbyW: number,                      // Leistung ausgeschaltet
  grundlast: boolean,                    // Kühlschrank, Gefrierschrank, Router
  autoAusS: 180 | null,                  // Wasserkocher, Mikrowelle
}[]                                      // 28 Geräte
SZENEN: { id, name, symbol, allesAus: boolean, ziele: Partial<Record<GeraetId, boolean>> }[]
```

`GeraetId`, `RaumId` und `SzeneId` sind aus den Konstanten abgeleitete Literal-Typen. Eine Tabelle aller Geräte steht im
[README](../README.md#gerätekatalog).

## Zustand (`src/domain/protokoll.ts`)

```ts
type GeraeteZustand = { an: boolean; seit: number };     // seit = ms seit Epoch der letzten Änderung
type HausZustand    = Record<GeraetId, GeraeteZustand>;  // immer alle 28 Geräte
type Energie        = { datum: string; wh: number };     // datum YYYY-MM-DD (Europe/Berlin), wh ungerundet
```

Ausgangszustand beim ersten Start: nur Grundlastgeräte an (`ausgangszustand` in `befehle.ts`).

## Rechenregeln (`src/domain/verbrauch.ts`, `energie.ts`)

- Geräteleistung = `an ? betriebW : standbyW`; Hausverbrauch = Summe aller Geräte; Raumverbrauch analog.
- Standby-Anteil = Summe `standbyW` der ausgeschalteten Geräte.
- Laststufe auf den gerundeten Watt-Wert: < 500 niedrig, < 2.000 mittel, sonst hoch.
- Kosten pro Stunde = W / 1000 × Strompreis.
- Tagesenergie: Integration der Leistung über die Zeit im Server, Neustart um 00:00 Uhr Europe/Berlin (auch an 23- und 25-Stunden-Tagen).
  Je Integrationsschritt zählen höchstens 2 Minuten; größere Zeitsprünge gelten nicht als Verbrauch.
- Anzeige: Zwischen Zahl und Einheit steht U+202F (schmales geschütztes Leerzeichen), z. B. „1.274 W“.
- Gerundet wird nur bei der Anzeige (`format.ts`, de-DE).

## Wo liegen Daten

| Ort | Inhalt | Lebensdauer |
|---|---|---|
| Speicher des Node-Servers | autoritativer `HausZustand`, `Energie`, Auto-Aus-Timer | Prozess |
| Mosquitto (retained, Volume `mosquitto-data`) | je Gerät `iot-haus/v2/geraet/<id>/zustand` (bei jeder Änderung), dazu `iot-haus/v2/energie/heute` (60-s-Takt, SIGTERM) | dauerhaft |
| Browser-Speicher | Kopie des Serverzustands im Reducer | Tab |
| `localStorage` | nur `iot-haus.theme` (`system`/`hell`/`dunkel`); Altschlüssel `smart-home-state` wird gelöscht | dauerhaft im Browser |

Payload-Schemas der Topics: [API.md](../API.md#3-mqtt-topic-schema-intern).
