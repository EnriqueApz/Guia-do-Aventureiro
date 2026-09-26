/** Validação (Zod) do código da mesa recebido por link. */
import { z } from 'zod';
import { ABILITY_METHODS, type TableRules } from './table';

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

export function parseTable(data: unknown): TableRules | undefined {
  const r = TableRulesSchema.safeParse(data);
  return r.success ? (r.data as TableRules) : undefined;
}
