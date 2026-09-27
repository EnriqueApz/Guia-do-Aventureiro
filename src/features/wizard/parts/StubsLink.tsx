import { PenLine } from 'lucide-react';
import { Link } from 'react-router';

/** Leva das opções "incompletas" (fora do SRD) para a página onde o grupo as completa. */
export function StubsLink() {
  return (
    <p>
      <Link
        to="/conteudo"
        className="inline-flex min-h-11 items-center gap-2 font-semibold text-ink underline decoration-seal underline-offset-4"
      >
        <PenLine aria-hidden className="size-4" />
        Completar as opções com cadeado em Conteúdo próprio
      </Link>
    </p>
  );
}
