import { useEffect, useSyncExternalStore } from 'react';
import { resolveTheme, useSettings } from '@/state/settings';

const darkQuery = '(prefers-color-scheme: dark)';
const motionQuery = '(prefers-reduced-motion: reduce)';

function subscribeMedia(query: string) {
  return (callback: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  };
}

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    subscribeMedia(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Reflete os ajustes (tema, fonte, movimento) em atributos do <html>. */
export function useApplySettings() {
  const theme = useSettings((s) => s.theme);
  const largeText = useSettings((s) => s.largeText);
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const systemDark = useMedia(darkQuery);
  const systemReducedMotion = useMedia(motionQuery);
  const effectiveTheme = resolveTheme(theme, systemDark);
  const reduced = reduceMotion || systemReducedMotion;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = effectiveTheme;
    root.dataset.font = largeText ? 'grande' : 'normal';
    root.dataset.motion = reduced ? 'reduzido' : 'normal';
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', effectiveTheme === 'escuro' ? '#15100b' : '#f3ead6');
  }, [effectiveTheme, largeText, reduced]);

  return { effectiveTheme, reducedMotion: reduced };
}
