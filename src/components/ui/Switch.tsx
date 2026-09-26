import * as RadixSwitch from '@radix-ui/react-switch';
import { useId } from 'react';

interface SwitchProps {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}

export function Switch({ label, hint, checked, onCheckedChange }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex min-h-11 items-center justify-between gap-4">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-sm text-ink-muted">{hint}</span>}
      </label>
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="group relative flex h-11 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full"
      >
        {/* O botão tem 44 px de altura; o trilho visível é menor. */}
        <span
          aria-hidden
          className="absolute h-7 w-12 rounded-full border border-line-strong bg-sunken transition-colors group-data-[state=checked]:border-seal group-data-[state=checked]:bg-seal"
        />
        <RadixSwitch.Thumb className="relative block size-5 -translate-x-2.5 rounded-full bg-surface shadow transition-transform data-[state=checked]:translate-x-2.5" />
      </RadixSwitch.Root>
    </div>
  );
}
