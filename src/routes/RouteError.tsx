import { isRouteErrorResponse, useRouteError } from 'react-router';

/** Pedaço do site que não carregou (versão nova publicada ou sem internet). */
function isChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|Importing a module script failed|Loading chunk|error loading dynamically/i.test(
    message,
  );
}

/** Erro inesperado: mensagem amigável, sem depender do layout (que pode ter falhado). */
export function RouteError() {
  const error = useRouteError();
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : String(error);
  const chunk = isChunkError(error);
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const home = import.meta.env.BASE_URL;

  const [title, text] = chunk
    ? offline
      ? [
          'Sem internet por aqui',
          'Esta parte do site ainda não tinha sido guardada para usar offline. Conecte-se e tente de novo: seus personagens continuam salvos.',
        ]
      : [
          'Saiu uma versão nova do site',
          'Recarregue a página para pegar a versão mais recente. Seus personagens continuam salvos.',
        ]
    : [
        'Um dado rolou para debaixo da mesa',
        'Algo deu errado ao abrir esta página. Seus personagens continuam salvos. Tente recarregar.',
      ];

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-4xl font-semibold">{title}</h1>
      <p className="mt-3 text-lg text-ink-muted">{text}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-11 cursor-pointer rounded-lg bg-seal px-5 font-display font-semibold text-on-seal"
        >
          Recarregar a página
        </button>
        <a
          href={home}
          className="inline-flex min-h-11 items-center rounded-lg border border-line-strong px-5 font-display font-semibold"
        >
          Voltar ao início
        </a>
      </div>
      {!chunk && (
        <details className="mt-8 text-left text-sm text-ink-muted">
          <summary className="min-h-11 cursor-pointer">Detalhes técnicos</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{detail}</pre>
        </details>
      )}
    </main>
  );
}
