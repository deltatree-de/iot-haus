'use client';

// Hausansicht: 2 Etagen × 3 Räume als Schaltflächen, Sprung zur Raumkarte (FR-7, FR-26, AD-12).
import { GERAETE, RAEUME, type RaumId } from '@/domain/katalog';
import { watt } from '@/domain/format';
import { anzahlAn, lichtAn, raumverbrauch, runden } from '@/domain/verbrauch';
import { useHaus } from '@/hooks/useHaus';
import { useImpuls } from '@/hooks/useImpuls';
import { useReduzierteBewegung } from '@/hooks/useReduzierteBewegung';
import { GERAETE_ICON, Icon } from './Icon';

const ETAGEN = [
  { kurz: 'OG', name: 'Obergeschoss', raeume: RAEUME.filter((r) => r.etage === 'OG') },
  { kurz: 'EG', name: 'Erdgeschoss', raeume: RAEUME.filter((r) => r.etage === 'EG') },
] as const;

export function springeZuRaum(raum: RaumId, reduziert: boolean): void {
  const karte = document.getElementById(`raum-${raum}`);
  const titel = document.getElementById(`raum-${raum}-titel`);
  if (!karte || !titel) return;
  karte.scrollIntoView({ behavior: reduziert ? 'auto' : 'smooth', block: 'start' });
  titel.focus({ preventScroll: true });
  karte.classList.remove('impuls');
  void karte.offsetWidth;
  karte.classList.add('impuls');
}

function Raum({ id, impulsNr }: { id: RaumId; impulsNr: number | null }) {
  const { zustand } = useHaus();
  const reduziert = useReduzierteBewegung();
  const ref = useImpuls<HTMLButtonElement>(impulsNr, 'impuls');
  const raum = RAEUME.find((r) => r.id === id)!;
  const z = zustand.server?.zustand;
  const w = z ? runden(raumverbrauch(z, id)) : null;
  const n = z ? anzahlAn(z, id) : 0;
  const licht = z ? lichtAn(z, id) : false;
  const eingeschaltet = z ? GERAETE.filter((g) => g.raum === id && z[g.id].an) : [];

  const name = z
    ? `${raum.name}, ${watt(w ?? 0)}, ${n === 1 ? '1 Gerät an' : `${n} Geräte an`} – zur Raumkarte`
    : `${raum.name} – zur Raumkarte`;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={name}
      onClick={() => springeZuRaum(id, reduziert)}
      className={`relative flex min-h-[72px] min-w-0 flex-col items-start gap-0.5 rounded-md border-2 p-2 text-left transition-colors duration-[var(--m-basis)] lg:min-h-24 ${
        licht
          ? 'border-on bg-room-lit shadow-[inset_0_-12px_24px_var(--c-on-soft)]'
          : 'border-transparent bg-room-off [@media(hover:hover)]:hover:border-ink-muted'
      }`}
    >
      {licht && <Icon name="birne" groesse={14} className="absolute top-1.5 right-1.5 text-on" />}
      <span className="silben w-full pr-4 text-[13px] leading-4 font-semibold text-ink">{raum.name}</span>
      {z ? (
        <>
          <span className="zahlen text-sm font-semibold text-ink">{watt(w ?? 0)}</span>
          <span className="flex w-full items-center justify-between gap-1 text-[13px] leading-4 text-ink-secondary">
            <span className="zahlen">{n} an</span>
            <span className="flex gap-0.5">
              {eingeschaltet.slice(0, 3).map((g) => (
                <Icon key={g.id} name={GERAETE_ICON[g.symbol]} groesse={14} />
              ))}
              {eingeschaltet.length > 3 && <span className="zahlen">+{eingeschaltet.length - 3}</span>}
            </span>
          </span>
        </>
      ) : (
        <span className="skeleton mt-1 h-3.5 w-12" aria-hidden="true" />
      )}
    </button>
  );
}

export function Hausansicht() {
  const { zustand } = useHaus();
  // Impuls nur für Räume der letzten Änderung (UX Motion „impuls“); Snapshot setzt sie zurück.
  const a = zustand.letzteAenderung;

  return (
    <section aria-labelledby="haus-titel">
      <h2 id="haus-titel" className="mb-3 text-lg font-semibold text-ink">
        Hausansicht
      </h2>
      <div role="group" aria-label="Hausansicht" className="mx-auto max-w-xl">
        <svg viewBox="0 0 300 60" className="ml-7 block w-[calc(100%-28px)] text-house-roof" aria-hidden="true" focusable="false">
          <path d="M4 58 150 6l146 52" fill="var(--c-surface-sunken)" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <div className="flex flex-col">
          {ETAGEN.map((etage) => (
            <div key={etage.kurz} role="group" aria-label={etage.name} className="flex items-stretch">
              <span aria-hidden="true" className="w-7 shrink-0 self-center text-[13px] leading-4 font-medium text-ink-secondary">
                {etage.kurz}
              </span>
              <div
                className={`grid min-w-0 flex-1 grid-cols-3 gap-1 border-x-2 border-house-roof p-1 ${
                  etage.kurz === 'OG' ? 'border-t-2' : 'border-b-2'
                }`}
              >
                {etage.raeume.map((r) => (
                  <Raum
                    key={r.id}
                    id={r.id}
                    impulsNr={a && a.raeume.includes(r.id) ? a.nr : null}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[13px] leading-4 text-ink-secondary">
        <Icon name="birne" groesse={14} className="text-on" />
        Warm leuchtend: Licht ist an.
      </p>
    </section>
  );
}
