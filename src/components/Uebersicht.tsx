'use client';

// Übersichtsbereich: Standby-Anteil, Tageswerte mit Info-Hinweis, Strompreis, Darstellung (FR-9, FR-10, FR-13, FR-28).
import { euro, kwh, strompreis as strompreisText, wattEineStelle, zahl } from '@/domain/format';
import { standbyAnteil, tagesKosten } from '@/domain/verbrauch';
import { useHaus } from '@/hooks/useHaus';
import { T } from '@/ui/texte';
import { InfoKnopf, InfoText, useInfoHinweis } from './InfoHinweis';
import { Skeleton } from './Skeleton';
import { ThemeWahl } from './ThemeWahl';

function Wert({ sichtbar, gesprochen }: { sichtbar: string; gesprochen: string }) {
  return (
    <>
      <span aria-hidden="true">{sichtbar}</span>
      <span className="sr-only">{gesprochen}</span>
    </>
  );
}

export function Uebersicht() {
  const { zustand } = useHaus();
  const info = useInfoHinweis();
  const server = zustand.server;
  const standby = server ? standbyAnteil(server.zustand) : 0;
  // Netto-Tageskosten; negativ = Ertrag (FR-10, FR-42)
  const netto = server ? tagesKosten(server.energie, server.strompreis, server.einspeiseverguetung) : 0;
  const ertrag = netto < 0;
  const betrag = Math.abs(netto);

  return (
    <section aria-labelledby="uebersicht-titel" className="text-sm text-ink-secondary">
      <h2 id="uebersicht-titel" className="sr-only">
        {T.uebersicht.titel}
      </h2>
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-2">
          <p className="zahlen">
            {server ? (
              <Wert
                sichtbar={`${T.uebersicht.standby} ${wattEineStelle(standby)}`}
                gesprochen={T.uebersicht.standbySr(zahl(standby, 1))}
              />
            ) : (
              <>
                {T.uebersicht.standby} <Skeleton className="h-3.5 w-12 align-middle" />
              </>
            )}
          </p>
          <span aria-hidden="true" className="hidden lg:inline">
            ·
          </span>
          <div className="flex items-center gap-1">
            <p className="zahlen">
              {server ? (
                <Wert
                  sichtbar={`${T.uebersicht.heute} ${kwh(server.energie.wh)} · ${ertrag ? `${T.uebersicht.heuteErtrag} ` : ''}${euro(betrag)}`}
                  gesprochen={T.uebersicht.heuteSr(zahl(server.energie.wh / 1000, 2), zahl(betrag, 2), ertrag)}
                />
              ) : (
                <>
                  {T.uebersicht.heute} <Skeleton className="h-3.5 w-24 align-middle" />
                </>
              )}
            </p>
            <InfoKnopf offen={info.offen} steuert={info.id} onUmschalten={info.setOffen} />
          </div>
          <span aria-hidden="true" className="hidden lg:inline">
            ·
          </span>
          {server && (
            <p className="zahlen">
              <Wert
                sichtbar={T.uebersicht.netzHeute(kwh(server.energie.bezugWh), kwh(server.energie.einspeisungWh))}
                gesprochen={T.uebersicht.netzHeuteSr(
                  zahl(server.energie.bezugWh / 1000, 2),
                  zahl(server.energie.einspeisungWh / 1000, 2),
                )}
              />
            </p>
          )}
          <span aria-hidden="true" className="hidden lg:inline">
            ·
          </span>
          <p className="zahlen">
            {server ? (
              <>
                <Wert
                  sichtbar={`${T.uebersicht.strompreis} ${strompreisText(server.strompreis)} · `}
                  gesprochen={`${T.uebersicht.strompreisSr(zahl(server.strompreis, 2))}, `}
                />
                <Wert
                  sichtbar={`${T.uebersicht.verguetung} ${strompreisText(server.einspeiseverguetung)}`}
                  gesprochen={T.uebersicht.verguetungSr(zahl(server.einspeiseverguetung, 2))}
                />
              </>
            ) : (
              <>
                {T.uebersicht.strompreis} <Skeleton className="h-3.5 w-20 align-middle" />
              </>
            )}
          </p>
        </div>
        <ThemeWahl />
      </div>
      <InfoText id={info.id} offen={info.offen} />
    </section>
  );
}
