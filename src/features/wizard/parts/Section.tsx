import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-3', className)}>
      <h3 className="text-xl font-semibold">{title}</h3>
      {children}
    </section>
  );
}

export function Fact({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line py-2 last:border-b-0 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-sm font-semibold text-ink-muted sm:w-44">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
