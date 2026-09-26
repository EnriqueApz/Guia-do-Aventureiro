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
        className="relative h-7 w-12 shrink-0 cursor-pointer rounded-full border border-line-strong bg-sunken transition-colors data-[state=checked]:border-seal data-[state=checked]:bg-seal"
      >
        <RadixSwitch.Thumb className="block size-5 translate-x-1 rounded-full bg-surface shadow transition-transform data-[state=checked]:translate-x-6" />
      </RadixSwitch.Root>
    </div>
  );
}
