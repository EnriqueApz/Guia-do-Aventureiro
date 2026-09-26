import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface PickerOption {
  id: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

interface ChoicePickerProps {
  label: string;
  options: PickerOption[];
  selected: string[];
  max: number;
  onToggle: (id: string) => void;
}

/** Escolha com contador ("escolha 2 de 5"), em chips grandes o bastante para o toque. */
export function ChoicePicker({ label, options, selected, max, onToggle }: ChoicePickerProps) {
  const full = selected.length >= max;
  const done = selected.length === max;
  return (
    <fieldset className="space-y-2">
      <legend className="flex w-full flex-wrap items-baseline justify-between gap-2">
        <span className="font-display font-semibold">{label}</span>
        <span
          className={cn('num text-sm font-semibold', done ? 'text-forest' : 'text-ink-muted')}
          aria-live="polite"
        >
          {selected.length} de {max}
        </span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isOn = selected.includes(opt.id);
          const blocked = opt.disabled || (!isOn && full && max > 1);
          return (
            <button
              key={opt.id}
              type="button"
              role="checkbox"
              aria-checked={isOn}
              aria-disabled={blocked || undefined}
              title={opt.hint}
              onClick={() => !blocked && onToggle(opt.id)}
              className={cn(
                'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors',
                isOn
                  ? 'border-seal bg-seal text-on-seal'
                  : 'border-line-strong bg-surface text-ink hover:border-gold',
                blocked && 'cursor-not-allowed opacity-45 hover:border-line-strong',
              )}
            >
              {isOn && <Check aria-hidden className="size-4" />}
              {opt.label}
              {opt.hint && <span className="sr-only"> ({opt.hint})</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
