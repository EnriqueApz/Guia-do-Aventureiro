import { ChevronDown } from 'lucide-react';
import type { Feature } from '@/content/schema';
import { RichText } from '@/components/ui/RichText';
import { cn } from '@/lib/cn';
import { ACTION_LABEL } from '../labels';

interface FeatureListProps {
  features: Feature[];
  /** Nível atual: características acima dele aparecem como "no nível X". */
  level?: number;
  className?: string;
}

/**
 * Lista de traços/características: a explicação simples em destaque e a regra
 * completa num "ver regra completa" (details nativo, acessível por teclado).
 */
export function FeatureList({ features, level = 20, className }: FeatureListProps) {
  return (
    <ul className={cn('space-y-3', className)}>
      {features.map((f) => {
        const future = (f.level ?? 1) > level;
        return (
          <li
            key={f.id}
            className={cn('rounded-lg border border-line bg-bg/40 p-3.5', future && 'opacity-70')}
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h4 className="font-display text-base font-semibold">{f.name}</h4>
              {f.level && f.level > 1 && (
                <span className="text-xs font-semibold text-gold">
                  {future ? `no nível ${f.level}` : `nível ${f.level}`}
                </span>
              )}
              {f.action && f.action !== 'passiva' && (
                <span className="rounded-full bg-sunken px-2 py-0.5 text-xs text-ink-muted">
                  {ACTION_LABEL[f.action]}
                </span>
              )}
            </div>
            {f.plain ? (
              <>
                <p className="mt-1">{f.plain}</p>
                <details className="group mt-2">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm font-semibold text-gold [&::-webkit-details-marker]:hidden">
                    <ChevronDown
                      aria-hidden
                      className="size-4 transition-transform group-open:rotate-180"
                    />
                    Ver regra completa
                  </summary>
                  <RichText text={f.text} className="mt-2 text-[0.95rem] text-ink-muted" />
                </details>
              </>
            ) : (
              <RichText text={f.text} className="mt-1" />
            )}
          </li>
        );
      })}
    </ul>
  );
}
