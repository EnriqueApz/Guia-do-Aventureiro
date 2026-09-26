/** Mesa ativa neste aparelho (regras do Mestre), salva no navegador. */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TableRules } from '@/model/table';

export const TABLE_KEY = 'guia:mesa';

interface TableState {
  rules: TableRules | null;
  join: (rules: TableRules) => void;
  leave: () => void;
}

export const useTable = create<TableState>()(
  persist(
    (set) => ({
      rules: null,
      join: (rules) => set({ rules }),
      leave: () => set({ rules: null }),
    }),
    { name: TABLE_KEY, version: 1 },
  ),
);
