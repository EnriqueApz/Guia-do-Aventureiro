import { useEffect } from 'react';

const SITE = 'Guia do Aventureiro';

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : `${SITE} · Crie seu personagem de D&D`;
  }, [title]);
}
