// Verbindungsstatus mit Symbol und Text (FR-20); kein aria-live, das Banner sagt an.
import type { Verbindung } from '@/client/hausReducer';
import { T } from '@/ui/texte';
import { Symbol } from './Symbol';

export function VerbindungsStatus({ verbindung }: { verbindung: Verbindung }) {
  const text = verbindung === 'verbunden' ? T.status.verbunden : verbindung === 'verbinde' ? T.status.verbinde : T.status.getrennt;
  const farbe =
    verbindung === 'verbunden' ? 'text-status-ok' : verbindung === 'verbinde' ? 'text-ink-secondary' : 'text-danger';
  return (
    <p className={`flex min-h-6 items-center gap-1.5 text-[13px] leading-4 font-medium ${farbe}`}>
      <Symbol
        name={verbindung}
        groesse={verbindung === 'verbunden' ? 10 : 14}
        className={verbindung === 'verbinde' ? 'drehen' : undefined}
      />
      <span className="sr-only">{T.status.sr}</span>
      <span className="max-[360px]:sr-only">{text}</span>
    </p>
  );
}
