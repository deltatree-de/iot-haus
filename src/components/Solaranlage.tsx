'use client';

// Bereich „Solaranlage“: Erzeugung, Spitzenleistung, heute erzeugt, Sonnenwahl (FR-40, FR-42, FR-43).
import { kwh, kwp, watt, zahl } from '@/domain/format';
import { erzeugung, SOLARANLAGE } from '@/domain/solar';
import { runden, tagesErzeugungWh } from '@/domain/verbrauch';
import { useHaus } from '@/hooks/useHaus';
import { T } from '@/ui/texte';
import { Skeleton } from './Skeleton';
import { SonnenWahl } from './SonnenWahl';
import { Symbol } from './Symbol';

export function Solaranlage() {
  const { zustand } = useHaus();
  const server = zustand.server;
  const w = server ? runden(erzeugung(server.sonne.stufe)) : 0;
  const heuteWh = server ? tagesErzeugungWh(server.energie) : 0;
  const spitze = kwp(SOLARANLAGE.spitzenleistungW);

  return (
    <section aria-labelledby="solar-titel">
      <h2 id="solar-titel" className="mb-3 text-lg font-semibold text-ink">
        {T.solar.titel}
      </h2>
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 ebene-1 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-solar-soft text-solar">
            <Symbol name="solar" groesse={22} />
          </span>
          <div className="zahlen text-sm">
            {server ? (
              <>
                <p className="text-ink">
                  <span aria-hidden="true">
                    {T.solar.erzeugung} <strong className="font-semibold text-solar">{watt(w)}</strong>
                    <span className="ml-2 text-ink-secondary">{spitze}</span>
                  </span>
                  <span className="sr-only">
                    {T.solar.erzeugungSr(zahl(w, 0))}, {T.solar.spitzenleistungSr(zahl(SOLARANLAGE.spitzenleistungW / 1000, 1))}
                  </span>
                </p>
                <p className="text-ink-secondary">
                  <span aria-hidden="true">
                    {T.solar.heuteErzeugt} {kwh(heuteWh)}
                  </span>
                  <span className="sr-only">{T.solar.heuteErzeugtSr(zahl(heuteWh / 1000, 2))}</span>
                </p>
              </>
            ) : (
              <Skeleton className="h-9 w-40" />
            )}
          </div>
        </div>
        <div className="min-w-0 md:w-[min(100%,520px)]">
          <SonnenWahl />
        </div>
      </div>
    </section>
  );
}
