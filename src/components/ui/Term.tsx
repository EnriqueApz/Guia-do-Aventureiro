import * as Popover from '@radix-ui/react-popover';
import type { ReactNode } from 'react';

interface TermProps {
  children: ReactNode;
  /** Explicação curta, em uma linha. */
  definition: string;
  /** Nome do termo quando o texto exibido é uma variação ("CA" → "Classe de Armadura"). */
  term?: string;
  /** Link opcional no rodapé do balão (ex.: "Ver no glossário"). */
  more?: ReactNode;
}

/**
 * Termo do glossário: sublinhado pontilhado que abre uma explicação curta
 * ao tocar/clicar (funciona no celular, onde não existe hover) ou com Enter/Espaço.
 */
export function Term({ children, definition, term, more }: TermProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        className="cursor-help rounded-sm underline decoration-gold-soft decoration-dotted decoration-2 underline-offset-4 hover:decoration-gold"
        aria-label={`${term ?? (typeof children === 'string' ? children : '')}: ver explicação`}
      >
        {children}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 max-w-72 rounded-lg border border-line-strong bg-surface px-4 py-3 text-sm text-ink shadow-card data-[state=open]:animate-[fade-in_120ms_ease-out]"
        >
          {term && <p className="font-display font-semibold">{term}</p>}
          <p>{definition}</p>
          {more && <div className="mt-2 text-sm font-semibold">{more}</div>}
          <Popover.Arrow className="fill-line-strong" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
