import type { Ability } from '@/content/schema';
import { ABILITIES } from '@/content/schema';
import type { AbilityScores } from '@/model/character';
import { rollDie, type Rng } from './dice';

export { ABILITIES };

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `−${Math.abs(mod)}`;
}

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;
const POINT_BUY_COST: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export function pointBuyCost(score: number): number {
  const cost = POINT_BUY_COST[score];
  if (cost === undefined)
    throw new RangeError(`Na compra de pontos, os valores vão de 8 a 15 (recebi ${score}).`);
  return cost;
}

export function pointBuySpent(scores: AbilityScores): number {
  return ABILITIES.reduce((sum, a) => sum + pointBuyCost(scores[a]), 0);
}

/** Aumenta ou diminui um valor na compra de pontos, se couber no orçamento. */
export function canChangePointBuy(scores: AbilityScores, ability: Ability, delta: 1 | -1): boolean {
  const next = scores[ability] + delta;
  if (next < POINT_BUY_MIN || next > POINT_BUY_MAX) return false;
  return pointBuySpent({ ...scores, [ability]: next }) <= POINT_BUY_BUDGET;
}

/** Verdadeiro se os seis valores são exatamente o array padrão, em qualquer ordem. */
export function isStandardArray(scores: AbilityScores): boolean {
  const sorted = ABILITIES.map((a) => scores[a]).sort((x, y) => y - x);
  return sorted.join() === STANDARD_ARRAY.join();
}

export interface AbilityRoll {
  dice: number[];
  dropped: number;
  total: number;
}

/** 4d6, descartando o menor. */
export function roll4d6DropLowest(rng?: Rng): AbilityRoll {
  const dice = [rollDie(6, rng), rollDie(6, rng), rollDie(6, rng), rollDie(6, rng)];
  const dropped = Math.min(...dice);
  const total = dice.reduce((a, b) => a + b, 0) - dropped;
  return { dice, dropped, total };
}

/** Valida o aumento do antecedente: +2/+1 em dois atributos ou +1/+1/+1 nos três. */
export function isValidBackgroundBonus(
  bonus: Partial<AbilityScores>,
  options: readonly Ability[],
): boolean {
  const entries = Object.entries(bonus).filter(([, v]) => v);
  if (entries.some(([a]) => !options.includes(a as Ability))) return false;
  const values = entries.map(([, v]) => v).sort();
  return values.join() === '1,2' || values.join() === '1,1,1';
}

/** Valida as escolhas do talento Aumento no Valor de Atributo: +2 em um ou +1 em dois. */
export function isValidAsi(bonus: Partial<AbilityScores>): boolean {
  const values = Object.values(bonus).filter(Boolean).sort();
  return values.join() === '2' || values.join() === '1,1';
}
