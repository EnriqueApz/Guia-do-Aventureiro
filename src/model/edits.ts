/**
 * Edições do personagem feitas pelo assistente. Funções puras: recebem o personagem
 * e devolvem uma cópia alterada, limpando escolhas que deixaram de fazer sentido.
 */
import type { Ability, ClassDef, ContentBundle } from '@/content/schema';
import { ABILITIES } from '@/content/schema';
import {
  canChangePointBuy,
  isStandardArray,
  POINT_BUY_MIN,
  STANDARD_ARRAY,
} from '@/rules/abilities';
import { featSpellOptions, spellBudget } from '@/rules/spells';
import {
  DEFAULT_SCORES,
  featScope,
  type AbilityMethod,
  type AbilityScores,
  type Character,
  type InventoryItem,
} from './character';

function withoutChoices(choices: Character['choices'], prefixes: string[]): Character['choices'] {
  return Object.fromEntries(
    Object.entries(choices).filter(([key]) => !prefixes.some((p) => key.startsWith(p))),
  );
}

export function setLevel(c: Character, level: number): Character {
  const clamped = Math.min(20, Math.max(1, Math.round(level)));
  // Multiclasse: ao baixar o nível, tira níveis das últimas classes extras primeiro
  // (a classe principal fica sempre com pelo menos 1).
  let spare = clamped - 1;
  const kept = (c.multiclass ?? [])
    .map((m) => {
      const levels = Math.min(m.levels, spare);
      spare -= levels;
      return { ...m, levels };
    })
    .filter((m) => m.levels > 0);
  const removed = (c.multiclass ?? []).filter((m) => !kept.some((k) => k.classId === m.classId));
  let next: Character = { ...c, level: clamped };
  if (c.multiclass) next.multiclass = kept;
  for (const m of removed) next = removeExtraClass(next, m.classId);
  return next;
}

// ------------------------------------------------------------------ multiclasse

/** Níveis livres para dar a outra classe (a principal precisa de pelo menos 1). */
export function freeMulticlassLevels(c: Character): number {
  const used = (c.multiclass ?? []).reduce((s, m) => s + m.levels, 0);
  return Math.max(0, c.level - 1 - used);
}

/** Adiciona uma classe extra com 1 nível (tirado da classe principal). */
export function addExtraClass(c: Character, classId: string, content: ContentBundle): Character {
  if (!content.classes.some((x) => x.id === classId)) return c;
  if (classId === c.classId || (c.multiclass ?? []).some((m) => m.classId === classId)) return c;
  if (freeMulticlassLevels(c) < 1) return c;
  return { ...c, multiclass: [...(c.multiclass ?? []), { classId, levels: 1 }] };
}

/** Muda os níveis de uma classe extra (de 1 até o que couber). */
export function setExtraClassLevels(c: Character, classId: string, levels: number): Character {
  const entry = (c.multiclass ?? []).find((m) => m.classId === classId);
  if (!entry) return c;
  const max = entry.levels + freeMulticlassLevels(c);
  const n = Math.min(max, Math.max(1, Math.round(levels)));
  let next: Character = {
    ...c,
    multiclass: (c.multiclass ?? []).map((m) => (m.classId === classId ? { ...m, levels: n } : m)),
  };
  // Abaixo do nível da subclasse, ela sai.
  if (n < 3 && entry.subclassId) next = selectExtraSubclass(next, classId, undefined);
  return next;
}

/** Tira uma classe extra e tudo o que foi escolhido nela. */
export function removeExtraClass(c: Character, classId: string): Character {
  const byClass = Object.fromEntries(
    Object.entries(c.spells.byClass ?? {}).filter(([k]) => k !== classId),
  );
  return {
    ...c,
    multiclass: (c.multiclass ?? []).filter((m) => m.classId !== classId),
    choices: withoutChoices(c.choices, [
      `classe@${classId}:`,
      `subclasse@${classId}:`,
      `multiclasse:${classId}:`,
      ...c.feats.filter((f) => f.classId === classId).map((f) => `${featScope(f)}:`),
    ]),
    feats: c.feats.filter((f) => f.classId !== classId),
    spells: { ...c.spells, byClass },
  };
}

export function selectExtraSubclass(
  c: Character,
  classId: string,
  subclassId: string | undefined,
): Character {
  return {
    ...c,
    multiclass: (c.multiclass ?? []).map((m) => {
      if (m.classId !== classId) return m;
      const { subclassId: _old, ...rest } = m;
      return subclassId ? { ...rest, subclassId } : rest;
    }),
    choices: withoutChoices(c.choices, [`subclasse@${classId}:`]),
  };
}

export function selectSpecies(c: Character, speciesId: string, content: ContentBundle): Character {
  if (c.speciesId === speciesId) return c;
  const species = content.species.find((s) => s.id === speciesId);
  if (!species) return c;
  const next: Character = {
    ...c,
    speciesId,
    choices: withoutChoices(c.choices, ['especie:', 'linhagem:']),
  };
  delete next.lineageId;
  delete next.lineageSpellAbility;
  delete next.size;
  if (species.sizes.length === 1) next.size = species.sizes[0];
  return next;
}

export function selectLineage(c: Character, lineageId: string): Character {
  if (c.lineageId === lineageId) return c;
  return { ...c, lineageId, choices: withoutChoices(c.choices, ['linhagem:']) };
}

export function setLineageSpellAbility(c: Character, ability: Ability): Character {
  return { ...c, lineageSpellAbility: ability };
}

export function setSize(c: Character, size: 'Pequeno' | 'Médio'): Character {
  return { ...c, size };
}

export function selectClass(c: Character, classId: string, content: ContentBundle): Character {
  if (c.classId === classId) return c;
  const cls = content.classes.find((x) => x.id === classId);
  if (!cls) return c;
  const base = (c.multiclass ?? []).some((m) => m.classId === classId)
    ? removeExtraClass(c, classId)
    : c;
  const next: Character = {
    ...base,
    classId,
    choices: withoutChoices(base.choices, ['classe:', 'subclasse:']),
    // Talentos só continuam se o novo nível de talento existir na nova classe.
    feats: base.feats.filter(
      (f) => f.classId || f.level === 19 || cls.featLevels.includes(f.level),
    ),
    startingEquipment: { ...c.startingEquipment },
    spells: { ...base.spells, cantrips: [], prepared: [] },
  };
  delete next.startingEquipment.classOption;
  const sub = content.subclasses.find((s) => s.id === c.subclassId);
  if (!sub || sub.classId !== classId) delete next.subclassId;
  if (c.startingEquipment.classOption) Object.assign(next, startingInventory(next, content));
  return next;
}

export function selectSubclass(c: Character, subclassId: string): Character {
  if (c.subclassId === subclassId) return c;
  return { ...c, subclassId, choices: withoutChoices(c.choices, ['subclasse:']) };
}

export function selectBackground(
  c: Character,
  backgroundId: string,
  content: ContentBundle,
): Character {
  if (c.backgroundId === backgroundId) return c;
  const background = content.backgrounds.find((b) => b.id === backgroundId);
  if (!background) return c;
  const old = content.backgrounds.find((b) => b.id === c.backgroundId);
  const next: Character = {
    ...c,
    backgroundId,
    backgroundBonus: {},
    choices: withoutChoices(c.choices, [
      'antecedente:',
      ...(old ? [`talento:${old.originFeat.id}:`] : []),
    ]),
    startingEquipment: { ...c.startingEquipment },
  };
  delete next.startingEquipment.backgroundOption;
  // Iniciado em Magia do antecedente já vem com a lista definida (ex.: Clérigo).
  const { id: featId, note } = background.originFeat;
  if (featId === 'magic-initiate' && note) next.choices[`talento:${featId}:list`] = [note];
  if (c.startingEquipment.backgroundOption) Object.assign(next, startingInventory(next, content));
  return next;
}

/** Define os valores de uma escolha; lista vazia apaga a escolha. */
export function setChoice(c: Character, key: string, values: string[]): Character {
  const rest = Object.fromEntries(Object.entries(c.choices).filter(([k]) => k !== key));
  return { ...c, choices: values.length ? { ...rest, [key]: values } : rest };
}

/** Liga/desliga um valor numa escolha com limite; ao passar do limite, troca o mais antigo. */
export function toggleChoice(c: Character, key: string, value: string, max: number): Character {
  const current = c.choices[key] ?? [];
  if (current.includes(value))
    return setChoice(
      c,
      key,
      current.filter((v) => v !== value),
    );
  if (max === 1) return setChoice(c, key, [value]);
  if (current.length >= max) return c;
  return setChoice(c, key, [...current, value]);
}

export function setPersonality(
  c: Character,
  field: keyof Character['details']['personality'],
  value: string,
): Character {
  return {
    ...c,
    details: { ...c.details, personality: { ...c.details.personality, [field]: value } },
  };
}

// ------------------------------------------------------------------ atributos

/** Valores do array padrão na ordem sugerida pela classe (ou na ordem FOR→CAR). */
function standardFor(classDef: ClassDef | undefined): AbilityScores {
  if (classDef) return { ...DEFAULT_SCORES, ...classDef.recommendedScores };
  return Object.fromEntries(ABILITIES.map((a, i) => [a, STANDARD_ARRAY[i]])) as AbilityScores;
}

/** Atributos em ordem de prioridade para a classe (o maior valor sugerido primeiro). */
export function abilityPriority(classDef: ClassDef | undefined): Ability[] {
  if (!classDef) return [...ABILITIES];
  const rec = classDef.recommendedScores;
  return [...ABILITIES].sort((x, y) => (rec[y] ?? 0) - (rec[x] ?? 0));
}

/** Distribui valores (em qualquer ordem) pelos atributos, do maior para o de maior prioridade. */
function assignByPriority(values: number[], priority: Ability[]): AbilityScores {
  const sorted = [...values].sort((x, y) => y - x);
  const out = { ...DEFAULT_SCORES };
  priority.forEach((a, i) => (out[a] = sorted[i] ?? 10));
  return out;
}

export function setAbilityMethod(
  c: Character,
  method: AbilityMethod,
  content: ContentBundle,
): Character {
  if (c.abilities.method === method) return c;
  const classDef = content.classes.find((x) => x.id === c.classId);
  const base =
    method === 'padrao'
      ? standardFor(classDef)
      : method === 'compra'
        ? (Object.fromEntries(ABILITIES.map((a) => [a, POINT_BUY_MIN])) as AbilityScores)
        : method === 'rolagem'
          ? { ...DEFAULT_SCORES }
          : { ...c.abilities.base };
  return { ...c, abilities: { method, base } };
}

/** Com o array padrão, garante que os seis valores estejam distribuídos (sugestão da classe). */
export function ensureStandardArray(c: Character, content: ContentBundle): Character {
  if (c.abilities.method !== 'padrao' || isStandardArray(c.abilities.base)) return c;
  const classDef = content.classes.find((x) => x.id === c.classId);
  return { ...c, abilities: { method: 'padrao', base: standardFor(classDef) } };
}

/**
 * Coloca um valor num atributo trocando com quem o tinha (array padrão e rolagem):
 * assim os seis valores continuam sendo sempre os mesmos.
 */
export function assignScore(c: Character, ability: Ability, value: number): Character {
  const base = { ...c.abilities.base };
  const holder = ABILITIES.find((a) => a !== ability && base[a] === value);
  if (holder) base[holder] = base[ability];
  base[ability] = value;
  return { ...c, abilities: { ...c.abilities, base } };
}

export function changePointBuy(c: Character, ability: Ability, delta: 1 | -1): Character {
  if (c.abilities.method !== 'compra' || !canChangePointBuy(c.abilities.base, ability, delta))
    return c;
  const base = { ...c.abilities.base, [ability]: c.abilities.base[ability] + delta };
  return { ...c, abilities: { ...c.abilities, base } };
}

export function setManualScore(c: Character, ability: Ability, value: number): Character {
  if (!Number.isFinite(value)) return c;
  const v = Math.min(18, Math.max(3, Math.round(value)));
  return { ...c, abilities: { ...c.abilities, base: { ...c.abilities.base, [ability]: v } } };
}

/** Guarda as seis rolagens de 4d6 e distribui os totais pela prioridade da classe. */
export function setAbilityRolls(
  c: Character,
  rolls: number[][],
  content: ContentBundle,
): Character {
  const classDef = content.classes.find((x) => x.id === c.classId);
  const totals = rolls.map((dice) => dice.reduce((s, d) => s + d, 0) - Math.min(...dice));
  return {
    ...c,
    abilities: {
      method: 'rolagem',
      base: assignByPriority(totals, abilityPriority(classDef)),
      rolls: rolls.map((r) => [...r]),
    },
  };
}

/** Aplica a sugestão da classe mantendo o método: reordena os valores que já existem. */
export function applyClassSuggestion(c: Character, content: ContentBundle): Character {
  const classDef = content.classes.find((x) => x.id === c.classId);
  if (!classDef) return c;
  const { method, base } = c.abilities;
  const next =
    method === 'padrao' || method === 'compra'
      ? standardFor(classDef)
      : assignByPriority(
          ABILITIES.map((a) => base[a]),
          abilityPriority(classDef),
        );
  return { ...c, abilities: { ...c.abilities, base: next } };
}

export function setBackgroundBonus(c: Character, bonus: Partial<AbilityScores>): Character {
  const clean = Object.fromEntries(
    Object.entries(bonus).filter(([, v]) => v),
  ) as Partial<AbilityScores>;
  return { ...c, backgroundBonus: clean };
}

// ------------------------------------------------------------------ equipamento

/** Monta inventário e moedas a partir das opções de equipamento escolhidas. */
export function startingInventory(
  c: Character,
  content: ContentBundle,
): Pick<Character, 'inventory' | 'coins'> {
  const classDef = content.classes.find((x) => x.id === c.classId);
  const background = content.backgrounds.find((b) => b.id === c.backgroundId);
  const options = [
    classDef?.startingEquipment.find((o) => o.id === c.startingEquipment.classOption),
    background?.equipment.find((o) => o.id === c.startingEquipment.backgroundOption),
  ].filter((o) => !!o);
  const qty = new Map<string, number>();
  for (const opt of options)
    for (const it of opt.items) qty.set(it.id, (qty.get(it.id) ?? 0) + it.qty);
  const itemById = new Map(content.items.map((i) => [i.id, i]));
  let armorEquipped = false;
  let shieldEquipped = false;
  const inventory: InventoryItem[] = [...qty].map(([id, n]) => {
    const item = itemById.get(id);
    let equipped = false;
    if (item?.category === 'armadura' && !armorEquipped) equipped = armorEquipped = true;
    if (item?.category === 'escudo' && !shieldEquipped) equipped = shieldEquipped = true;
    return { id, qty: n, ...(equipped && { equipped }) };
  });
  const gold = options.reduce((s, o) => s + o.gold, 0);
  return { inventory, coins: { pc: 0, pp: 0, pe: 0, po: gold, pl: 0 } };
}

export function chooseEquipment(
  c: Character,
  which: 'classOption' | 'backgroundOption',
  optionId: string,
  content: ContentBundle,
): Character {
  const next = { ...c, startingEquipment: { ...c.startingEquipment, [which]: optionId } };
  return { ...next, ...startingInventory(next, content) };
}

// ------------------------------------------------------------------ magias

export function toggleSpell(
  c: Character,
  list: 'cantrips' | 'prepared',
  spellId: string,
  max: number,
  /** "principal" ou o id da classe extra (multiclasse). */
  key = 'principal',
): Character {
  const own =
    key === 'principal'
      ? { cantrips: c.spells.cantrips, prepared: c.spells.prepared }
      : (c.spells.byClass?.[key] ?? { cantrips: [], prepared: [] });
  const current = own[list];
  let nextList: string[];
  if (current.includes(spellId)) nextList = current.filter((s) => s !== spellId);
  else if (current.length >= max) return c;
  else nextList = [...current, spellId];
  if (key === 'principal') return { ...c, spells: { ...c.spells, [list]: nextList } };
  return {
    ...c,
    spells: { ...c.spells, byClass: { ...c.spells.byClass, [key]: { ...own, [list]: nextList } } },
  };
}

// ------------------------------------------------------------------ talentos por nível

/** Talento de um nível de classe; `classId` só para classes extras (multiclasse). */
export function setLevelFeat(
  c: Character,
  level: number,
  featId: string,
  classId?: string,
): Character {
  const same = (f: Character['feats'][number]) => f.level === level && f.classId === classId;
  const rest = c.feats.filter((f) => !same(f));
  const pick = { level, featId, ...(classId && { classId }) };
  const feats = featId ? [...rest, pick].sort((x, y) => x.level - y.level) : rest;
  return {
    ...c,
    feats,
    choices: withoutChoices(c.choices, [`${featScope({ level, ...(classId && { classId }) })}:`]),
  };
}

export function setLevelFeatBonus(
  c: Character,
  level: number,
  bonus: Partial<AbilityScores>,
  classId?: string,
): Character {
  const clean = Object.fromEntries(
    Object.entries(bonus).filter(([, v]) => v),
  ) as Partial<AbilityScores>;
  return {
    ...c,
    feats: c.feats.map((f) =>
      f.level === level && f.classId === classId ? { ...f, abilityBonus: clean } : f,
    ),
  };
}

// ------------------------------------------------------------------ pontos de vida

export function setHpMethod(c: Character, method: 'media' | 'rolagem'): Character {
  return { ...c, hp: { ...c.hp, method } };
}

export function setHpRoll(c: Character, level: number, value: number | undefined): Character {
  const rolls = Object.fromEntries(
    Object.entries(c.hp.rolls).filter(([l]) => Number(l) !== level),
  ) as Record<number, number>;
  if (value !== undefined) rolls[level] = value;
  return { ...c, hp: { ...c.hp, rolls } };
}

// ------------------------------------------------------------------ kit para iniciantes

/** Idioma mais natural para cada espécie (sugestão; o jogador pode trocar). */
const SPECIES_LANGUAGE: Record<string, string> = {
  dragonborn: 'draconic',
  dwarf: 'dwarvish',
  elf: 'elvish',
  gnome: 'gnomish',
  goliath: 'giant',
  halfling: 'halfling',
  orc: 'orc',
  tiefling: 'infernal',
};

/** Sugestões para o talento Iniciado em Magia, por lista. */
const MAGIC_INITIATE_KIT: Record<string, { ability: Ability; cantrips: string[]; spell: string }> =
  {
    clerigo: { ability: 'sab', cantrips: ['guidance', 'sacred-flame'], spell: 'bless' },
    druida: { ability: 'sab', cantrips: ['guidance', 'produce-flame'], spell: 'healing-word' },
    mago: { ability: 'int', cantrips: ['light', 'fire-bolt'], spell: 'mage-armor' },
  };

/**
 * Aplica o kit recomendado da classe: perícias (sem repetir as do antecedente),
 * equipamento, magias iniciais e as escolhas de características. Também preenche
 * idiomas e as escolhas do talento de origem que ainda estiverem vazios.
 */
export function applyBeginnerKit(c: Character, content: ContentBundle): Character {
  const classDef = content.classes.find((x) => x.id === c.classId);
  const kit = classDef?.beginnerKit;
  if (!classDef || !kit) return c;
  const background = content.backgrounds.find((b) => b.id === c.backgroundId);
  let next: Character = c;

  // Perícias: troca as que o antecedente já dá por outras da lista da classe.
  const taken = new Set<string>(background?.skills ?? []);
  const pool =
    classDef.skillChoice.from === 'qualquer'
      ? content.skills.map((s) => s.id)
      : classDef.skillChoice.from;
  const skills = kit.skills.filter((s) => !taken.has(s));
  for (const s of [...kit.skills, ...pool]) {
    if (skills.length >= classDef.skillChoice.count) break;
    if (!taken.has(s) && !skills.includes(s)) skills.push(s);
  }
  next = setChoice(next, 'classe:pericias', skills);

  for (const [key, values] of Object.entries(kit.choices ?? {}))
    next = setChoice(next, key, values);

  next = chooseEquipment(next, 'classOption', kit.equipment, content);
  if (!next.startingEquipment.backgroundOption && background?.equipment[0])
    next = chooseEquipment(next, 'backgroundOption', background.equipment[0].id, content);

  const budget = spellBudget(next, content);
  if (budget) {
    next = {
      ...next,
      spells: {
        cantrips: (kit.cantrips ?? []).slice(0, budget.cantrips),
        prepared: (kit.spells ?? [])
          .filter((s) => !budget.alwaysPrepared.includes(s))
          .slice(0, budget.prepared),
      },
    };
  }

  // Idiomas: o da espécie e mais um comum.
  if (!(next.choices.idiomas ?? []).length) {
    const langs = [SPECIES_LANGUAGE[c.speciesId ?? ''], 'elvish', 'dwarvish', 'halfling'].filter(
      (l, i, arr): l is string => !!l && arr.indexOf(l) === i,
    );
    next = setChoice(next, 'idiomas', langs.slice(0, 2));
  }

  // Talento de origem com magias (Iniciado em Magia).
  const featId = background?.originFeat.id;
  const list = background?.originFeat.note;
  const mi = list ? MAGIC_INITIATE_KIT[list] : undefined;
  if (featId === 'magic-initiate' && list && mi) {
    const k = (id: string) => `talento:${featId}:${id}`;
    const spellAbility = classDef.spellcasting?.ability;
    const ability =
      spellAbility && ['int', 'sab', 'car'].includes(spellAbility) ? spellAbility : mi.ability;
    if (!next.choices[k('list')]) next = setChoice(next, k('list'), [list]);
    if (!next.choices[k('ability')]) next = setChoice(next, k('ability'), [ability]);
    // Evita repetir magias que a classe já tem: troca por outras da mesma lista.
    const known = new Set([...next.spells.cantrips, ...next.spells.prepared]);
    const pickFrom = (first: string[], choiceId: string, n: number) => {
      const pool = featSpellOptions(content, featId, choiceId, list);
      const ranked = [
        ...first,
        ...pool.filter((sp) => sp.beginner).map((sp) => sp.id),
        ...pool.map((sp) => sp.id),
      ];
      return [...new Set(ranked)].filter((id) => !known.has(id)).slice(0, n);
    };
    if (!next.choices[k('cantrips')])
      next = setChoice(next, k('cantrips'), pickFrom(mi.cantrips, 'cantrips', 2));
    if (!next.choices[k('spell')])
      next = setChoice(next, k('spell'), pickFrom([mi.spell], 'spell', 1));
  }
  return next;
}

// ------------------------------------------------------------------ detalhes

export function setName(c: Character, name: string): Character {
  return { ...c, name };
}

export function setDetails(c: Character, patch: Partial<Character['details']>): Character {
  return { ...c, details: { ...c.details, ...patch } };
}

// ------------------------------------------------------------------ Me guie

/** Aplica uma sugestão do "Me guie": espécie, classe e antecedente de uma vez. */
export function applySuggestion(
  c: Character,
  s: { speciesId: string; classId: string; backgroundId: string },
  content: ContentBundle,
): Character {
  let next = selectSpecies(c, s.speciesId, content);
  next = selectClass(next, s.classId, content);
  next = selectBackground(next, s.backgroundId, content);
  return next;
}

// ------------------------------------------------------------------ ajustes manuais

/** Sobrescreve um número da ficha ("ca", "pvMax"...); `undefined` volta ao automático. */
export function setOverride(c: Character, path: string, value: number | undefined): Character {
  const rest = Object.fromEntries(Object.entries(c.overrides).filter(([k]) => k !== path));
  if (value === undefined || !Number.isFinite(value)) return { ...c, overrides: rest };
  return { ...c, overrides: { ...rest, [path]: Math.round(value) } };
}
