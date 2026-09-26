import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '@/lib/id';

/**
 * Rascunho mínimo de personagem. O modelo completo (escolhas de espécie, classe,
 * atributos etc.) entra na Fase 2; a versão do armazenamento permite migrar depois.
 */
export interface CharacterDraft {
  id: string;
  name: string;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface CharactersState {
  characters: Record<string, CharacterDraft>;
  create: (partial?: Partial<Pick<CharacterDraft, 'name' | 'level'>>) => CharacterDraft;
  update: (id: string, patch: Partial<Omit<CharacterDraft, 'id' | 'createdAt'>>) => void;
  duplicate: (id: string) => CharacterDraft | undefined;
  remove: (id: string) => CharacterDraft | undefined;
  restore: (character: CharacterDraft) => void;
}

export const CHARACTERS_KEY = 'guia:personagens';
export const CHARACTERS_VERSION = 1;

export const useCharacters = create<CharactersState>()(
  persist(
    (set, get) => ({
      characters: {},

      create: (partial) => {
        const now = new Date().toISOString();
        const character: CharacterDraft = {
          id: newId(),
          name: partial?.name ?? '',
          level: partial?.level ?? 1,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ characters: { ...s.characters, [character.id]: character } }));
        return character;
      },

      update: (id, patch) =>
        set((s) => {
          const current = s.characters[id];
          if (!current) return s;
          return {
            characters: {
              ...s.characters,
              [id]: { ...current, ...patch, updatedAt: new Date().toISOString() },
            },
          };
        }),

      duplicate: (id) => {
        const original = get().characters[id];
        if (!original) return undefined;
        const now = new Date().toISOString();
        const copy: CharacterDraft = {
          ...structuredClone(original),
          id: newId(),
          name: original.name ? `${original.name} (cópia)` : '',
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ characters: { ...s.characters, [copy.id]: copy } }));
        return copy;
      },

      remove: (id) => {
        const removed = get().characters[id];
        if (!removed) return undefined;
        set((s) => {
          const { [id]: _removed, ...rest } = s.characters;
          return { characters: rest };
        });
        return removed;
      },

      restore: (character) =>
        set((s) => ({ characters: { ...s.characters, [character.id]: character } })),
    }),
    { name: CHARACTERS_KEY, version: CHARACTERS_VERSION },
  ),
);

/** Personagens ordenados do mais recente para o mais antigo. */
export function sortByRecent(characters: Record<string, CharacterDraft>): CharacterDraft[] {
  return Object.values(characters).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
