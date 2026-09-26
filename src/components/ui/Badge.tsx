import type { ReactNode } from 'react';
import { Feather, Flame, Sprout } from 'lucide-react';
import { cn } from '@/lib/cn';

export type Difficulty = 'facil' | 'medio' | 'avancado';

const difficulty: Record<Difficulty, { label: string; icon: ReactNode; className: string }> = {
  facil: {
    label: 'Bom para iniciantes',
    icon: <Sprout aria-hidden className="size-3.5" />,
    className: 'border-forest/40 text-forest',
  },
  medio: {
    label: 'Dificuldade média',
    icon: <Feather aria-hidden className="size-3.5" />,
    className: 'border-gold/50 text-gold',
  },
  avancado: {
    label: 'Para quem já pegou o jeito',
    icon: <Flame aria-hidden className="size-3.5" />,
    className: 'border-danger/40 text-danger',
  },
};

export function DifficultyBadge({ level, className }: { level: Difficulty; className?: string }) {
  const d = difficulty[level];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border bg-surface px-2.5 py-0.5 text-xs font-semibold',
        d.className,
        className,
      )}
    >
      {d.icon}
      {d.label}
    </span>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-line-strong bg-sunken px-2.5 py-0.5 text-xs font-semibold text-ink-muted',
        className,
      )}
    >
      {children}
    </span>
  );
}
