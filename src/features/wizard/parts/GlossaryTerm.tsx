import type { ReactNode } from 'react';
import { Term } from '@/components/ui/Term';
import glossary from '@/content/glossary.json';

const byId = new Map(glossary.map((g) => [g.id, g]));

/** Termo do glossário pelo id; se o id não existir, mostra só o texto. */
export function GlossaryTerm({ id, children }: { id: string; children?: ReactNode }) {
  const entry = byId.get(id);
  if (!entry) return <>{children}</>;
  return (
    <Term term={entry.term} definition={entry.short}>
      {children ?? entry.term}
    </Term>
  );
}
