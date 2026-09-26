import { CircleAlert, CircleCheck } from 'lucide-react';
import type { Issue } from '@/rules/validate';

/** Pendências da etapa atual, em linguagem amigável. */
export function StepIssues({ issues, doneText }: { issues: Issue[]; doneText: string }) {
  const errors = issues.filter((i) => i.severity === 'erro');
  const warnings = issues.filter((i) => i.severity === 'aviso');
  if (!errors.length && !warnings.length) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-forest/30 bg-forest/5 px-4 py-3 text-forest">
        <CircleCheck aria-hidden className="size-5 shrink-0" />
        {doneText}
      </p>
    );
  }
  return (
    <div className="rounded-lg border border-gold-soft/60 bg-gold-soft/10 px-4 py-3" role="status">
      <p className="flex items-center gap-2 font-semibold">
        <CircleAlert aria-hidden className="size-5 shrink-0 text-gold" />
        Falta nesta etapa
      </p>
      <ul className="mt-1 ml-7 list-disc space-y-0.5">
        {[...errors, ...warnings].map((i) => (
          <li key={i.message}>{i.message}</li>
        ))}
      </ul>
    </div>
  );
}
