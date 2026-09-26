'use client';

// Gerätezeile: ganze Zeile ist ein Schalter (FR-3, FR-5, FR-8, FR-21, FR-27).
import { memo } from 'react';
import { raumById, type Geraet } from '@/domain/katalog';
import { restzeit, watt, wattEineStelle } from '@/domain/format';
import { useImpuls } from '@/hooks/useImpuls';
import { useSekundentakt } from '@/hooks/useSekundentakt';
import { GERAETE_ICON, Icon } from './Icon';

export interface GeraetSchalterProps {
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

function gesprochen(w: number, stellen: number): string {
  return new Intl.NumberFormat('de-DE', { minimumFractionDigits: stellen, maximumFractionDigits: stellen }).format(w);
}

function Restzeit({ seit, dauerS, uhrVersatzMs }: { seit: number; dauerS: number; uhrVersatzMs: number }) {
  const jetzt = useSekundentakt(true) || Date.now();
  const restMs = seit + dauerS * 1000 - (jetzt + uhrVersatzMs);
  const anteil = Math.max(0, Math.min(1, restMs / (dauerS * 1000)));
  return (
    <>
      <span className="inline-flex items-center gap-1 text-ink">
        <span aria-hidden="true">·</span>
        <Icon name="uhr" groesse={14} />
        {restMs > 0 ? restzeit(restMs / 1000) : 'schaltet aus …'}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-x-3 bottom-0 h-0.5 origin-left bg-on"
        style={{ transform: `scaleX(${anteil})` }}
      />
    </>
  );
}

export const GeraetSchalter = memo(function GeraetSchalter({
  geraet,
  an,
  seit,
  uhrVersatzMs,
  beschaeftigt,
  gesperrt,
  impulsNr,
  onAktivieren,
}: GeraetSchalterProps) {
  const ref = useImpuls<HTMLButtonElement>(impulsNr, 'aufleuchten');
  const raum = raumById(geraet.raum).name;
  const beschreibungId = `geraet-${geraet.id.replace('.', '-')}-info`;

  const leistung = beschaeftigt
    ? 'wird geschaltet …'
    : an
      ? watt(geraet.betriebW)
      : geraet.standbyW > 0
        ? `Standby ${wattEineStelle(geraet.standbyW)}`
        : 'aus';
  const leistungGesprochen = beschaeftigt
    ? 'wird geschaltet'
    : an
      ? `${gesprochen(geraet.betriebW, 0)} Watt`
      : geraet.standbyW > 0
        ? `Standby ${gesprochen(geraet.standbyW, 1)} Watt`
        : 'aus';
  const kennzeichen = [
    geraet.grundlast ? 'Grundlastgerät' : null,
    geraet.autoAusS ? 'schaltet nach 3 Minuten automatisch aus' : null,
  ].filter(Boolean);

  return (
    <li>
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={an}
        aria-label={`${geraet.name}, ${raum}`}
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
          <Icon name={GERAETE_ICON[geraet.symbol]} groesse={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-ink">{geraet.name}</span>
            {geraet.grundlast && (
              <span className="inline-flex h-5 items-center gap-1 rounded-full bg-surface-sunken px-2 text-[13px] leading-4 font-medium text-ink-secondary">
                <Icon name="schild" groesse={12} />
                Grundlast
              </span>
            )}
            {geraet.autoAusS && (
              <span className="inline-flex h-5 items-center gap-1 rounded-full bg-surface-sunken px-2 text-[13px] leading-4 font-medium text-ink-secondary">
                <Icon name="uhr" groesse={12} />
                Auto-Aus 3 min
              </span>
            )}
          </span>
          <span
            aria-hidden="true"
            className={`zahlen flex flex-wrap items-center gap-x-1 text-sm ${
              an && !beschaeftigt ? 'font-semibold text-ink' : 'text-ink-muted'
            }`}
          >
            {leistung}
            {an && !beschaeftigt && geraet.autoAusS && (
              <Restzeit seit={seit} dauerS={geraet.autoAusS} uhrVersatzMs={uhrVersatzMs} />
            )}
          </span>
          <span id={beschreibungId} className="sr-only">
            {[leistungGesprochen, ...kennzeichen].join(', ')}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`relative inline-flex h-[26px] w-11 shrink-0 items-center rounded-full border-2 transition-colors duration-[var(--m-schnell)] ${
            an ? 'border-on bg-on' : 'border-switch-off bg-transparent'
          } ${gesperrt ? 'opacity-55' : ''}`}
        >
          <span
            className={`flex size-5 items-center justify-center rounded-full transition-transform duration-[var(--m-schnell)] ${
              an ? 'translate-x-[18px] bg-on-contrast text-on' : 'translate-x-px bg-switch-off'
            }`}
          >
            {beschaeftigt ? (
              <Icon name="verbinde" groesse={12} className={`drehen ${an ? 'text-on' : 'text-surface'}`} />
            ) : (
              an && <Icon name="haekchen" groesse={10} />
            )}
          </span>
        </span>
      </button>
    </li>
  );
});
