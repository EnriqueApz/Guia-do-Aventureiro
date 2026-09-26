import { Hourglass } from 'lucide-react';
import { Link } from 'react-router';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { Card } from '@/components/ui/Card';
import { usePageTitle } from '@/app/usePageTitle';
import { PageHeader } from './PageHeader';

interface ComingSoonProps {
  title: string;
  description: string;
  phase: number;
}

/** Página provisória para telas que chegam nas próximas fases. */
export function ComingSoon({ title, description, phase }: ComingSoonProps) {
  usePageTitle(title);
  return (
    <>
      <PageHeader eyebrow="Em construção" title={title}>
        <p>{description}</p>
      </PageHeader>
      <Card className="flex max-w-xl items-start gap-4">
        <Hourglass aria-hidden className="mt-1 size-6 shrink-0 text-gold" />
        <div>
          <p className="font-display text-lg font-semibold">Chega na fase {phase} do projeto.</p>
          <p className="mt-1 text-ink-muted">
            Os escribas ainda estão passando esta página a limpo. Enquanto isso, você pode começar
            um personagem.
          </p>
          <Link to="/" className={`${buttonClasses('secundario')} mt-4`}>
            Voltar ao início
          </Link>
        </div>
      </Card>
    </>
  );
}
