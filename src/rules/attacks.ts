import type { Ability, Item, Mastery, WeaponProperty } from '@/content/schema';
import { formatDice, parseDice } from './dice';

/** Proficiência com armas: "simples", "marciais", "marciais:leve|acuidade" ou "arma:<id>". */
export function isWeaponProficient(item: Item, proficiencies: string[]): boolean {
  const w = item.weapon;
  if (!w) return false;
  return proficiencies.some((p) => {
    if (p === 'simples') return w.group === 'simples';
    if (p === 'marciais') return w.group === 'marcial';
    if (p.startsWith('arma:')) return p.slice(5) === item.id;
    if (p.startsWith('marciais:')) {
      const props = p.slice(9).split('|') as WeaponProperty[];
      return w.group === 'marcial' && props.some((prop) => w.properties.includes(prop));
    }
    return false;
  });
}

export interface AttackInput {
  item: Item;
  modifiers: Record<Ability, number>;
  proficiencyBonus: number;
  proficient: boolean;
  rangedBonus?: number;
  /** Dado de Artes Marciais do monge, se a arma conta como arma de Monge. */
  martialArtsDie?: number;
  masteries?: string[];
}

export interface Attack {
  id: string;
  name: string;
  ability: Ability;
  attackBonus: number;
  damage: string;
  versatileDamage?: string;
  damageType: string;
  range?: [number, number];
  properties: WeaponProperty[];
  mastery?: Mastery;
  proficient: boolean;
}

/** Monta um ataque com arma: atributo, bônus de ataque e dano. */
export function weaponAttack(input: AttackInput): Attack {
  const {
    item,
    modifiers,
    proficiencyBonus,
    proficient,
    rangedBonus = 0,
    martialArtsDie,
    masteries = [],
  } = input;
  const w = item.weapon;
  if (!w) throw new Error(`${item.id} não é uma arma.`);
  const ranged = w.kind === 'distancia';
  const finesse = w.properties.includes('acuidade') || martialArtsDie !== undefined;
  const ability: Ability = ranged
    ? 'des'
    : finesse && modifiers.des > modifiers.for
      ? 'des'
      : 'for';
  const mod = modifiers[ability];
  const attackBonus = mod + (proficient ? proficiencyBonus : 0) + (ranged ? rangedBonus : 0);
  const withMod = (dice: string) => {
    const d = parseDice(dice);
    return formatDice({ ...d, modifier: d.modifier + mod });
  };
  let baseDice = w.damage;
  if (martialArtsDie && dieAverage(`1d${martialArtsDie}`) > dieAverage(w.damage))
    baseDice = `1d${martialArtsDie}`;
  return {
    id: item.id,
    name: item.name,
    ability,
    attackBonus,
    damage: withMod(baseDice),
    ...(w.versatile && { versatileDamage: withMod(w.versatile) }),
    damageType: w.damageType,
    ...(w.range && { range: w.range }),
    properties: w.properties,
    ...(masteries.includes(item.id) && { mastery: w.mastery }),
    proficient,
  };
}

/** Ataque Desarmado: 1 + Força (ou o dado de Artes Marciais do monge). */
export function unarmedStrike(
  modifiers: Record<Ability, number>,
  proficiencyBonus: number,
  martialArtsDie?: number,
): Attack {
  const ability: Ability = martialArtsDie && modifiers.des > modifiers.for ? 'des' : 'for';
  const mod = modifiers[ability];
  const damage = martialArtsDie
    ? formatDice({ count: 1, sides: martialArtsDie, modifier: mod })
    : String(Math.max(0, 1 + mod));
  return {
    id: 'ataque-desarmado',
    name: 'Ataque Desarmado',
    ability,
    attackBonus: mod + proficiencyBonus,
    damage,
    damageType: 'concussao',
    properties: [],
    proficient: true,
  };
}

function dieAverage(expr: string): number {
  const d = parseDice(expr);
  return (d.count * (d.sides + 1)) / 2 + d.modifier;
}
