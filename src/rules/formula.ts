import type { Ability, ClassDef, Formula } from '@/content/schema';

export interface FormulaContext {
  level: number;
  proficiencyBonus: number;
  modifiers: Record<Ability, number>;
  classDef?: ClassDef;
}

/** Valor atual de uma coluna da tabela da classe (ex.: "furias" no nível 5 → 3). */
export function columnValue(classDef: ClassDef | undefined, column: string, level: number) {
  const col = classDef?.columns.find((c) => c.id === column);
  return col?.values[level - 1] ?? null;
}

export function evaluateFormula(formula: Formula, ctx: FormulaContext): number {
  if (typeof formula === 'number') return formula;
  switch (formula.kind) {
    case 'proficiencia':
      return ctx.proficiencyBonus;
    case 'modificador':
      return Math.max(ctx.modifiers[formula.ability], formula.min ?? -Infinity);
    case 'nivel':
      return ctx.level * (formula.multiplier ?? 1);
    case 'por-nivel':
      return formula.values[ctx.level - 1] ?? 0;
    case 'coluna': {
      const v = columnValue(ctx.classDef, formula.column, ctx.level);
      return typeof v === 'number' ? v : 0;
    }
  }
}
