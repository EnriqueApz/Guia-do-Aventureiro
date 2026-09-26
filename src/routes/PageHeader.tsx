import type { ReactNode } from 'react';

export function PageHeader(props: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8">
      {props.eyebrow && (
        <p className="mb-2 font-display text-sm font-semibold tracking-[0.2em] text-gold uppercase">
          {props.eyebrow}
        </p>
      )}
      <h1 className="text-4xl font-semibold md:text-5xl">{props.title}</h1>
      {props.children && (
        <div className="mt-3 max-w-2xl text-lg text-ink-muted">{props.children}</div>
      )}
    </header>
  );
}
