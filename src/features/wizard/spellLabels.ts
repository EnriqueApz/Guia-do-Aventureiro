import { content } from '@/content';
import type { School } from '@/content/schema';

export const SCHOOL_LABEL: Record<School, string> = {
  abjuracao: 'Abjuração',
  adivinhacao: 'Adivinhação',
  conjuracao: 'Conjuração',
  encantamento: 'Encantamento',
  evocacao: 'Evocação',
  ilusao: 'Ilusão',
  necromancia: 'Necromancia',
  transmutacao: 'Transmutação',
};

export const spellName = (() => {
  const names = new Map(content.spells.map((s) => [s.id, s.name]));
  return (id: string) => names.get(id) ?? id;
})();

export function circleLabel(level: number): string {
  return level === 0 ? 'Truque' : `${level}º círculo`;
}
