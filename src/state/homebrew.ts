/** Conteúdo próprio salvo neste navegador (vale depois de recarregar a página). */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EMPTY_PACK, HOMEBREW_KEY, type HomebrewKind, type HomebrewPack } from '@/content/homebrew';

type Entry = HomebrewPack[HomebrewKind][number];

interface HomebrewState {
  pack: HomebrewPack;
  save: (kind: HomebrewKind, entry: Entry) => void;
  remove: (kind: HomebrewKind, id: string) => void;
  replace: (pack: HomebrewPack) => void;
}

export const useHomebrew = create<HomebrewState>()(
  persist(
    (set) => ({
      pack: EMPTY_PACK,
      save: (kind, entry) =>
        set((s) => {
          const list = s.pack[kind] as Entry[];
          const next = list.some((x) => x.id === entry.id)
            ? list.map((x) => (x.id === entry.id ? entry : x))
            : [...list, entry];
          return { pack: { ...s.pack, [kind]: next } };
        }),
      remove: (kind, id) =>
        set((s) => ({
          pack: { ...s.pack, [kind]: (s.pack[kind] as Entry[]).filter((x) => x.id !== id) },
        })),
      replace: (pack) => set({ pack }),
    }),
    { name: HOMEBREW_KEY, version: 1 },
  ),
);
