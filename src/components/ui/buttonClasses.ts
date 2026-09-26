import { cn } from '@/lib/cn';

export type ButtonVariant = 'primario' | 'secundario' | 'fantasma' | 'perigo';
export type ButtonSize = 'md' | 'lg' | 'icone';

const variants: Record<ButtonVariant, string> = {
  primario:
    'bg-seal text-on-seal shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_2px_6px_-2px_rgb(60_20_10/0.5)] hover:bg-seal-hover',
  secundario: 'border border-line-strong bg-surface text-ink hover:border-gold hover:bg-sunken',
  fantasma: 'text-ink hover:bg-sunken',
  perigo: 'border border-danger/40 bg-surface text-danger hover:bg-danger hover:text-on-seal',
};

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-11 min-w-11 justify-center px-4 text-[0.95rem]',
  lg: 'min-h-13 px-6 text-lg',
  icone: 'size-11 justify-center',
};

export function buttonClasses(variant: ButtonVariant = 'primario', size: ButtonSize = 'md') {
  return cn(
    'inline-flex cursor-pointer items-center gap-2 rounded-lg font-display font-semibold tracking-tight',
    'transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px',
    'disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
  );
}
