import { Check } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';
import { STEPS } from './steps';

export type StepStatus = 'feito' | 'pendente' | 'em-breve';

interface WizardProgressProps {
  characterId: string;
  current: number;
  statuses: StepStatus[];
}

/** Barra de progresso clicável: dá para pular para qualquer etapa sem perder nada. */
export function WizardProgress({ characterId, current, statuses }: WizardProgressProps) {
  const step = STEPS[current];
  return (
    <nav aria-label="Etapas da criação" className="mb-6">
      <p className="mb-2 text-sm text-ink-muted">
        Etapa <span className="num font-semibold text-ink">{current + 1}</span> de{' '}
        <span className="num">{STEPS.length}</span> ·{' '}
        <span className="font-semibold text-ink">{step?.label}</span>
      </p>
      <ol className="flex gap-1">
        {STEPS.map((s, i) => {
          const status = statuses[i];
          const isCurrent = i === current;
          return (
            <li key={s.id} className="min-w-0 flex-1">
              <Link
                to={`/criar/${characterId}/${s.id}`}
                aria-current={isCurrent ? 'step' : undefined}
                className="group block rounded-md py-2"
                title={s.label}
              >
                <span
                  className={cn(
                    'block h-1.5 rounded-full transition-colors duration-300',
                    isCurrent
                      ? 'bg-seal'
                      : status === 'feito'
                        ? 'bg-gold'
                        : 'bg-line group-hover:bg-line-strong',
                  )}
                />
                <span
                  className={cn(
                    'mt-1.5 hidden items-center gap-1 truncate text-xs lg:flex',
                    isCurrent ? 'font-semibold text-ink' : 'text-ink-muted group-hover:text-ink',
                  )}
                >
                  {status === 'feito' && !isCurrent && (
                    <Check aria-hidden className="size-3 shrink-0 text-gold" />
                  )}
                  {s.short}
                </span>
                <span className="sr-only">
                  {s.label}
                  {status === 'feito' ? ' (concluída)' : status === 'em-breve' ? ' (em breve)' : ''}
                  {isCurrent ? ' (atual)' : ''}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
