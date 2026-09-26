/**
 * Personagem salvo. Guardamos ESCOLHAS, nunca valores calculados:
 * a ficha é sempre derivada por `derive()` a partir disto + conteúdo.
 */
import type { Ability, SkillId } from '@/content/schema';

export type AbilityScores = Record<Ability, number>;

export type AbilityMethod = 'padrao' | 'compra' | 'rolagem' | 'manual';

/** Talento ou melhoria escolhido num nível de "talento geral" ou na dádiva épica. */
export interface FeatPick {
  /** Nível de classe em que foi escolhido. */
  level: number;
  featId: string;
  /** Aumentos de atributo que o talento concede (ex.: {for: 2} ou {for: 1, con: 1}). */
  abilityBonus?: Partial<AbilityScores>;
  /** Escolhas internas do talento, por id de escolha. */
  choices?: Record<string, string[]>;
}

export interface InventoryItem {
  id: string;
  qty: number;
  equipped?: boolean;
}

export type Coins = Record<'pc' | 'pp' | 'pe' | 'po' | 'pl', number>;

export interface CharacterDetails {
  pronouns?: string;
  alignment?: string;
  appearance: string;
  personality: { traits: string; ideals: string; bonds: string; flaws: string };
  backstory: string;
  hook?: string;
}

export interface PlayState {
  hpCurrent: number | null;
  hpTemp: number;
  hitDiceUsed: number;
  /** Espaços gastos por círculo (índice 0 = 1º círculo). */
  slotsUsed: number[];
  /** Usos gastos por id de característica. */
  resourcesUsed: Record<string, number>;
  conditions: string[];
  exhaustion: number;
  deathSaves: { successes: number; failures: number };
  heroicInspiration: boolean;
}

export interface Character {
  id: string;
  schemaVersion: 2;
  createdAt: string;
  updatedAt: string;
  name: string;
  level: number;

  speciesId?: string;
  lineageId?: string;
  size?: 'Pequeno' | 'Médio';
  /** Atributo de conjuração das magias da linhagem. */
  lineageSpellAbility?: Ability;

  classId?: string;
  subclassId?: string;

  backgroundId?: string;
  /** Aumentos do antecedente: +2/+1 ou +1/+1/+1 entre os três atributos dele. */
  backgroundBonus: Partial<AbilityScores>;

  abilities: { method: AbilityMethod; base: AbilityScores; rolls?: number[][] };

  /**
   * Escolhas feitas, por chave de origem. Exemplos:
   * "classe:pericias" → ["atletismo", "percepcao"]
   * "especie:habilidoso" → ["furtividade"]
   * "idiomas" → ["elfico", "anao"]
   * "classe:estilo-de-luta" → ["defesa"]
   */
  choices: Record<string, string[]>;

  /** Talentos por nível (talentos gerais e dádiva épica). O de origem vem do antecedente. */
  feats: FeatPick[];

  hp: { method: 'media' | 'rolagem'; rolls: Record<number, number> };

  startingEquipment: { classOption?: string; backgroundOption?: string };
  inventory: InventoryItem[];
  coins: Coins;

  spells: { cantrips: string[]; prepared: string[] };

  details: CharacterDetails;

  /** Sobrescritas manuais da ficha, por caminho ("ca", "pericias.furtividade"). */
  overrides: Record<string, number | string>;

  play: PlayState;
}

export const CHARACTER_SCHEMA_VERSION = 2;

export const DEFAULT_SCORES: AbilityScores = {
  for: 10,
  des: 10,
  con: 10,
  int: 10,
  sab: 10,
  car: 10,
};

export function emptyCharacter(id: string, now: string): Character {
  return {
    id,
    schemaVersion: 2,
    createdAt: now,
    updatedAt: now,
    name: '',
    level: 1,
    backgroundBonus: {},
    abilities: { method: 'padrao', base: { ...DEFAULT_SCORES } },
    choices: {},
    feats: [],
    hp: { method: 'media', rolls: {} },
    startingEquipment: {},
    inventory: [],
    coins: { pc: 0, pp: 0, pe: 0, po: 0, pl: 0 },
    spells: { cantrips: [], prepared: [] },
    details: {
      appearance: '',
      personality: { traits: '', ideals: '', bonds: '', flaws: '' },
      backstory: '',
    },
    overrides: {},
    play: {
      hpCurrent: null,
      hpTemp: 0,
      hitDiceUsed: 0,
      slotsUsed: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      resourcesUsed: {},
      conditions: [],
      exhaustion: 0,
      deathSaves: { successes: 0, failures: 0 },
      heroicInspiration: false,
    },
  };
}

export type { SkillId };

/**
 * Chave de uma escolha feita numa característica, usada em `Character.choices`.
 * Ex.: choiceKey('especie', 'keen-senses', 'keen-senses') → "especie:keen-senses:keen-senses".
 * Escolhas de base usam chaves fixas: "classe:pericias", "classe:ferramentas",
 * "antecedente:ferramenta" e "idiomas". Escolhas de talentos: "talento:<id>:<escolha>".
 */
export function choiceKey(scope: string, featureId: string, choiceId: string): string {
  return `${scope}:${featureId}:${choiceId}`;
}
