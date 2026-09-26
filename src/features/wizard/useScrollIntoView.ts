import { useEffect, useRef, type RefObject } from 'react';
import { useSettings } from '@/state/settings';

/** Rola até o detalhe quando o jogador escolhe uma opção (não na primeira renderização). */
export function useScrollIntoViewOnChange(ref: RefObject<HTMLElement | null>, value: unknown) {
  const reduce = useSettings((s) => s.reduceMotion);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (value)
      ref.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [value, ref, reduce]);
}
