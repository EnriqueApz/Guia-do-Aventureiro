/**
 * Resumo do personagem em um parágrafo, montado a partir da ficha derivada.
 * Função pura para poder ser testada sem React.
 */
import type { ContentBundle } from '@/content/schema';
import { ABILITIES } from '@/content/schema';
import type { Character } from '@/model/character';
import type { Sheet } from '@/rules/derive';
import { formatMeters } from '@/rules/encumbrance';
import { ALIGNMENTS } from './detailsData';

const ORDINAL = (n: number) => `${n}º`;

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function joinPt(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} e ${items.at(-1)}`;
}

export function characterSummary(c: Character, sheet: Sheet, content: ContentBundle): string {
  const name = c.name.trim() || 'Seu personagem';
  const parts: string[] = [];

  // Sem artigos nem adjetivos de gênero: o texto serve para qualquer personagem.
  const identity = [
    sheet.species?.name,
    sheet.classDef && `${sheet.classDef.name} de ${ORDINAL(c.level)} nível`,
  ].filter(Boolean);
  let first = `${name}: ${identity.length ? identity.join(', ') : `personagem de ${ORDINAL(c.level)} nível`}`;
  if (sheet.subclass) first += ` (${sheet.subclass.name})`;
  if (sheet.background) first += `, com o antecedente ${sheet.background.name}`;
  parts.push(`${first}.`);

  const best = [...ABILITIES].sort((a, b) => sheet.abilities[b].score - sheet.abilities[a].score);
  const abilityName = new Map(content.abilities.map((a) => [a.id, a.name]));
  const [top, second] = best;
  if (top && second && sheet.abilities[top].score > 10)
    parts.push(
      `Seus pontos fortes são ${abilityName.get(top)} (${sheet.abilities[top].score}) e ${abilityName.get(second)} (${sheet.abilities[second].score}).`,
    );

  parts.push(
    `Em combate, tem CA ${sheet.ac.value}, ${sheet.hp.max} Pontos de Vida e deslocamento de ${formatMeters(sheet.speed.walk)}.`,
  );

  const spellNames = new Map(content.spells.map((s) => [s.id, s.name]));
  const spells = [...c.spells.cantrips, ...c.spells.prepared]
    .slice(0, 3)
    .map((id) => spellNames.get(id) ?? id);
  const weapons = sheet.attacks.filter((a) => a.id !== 'ataque-desarmado').slice(0, 2);
  if (spells.length) parts.push(`Conta com magias como ${joinPt(spells)}.`);
  else if (weapons.length)
    parts.push(`Luta com ${joinPt(weapons.map((w) => w.name.toLowerCase()))}.`);

  const skills = Object.values(sheet.skills)
    .filter((s) => s.proficient)
    .sort((a, b) => b.bonus - a.bonus)
    .slice(0, 3)
    .map((s) => content.skills.find((x) => x.id === s.id)?.name ?? s.id);
  if (skills.length) parts.push(`Tem mais facilidade com ${joinPt(skills)}.`);

  const alignment = ALIGNMENTS.find((a) => a.id === c.details.alignment);
  const trait = c.details.personality.traits.trim();
  if (trait)
    parts.push(`Quem convive com ${name} logo nota: ${lowerFirst(trait.replace(/\.$/, ''))}.`);
  if (alignment) parts.push(`Alinhamento: ${alignment.name}.`);
  if (c.details.hook?.trim()) parts.push(c.details.hook.trim());

  return parts.join(' ');
}
