import { ArrowLeftRight, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router';
import type { Beginner } from '@/content/schema';

interface BeginnerNoteProps {
  beginner: Beginner;
  /** "classe" ou "espécie": muda o texto do aviso e o link do comparador. */
  kind: 'classe' | 'especie' | 'subclasse';
  /** Id da opção, para abrir o comparador já com ela. */
  id?: string;
}

const EASY: Record<BeginnerNoteProps['kind'], string> = {
  classe: 'Guerreiro ou Bárbaro',
  especie: 'Humano ou Anão',
  subclasse: 'a outra subclasse, se houver',
};

/**
 * Nota de iniciante da opção. Nas opções avançadas vira um aviso de complexidade,
 * com uma alternativa mais simples e o atalho para o comparador.
 */
export function BeginnerNote({ beginner, kind, id }: BeginnerNoteProps) {
  const compare =
    kind === 'subclasse' || !id
      ? undefined
      : `/comparar?tipo=${kind === 'classe' ? 'classes' : 'especies'}&a=${id}`;
  if (beginner.rating !== 'avancado') {
    return (
      <div className="mt-3 space-y-2">
        <p className="rounded-lg bg-sunken/70 p-3 text-sm">{beginner.note}</p>
        {compare && <CompareLink to={compare} />}
      </div>
    );
  }
  return (
    <div
      role="note"
      aria-label="Aviso de complexidade"
      className="mt-3 space-y-2 rounded-lg border border-gold/50 bg-gold-soft/15 p-3 text-sm"
    >
      <p className="flex items-center gap-2 font-display font-semibold">
        <TriangleAlert aria-hidden className="size-5 shrink-0 text-gold" />
        Opção avançada
      </p>
      <p>{beginner.note}</p>
      <p className="text-ink-muted">
        Não é uma escolha ruim: só tem mais coisas para acompanhar durante o jogo. Se esta é a sua
        primeira ficha, {EASY[kind]} {kind === 'subclasse' ? 'pode' : 'podem'} ser um começo mais
        tranquilo.
      </p>
      {compare && <CompareLink to={compare} />}
    </div>
  );
}

function CompareLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink underline decoration-seal decoration-2 underline-offset-2"
    >
      <ArrowLeftRight aria-hidden className="size-4" /> Comparar com outra opção
    </Link>
  );
}
