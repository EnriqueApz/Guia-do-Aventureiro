/**
 * Código da mesa: as regras que o Mestre escolhe (nível, opções liberadas, métodos
 * de atributo e de PV). Vai comprimido no link `/mesa#m=...`.
 */
import { z } from 'zod';
import type { ContentBundle } from '@/content/schema';
import type { Issue } from '@/rules/validate';
import type { AbilityMethod, Character } from './character';

export const ABILITY_METHODS = ['padrao', 'compra', 'rolagem', 'manual'] as const;

export const TableRulesSchema = z.object({
  v: z.literal(1),
  name: z.string().max(80).optional(),
  /** Nível inicial obrigatório; ausente = livre. */
  level: z.number().int().min(1).max(20).optional(),
  /** Ids liberados; ausente = tudo liberado. */
  species: z.array(z.string()).optional(),
  classes: z.array(z.string()).optional(),
  backgrounds: z.array(z.string()).optional(),
  abilityMethods: z.array(z.enum(ABILITY_METHODS)).min(1),
  hpMethod: z.enum(['media', 'rolagem', 'livre']),
  allowHomebrew: z.boolean(),
});
export type TableRules = z.infer<typeof TableRulesSchema>;

export const DEFAULT_TABLE: TableRules = {
  v: 1,
  abilityMethods: ['padrao', 'compra', 'rolagem', 'manual'],
  hpMethod: 'livre',
  allowHomebrew: true,
};

export const METHOD_LABEL: Record<AbilityMethod, string> = {
  padrao: 'Array padrão',
  compra: 'Compra de pontos',
  rolagem: 'Rolagem 4d6',
  manual: 'Valores digitados',
};

export function parseTable(data: unknown): TableRules | undefined {
  const r = TableRulesSchema.safeParse(data);
  return r.success ? r.data : undefined;
}

/** Conteúdo próprio bloqueado pela mesa? */
export function homebrewBlocked(
  rules: TableRules | null | undefined,
  entry: { source: { kind: string } },
): boolean {
  return !!rules && !rules.allowHomebrew && entry.source.kind === 'homebrew';
}

/** A opção está liberada pela mesa? (lista ausente = tudo liberado) */
export function allowed(list: string[] | undefined, id: string | undefined): boolean {
  return !list || (id !== undefined && list.includes(id));
}

/** Problemas do personagem diante das regras da mesa, ligados às etapas do assistente. */
export function tableIssues(c: Character, rules: TableRules, content: ContentBundle): Issue[] {
  const issues: Issue[] = [];
  const err = (step: Issue['step'], message: string) =>
    issues.push({ step, severity: 'erro', message });
  const table = rules.name ? `A mesa “${rules.name}”` : 'A mesa';
  if (rules.level && c.level !== rules.level)
    err('classe', `${table} começa no nível ${rules.level}.`);
  if (c.speciesId && !allowed(rules.species, c.speciesId)) {
    const name = content.species.find((s) => s.id === c.speciesId)?.name ?? c.speciesId;
    err('especie', `${table} não liberou a espécie ${name}.`);
  }
  if (c.classId && !allowed(rules.classes, c.classId)) {
    const name = content.classes.find((s) => s.id === c.classId)?.name ?? c.classId;
    err('classe', `${table} não liberou a classe ${name}.`);
  }
  if (c.backgroundId && !allowed(rules.backgrounds, c.backgroundId)) {
    const name = content.backgrounds.find((s) => s.id === c.backgroundId)?.name ?? c.backgroundId;
    err('antecedente', `${table} não liberou o antecedente ${name}.`);
  }
  if (!rules.allowHomebrew) {
    const own = [
      content.species.find((x) => x.id === c.speciesId),
      content.subclasses.find((x) => x.id === c.subclassId),
      content.backgrounds.find((x) => x.id === c.backgroundId),
    ].filter((x) => x?.source.kind === 'homebrew');
    for (const x of own)
      if (x) err('especie', `${table} não permite conteúdo próprio (${x.name}).`);
  }
  if (!rules.abilityMethods.includes(c.abilities.method))
    err('atributos', `${table} não usa ${METHOD_LABEL[c.abilities.method].toLowerCase()}.`);
  if (rules.hpMethod !== 'livre' && c.level > 1 && c.hp.method !== rules.hpMethod)
    err(
      'escolhas',
      `${table} usa PV ${rules.hpMethod === 'media' ? 'pela média' : 'rolados'} a cada nível.`,
    );
  return issues;
}

/** Ajusta um personagem novo às regras da mesa (nível, método de atributos, PV). */
export function applyTableDefaults(c: Character, rules: TableRules): Character {
  const method = rules.abilityMethods.includes(c.abilities.method)
    ? c.abilities.method
    : (rules.abilityMethods[0] ?? 'padrao');
  return {
    ...c,
    ...(rules.level && { level: rules.level }),
    abilities: method === c.abilities.method ? c.abilities : { ...c.abilities, method },
    ...(rules.hpMethod !== 'livre' && { hp: { ...c.hp, method: rules.hpMethod } }),
  };
}
