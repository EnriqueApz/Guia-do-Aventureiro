import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '@/lib/id';
import { emptyCharacter, type Character } from '@/model/character';

/** Personagem salvo (modelo completo em `@/model/character`). */
export type CharacterDraft = Character;

export interface CharactersState {
  characters: Record<string, CharacterDraft>;
  create: (partial?: Partial<Pick<CharacterDraft, 'name' | 'level'>>) => CharacterDraft;
  update: (id: string, patch: Partial<Omit<CharacterDraft, 'id' | 'createdAt'>>) => void;
  duplicate: (id: string) => CharacterDraft | undefined;
  remove: (id: string) => CharacterDraft | undefined;
  restore: (character: CharacterDraft) => void;
}

export const CHARACTERS_KEY = 'guia:personagens';
export const CHARACTERS_VERSION = 2;

export const useCharacters = create<CharactersState>()(
  persist(
    (set, get) => ({
      characters: {},

      create: (partial) => {
        const character: CharacterDraft = {
          ...emptyCharacter(newId(), new Date().toISOString()),
          ...(partial?.name !== undefined && { name: partial.name }),
          ...(partial?.level !== undefined && { level: partial.level }),
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
    { name: CHARACTERS_KEY, version: CHARACTERS_VERSION, migrate: migrateCharacters },
  ),
);

/** Personagens ordenados do mais recente para o mais antigo. */
export function sortByRecent(characters: Record<string, CharacterDraft>): CharacterDraft[] {
  return Object.values(characters).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

interface V1Draft {
  id: string;
  name: string;
  level: number;
  createdAt: string;
  updatedAt: string;
}

/** Migra dados salvos por versões antigas do site. */
export function migrateCharacters(
  persisted: unknown,
  version: number,
): Pick<CharactersState, 'characters'> {
  const state = (persisted ?? {}) as { characters?: Record<string, unknown> };
  const characters = state.characters ?? {};
  if (version < 2) {
    const migrated: Record<string, Character> = {};
    for (const raw of Object.values(characters) as V1Draft[]) {
      migrated[raw.id] = {
        ...emptyCharacter(raw.id, raw.createdAt),
        name: raw.name,
        level: raw.level,
        updatedAt: raw.updatedAt,
      };
    }
    return { characters: migrated };
  }
  return { characters: characters as Record<string, Character> };
}
