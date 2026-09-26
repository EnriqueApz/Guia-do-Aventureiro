import { Compass } from 'lucide-react';
import { Link } from 'react-router';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { usePageTitle } from '@/app/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Página não encontrada');
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <Compass aria-hidden className="mx-auto size-12 text-gold" />
      <h1 className="mt-4 text-4xl font-semibold">Você se perdeu na masmorra</h1>
      <p className="mt-3 text-lg text-ink-muted">
        Este corredor não leva a lugar nenhum. Talvez o link esteja errado ou a página tenha mudado
        de lugar.
      </p>
      <Link to="/" className={`${buttonClasses('primario', 'lg')} mt-8`}>
        Voltar à taverna
      </Link>
    </div>
  );
}
