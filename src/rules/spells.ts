/**
 * Quais magias um personagem pode escolher: listas por classe, limites por nível
 * e o círculo máximo que os espaços permitem.
 */
import type { ClassDef, ContentBundle, Spell } from '@/content/schema';
import type { Character } from '@/model/character';
import { classEntries } from './classes';

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

/** Limites de magias da classe principal (no nível dela). */
export function spellBudget(c: Character, content: ContentBundle): SpellBudget | undefined {
  const main = spellBudgets(c, content).find((b) => b.key === 'principal');
  if (!main) return undefined;
  const { cantrips, prepared, maxCircle, alwaysPrepared } = main;
  return { cantrips, prepared, maxCircle, alwaysPrepared };
}

export interface ClassSpellBudget extends SpellBudget {
  classId: string;
  className: string;
  /** "principal" (classe do nível 1) ou o id da classe extra. */
  key: string;
}

/** Limites de magias de cada classe conjuradora (multiclasse: cada uma pelo próprio nível). */
export function spellBudgets(c: Character, content: ContentBundle): ClassSpellBudget[] {
  return classEntries(c, content).flatMap((e) => {
    const sc = e.classDef.spellcasting;
    if (!sc) return [];
    return [
      {
        classId: e.classDef.id,
        className: e.classDef.name,
        key: e.primary ? 'principal' : e.classDef.id,
        cantrips: sc.cantrips[e.levels - 1] ?? 0,
        prepared: sc.prepared[e.levels - 1] ?? 0,
        maxCircle: maxSpellCircle(e.classDef, e.levels),
        alwaysPrepared: (e.subclass?.alwaysPrepared ?? [])
          .filter((g) => g.level <= e.levels)
          .flatMap((g) => g.spells),
      },
    ];
  });
}

/** Magias escolhidas de uma classe ("principal" ou id da classe extra). */
export function chosenSpells(
  c: Character,
  key: string,
): { cantrips: string[]; prepared: string[] } {
  if (key === 'principal') return { cantrips: c.spells.cantrips, prepared: c.spells.prepared };
  return c.spells.byClass?.[key] ?? { cantrips: [], prepared: [] };
}

/** Todas as magias escolhidas, de todas as classes. */
export function allChosenSpells(c: Character): { cantrips: string[]; prepared: string[] } {
  const extra = Object.values(c.spells.byClass ?? {});
  return {
    cantrips: [...c.spells.cantrips, ...extra.flatMap((x) => x.cantrips)],
    prepared: [...c.spells.prepared, ...extra.flatMap((x) => x.prepared)],
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
