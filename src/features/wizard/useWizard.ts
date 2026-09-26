import { useMemo } from 'react';
import { content } from '@/content';
import type { Character } from '@/model/character';
import { derive } from '@/rules/derive';
import { validateCharacter } from '@/rules/validate';
import { tableIssues } from '@/model/table';
import { useCharacters } from '@/state/characters';
import { useTable } from '@/state/table';

/** Personagem do assistente + ficha derivada + pendências, recalculados a cada mudança. */
export function useWizard(id: string) {
  const character = useCharacters((s) => s.characters[id]);
  const editStore = useCharacters((s) => s.edit);
  const sheet = useMemo(() => (character ? derive(character, content) : undefined), [character]);
  const rules = useTable((s) => s.rules);
  const issues = useMemo(
    () =>
      character
        ? [
            ...validateCharacter(character, content),
            ...(rules ? tableIssues(character, rules, content) : []),
          ]
        : [],
    [character, rules],
  );
  const edit = (fn: (c: Character) => Character) => editStore(id, fn);
  return { character, sheet, issues, edit };
}

export type Wizard = ReturnType<typeof useWizard>;
export type LoadedWizard = Wizard & { character: Character; sheet: NonNullable<Wizard['sheet']> };
