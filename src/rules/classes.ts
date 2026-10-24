/**
 * Classes do personagem (multiclasse): quantos níveis em cada uma, subclasses,
 * requisitos e os espaços de magia combinados. Funções puras.
 *
 * A classe principal é a de `character.classId` (a do nível 1) e fica com os níveis
 * que sobram depois das classes de `character.multiclass`.
 */
import type { Ability, ClassDef, ContentBundle, Subclass } from '@/content/schema';
import type { Character } from '@/model/character';

export interface ClassEntry {
  classDef: ClassDef;
  subclass?: Subclass;
  /** Níveis nesta classe. */
  levels: number;
  primary: boolean;
  /** Prefixo das escolhas das características ("classe" na principal). */
  scope: string;
  subScope: string;
}

/** Níveis somados das classes extras (multiclasse). */
export function extraLevels(c: Character): number {
  return (c.multiclass ?? []).reduce((s, m) => s + Math.max(0, m.levels), 0);
}

/** Níveis da classe principal: o que sobra do nível total (mínimo 1). */
export function primaryLevels(c: Character): number {
  return Math.max(1, c.level - extraLevels(c));
}

export function scopesFor(classId: string, primary: boolean) {
  return primary
    ? { scope: 'classe', subScope: 'subclasse' }
    : { scope: `classe@${classId}`, subScope: `subclasse@${classId}` };
}

/** Todas as classes do personagem, a principal primeiro. Ignora classes desconhecidas. */
export function classEntries(c: Character, content: ContentBundle): ClassEntry[] {
  const out: ClassEntry[] = [];
  const add = (
    classId: string | undefined,
    subclassId: string | undefined,
    levels: number,
    primary: boolean,
  ) => {
    const classDef = content.classes.find((x) => x.id === classId);
    if (!classDef || levels < 1) return;
    const subclass =
      levels >= classDef.subclassLevel
        ? content.subclasses.find((s) => s.id === subclassId && s.classId === classDef.id)
        : undefined;
    out.push({
      classDef,
      ...(subclass && { subclass }),
      levels,
      primary,
      ...scopesFor(classDef.id, primary),
    });
  };
  add(c.classId, c.subclassId, primaryLevels(c), true);
  for (const m of c.multiclass ?? [])
    if (m.classId !== c.classId) add(m.classId, m.subclassId, m.levels, false);
  return out;
}

export function isMulticlass(c: Character): boolean {
  return (c.multiclass ?? []).some((m) => m.levels > 0);
}

/** "Clérigo 3 / Guerreiro 2" (ou "Clérigo 5" sem multiclasse). */
export function classLabel(entries: ClassEntry[]): string {
  return entries.map((e) => `${e.classDef.name} ${e.levels}`).join(' / ');
}

/**
 * Dado de vida de cada nível de personagem, em ordem: primeiro os níveis da classe
 * principal, depois os de cada classe extra (é a ordem usada nas rolagens de PV).
 */
export function hitDiceByLevel(entries: ClassEntry[]): number[] {
  return entries.flatMap((e) => Array.from({ length: e.levels }, () => e.classDef.hitDie));
}

/** Requisito de multiclasse: 13 nos atributos principais (todos, ou um deles se "ou"). */
export function meetsMulticlassRequirement(
  classDef: ClassDef,
  scores: Record<Ability, number>,
): boolean {
  const ok = (a: Ability) => (scores[a] ?? 0) >= 13;
  return classDef.primaryMode === 'ou'
    ? classDef.primaryAbilities.some(ok)
    : classDef.primaryAbilities.every(ok);
}

/** Texto do requisito ("Força 13", "Força ou Destreza 13"). */
export function requirementLabel(classDef: ClassDef, names: Record<Ability, string>): string {
  const list = classDef.primaryAbilities.map((a) => names[a]);
  const join = classDef.primaryMode === 'ou' ? ' ou ' : ' e ';
  return `${list.join(join)} 13`;
}

/**
 * Nível de conjurador da multiclasse: níveis inteiros das classes de conjuração
 * completa + metade (arredondada para cima) das de meia conjuração. Magia de Pacto
 * fica de fora (tem espaços próprios).
 */
export function multiclassCasterLevel(entries: ClassEntry[]): number {
  let total = 0;
  for (const e of entries) {
    const p = e.classDef.spellcasting?.progression;
    if (p === 'completa') total += e.levels;
    else if (p === 'meia') total += Math.ceil(e.levels / 2);
  }
  return total;
}

export interface SlotPools {
  /** Espaços comuns (índice 0 = 1º círculo). */
  slots: number[];
  /** Espaços de Magia de Pacto, quando há Bruxo junto de outra classe conjuradora. */
  pactSlots?: number[];
  /** Só Bruxo: os espaços comuns SÃO os de pacto (voltam no descanso curto). */
  pactOnly: boolean;
}

/**
 * Espaços de magia. Com uma só classe conjuradora, usa a tabela dela no nível dela.
 * Com duas ou mais (sem contar Magia de Pacto), usa a tabela de conjurador completo
 * no nível de conjurador da multiclasse.
 */
export function spellSlotPools(entries: ClassEntry[], content: ContentBundle): SlotPools {
  const empty = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const regular = entries.filter(
    (e) => e.classDef.spellcasting && e.classDef.spellcasting.progression !== 'pacto',
  );
  const pact = entries.find((e) => e.classDef.spellcasting?.progression === 'pacto');
  const pactRow = pact
    ? [...(pact.classDef.spellcasting?.slots[pact.levels - 1] ?? empty)]
    : undefined;

  let slots = [...empty];
  if (regular.length === 1) {
    const e = regular[0] as ClassEntry;
    slots = [...(e.classDef.spellcasting?.slots[e.levels - 1] ?? empty)];
  } else if (regular.length > 1) {
    const level = Math.min(20, multiclassCasterLevel(regular));
    const full = content.classes.find((c) => c.spellcasting?.progression === 'completa');
    slots = [...(full?.spellcasting?.slots[level - 1] ?? empty)];
  }
  if (!regular.length && pactRow) return { slots: pactRow, pactOnly: true };
  return { slots, ...(pactRow && { pactSlots: pactRow }), pactOnly: false };
}
