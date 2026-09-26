import type { Spellcasting } from '@/content/schema';

/** Espaços de magia de um conjurador completo, por nível (tabela padrão do SRD). */
export const FULL_CASTER_SLOTS: number[][] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

/** Magia de Pacto do Bruxo: [quantidade de espaços, círculo dos espaços] por nível. */
export const PACT_SLOTS: [number, number][] = [
  [1, 1],
  [2, 1],
  [2, 2],
  [2, 2],
  [2, 3],
  [2, 3],
  [2, 4],
  [2, 4],
  [2, 5],
  [2, 5],
  [3, 5],
  [3, 5],
  [3, 5],
  [3, 5],
  [3, 5],
  [3, 5],
  [4, 5],
  [4, 5],
  [4, 5],
  [4, 5],
];

function checkLevel(level: number) {
  if (level < 1 || level > 20) throw new RangeError(`Nível deve ser de 1 a 20 (recebi ${level}).`);
}

/**
 * Espaços por círculo (9 posições) para uma progressão.
 * Meio-conjuradores (regras de 2024) usam a tabela completa no nível ⌈nível/2⌉.
 */
export function spellSlots(progression: Spellcasting['progression'], level: number): number[] {
  checkLevel(level);
  if (progression === 'completa') return [...(FULL_CASTER_SLOTS[level - 1] ?? [])];
  if (progression === 'meia') return [...(FULL_CASTER_SLOTS[Math.ceil(level / 2) - 1] ?? [])];
  const [count, slotLevel] = PACT_SLOTS[level - 1] ?? [0, 0];
  return Array.from({ length: 9 }, (_, i) => (i === slotLevel - 1 ? count : 0));
}

/** Maior círculo de magia que o personagem consegue lançar com espaços. */
export function highestSlotLevel(slots: number[]): number {
  for (let i = slots.length - 1; i >= 0; i--) if ((slots[i] ?? 0) > 0) return i + 1;
  return 0;
}

export function spellSaveDc(abilityMod: number, proficiencyBonus: number): number {
  return 8 + abilityMod + proficiencyBonus;
}

export function spellAttackBonus(abilityMod: number, proficiencyBonus: number): number {
  return abilityMod + proficiencyBonus;
}

/** Truques de dano ficam mais fortes nos níveis de personagem 5, 11 e 17. */
export function cantripDiceMultiplier(level: number): number {
  checkLevel(level);
  return level >= 17 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1;
}
