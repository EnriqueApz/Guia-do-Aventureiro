/**
 * Esquemas do conteúdo de regras (SRD 5.2 traduzido, stubs e conteúdo próprio).
 *
 * Convenções:
 * - ids em kebab-case, sem acento, únicos por coleção;
 * - distâncias em PÉS e pesos em LIBRAS nos campos numéricos (como no SRD);
 *   a interface converte para metros (5 pés = 1,5 m) e quilos (1 lb = 0,5 kg);
 * - `text` é a tradução fiel; `plain` é a explicação simples escrita por nós.
 */
import { z } from 'zod';

export const ABILITIES = ['for', 'des', 'con', 'int', 'sab', 'car'] as const;
export const Ability = z.enum(ABILITIES);
export type Ability = z.infer<typeof Ability>;

export const SKILLS = [
  'acrobacia',
  'adestrar-animais',
  'arcanismo',
  'atletismo',
  'atuacao',
  'enganacao',
  'furtividade',
  'historia',
  'intimidacao',
  'intuicao',
  'investigacao',
  'medicina',
  'natureza',
  'percepcao',
  'persuasao',
  'prestidigitacao',
  'religiao',
  'sobrevivencia',
] as const;
export const SkillId = z.enum(SKILLS);
export type SkillId = z.infer<typeof SkillId>;

export const DAMAGE_TYPES = [
  'acido',
  'concussao',
  'cortante',
  'eletrico',
  'energia',
  'fogo',
  'frio',
  'necrotico',
  'perfurante',
  'psiquico',
  'radiante',
  'trovejante',
  'veneno',
] as const;
export const DamageType = z.enum(DAMAGE_TYPES);
export type DamageType = z.infer<typeof DamageType>;

export const Id = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id deve estar em kebab-case, sem acentos');

export const Source = z.object({
  kind: z.enum(['srd', 'homebrew', 'stub']),
  ref: z.string().optional(),
});
export type Source = z.infer<typeof Source>;

export const Beginner = z.object({
  rating: z.enum(['facil', 'medio', 'avancado']),
  note: z.string().min(1),
});
export type Beginner = z.infer<typeof Beginner>;

/** Número que depende do personagem. */
export const Formula = z.union([
  z.number(),
  z.object({ kind: z.literal('proficiencia') }),
  z.object({ kind: z.literal('modificador'), ability: Ability, min: z.number().optional() }),
  z.object({ kind: z.literal('nivel'), multiplier: z.number().optional() }),
  /** Valor de uma coluna da tabela da classe no nível atual (ex.: fúrias). */
  z.object({ kind: z.literal('coluna'), column: Id }),
  /** Valor por nível de personagem (20 posições). */
  z.object({ kind: z.literal('por-nivel'), values: z.array(z.number()).length(20) }),
]);
export type Formula = z.infer<typeof Formula>;

export const Recharge = z.enum(['descanso-curto', 'descanso-longo']);
export type Recharge = z.infer<typeof Recharge>;

/**
 * Efeitos mecânicos que o motor de regras aplica automaticamente.
 * Lista fechada: tudo que não couber aqui fica só no texto da característica.
 */
export const Effect = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('proficiencia'),
    category: z.enum(['pericia', 'salvaguarda', 'armadura', 'arma', 'ferramenta', 'idioma']),
    ids: z.array(z.string()).min(1),
  }),
  /** Deslocamento base (substitui o da espécie), em pés. */
  z.object({ type: z.literal('deslocamento-base'), value: z.number() }),
  /** Bônus de deslocamento, em pés (número fixo ou coluna da classe). */
  z.object({
    type: z.literal('deslocamento-bonus'),
    value: Formula,
    condition: z.enum(['sem-armadura-pesada', 'sem-armadura-e-escudo']).optional(),
  }),
  z.object({ type: z.literal('pv-por-nivel'), value: z.number() }),
  /** CA alternativa quando sem armadura: base + atributos (+ escudo, se permitido). */
  z.object({
    type: z.literal('ca-sem-armadura'),
    base: z.number(),
    abilities: z.array(Ability),
    allowShield: z.boolean(),
  }),
  z.object({ type: z.literal('visao-no-escuro'), range: z.number() }),
  z.object({ type: z.literal('resistencia'), damage: DamageType }),
  z.object({ type: z.literal('ataques-extras'), attacks: z.number().int().min(2) }),
  z.object({ type: z.literal('iniciativa-proficiencia') }),
  /** Bônus na CA; "com-armadura" = só vestindo armadura (talento Defesa). */
  z.object({
    type: z.literal('ca-bonus'),
    value: z.number(),
    condition: z.enum(['com-armadura']).optional(),
  }),
  /** Soma metade da proficiência em perícias sem proficiência (Pau pra Toda Obra). */
  z.object({ type: z.literal('pericias-meia-proficiencia') }),
  /** Conta como um tamanho maior para capacidade de carga (Constituição Poderosa). */
  z.object({ type: z.literal('carga-tamanho-maior') }),
  /** +2 em jogadas de ataque com armas à distância (Arquearia). */
  z.object({ type: z.literal('ataque-distancia-bonus'), value: z.number() }),
  z.object({ type: z.literal('atributo-maximo'), abilities: z.array(Ability), max: z.number() }),
  z.object({ type: z.literal('atributo-bonus'), ability: Ability, value: z.number() }),
  /** Magia concedida (linhagens, talentos). `level` = nível de personagem em que é ganha. */
  z.object({
    type: z.literal('magia'),
    spell: Id,
    level: z.number().int().min(1).default(1),
    freeCast: z.boolean().default(false),
  }),
]);
export type Effect = z.infer<typeof Effect>;

/** Escolha que o jogador precisa fazer (perícias, idiomas, estilo de luta...). */
export const Choice = z.object({
  id: Id,
  kind: z.enum([
    'pericia',
    'ferramenta',
    'idioma',
    'atributo',
    'opcao',
    'talento',
    'magia',
    'maestria',
    'especializacao',
  ]),
  label: z.string(),
  count: Formula,
  /** Ids permitidos; "qualquer" = todos do tipo. Para talentos, pode ser uma categoria. */
  from: z.union([z.array(z.string()).min(1), z.literal('qualquer')]).optional(),
  featCategory: z.enum(['origem', 'geral', 'estilo-de-luta', 'dadiva-epica']).optional(),
  /** Para kind "opcao": as opções com seus efeitos. */
  options: z
    .array(
      z.object({
        id: Id,
        name: z.string(),
        text: z.string(),
        effects: z.array(Effect).optional(),
      }),
    )
    .optional(),
});
export type Choice = z.infer<typeof Choice>;

export const Feature = z.object({
  id: Id,
  name: z.string().min(1),
  level: z.number().int().min(1).max(20).optional(),
  text: z.string().min(1),
  plain: z.string().optional(),
  action: z.enum(['acao', 'acao-bonus', 'reacao', 'passiva']).optional(),
  uses: z.object({ max: Formula, recharge: Recharge }).optional(),
  effects: z.array(Effect).optional(),
  choices: z.array(Choice).optional(),
});
export type Feature = z.infer<typeof Feature>;

const ItemQty = z.object({ id: Id, qty: z.number().int().min(1) });

/** Pacote de equipamento inicial (A, B, C...). `note` descreve escolhas livres. */
const EquipmentOption = z.object({
  id: z.enum(['a', 'b', 'c']),
  items: z.array(ItemQty),
  gold: z.number(),
  note: z.string().optional(),
});

// ---------------------------------------------------------------- Espécie

export const Lineage = z.object({
  id: Id,
  name: z.string(),
  summary: z.string(),
  traits: z.array(Feature),
  beginner: Beginner.optional(),
});
export type Lineage = z.infer<typeof Lineage>;

export const Species = z.object({
  id: Id,
  name: z.string(),
  source: Source,
  summary: z.string(),
  description: z.string(),
  creatureType: z.string(),
  sizes: z.array(z.enum(['Pequeno', 'Médio'])).min(1),
  sizeNote: z.string().optional(),
  speed: z.number(),
  traits: z.array(Feature),
  lineageLabel: z.string().optional(),
  lineages: z.array(Lineage),
  /** Atributos entre os quais o jogador escolhe o de conjuração das magias da linhagem. */
  lineageSpellAbilities: z.array(Ability).optional(),
  beginner: Beginner,
});
export type Species = z.infer<typeof Species>;

// ---------------------------------------------------------------- Classe

export const WeaponProficiency = z
  .string()
  .regex(
    /^(simples|marciais|marciais:[a-z-]+(\|[a-z-]+)*|arma:[a-z0-9-]+)$/,
    'use "simples", "marciais", "marciais:<propriedade>" ou "arma:<id>"',
  );

export const ArmorProficiency = z.enum(['leve', 'media', 'pesada', 'escudo']);
export type ArmorProficiency = z.infer<typeof ArmorProficiency>;

export const Spellcasting = z.object({
  ability: Ability,
  progression: z.enum(['completa', 'meia', 'pacto']),
  /** Truques conhecidos por nível (20 posições). */
  cantrips: z.array(z.number().int()).length(20),
  /** Magias preparadas por nível (20 posições). */
  prepared: z.array(z.number().int()).length(20),
  /** Espaços por nível de personagem: 20 linhas × 9 círculos. */
  slots: z.array(z.array(z.number().int()).length(9)).length(20),
  ritual: z.boolean(),
  focus: z.string(),
  /** Quando dá para trocar as magias preparadas. */
  swap: z.enum(['descanso-longo', 'subir-de-nivel']),
  explainer: z.string(),
});
export type Spellcasting = z.infer<typeof Spellcasting>;

export const ClassColumn = z.object({
  id: Id,
  label: z.string(),
  values: z.array(z.union([z.number(), z.string(), z.null()])).length(20),
});
export type ClassColumn = z.infer<typeof ClassColumn>;

export const ROLES = [
  'combatente',
  'defensor',
  'curandeiro',
  'conjurador',
  'especialista',
  'suporte',
] as const;

export const ClassDef = z.object({
  id: Id,
  name: z.string(),
  source: Source,
  summary: z.string(),
  description: z.string(),
  roles: z.array(z.enum(ROLES)).min(1),
  beginner: Beginner,
  primaryAbilities: z.array(Ability).min(1),
  /** "e" = precisa de todos; "ou" = qualquer um deles. */
  primaryMode: z.enum(['e', 'ou']),
  /** Distribuição sugerida do array padrão (15,14,13,12,10,8) + por quê. */
  recommendedScores: z.record(Ability, z.number()),
  recommendedWhy: z.string(),
  hitDie: z.union([z.literal(6), z.literal(8), z.literal(10), z.literal(12)]),
  saves: z.tuple([Ability, Ability]),
  armor: z.array(ArmorProficiency),
  weapons: z.array(WeaponProficiency),
  tools: z.array(Id),
  skillChoice: z.object({
    count: z.number().int(),
    from: z.union([z.array(SkillId), z.literal('qualquer')]),
  }),
  toolChoice: Choice.optional(),
  startingEquipment: z.array(EquipmentOption).min(1),
  spellcasting: Spellcasting.optional(),
  columns: z.array(ClassColumn),
  features: z.array(Feature.extend({ level: z.number().int().min(1).max(20) })),
  /** Níveis em que se ganha um talento geral (ou Aumento no Valor de Atributo). */
  featLevels: z.array(z.number().int()),
  epicBoonLevel: z.literal(19),
  subclassLevel: z.literal(3),
  subclassLabel: z.string(),
  typicalTurn: z.string(),
});
export type ClassDef = z.infer<typeof ClassDef>;

export const Subclass = z.object({
  id: Id,
  classId: Id,
  name: z.string(),
  source: Source,
  summary: z.string(),
  description: z.string(),
  features: z.array(Feature.extend({ level: z.number().int().min(3).max(20) })),
  /** Magias sempre preparadas, por nível de classe. */
  alwaysPrepared: z.array(z.object({ level: z.number().int(), spells: z.array(Id) })).optional(),
  beginner: Beginner.optional(),
});
export type Subclass = z.infer<typeof Subclass>;

// ---------------------------------------------------------------- Antecedente

export const Background = z.object({
  id: Id,
  name: z.string(),
  source: Source,
  summary: z.string(),
  description: z.string(),
  abilityOptions: z.tuple([Ability, Ability, Ability]),
  originFeat: z.object({ id: Id, note: z.string().optional() }),
  skills: z.tuple([SkillId, SkillId]),
  tool: z.union([Id, Choice]),
  equipment: z.array(EquipmentOption).min(1),
  personality: z.object({
    traits: z.array(z.string()).min(1),
    ideals: z.array(z.string()).min(1),
    bonds: z.array(z.string()).min(1),
    flaws: z.array(z.string()).min(1),
  }),
});
export type Background = z.infer<typeof Background>;

// ---------------------------------------------------------------- Talento

export const Feat = z.object({
  id: Id,
  name: z.string(),
  source: Source,
  category: z.enum(['origem', 'geral', 'estilo-de-luta', 'dadiva-epica']),
  prerequisite: z
    .object({
      level: z.number().int().optional(),
      text: z.string().optional(),
    })
    .optional(),
  repeatable: z.boolean(),
  text: z.string(),
  plain: z.string(),
  /** Aumento de atributo incluso no talento. */
  abilityIncrease: z
    .object({
      options: z.array(Ability).min(1),
      /** "um+2-ou-dois+1" é o Aumento no Valor de Atributo. */
      mode: z.enum(['+1', 'um+2-ou-dois+1']),
      max: z.number(),
    })
    .optional(),
  effects: z.array(Effect).optional(),
  choices: z.array(Choice).optional(),
});
export type Feat = z.infer<typeof Feat>;

// ---------------------------------------------------------------- Itens

export const WEAPON_PROPERTIES = [
  'acuidade',
  'alcance',
  'arremesso',
  'distancia',
  'duas-maos',
  'leve',
  'municao',
  'pesada',
  'recarga',
  'versatil',
] as const;
export const WeaponProperty = z.enum(WEAPON_PROPERTIES);
export type WeaponProperty = z.infer<typeof WeaponProperty>;

export const MASTERIES = [
  'afligir',
  'derrubar',
  'desacelerar',
  'enfraquecer',
  'empurrar',
  'raspar',
  'talho',
  'trespassar',
] as const;
export const Mastery = z.enum(MASTERIES);
export type Mastery = z.infer<typeof Mastery>;

export const Cost = z.object({
  qty: z.number(),
  unit: z.enum(['pc', 'pp', 'pe', 'po', 'pl']),
});
export type Cost = z.infer<typeof Cost>;

export const Item = z.object({
  id: Id,
  name: z.string(),
  source: Source,
  category: z.enum([
    'arma',
    'armadura',
    'escudo',
    'equipamento',
    'ferramenta',
    'instrumento',
    'jogo',
    'pacote',
    'foco',
    'municao',
  ]),
  cost: Cost.nullable(),
  weight: z.number().nullable(),
  description: z.string().optional(),
  weapon: z
    .object({
      group: z.enum(['simples', 'marcial']),
      kind: z.enum(['corpo-a-corpo', 'distancia']),
      damage: z.string().regex(/^(\d+d\d+|\d+)$/),
      damageType: DamageType,
      versatile: z.string().optional(),
      range: z.tuple([z.number(), z.number()]).optional(),
      properties: z.array(WeaponProperty),
      mastery: Mastery,
      ammunition: z.string().optional(),
    })
    .optional(),
  armor: z
    .object({
      type: z.enum(['leve', 'media', 'pesada']),
      base: z.number(),
      dexCap: z.number().nullable(),
      strength: z.number().optional(),
      stealthDisadvantage: z.boolean(),
    })
    .optional(),
  shield: z.object({ bonus: z.number() }).optional(),
  focus: z.enum(['arcano', 'druidico', 'sagrado']).optional(),
  tool: z.object({ ability: Ability }).optional(),
  contents: z.array(ItemQty).optional(),
});
export type Item = z.infer<typeof Item>;

export const RuleText = z.object({ id: Id, name: z.string(), text: z.string(), plain: z.string() });
export type RuleText = z.infer<typeof RuleText>;

// ---------------------------------------------------------------- Básicos

export const AbilityInfo = z.object({
  id: Ability,
  name: z.string(),
  abbr: z.string(),
  plain: z.string(),
});

export const SkillInfo = z.object({
  id: SkillId,
  name: z.string(),
  ability: Ability,
  plain: z.string(),
});
export type SkillInfo = z.infer<typeof SkillInfo>;

export const Language = z.object({
  id: Id,
  name: z.string(),
  rarity: z.enum(['padrao', 'raro']),
  origin: z.string(),
});

export const Condition = RuleText;

export const GlossaryEntry = z.object({
  id: Id,
  term: z.string(),
  aliases: z.array(z.string()),
  short: z.string().max(200),
  long: z.string().optional(),
  seeAlso: z.array(Id),
});
export type GlossaryEntry = z.infer<typeof GlossaryEntry>;

/** Opção fora do SRD: só o nome e de onde vem. Mecânicas preenchidas pelo grupo. */
export const Stub = z.object({
  id: Id,
  type: z.enum(['especie', 'classe', 'subclasse', 'antecedente', 'talento']),
  name: z.string(),
  parentId: Id.optional(),
  ref: z.string(),
});
export type Stub = z.infer<typeof Stub>;

export const ContentBundle = z.object({
  abilities: z.array(AbilityInfo),
  skills: z.array(SkillInfo),
  languages: z.array(Language),
  conditions: z.array(Condition),
  damageTypes: z.array(z.object({ id: DamageType, name: z.string() })),
  weaponProperties: z.array(RuleText),
  masteries: z.array(RuleText),
  species: z.array(Species),
  classes: z.array(ClassDef),
  subclasses: z.array(Subclass),
  backgrounds: z.array(Background),
  feats: z.array(Feat),
  items: z.array(Item),
  glossary: z.array(GlossaryEntry),
  stubs: z.array(Stub),
});
export type ContentBundle = z.infer<typeof ContentBundle>;
