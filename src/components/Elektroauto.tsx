'use client';

// Elektroauto im Carport: Ort, Akku, Ladezeit, Wegfahren/Zurückkommen (FR-37 bis FR-39, Proposal §5.4.3).
import { useId } from 'react';
import { autoBeschaeftigt } from '@/client/hausReducer';
import { akkuProzent, akkuWhBei, darfWegfahren, ELEKTROAUTO, restLadezeitMs } from '@/domain/elektroauto';
import { akku } from '@/domain/format';
import { useHaus } from '@/hooks/useHaus';
import { useSekundentakt } from '@/hooks/useSekundentakt';
import { T } from '@/ui/texte';
import { Symbol } from './Symbol';

export function Elektroauto() {
  const { zustand, bedienbar, auto: fahre } = useHaus();
  const titelId = useId();
  const grundId = useId();
  const server = zustand.server;
  const laedt = !!server && server.zustand[ELEKTROAUTO.ladegeraet].an && server.auto.zuhause;
  // Akku und Restzeit laufen beim Laden sichtbar mit (Server bleibt Autorität, AD-24)
  const takt = useSekundentakt(laedt) || Date.now();
  if (!server) return null;

  const jetzt = takt + zustand.uhrVersatzMs;
  const a = server.auto;
  const wh = akkuWhBei(a, laedt, jetzt);
  const prozent = akkuProzent(wh);
  const rest = restLadezeitMs(a, laedt, jetzt);
  const minuten = rest === null ? 0 : Math.ceil(rest / 60_000);
  const h = Math.floor(minuten / 60);
  const m = minuten % 60;
  const beschaeftigt = autoBeschaeftigt(zustand);
  const zuLeer = a.zuhause && !darfWegfahren(a, laedt, jetzt);
  const gesperrt = !bedienbar || zuLeer;
  const ort = a.zuhause ? T.auto.zuhause : T.auto.unterwegs;

  const status = [ort, laedt ? T.auto.laedt : null, prozent === 100 && a.zuhause ? T.auto.voll : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <div role="group" aria-labelledby={titelId} className="mb-2 rounded-[10px] bg-surface-sunken/60 p-3">
      <div className="flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
            laedt ? 'bg-on-soft text-on' : 'bg-surface-sunken text-ink-secondary'
          }`}
        >
          <Symbol name={laedt ? 'blitz' : 'auto'} groesse={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p id={titelId} className="font-medium text-ink">
            {T.auto.name}
          </p>
          <p className="sr-only">
            {T.auto.statusSr(ort, prozent, laedt)}
            {laedt && rest !== null ? `, ${T.auto.vollInSr(h, m)}` : ''}
          </p>
          <p aria-hidden="true" className="zahlen text-sm text-ink-secondary">
            {status}
            {laedt && rest !== null && ` · ${T.auto.vollIn(h, m)}`}
          </p>
          <p aria-hidden="true" className="zahlen mt-1 text-sm text-ink">
            {a.zuhause ? T.auto.akku(akku(prozent)) : T.auto.akkuAbfahrt(akku(prozent))}
          </p>
          <div aria-hidden="true" className="mt-1 h-2 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className={`h-full origin-left rounded-full transition-transform duration-[var(--m-basis)] ${laedt ? 'bg-on' : 'bg-ink-secondary'}`}
              style={{ transform: `scaleX(${wh / ELEKTROAUTO.kapazitaetWh})` }}
            />
          </div>
          {!a.zuhause && <p className="mt-1 text-[13px] leading-4 text-ink-secondary">{T.auto.fahrtHinweis}</p>}
          {zuLeer && (
            <p id={grundId} className="mt-1 text-[13px] leading-4 text-ink-secondary">
              {T.auto.zuLeer}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-disabled={gesperrt || undefined}
          aria-busy={beschaeftigt || undefined}
          aria-describedby={zuLeer ? grundId : undefined}
          onClick={() => {
            if (!gesperrt && !beschaeftigt) fahre(!a.zuhause);
          }}
          className={`min-h-11 shrink-0 rounded-[10px] border border-border bg-surface px-3 text-sm font-medium text-ink ${
            gesperrt ? 'text-ink-secondary' : '[@media(hover:hover)]:hover:bg-surface-sunken'
          }`}
        >
          <span aria-hidden="true">
            {beschaeftigt ? T.auto.busy : a.zuhause ? T.auto.wegfahren : T.auto.zurueckkommen}
          </span>
          <span className="sr-only">{a.zuhause ? T.auto.wegfahrenSr : T.auto.zurueckSr}</span>
        </button>
      </div>
    </div>
  );
}
