// Netz-Zeile im Kopf: Solarerzeugung und Netzbezug bzw. Einspeisung, ohne Animation (FR-41, Proposal §5.4.3).
import { watt, zahl } from '@/domain/format';
import type { Netzbilanz } from '@/domain/verbrauch';
import { T } from '@/ui/texte';
import { Symbol } from './Symbol';

export function NetzZeile({ bilanz }: { bilanz: Netzbilanz }) {
  const einspeisung = bilanz.einspeisungW > 0;
  const netzW = einspeisung ? bilanz.einspeisungW : bilanz.bezugW;
  return (
    <p className="zahlen flex flex-wrap items-center gap-x-1.5 text-[13px] leading-4 font-medium text-ink-secondary">
      <span className="sr-only">
        {T.kopf.netzSr(zahl(bilanz.erzeugungW, 0), einspeisung ? 'einspeisung' : 'bezug', zahl(netzW, 0))}
      </span>
      <span aria-hidden="true" className="inline-flex items-center gap-1 text-solar [@media(max-height:500px)]:hidden">
        <Symbol name="sonne" groesse={14} />
        {T.kopf.solar} <span className="inline-block min-w-[7ch]">{watt(bilanz.erzeugungW)}</span>
      </span>
      <span aria-hidden="true" className="[@media(max-height:500px)]:hidden">
        ·
      </span>
      <span aria-hidden="true" className={einspeisung ? 'text-solar' : 'text-ink'}>
        {einspeisung ? T.kopf.einspeisung : T.kopf.netzbezug} <span className="inline-block min-w-[7ch]">{watt(netzW)}</span>
      </span>
    </p>
  );
}
