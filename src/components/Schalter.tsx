// Rein visueller Schalter (K-07): die ganze GeraeteZeile ist der role="switch".
import { Symbol } from './Symbol';

export function Schalter({ an, beschaeftigt, gesperrt }: { an: boolean; beschaeftigt: boolean; gesperrt: boolean }) {
  return (
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
          <Symbol name="verbinde" groesse={12} className={`drehen ${an ? 'text-on' : 'text-surface'}`} />
        ) : (
          an && <Symbol name="haekchen" groesse={10} />
        )}
      </span>
    </span>
  );
}
