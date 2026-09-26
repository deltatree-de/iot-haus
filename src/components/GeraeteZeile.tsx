'use client';

// Gerätezeile: die ganze Zeile ist ein Schalter (FR-3, FR-5, FR-8, FR-21, FR-27, K-07).
import { memo } from 'react';
import { raumById, type Geraet } from '@/domain/katalog';
import { restzeit, watt, wattEineStelle, zahl } from '@/domain/format';
import { useImpuls } from '@/hooks/useImpuls';
import { useRestzeit } from '@/hooks/useRestzeit';
import { T } from '@/ui/texte';
import { Schalter } from './Schalter';
import { GERAETE_SYMBOL, Symbol } from './Symbol';

export interface GeraeteZeileProps {
  geraet: Geraet;
  an: boolean;
  /** Einschaltzeitpunkt laut Server (für Auto-Aus) */
  seit: number;
  uhrVersatzMs: number;
  beschaeftigt: boolean;
  gesperrt: boolean;
  /** Änderungsnummer, wenn dieses Gerät zuletzt geändert wurde (Aufleuchten) */
  impulsNr: number | null;
  onAktivieren: (geraet: Geraet, element: HTMLButtonElement) => void;
}

function Kennzeichen({ symbol, text }: { symbol: 'schild' | 'uhr'; text: string }) {
  return (
    <span className="inline-flex h-5 items-center gap-1 rounded-full bg-surface-sunken px-2 text-[13px] leading-4 font-medium text-ink-secondary">
      <Symbol name={symbol} groesse={12} />
      {text}
    </span>
  );
}

export const GeraeteZeile = memo(function GeraeteZeile({
  geraet,
  an,
  seit,
  uhrVersatzMs,
  beschaeftigt,
  gesperrt,
  impulsNr,
  onAktivieren,
}: GeraeteZeileProps) {
  const ref = useImpuls<HTMLButtonElement>(impulsNr, 'aufleuchten');
  const beschreibungId = `geraet-${geraet.id.replace('.', '-')}-info`;
  const autoAus = geraet.autoAusS;
  const laeuft = an && !beschaeftigt && autoAus !== null;
  const restS = useRestzeit(seit, autoAus ?? 0, uhrVersatzMs, laeuft);
  const autoAusMin = autoAus ? Math.round(autoAus / 60) : 0;

  const leistung = beschaeftigt
    ? T.geraet.busy
    : an
      ? watt(geraet.betriebW)
      : geraet.standbyW > 0
        ? T.geraet.standby(wattEineStelle(geraet.standbyW))
        : T.geraet.aus;
  const beschreibung = [
    beschaeftigt
      ? T.geraet.busySr
      : an
        ? `${zahl(geraet.betriebW, 0)} Watt`
        : geraet.standbyW > 0
          ? `Standby ${zahl(geraet.standbyW, 1)} Watt`
          : T.geraet.aus,
    geraet.grundlast ? T.badge.grundlastSr : null,
    autoAus ? T.badge.autoausSr(autoAusMin) : null,
    laeuft ? (restS > 0 ? T.geraet.restzeitSr(Math.ceil(restS)) : T.geraet.restzeitEndeSr) : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <li>
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={an}
        aria-label={T.geraet.name(geraet.name, raumById(geraet.raum).name)}
        aria-describedby={beschreibungId}
        aria-disabled={gesperrt || undefined}
        aria-busy={beschaeftigt || undefined}
        onClick={(e) => {
          if (!gesperrt && !beschaeftigt) onAktivieren(geraet, e.currentTarget);
        }}
        className="fokus-innen relative flex min-h-14 w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left transition-colors duration-[var(--m-schnell)] [@media(hover:hover)]:hover:bg-surface-sunken"
      >
        <span
          className={`relative flex size-10 shrink-0 items-center justify-center rounded-full ${
            an ? 'bg-on-soft text-on' : 'bg-surface-sunken text-ink-secondary'
          }`}
        >
          <Symbol name={GERAETE_SYMBOL[geraet.symbol]} groesse={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-ink">{geraet.name}</span>
            {geraet.grundlast && <Kennzeichen symbol="schild" text={T.badge.grundlast} />}
            {autoAus && <Kennzeichen symbol="uhr" text={T.badge.autoaus(autoAusMin)} />}
          </span>
          <span
            aria-hidden="true"
            className={`zahlen flex flex-wrap items-center gap-x-1 text-sm ${
              an && !beschaeftigt ? 'font-semibold text-ink' : 'text-ink-muted'
            }`}
          >
            {leistung}
            {laeuft && (
              <span className="inline-flex items-center gap-1 text-ink">
                <span aria-hidden="true">·</span>
                <Symbol name="uhr" groesse={14} />
                {restS > 0 ? restzeit(restS) : T.geraet.restzeitEnde}
              </span>
            )}
          </span>
          <span id={beschreibungId} className="sr-only">
            {beschreibung}
          </span>
        </span>
        <Schalter an={an} beschaeftigt={beschaeftigt} gesperrt={gesperrt} />
        {laeuft && (
          <span
            aria-hidden="true"
            className="absolute inset-x-3 bottom-0 h-0.5 origin-left bg-on"
            style={{ transform: `scaleX(${Math.max(0, Math.min(1, restS / (autoAus ?? 1)))})` }}
          />
        )}
      </button>
    </li>
  );
});
