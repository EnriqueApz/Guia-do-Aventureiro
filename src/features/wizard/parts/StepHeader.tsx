import type { ReactNode } from 'react';

export function StepHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {eyebrow && (
        <p className="mb-2 font-display text-sm font-semibold tracking-[0.2em] text-gold uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-lg text-ink-muted">{children}</div>}
    </header>
  );
}
