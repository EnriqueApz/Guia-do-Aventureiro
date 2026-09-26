import { cn } from '@/lib/cn';

export interface Step {
  id: string;
  label: string;
}

interface StepProgressProps {
  steps: Step[];
  currentIndex: number;
  className?: string;
}

/** Barra de progresso do assistente: compacta no celular, com rótulos no desktop. */
export function StepProgress({ steps, currentIndex, className }: StepProgressProps) {
  const current = steps[currentIndex];
  return (
    <nav aria-label="Progresso da criação" className={className}>
      <p className="mb-2 text-sm text-ink-muted">
        Etapa <span className="num font-semibold text-ink">{currentIndex + 1}</span> de{' '}
        <span className="num">{steps.length}</span>
        {current && (
          <>
            {' '}
            · <span className="font-semibold text-ink">{current.label}</span>
          </>
        )}
      </p>
      <ol className="flex gap-1.5">
        {steps.map((step, i) => (
          <li key={step.id} className="flex-1">
            <span
              aria-current={i === currentIndex ? 'step' : undefined}
              className={cn(
                'block h-1.5 rounded-full transition-colors duration-300',
                i < currentIndex && 'bg-gold',
                i === currentIndex && 'bg-seal',
                i > currentIndex && 'bg-line',
              )}
            />
            <span className="sr-only">
              {step.label}
              {i < currentIndex ? ' (concluída)' : i === currentIndex ? ' (atual)' : ''}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
