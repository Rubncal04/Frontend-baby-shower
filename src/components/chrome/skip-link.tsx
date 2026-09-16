/** Sends keyboard users past repeated chrome and into the invitation. */
export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#contenido"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-[var(--shadow-direct)]"
    >
      {label}
    </a>
  );
}
