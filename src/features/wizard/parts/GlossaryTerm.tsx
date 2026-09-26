import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Term } from '@/components/ui/Term';
import glossary from '@/content/glossary.json';

const byId = new Map(glossary.map((g) => [g.id, g]));

/** Termo do glossário pelo id; se o id não existir, mostra só o texto. */
export function GlossaryTerm({ id, children }: { id: string; children?: ReactNode }) {
  const entry = byId.get(id);
  if (!entry) return <>{children}</>;
  return (
    <Term
      term={entry.term}
      definition={entry.short}
      more={
        <Link
          to={`/glossario#${id}`}
          className="text-ink underline decoration-seal decoration-2 underline-offset-2"
        >
          Ver no glossário
        </Link>
      }
    >
      {children ?? entry.term}
    </Term>
  );
}
