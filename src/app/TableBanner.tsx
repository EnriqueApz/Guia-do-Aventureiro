import { Users } from 'lucide-react';
import { Link } from 'react-router';
import { useTable } from '@/state/table';

/** Faixa discreta avisando que há uma mesa ativa, com atalho para as regras. */
export function TableBanner() {
  const rules = useTable((s) => s.rules);
  const leave = useTable((s) => s.leave);
  if (!rules) return null;
  return (
    <div
      className="border-b border-gold-soft/60 bg-gold-soft/15 print:hidden"
      role="region"
      aria-label="Mesa ativa"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm">
        <Users aria-hidden className="size-4 text-gold" />
        <span>
          Mesa ativa{rules.name ? `: ${rules.name}` : ''}
          {rules.level ? ` · nível ${rules.level}` : ''}
        </span>
        <Link to="/mesa" className="font-semibold underline underline-offset-2">
          Ver regras
        </Link>
        <button
          type="button"
          onClick={leave}
          className="ml-auto cursor-pointer font-semibold text-ink-muted underline underline-offset-2"
        >
          Sair da mesa
        </button>
      </div>
    </div>
  );
}
