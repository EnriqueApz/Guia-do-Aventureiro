import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

/** Posições dos pontos de um d6 numa grade 3×3 (índices 0–8). */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

interface D6Props {
  value: number;
  /** Dado descartado (o menor dos 4d6). */
  dropped?: boolean;
  /** Atraso da animação, em segundos, para os dados caírem em sequência. */
  delay?: number;
  /** Muda a cada rolagem para reiniciar a animação. */
  rollKey: string | number;
}

/** Um d6 com pontos, que "cai" girando quando é rolado. */
export function D6({ value, dropped, delay = 0, rollKey }: D6Props) {
  const pips = PIPS[value] ?? [];
  return (
    <motion.span
      key={rollKey}
      initial={{ rotate: -200, scale: 0.4, opacity: 0, y: -12 }}
      animate={{ rotate: 0, scale: 1, opacity: dropped ? 0.35 : 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 16, delay }}
      role="img"
      aria-label={`${value}${dropped ? ' (descartado)' : ''}`}
      className={cn(
        'grid size-8 grid-cols-3 grid-rows-3 gap-px rounded-md border-2 p-1 shadow-card',
        dropped ? 'border-line-strong bg-sunken line-through' : 'border-seal/70 bg-surface',
      )}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            'm-auto size-1.5 rounded-full',
            pips.includes(i) ? (dropped ? 'bg-ink-muted' : 'bg-seal') : '',
          )}
        />
      ))}
    </motion.span>
  );
}
