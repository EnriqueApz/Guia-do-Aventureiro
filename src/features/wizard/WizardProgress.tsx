import { Check } from 'lucide-react';
import { useId } from 'react';
import { Link, useNavigate } from 'react-router';
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
  const selectId = useId();
  const navigate = useNavigate();
  const bar = (status: StepStatus | undefined, isCurrent: boolean) =>
    cn(
      'block h-1.5 rounded-full transition-colors duration-300',
      isCurrent ? 'bg-seal' : status === 'feito' ? 'bg-gold' : 'bg-line group-hover:bg-line-strong',
    );
  return (
    <nav aria-label="Etapas da criação" className="mb-6">
      <p className="mb-2 text-sm text-ink-muted">
        Etapa <span className="num font-semibold text-ink">{current + 1}</span> de{' '}
        <span className="num">{STEPS.length}</span> ·{' '}
        <span className="font-semibold text-ink">{step?.label}</span>
      </p>
      {/* Celular: barra só visual + seletor de etapa (alvos grandes para o dedo). */}
      <div className="flex items-center gap-3 lg:hidden">
        <ol aria-hidden className="flex flex-1 gap-1">
          {STEPS.map((s, i) => (
            <li key={s.id} className="flex-1">
              <span className={bar(statuses[i], i === current)} />
            </li>
          ))}
        </ol>
        <label htmlFor={selectId} className="sr-only">
          Ir para a etapa
        </label>
        <select
          id={selectId}
          value={STEPS[current]?.id}
          onChange={(e) => void navigate(`/criar/${characterId}/${e.target.value}`)}
          className="min-h-11 max-w-40 cursor-pointer rounded-lg border border-line-strong bg-surface px-2 text-sm font-semibold"
        >
          {STEPS.map((s, i) => (
            <option key={s.id} value={s.id}>
              {i + 1}. {s.short}
              {statuses[i] === 'feito' && i !== current ? ' ✓' : ''}
            </option>
          ))}
        </select>
      </div>
      <ol className="hidden gap-1 lg:flex">
        {STEPS.map((s, i) => {
          const status = statuses[i];
          const isCurrent = i === current;
          return (
            <li key={s.id} className="min-w-0 flex-1">
              <Link
                to={`/criar/${characterId}/${s.id}`}
                aria-current={isCurrent ? 'step' : undefined}
                className="group block min-h-11 rounded-md py-2"
                title={s.label}
              >
                <span className={bar(status, isCurrent)} />
                <span
                  className={cn(
                    'mt-1.5 flex items-center gap-1 truncate text-xs',
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
