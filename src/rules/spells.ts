/**
 * Quais magias um personagem pode escolher: listas por classe, limites por nível
 * e o círculo máximo que os espaços permitem.
 */
import type { ClassDef, ContentBundle, Spell } from '@/content/schema';
import type { Character } from '@/model/character';

/** Círculo mais alto com espaço disponível no nível (0 = só truques). */
export function maxSpellCircle(classDef: ClassDef | undefined, level: number): number {
  const row = classDef?.spellcasting?.slots[level - 1] ?? [];
  let max = 0;
  row.forEach((n, i) => {
    if (n > 0) max = i + 1;
  });
  return max;
}

export interface SpellBudget {
  cantrips: number;
  prepared: number;
  maxCircle: number;
  /** Magias sempre preparadas (subclasse): não contam no limite. */
  alwaysPrepared: string[];
}

export function spellBudget(c: Character, content: ContentBundle): SpellBudget | undefined {
  const classDef = content.classes.find((x) => x.id === c.classId);
  const sc = classDef?.spellcasting;
  if (!classDef || !sc) return undefined;
  const subclass =
    c.level >= 3
      ? content.subclasses.find((s) => s.id === c.subclassId && s.classId === classDef.id)
      : undefined;
  return {
    cantrips: sc.cantrips[c.level - 1] ?? 0,
    prepared: sc.prepared[c.level - 1] ?? 0,
    maxCircle: maxSpellCircle(classDef, c.level),
    alwaysPrepared: (subclass?.alwaysPrepared ?? [])
      .filter((g) => g.level <= c.level)
      .flatMap((g) => g.spells),
  };
}

/** Magias da lista de uma classe, de um círculo (0 = truques) até outro. */
export function classSpells(
  content: ContentBundle,
  classId: string,
  minCircle: number,
  maxCircle: number,
): Spell[] {
  return content.spells.filter(
    (s) => s.classes.includes(classId) && s.level >= minCircle && s.level <= maxCircle,
  );
}

/** Lista de magias escolhida no talento Iniciado em Magia → id da classe. */
export const MAGIC_INITIATE_LISTS: Record<string, string> = {
  clerigo: 'cleric',
  druida: 'druid',
  mago: 'wizard',
};

/**
 * Magias válidas para uma escolha "magia" de talento. Hoje só o Iniciado em Magia
 * tem escolhas assim: "cantrips" são truques e "spell" é 1º círculo da lista escolhida.
 */
export function featSpellOptions(
  content: ContentBundle,
  featId: string,
  choiceId: string,
  listOption: string | undefined,
): Spell[] {
  if (featId !== 'magic-initiate') return [];
  const classId = listOption ? MAGIC_INITIATE_LISTS[listOption] : undefined;
  if (!classId) return [];
  const circle = choiceId === 'cantrips' ? 0 : 1;
  return classSpells(content, classId, circle, circle);
}
