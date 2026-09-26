import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

const inputClass = 'min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3';

export function TextField({
  label,
  value,
  onChange,
  hint,
  multiline,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  multiline?: boolean;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
        {hint && <span className="block font-normal text-ink-muted">{hint}</span>}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, 'py-2')}
        />
      ) : (
        <input
          id={id}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
    </div>
  );
}

export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        value={String(value)}
        onChange={(e) => {
          const found = options.find((o) => String(o.value) === e.target.value);
          if (found) onChange(found.value);
        }}
        className={cn(inputClass, 'cursor-pointer')}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FormErrors({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div role="alert" className="rounded-lg border border-danger/40 bg-danger/5 p-3 text-sm">
      <p className="font-semibold text-danger">Não deu para salvar:</p>
      <ul className="mt-1 list-disc pl-5">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}
