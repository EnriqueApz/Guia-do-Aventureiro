import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedProps<T extends string> {
  legend: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Grupo de opções exclusivas (rádios nativos, acessíveis por teclado). */
export function Segmented<T extends string>({
  legend,
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">{legend}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl border border-line bg-sunken p-1">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              'relative flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors',
              'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus',
              value === opt.value
                ? 'bg-surface text-ink shadow-card'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.icon}
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
