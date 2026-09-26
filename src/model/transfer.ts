/**
 * Exportar e importar personagens em JSON. A importação valida tudo com Zod e
 * devolve mensagens em português que dizem o que está errado e onde.
 */
import { z } from 'zod';
import { ABILITIES } from '@/content/schema';
import { newId } from '@/lib/id';
import { emptyCharacter, type Character } from './character';

export const EXPORT_APP = 'guia-do-aventureiro';
export const EXPORT_VERSION = 2;

const Scores = z.object(
  Object.fromEntries(ABILITIES.map((a) => [a, z.number().int().min(1).max(30)])) as Record<
    (typeof ABILITIES)[number],
    z.ZodNumber
  >,
);
const PartialScores = z.object(
  Object.fromEntries(ABILITIES.map((a) => [a, z.number().int().optional()])) as Record<
    (typeof ABILITIES)[number],
    z.ZodOptional<z.ZodNumber>
  >,
);
const Coins = z.object({
  pc: z.number().min(0),
  pp: z.number().min(0),
  pe: z.number().min(0),
  po: z.number().min(0),
  pl: z.number().min(0),
});

export const CharacterSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.literal(2),
  createdAt: z.string(),
  updatedAt: z.string(),
  name: z.string(),
  level: z.number().int().min(1).max(20),
  speciesId: z.string().optional(),
  lineageId: z.string().optional(),
  size: z.enum(['Pequeno', 'Médio']).optional(),
  lineageSpellAbility: z.enum(ABILITIES).optional(),
  classId: z.string().optional(),
  subclassId: z.string().optional(),
  backgroundId: z.string().optional(),
  backgroundBonus: PartialScores,
  abilities: z.object({
    method: z.enum(['padrao', 'compra', 'rolagem', 'manual']),
    base: Scores,
    rolls: z.array(z.array(z.number().int().min(1).max(6))).optional(),
  }),
  choices: z.record(z.string(), z.array(z.string())),
  feats: z.array(
    z.object({
      level: z.number().int().min(1).max(20),
      featId: z.string(),
      abilityBonus: PartialScores.optional(),
      choices: z.record(z.string(), z.array(z.string())).optional(),
    }),
  ),
  hp: z.object({
    method: z.enum(['media', 'rolagem']),
    rolls: z.record(z.string(), z.number().int()),
  }),
  startingEquipment: z.object({
    classOption: z.string().optional(),
    backgroundOption: z.string().optional(),
  }),
  inventory: z.array(
    z.object({ id: z.string(), qty: z.number().int().min(0), equipped: z.boolean().optional() }),
  ),
  coins: Coins,
  spells: z.object({ cantrips: z.array(z.string()), prepared: z.array(z.string()) }),
  details: z.object({
    pronouns: z.string().optional(),
    alignment: z.string().optional(),
    appearance: z.string(),
    personality: z.object({
      traits: z.string(),
      ideals: z.string(),
      bonds: z.string(),
      flaws: z.string(),
    }),
    backstory: z.string(),
    hook: z.string().optional(),
  }),
  overrides: z.record(z.string(), z.union([z.number(), z.string()])),
  play: z.object({
    hpCurrent: z.number().int().min(0).nullable(),
    hpTemp: z.number().int().min(0),
    hitDiceUsed: z.number().int().min(0),
    slotsUsed: z.array(z.number().int().min(0)),
    resourcesUsed: z.record(z.string(), z.number().int().min(0)),
    conditions: z.array(z.string()),
    exhaustion: z.number().int().min(0).max(6),
    deathSaves: z.object({
      successes: z.number().int().min(0).max(3),
      failures: z.number().int().min(0).max(3),
    }),
    heroicInspiration: z.boolean(),
  }),
  wizardStep: z.string().optional(),
});

/** Nomes amigáveis dos campos, para as mensagens de erro. */
const FIELD: Record<string, string> = {
  id: 'identificador',
  schemaVersion: 'versão do formato',
  name: 'nome',
  level: 'nível',
  abilities: 'atributos',
  base: 'valores de atributo',
  method: 'método',
  choices: 'escolhas',
  feats: 'talentos',
  hp: 'pontos de vida',
  inventory: 'inventário',
  coins: 'moedas',
  spells: 'magias',
  details: 'detalhes',
  play: 'estado de jogo',
  exhaustion: 'exaustão',
  deathSaves: 'salvaguardas contra a morte',
};

function describeIssue(issue: z.core.$ZodIssue): string {
  const path = issue.path.map((p) =>
    typeof p === 'number' ? `#${p + 1}` : (FIELD[String(p)] ?? String(p)),
  );
  const where = path.length ? path.join(' › ') : 'arquivo';
  if (issue.code === 'invalid_type')
    return `${where}: ${issue.input === undefined ? 'está faltando' : 'tipo de valor errado'}`;
  if (issue.code === 'too_small' || issue.code === 'too_big')
    return `${where}: valor fora do permitido`;
  if (issue.code === 'invalid_value') return `${where}: valor não reconhecido`;
  return `${where}: ${issue.message}`;
}

/** JSON com um pacote de personagens, pronto para salvar em arquivo. */
export function exportCharacters(characters: Character[], now = new Date()): string {
  return JSON.stringify(
    {
      app: EXPORT_APP,
      version: EXPORT_VERSION,
      exportedAt: now.toISOString(),
      characters,
    },
    null,
    2,
  );
}

/** Nome de arquivo seguro para a exportação. */
export function exportFileName(characters: Character[], now = new Date()): string {
  const date = now.toISOString().slice(0, 10);
  const one = characters.length === 1 ? characters[0] : undefined;
  const slug = (one?.name || 'personagens')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'personagem'}-${date}.json`;
}

export interface ImportResult {
  characters: Character[];
  errors: string[];
  /** Nomes dos que ganharam um id novo por já existir outro igual neste aparelho. */
  renamed: string[];
}

/** Personagem da versão 1 (só nome e nível). */
function fromV1(raw: Record<string, unknown>): unknown {
  const base = emptyCharacter(
    String(raw.id ?? newId()),
    String(raw.createdAt ?? new Date(0).toISOString()),
  );
  return {
    ...base,
    name: raw.name,
    level: raw.level,
    updatedAt: raw.updatedAt ?? base.updatedAt,
  };
}

/**
 * Lê o texto de um arquivo exportado (pacote, lista ou um único personagem).
 * Personagens inválidos são ignorados com uma mensagem; os válidos são importados.
 */
export function parseImport(text: string, existingIds: Set<string> = new Set()): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return {
      characters: [],
      errors: [
        'O arquivo não é um JSON válido. Use um arquivo exportado pelo Guia do Aventureiro.',
      ],
      renamed: [],
    };
  }

  let list: unknown[];
  let version = EXPORT_VERSION;
  if (Array.isArray(data)) list = data;
  else if (data && typeof data === 'object' && 'characters' in data) {
    const bundle = data as { app?: unknown; version?: unknown; characters: unknown };
    if (bundle.app !== undefined && bundle.app !== EXPORT_APP)
      return {
        characters: [],
        errors: ['Este arquivo não é do Guia do Aventureiro.'],
        renamed: [],
      };
    if (typeof bundle.version === 'number') version = bundle.version;
    if (version > EXPORT_VERSION)
      return {
        characters: [],
        errors: [
          'Este arquivo foi feito por uma versão mais nova do site. Atualize a página e tente de novo.',
        ],
        renamed: [],
      };
    if (!Array.isArray(bundle.characters))
      return { characters: [], errors: ['O arquivo não tem a lista de personagens.'], renamed: [] };
    list = bundle.characters;
  } else if (data && typeof data === 'object') list = [data];
  else return { characters: [], errors: ['O arquivo não tem nenhum personagem.'], renamed: [] };

  if (!list.length)
    return { characters: [], errors: ['O arquivo não tem nenhum personagem.'], renamed: [] };

  const characters: Character[] = [];
  const errors: string[] = [];
  const renamed: string[] = [];
  const taken = new Set(existingIds);
  list.forEach((raw, i) => {
    const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const candidate = version < 2 || obj.schemaVersion === undefined ? fromV1(obj) : obj;
    const label = typeof obj.name === 'string' && obj.name ? `“${obj.name}”` : `nº ${i + 1}`;
    const parsed = CharacterSchema.safeParse(candidate);
    if (!parsed.success) {
      const details = parsed.error.issues.slice(0, 3).map(describeIssue).join('; ');
      errors.push(`Personagem ${label} não foi importado: ${details}.`);
      return;
    }
    const c = parsed.data as Character;
    if (taken.has(c.id)) {
      renamed.push(c.name || 'Personagem sem nome');
      c.id = newId();
    }
    taken.add(c.id);
    characters.push(c);
  });
  return { characters, errors, renamed };
}
