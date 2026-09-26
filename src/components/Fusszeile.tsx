// Fußzeile mit Schätzungshinweis und Client-Version (UX Information Architecture, FR-18).
import { T } from '@/ui/texte';

export function Fusszeile({ version, mitBanner }: { version: string; mitBanner: boolean }) {
  return (
    <footer
      className={`mx-auto max-w-[1280px] px-4 text-[13px] leading-5 text-ink-secondary md:px-6 ${mitBanner ? 'pb-40' : 'pb-8'}`}
    >
      <p>{T.fuss.hinweis}</p>
      <p>{T.fuss.version(version)}</p>
    </footer>
  );
}
