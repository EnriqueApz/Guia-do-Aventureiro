import { useMemo } from 'react';
import { content } from '@/content';
import type { Character } from '@/model/character';
import { derive } from '@/rules/derive';
import { validateCharacter } from '@/rules/validate';
import { useCharacters } from '@/state/characters';

/** Personagem do assistente + ficha derivada + pendências, recalculados a cada mudança. */
export function useWizard(id: string) {
  const character = useCharacters((s) => s.characters[id]);
  const editStore = useCharacters((s) => s.edit);
  const sheet = useMemo(() => (character ? derive(character, content) : undefined), [character]);
  const issues = useMemo(
    () => (character ? validateCharacter(character, content) : []),
    [character],
  );
  const edit = (fn: (c: Character) => Character) => editStore(id, fn);
  return { character, sheet, issues, edit };
}

export type Wizard = ReturnType<typeof useWizard>;
export type LoadedWizard = Wizard & { character: Character; sheet: NonNullable<Wizard['sheet']> };
