import { cn } from '@/lib/cn';

/** Divisor ornamental discreto (linha com losango central). */
export function Ornament({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 text-gold-soft', className)} aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-current" />
      <svg viewBox="0 0 24 12" className="h-3 w-6" fill="currentColor">
        <path d="M12 0l4 6-4 6-4-6zM2 6l3-2v4zM22 6l-3 2V4z" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-current" />
    </div>
  );
}
