import { Fragment, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Transforma **negrito** em <strong>, sem interpretar HTML. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/**
 * Texto de regra do conteúdo: parágrafos por quebra de linha, listas com "- "
 * e **negrito**. Seguro: nunca usa innerHTML.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`l${blocks.length}`} className="ml-5 list-disc space-y-1">
        {list.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('- ')) {
      list.push(trimmed.slice(2));
      continue;
    }
    flush();
    blocks.push(<p key={`p${blocks.length}`}>{inline(trimmed)}</p>);
  }
  flush();
  return <div className={cn('space-y-2', className)}>{blocks}</div>;
}
