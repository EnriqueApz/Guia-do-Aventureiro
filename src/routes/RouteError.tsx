import { isRouteErrorResponse, useRouteError } from 'react-router';

/** Erro inesperado: mensagem amigável, sem depender do layout (que pode ter falhado). */
export function RouteError() {
  const error = useRouteError();
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : String(error);

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-4xl font-semibold">Um dado rolou para debaixo da mesa</h1>
      <p className="mt-3 text-lg text-ink-muted">
        Algo deu errado ao abrir esta página. Seus personagens continuam salvos. Tente recarregar.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 min-h-11 cursor-pointer rounded-lg bg-seal px-5 font-display font-semibold text-on-seal"
      >
        Recarregar a página
      </button>
      <details className="mt-8 text-left text-sm text-ink-muted">
        <summary className="cursor-pointer">Detalhes técnicos</summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{detail}</pre>
      </details>
    </main>
  );
}
