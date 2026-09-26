/** Tela de espera enquanto o primeiro pedaço do site carrega. */
export function PageLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16" aria-busy="true">
      <p role="status" className="font-display text-xl text-ink-muted">
        Abrindo o grimório…
      </p>
    </main>
  );
}
