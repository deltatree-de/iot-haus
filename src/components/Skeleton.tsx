// Platzhalter im Ladezustand (FR-15), pulsiert nur ohne reduzierte Bewegung.
export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton inline-block ${className}`} />;
}

/** Hinweisfeld, solange noch nie ein Snapshot kam und der erste Aufbau scheiterte (UX Erstfehler). */
export function Erstfehler({ titel, text }: { titel: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 ebene-1">
      <p className="font-semibold text-ink">{titel}</p>
      <p className="text-sm text-ink-secondary">{text}</p>
    </div>
  );
}
