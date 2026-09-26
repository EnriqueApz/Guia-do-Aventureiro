/** Emblema do Guia: um d20 sobre um livro aberto, traçado como gravura. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <path
        d="M4 34c7-3 13-3 20 1 7-4 13-4 20-1V40c-7-3-13-3-20 1-7-4-13-4-20-1z"
        fill="var(--c-surface)"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M24 35v6" stroke="currentColor" strokeWidth="2" />
      <path
        d="M24 5l12 7v13l-12 7-12-7V12z"
        fill="var(--c-seal)"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M24 5l-5 10h10zM19 15l-7-3M29 15l7-3M19 15l5 11 5-11M24 26v6M12 25l12 1 12-1"
        stroke="var(--c-on-seal)"
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity=".85"
      />
    </svg>
  );
}
