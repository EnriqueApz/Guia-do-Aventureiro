import { Check, Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface OptionCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
  disabledReason?: string;
  compact?: boolean;
}

/** Cartão de opção selecionável (semântica de botão alternável, acessível por teclado). */
export function OptionCard(props: OptionCardProps) {
  const { selected, onSelect, title, subtitle, icon, children, disabled, disabledReason, compact } =
    props;
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'group relative flex h-full w-full cursor-pointer flex-col rounded-card border bg-surface text-left shadow-card transition-[border-color,box-shadow,transform] duration-200',
        compact ? 'gap-1 p-3.5' : 'gap-2 p-4',
        selected
          ? 'border-seal ring-2 ring-seal/30'
          : 'border-line hover:-translate-y-0.5 hover:border-gold-soft',
        disabled && 'cursor-not-allowed opacity-60 hover:translate-y-0 hover:border-line',
      )}
    >
      <span className="flex items-start gap-3">
        {icon && (
          <span
            aria-hidden
            className={cn(
              'flex shrink-0 items-center justify-center rounded-full border transition-colors',
              compact ? 'size-9' : 'size-11',
              selected
                ? 'border-seal bg-seal text-on-seal'
                : 'border-gold-soft bg-sunken text-gold',
            )}
          >
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span
            className={cn('block font-display font-semibold', compact ? 'text-base' : 'text-lg')}
          >
            {title}
          </span>
          {subtitle && <span className="mt-0.5 block text-sm text-ink-muted">{subtitle}</span>}
        </span>
        {selected && <Check aria-hidden className="size-5 shrink-0 text-seal" />}
        {disabled && <Lock aria-hidden className="size-4 shrink-0 text-ink-muted" />}
      </span>
      {children}
      {disabled && disabledReason && (
        <span className="text-xs text-ink-muted">{disabledReason}</span>
      )}
    </button>
  );
}
