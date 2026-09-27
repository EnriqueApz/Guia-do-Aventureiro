import { Compass, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { usePageTitle } from '@/app/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Página não encontrada');
  // Pode ser uma página nova que esta cópia do site ainda não conhece: procura a
  // versão nova (se houver, o site recarrega sozinho; ver app/swUpdate.ts).
  useEffect(() => {
    void navigator.serviceWorker
      ?.getRegistration()
      .then((r) => r?.update())
      .catch(() => undefined);
  }, []);
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <Compass aria-hidden className="mx-auto size-12 text-gold" />
      <h1 className="mt-4 text-4xl font-semibold">Você se perdeu na masmorra</h1>
      <p className="mt-3 text-lg text-ink-muted">
        Este corredor não leva a lugar nenhum. Talvez o link esteja errado ou a página tenha mudado
        de lugar.
      </p>
      <p className="mt-3 text-ink-muted">
        Se alguém mandou este link agora há pouco, o site pode ter ganhado uma página nova: toque em
        “Atualizar o site”.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonClasses('primario', 'lg')}>
          Voltar à taverna
        </Link>
        <button
          type="button"
          className={buttonClasses('secundario', 'lg')}
          onClick={() => window.location.reload()}
        >
          <RefreshCw aria-hidden className="size-5" /> Atualizar o site
        </button>
      </div>
    </div>
  );
}
