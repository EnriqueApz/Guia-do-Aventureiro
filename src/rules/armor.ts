import type { Ability, Item } from '@/content/schema';

export interface UnarmoredOption {
  base: number;
  abilities: Ability[];
  allowShield: boolean;
  source: string;
}

export interface AcInput {
  modifiers: Record<Ability, number>;
  armor?: Item;
  shield?: Item;
  unarmored: UnarmoredOption[];
  /** Bônus que só valem vestindo armadura (Defesa). */
  armoredBonus?: number;
  flatBonus?: number;
}

export interface AcResult {
  value: number;
  formula: string;
  parts: { label: string; value: number }[];
}

/** Calcula a CA escolhendo a melhor fórmula permitida pelo equipamento. */
export function armorClass(input: AcInput): AcResult {
  const { modifiers, armor, shield, unarmored, armoredBonus = 0, flatBonus = 0 } = input;
  const dex = modifiers.des;
  const candidates: AcResult[] = [];

  if (armor?.armor) {
    const cap = armor.armor.dexCap;
    const dexPart = cap === null ? dex : Math.min(dex, cap);
    const parts = [{ label: armor.name, value: armor.armor.base }];
    if (dexPart) parts.push({ label: 'Destreza', value: dexPart });
    if (armoredBonus) parts.push({ label: 'Estilo de luta Defesa', value: armoredBonus });
    candidates.push({ value: 0, formula: armor.name, parts });
  } else {
    candidates.push({
      value: 0,
      formula: 'Sem armadura',
      parts: [
        { label: 'Base', value: 10 },
        { label: 'Destreza', value: dex },
      ],
    });
    for (const opt of unarmored) {
      if (shield && !opt.allowShield) continue;
      const parts = [{ label: 'Base', value: opt.base }];
      for (const a of opt.abilities) parts.push({ label: ABILITY_NAMES[a], value: modifiers[a] });
      candidates.push({ value: 0, formula: opt.source, parts });
    }
  }

  for (const c of candidates) {
    if (shield?.shield) c.parts.push({ label: shield.name, value: shield.shield.bonus });
    if (flatBonus) c.parts.push({ label: 'Outros bônus', value: flatBonus });
    c.value = c.parts.reduce((sum, p) => sum + p.value, 0);
  }
  return candidates.reduce((best, c) => (c.value > best.value ? c : best));
}

const ABILITY_NAMES: Record<Ability, string> = {
  for: 'Força',
  des: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  sab: 'Sabedoria',
  car: 'Carisma',
};
