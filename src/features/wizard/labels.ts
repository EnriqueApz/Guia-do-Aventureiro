import { content } from '@/content';
import type { Ability, ArmorProficiency } from '@/content/schema';

export const ABILITY_LABEL: Record<Ability, { name: string; abbr: string }> = Object.fromEntries(
  content.abilities.map((a) => [a.id, { name: a.name, abbr: a.abbr }]),
) as Record<Ability, { name: string; abbr: string }>;

const itemNames = new Map(content.items.map((i) => [i.id, i.name]));
const languageNames = new Map(content.languages.map((l) => [l.id, l.name]));
const skillNames = new Map<string, string>(content.skills.map((s) => [s.id, s.name]));
const featNames = new Map(content.feats.map((f) => [f.id, f.name]));
const damageNames = new Map<string, string>(content.damageTypes.map((d) => [d.id, d.name]));

export const itemName = (id: string) => itemNames.get(id) ?? id;
export const languageName = (id: string) => languageNames.get(id) ?? id;
export const skillName = (id: string) => skillNames.get(id) ?? itemNames.get(id) ?? id;
export const featName = (id: string) => featNames.get(id) ?? id;
export const damageName = (id: string) => damageNames.get(id) ?? id;

const ARMOR: Record<ArmorProficiency, string> = {
  leve: 'armaduras leves',
  media: 'armaduras médias',
  pesada: 'armaduras pesadas',
  escudo: 'escudos',
};

export function armorList(list: ArmorProficiency[]): string {
  return list.length ? capitalize(joinPt(list.map((a) => ARMOR[a]))) : 'Nenhuma';
}

const PROPERTY: Record<string, string> = { leve: 'Leve', acuidade: 'Acuidade' };

export function weaponLabel(token: string): string {
  if (token === 'simples') return 'armas simples';
  if (token === 'marciais') return 'armas marciais';
  if (token.startsWith('arma:')) return itemName(token.slice(5));
  if (token.startsWith('marciais:')) {
    const props = token
      .slice(9)
      .split('|')
      .map((p) => PROPERTY[p] ?? p);
    return `armas marciais com ${joinPt(props, 'ou')}`;
  }
  return token;
}

export function weaponList(tokens: string[]): string {
  return tokens.length ? capitalize(joinPt(tokens.map(weaponLabel))) : 'Nenhuma';
}

export const ROLE_LABEL: Record<string, string> = {
  combatente: 'Combatente',
  defensor: 'Defensor',
  curandeiro: 'Curandeiro',
  conjurador: 'Conjurador',
  especialista: 'Especialista',
  suporte: 'Suporte',
};

export const ACTION_LABEL: Record<string, string> = {
  acao: 'Ação',
  'acao-bonus': 'Ação Bônus',
  reacao: 'Reação',
  passiva: 'Passiva',
};

export const RECHARGE_LABEL: Record<string, string> = {
  'descanso-curto': 'por descanso curto',
  'descanso-longo': 'por descanso longo',
};

export function joinPt(items: string[], last = 'e'): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${last} ${items.at(-1)}`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatBonus(n: number): string {
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`;
}
