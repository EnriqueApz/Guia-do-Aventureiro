/**
 * Rolador de dados: modo (normal/vantagem/desvantagem) e histórico das últimas
 * rolagens, salvos no navegador.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '@/lib/id';
import { formatDice, parseDice, roll, rollD20, type Rng, type RollMode } from '@/rules/dice';

export const ROLLS_KEY = 'guia:rolagens';
export const HISTORY_LIMIT = 30;

export interface RollEntry {
  id: string;
  /** O que foi rolado ("Percepção", "Espada longa: dano", "2d6+3"). */
  label: string;
  /** Expressão exibida ("d20+4", "2d6+3"). */
  expr: string;
  mode: RollMode;
  /** Todos os dados rolados. Em testes de d20 com vantagem/desvantagem, os dois. */
  dice: number[];
  /** Para d20: o dado que valeu. */
  kept?: number;
  total: number;
  natural20?: boolean;
  natural1?: boolean;
  at: string;
}

interface RollsState {
  mode: RollMode;
  history: RollEntry[];
  setMode: (mode: RollMode) => void;
  /** Teste de d20 (ataque, perícia, salvaguarda) no modo atual; volta ao normal depois. */
  check: (label: string, modifier: number, rng?: Rng) => RollEntry;
  /** Rola uma expressão ("2d6+3"); lança erro se for inválida. */
  rollExpr: (label: string, expr: string, rng?: Rng) => RollEntry;
  clear: () => void;
}

const signed = (n: number) => (n ? `${n > 0 ? '+' : '−'}${Math.abs(n)}` : '');

export const useRolls = create<RollsState>()(
  persist(
    (set, get) => {
      const push = (entry: RollEntry) => {
        set((s) => ({ history: [entry, ...s.history].slice(0, HISTORY_LIMIT) }));
        return entry;
      };
      return {
        mode: 'normal',
        history: [],
        setMode: (mode) => set({ mode }),
        check: (label, modifier, rng) => {
          const mode = get().mode;
          const r = rollD20(modifier, mode, rng);
          // Vantagem/desvantagem vale para uma rolagem: depois volta ao normal.
          if (mode !== 'normal') set({ mode: 'normal' });
          return push({
            id: newId(),
            label,
            expr: `d20${signed(modifier)}`,
            mode,
            dice: r.rolls,
            kept: r.kept,
            total: r.total,
            natural20: r.natural20,
            natural1: r.natural1,
            at: new Date().toISOString(),
          });
        },
        rollExpr: (label, expr, rng) => {
          const parsed = parseDice(expr);
          if (parsed.count > 100 || parsed.sides > 1000)
            throw new Error('Rolagem grande demais: use até 100 dados de até 1000 lados.');
          const r = roll(parsed, rng);
          return push({
            id: newId(),
            label,
            expr: formatDice(parsed),
            mode: 'normal',
            dice: r.rolls,
            total: r.total,
            at: new Date().toISOString(),
          });
        },
        clear: () => set({ history: [] }),
      };
    },
    { name: ROLLS_KEY, version: 1, partialize: (s) => ({ history: s.history }) },
  ),
);
