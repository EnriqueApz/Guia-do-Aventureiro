/**
 * `derive(character, content)` monta a ficha completa a partir das escolhas.
 * Função pura: nada aqui depende de React, do navegador ou de estado global.
 */
import type {
  Ability,
  ArmorProficiency,
  Choice,
  ClassDef,
  ContentBundle,
  DamageType,
  Effect,
  Feat,
  Feature,
  Item,
  Lineage,
  Recharge,
  SkillId,
  Species,
  Subclass,
  Background,
} from '@/content/schema';
import { ABILITIES, SKILLS } from '@/content/schema';
import { choiceKey, featScope, type Character } from '@/model/character';
import { abilityModifier } from './abilities';
import { armorClass, type AcResult, type UnarmoredOption } from './armor';
import { isWeaponProficient, unarmedStrike, weaponAttack, type Attack } from './attacks';
import {
  classEntries,
  classLabel,
  hitDiceByLevel,
  isMulticlass,
  spellSlotPools,
  type ClassEntry,
} from './classes';
import { carryingCapacity, coinWeight, dragLiftPush, sizeUp, type Size } from './encumbrance';
import { columnValue, evaluateFormula, type FormulaContext } from './formula';
import { maxHitPoints } from './hp';
import { proficiencyBonus } from './proficiency';
import { spellAttackBonus, spellSaveDc } from './spellcasting';

export type SourceKind =
  'especie' | 'linhagem' | 'classe' | 'subclasse' | 'antecedente' | 'talento';

export interface Part {
  label: string;
  value: number;
}

export interface SheetFeature {
  id: string;
  name: string;
  source: SourceKind;
  sourceName: string;
  level: number;
  text: string;
  plain?: string;
  action?: Feature['action'];
  uses?: { max: number; recharge: Recharge };
}

export interface SheetSkill {
  id: SkillId;
  ability: Ability;
  bonus: number;
  proficient: boolean;
  expertise: boolean;
  overridden: boolean;
}

/** Conjuração de uma classe (com multiclasse, cada classe tem a sua). */
export interface SheetCasterClass {
  classId: string;
  className: string;
  /** Chave das magias escolhidas: "principal" ou o id da classe extra. */
  spellKey: string;
  ability: Ability;
  modifier: number;
  saveDc: number;
  attackBonus: number;
  cantrips: number;
  prepared: number;
  /** Círculo mais alto que esta classe prepara (pela tabela dela, no nível dela). */
  maxCircle: number;
  alwaysPrepared: string[];
}

export interface SheetSpellcasting {
  ability: Ability;
  modifier: number;
  saveDc: number;
  attackBonus: number;
  cantrips: number;
  prepared: number;
  slots: number[];
  pact: boolean;
  /** Magias sempre preparadas (subclasse, espécie, talentos). */
  alwaysPrepared: string[];
  /** Uma entrada por classe conjuradora (a principal primeiro). */
  classes: SheetCasterClass[];
  /** Multiclasse com Bruxo e outra conjuradora: espaços de Magia de Pacto à parte. */
  pactSlots?: number[];
}

export interface SheetClass {
  classDef: ClassDef;
  subclass?: Subclass;
  levels: number;
  primary: boolean;
}

export interface Sheet {
  level: number;
  proficiencyBonus: number;
  species?: Species;
  lineage?: Lineage;
  /** Classe principal (a do nível 1). */
  classDef?: ClassDef;
  subclass?: Subclass;
  /** Todas as classes, a principal primeiro (uma só, sem multiclasse). */
  classes: SheetClass[];
  /** "Clérigo 3 / Guerreiro 2" ou "Clérigo 5". */
  classLabel: string;
  multiclass: boolean;
  background?: Background;
  size: Size;
  abilities: Record<Ability, { score: number; modifier: number; parts: Part[] }>;
  saves: Record<Ability, { bonus: number; proficient: boolean; overridden: boolean }>;
  skills: Record<SkillId, SheetSkill>;
  passivePerception: number;
  initiative: { value: number; parts: Part[]; overridden: boolean };
  hp: { max: number; parts: Part[]; overridden: boolean };
  /** `die` é o da classe principal; `pools` separa por tamanho de dado (multiclasse). */
  hitDice: { die: number; total: number; pools: { die: number; total: number }[] };
  ac: AcResult & { overridden: boolean };
  speed: { walk: number; parts: Part[]; overridden: boolean };
  darkvision: number;
  resistances: DamageType[];
  proficiencies: {
    armor: ArmorProficiency[];
    weapons: string[];
    tools: string[];
    languages: string[];
  };
  masteries: string[];
  attacks: Attack[];
  extraAttacks: number;
  spellcasting?: SheetSpellcasting;
  grantedSpells: { spell: string; level: number; freeCast: boolean; source: string }[];
  features: SheetFeature[];
  feats: { feat: Feat; source: string }[];
  carrying: { weight: number; capacity: number; dragLiftPush: number; encumbered: boolean };
  d20Penalty: number;
  overridden: string[];
}

interface ActiveFeature {
  feature: Feature;
  source: SourceKind;
  sourceName: string;
  scope: string;
  /** Classe de onde veio (características de classe e subclasse). */
  entry?: ClassEntry;
}

const ABILITY_NAMES: Record<Ability, string> = {
  for: 'Força',
  des: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  sab: 'Sabedoria',
  car: 'Carisma',
};

export function derive(character: Character, content: ContentBundle): Sheet {
  const level = character.level;
  const pb = proficiencyBonus(level);
  const choices = character.choices;
  const pick = (key: string) => choices[key] ?? [];

  // ------------------------------------------------------------ entidades
  const species = content.species.find((s) => s.id === character.speciesId);
  const lineage = species?.lineages.find((l) => l.id === character.lineageId);
  const entries = classEntries(character, content);
  const primary = entries.find((e) => e.primary);
  const classDef = primary?.classDef;
  const subclass = primary?.subclass;
  const background = content.backgrounds.find((b) => b.id === character.backgroundId);
  const featById = new Map(content.feats.map((f) => [f.id, f]));
  const itemById = new Map(content.items.map((i) => [i.id, i]));

  // ------------------------------------------------------------ características ativas
  const active: ActiveFeature[] = [];
  const add = (
    features: Feature[],
    source: SourceKind,
    sourceName: string,
    scope: string,
    upTo: number,
    entry?: ClassEntry,
  ) => {
    for (const f of features)
      if ((f.level ?? 1) <= upTo)
        active.push({ feature: f, source, sourceName, scope, ...(entry && { entry }) });
  };
  if (species) add(species.traits, 'especie', species.name, 'especie', level);
  if (lineage) add(lineage.traits, 'linhagem', lineage.name, 'linhagem', level);
  for (const e of entries) {
    add(e.classDef.features, 'classe', e.classDef.name, e.scope, e.levels, e);
    if (e.subclass) add(e.subclass.features, 'subclasse', e.subclass.name, e.subScope, e.levels, e);
  }
  const levelsIn = (classId: string | undefined) =>
    entries.find((e) => (classId ? e.classDef.id === classId : e.primary))?.levels ?? 0;

  // ------------------------------------------------------------ talentos
  const feats: {
    feat: Feat;
    source: string;
    scope: string;
    abilityBonus?: Partial<Record<Ability, number>>;
  }[] = [];
  const addFeat = (
    id: string | undefined,
    source: string,
    scope: string,
    abilityBonus?: Partial<Record<Ability, number>>,
  ) => {
    const feat = id ? featById.get(id) : undefined;
    if (feat) feats.push({ feat, source, scope, ...(abilityBonus && { abilityBonus }) });
  };
  if (background)
    addFeat(
      background.originFeat.id,
      `Antecedente: ${background.name}`,
      `talento:${background.originFeat.id}`,
    );
  for (const a of active) {
    for (const ch of a.feature.choices ?? []) {
      if (ch.kind !== 'talento') continue;
      for (const id of pick(choiceKey(a.scope, a.feature.id, ch.id)))
        addFeat(id, a.feature.name, `talento:${id}`);
    }
  }
  for (const fp of character.feats) {
    if (fp.level > levelsIn(fp.classId)) continue;
    const cls = fp.classId ? entries.find((e) => e.classDef.id === fp.classId) : undefined;
    addFeat(
      fp.featId,
      cls ? `${cls.classDef.name} ${fp.level}` : `Nível ${fp.level}`,
      `${featScope(fp)}:${fp.featId}`,
      fp.abilityBonus,
    );
  }

  // ------------------------------------------------------------ efeitos
  const effects: { effect: Effect; source: string; entry?: ClassEntry }[] = [];
  // Multiclasse: Defesa sem Armadura de uma segunda classe não vale (fica a primeira).
  let unarmoredFrom: string | undefined;
  const pushEffect = (effect: Effect, source: string, entry?: ClassEntry) => {
    if (effect.type === 'ca-sem-armadura' && entry) {
      if (unarmoredFrom && unarmoredFrom !== entry.classDef.id) return;
      unarmoredFrom = entry.classDef.id;
    }
    effects.push({ effect, source, ...(entry && { entry }) });
  };
  for (const a of active) {
    for (const e of a.feature.effects ?? []) pushEffect(e, a.feature.name, a.entry);
    for (const ch of a.feature.choices ?? []) {
      if (ch.kind !== 'opcao') continue;
      const selected = pick(choiceKey(a.scope, a.feature.id, ch.id));
      for (const opt of ch.options ?? []) {
        if (selected.includes(opt.id))
          for (const e of opt.effects ?? []) pushEffect(e, opt.name, a.entry);
      }
    }
  }
  for (const f of feats)
    for (const e of f.feat.effects ?? []) effects.push({ effect: e, source: f.feat.name });
  const effectsOf = <T extends Effect['type']>(type: T) =>
    effects.filter(
      (e): e is { effect: Extract<Effect, { type: T }>; source: string; entry?: ClassEntry } =>
        e.effect.type === type,
    );

  // ------------------------------------------------------------ atributos
  const abilities = {} as Sheet['abilities'];
  const maxByAbility: Record<Ability, number> = {
    for: 20,
    des: 20,
    con: 20,
    int: 20,
    sab: 20,
    car: 20,
  };
  for (const { effect } of effectsOf('atributo-maximo')) {
    for (const a of effect.abilities) maxByAbility[a] = Math.max(maxByAbility[a], effect.max);
  }
  for (const a of ABILITIES) {
    const base = character.abilities.base[a];
    const parts: Part[] = [{ label: 'Valor base', value: base }];
    let score = base;
    const bg = character.backgroundBonus[a] ?? 0;
    if (bg) {
      score = Math.min(20, score + bg);
      parts.push({
        label: background ? `Antecedente: ${background.name}` : 'Antecedente',
        value: bg,
      });
    }
    for (const f of feats) {
      const inc = f.abilityBonus?.[a] ?? 0;
      if (!inc) continue;
      const cap = f.feat.abilityIncrease?.max ?? 20;
      const next = Math.min(cap, score + inc);
      if (next > score) parts.push({ label: f.feat.name, value: next - score });
      score = Math.max(score, next);
    }
    for (const { effect, source } of effectsOf('atributo-bonus')) {
      if (effect.ability !== a) continue;
      const next = Math.min(maxByAbility[a], score + effect.value);
      if (next > score) parts.push({ label: source, value: next - score });
      score = Math.max(score, next);
    }
    abilities[a] = { score, modifier: abilityModifier(score), parts };
  }
  const mods = Object.fromEntries(ABILITIES.map((a) => [a, abilities[a].modifier])) as Record<
    Ability,
    number
  >;
  const ctx: FormulaContext = {
    level,
    proficiencyBonus: pb,
    modifiers: mods,
    ...(classDef && { classDef }),
  };
  // Características de classe contam o nível DAQUELA classe (multiclasse).
  const ctxOf = (entry?: ClassEntry): FormulaContext =>
    entry ? { ...ctx, level: entry.levels, classDef: entry.classDef } : ctx;

  // ------------------------------------------------------------ escolhas por tipo
  const chosenOfKind = (kind: Choice['kind']) => {
    const out: string[] = [];
    for (const a of active) {
      for (const ch of a.feature.choices ?? []) {
        if (ch.kind === kind) out.push(...pick(choiceKey(a.scope, a.feature.id, ch.id)));
      }
    }
    for (const f of feats) {
      for (const ch of f.feat.choices ?? []) {
        if (ch.kind === kind) out.push(...pick(`${f.scope}:${ch.id}`));
      }
    }
    return out;
  };
  const skillSet = new Set<string>(SKILLS);
  const extraEntries = entries.filter((e) => !e.primary);

  // ------------------------------------------------------------ proficiências
  const skillProf = new Set<string>([...pick('classe:pericias'), ...(background?.skills ?? [])]);
  const toolProf = new Set<string>([...(classDef?.tools ?? []), ...pick('classe:ferramentas')]);
  if (background) {
    if (typeof background.tool === 'string') toolProf.add(background.tool);
    else for (const t of pick('antecedente:ferramenta')) toolProf.add(t);
  }
  // "pericia" pode incluir ferramentas (talento Habilidoso).
  for (const id of chosenOfKind('pericia')) (skillSet.has(id) ? skillProf : toolProf).add(id);
  for (const id of chosenOfKind('ferramenta')) toolProf.add(id);
  // Multiclasse: só parte das proficiências da classe nova.
  for (const e of extraEntries) {
    const mc = e.classDef.multiclass;
    for (const t of mc?.tools ?? []) toolProf.add(t);
    for (const ch of mc?.choices ?? [])
      for (const id of pick(`multiclasse:${e.classDef.id}:${ch.id}`))
        (skillSet.has(id) ? skillProf : toolProf).add(id);
  }
  const expertise = new Set(chosenOfKind('especializacao').filter((s) => skillProf.has(s)));

  const saveProf = new Set<Ability>(classDef?.saves ?? []);
  const armorProf = new Set<ArmorProficiency>(classDef?.armor ?? []);
  const weaponProf = new Set<string>(classDef?.weapons ?? []);
  for (const e of extraEntries) {
    for (const a of e.classDef.multiclass?.armor ?? []) armorProf.add(a);
    for (const w of e.classDef.multiclass?.weapons ?? []) weaponProf.add(w);
  }
  const languages = new Set<string>(['common', ...pick('idiomas'), ...chosenOfKind('idioma')]);
  for (const { effect } of effectsOf('proficiencia')) {
    for (const id of effect.ids) {
      if (effect.category === 'pericia') skillProf.add(id);
      if (effect.category === 'salvaguarda') saveProf.add(id as Ability);
      if (effect.category === 'armadura') armorProf.add(id as ArmorProficiency);
      if (effect.category === 'arma') weaponProf.add(id);
      if (effect.category === 'ferramenta') toolProf.add(id);
      if (effect.category === 'idioma') languages.add(id);
    }
  }

  const overrides = character.overrides;
  const overridden: string[] = [];
  const num = (path: string, value: number): [number, boolean] => {
    const o = overrides[path];
    if (typeof o === 'number') {
      overridden.push(path);
      return [o, true];
    }
    return [value, false];
  };

  // ------------------------------------------------------------ salvaguardas e perícias
  const saves = {} as Sheet['saves'];
  for (const a of ABILITIES) {
    const proficient = saveProf.has(a);
    const [bonus, isOver] = num(`salvaguardas.${a}`, mods[a] + (proficient ? pb : 0));
    saves[a] = { bonus, proficient, overridden: isOver };
  }
  const halfProf = effectsOf('pericias-meia-proficiencia').length > 0;
  const skills = {} as Sheet['skills'];
  for (const s of content.skills) {
    const proficient = skillProf.has(s.id);
    const exp = proficient && expertise.has(s.id);
    const raw =
      mods[s.ability] + (exp ? pb * 2 : proficient ? pb : halfProf ? Math.floor(pb / 2) : 0);
    const [bonus, isOver] = num(`pericias.${s.id}`, raw);
    skills[s.id] = {
      id: s.id,
      ability: s.ability,
      bonus,
      proficient,
      expertise: exp,
      overridden: isOver,
    };
  }
  const [passivePerception] = num('percepcaoPassiva', 10 + (skills.percepcao?.bonus ?? mods.sab));

  // ------------------------------------------------------------ equipamento
  const equipped = character.inventory
    .filter((i) => i.equipped)
    .map((i) => itemById.get(i.id))
    .filter((i): i is Item => !!i);
  const armor = equipped.find((i) => i.category === 'armadura');
  const shield = equipped.find((i) => i.category === 'escudo');

  // ------------------------------------------------------------ CA
  const unarmored: UnarmoredOption[] = effectsOf('ca-sem-armadura').map(({ effect, source }) => ({
    base: effect.base,
    abilities: effect.abilities,
    allowShield: effect.allowShield,
    source,
  }));
  let armoredBonus = 0;
  let flatBonus = 0;
  for (const { effect } of effectsOf('ca-bonus')) {
    if (effect.condition === 'com-armadura') armoredBonus += effect.value;
    else flatBonus += effect.value;
  }
  const acBase = armorClass({
    modifiers: mods,
    ...(armor && { armor }),
    ...(shield && { shield }),
    unarmored,
    armoredBonus,
    flatBonus,
  });
  const [acValue, acOver] = num('ca', acBase.value);

  // ------------------------------------------------------------ PV
  const hitDie = classDef?.hitDie ?? 8;
  const multi = isMulticlass(character) && entries.length > 1;
  const diceByLevel = multi ? hitDiceByLevel(entries).slice(0, level) : undefined;
  const bonusPerLevel = effectsOf('pv-por-nivel').reduce(
    (sum, { effect }) => sum + effect.value,
    0,
  );
  const hpCalc = maxHitPoints({
    hitDie,
    ...(diceByLevel && diceByLevel.length === level && { hitDiceByLevel: diceByLevel }),
    level,
    conModifier: mods.con,
    method: character.hp.method,
    rolls: character.hp.rolls,
    bonusPerLevel,
  });
  const [hpMax, hpOver] = num('pvMax', hpCalc.max);

  // ------------------------------------------------------------ iniciativa
  const initParts: Part[] = [{ label: 'Destreza', value: mods.des }];
  if (effectsOf('iniciativa-proficiencia').length) initParts.push({ label: 'Alerta', value: pb });
  const [initiative, initOver] = num(
    'iniciativa',
    initParts.reduce((s, p) => s + p.value, 0),
  );

  // ------------------------------------------------------------ deslocamento
  let walk = species?.speed ?? 30;
  const speedParts: Part[] = [{ label: species ? species.name : 'Base', value: walk }];
  for (const { effect, source } of effectsOf('deslocamento-base')) {
    if (effect.value > walk) {
      speedParts.push({ label: source, value: effect.value - walk });
      walk = effect.value;
    }
  }
  const heavy = armor?.armor?.type === 'pesada';
  for (const { effect, source, entry } of effectsOf('deslocamento-bonus')) {
    if (effect.condition === 'sem-armadura-pesada' && heavy) continue;
    if (effect.condition === 'sem-armadura-e-escudo' && (armor || shield)) continue;
    const v = evaluateFormula(effect.value, ctxOf(entry));
    if (v) {
      speedParts.push({ label: source, value: v });
      walk += v;
    }
  }
  if (armor?.armor?.strength && abilities.for.score < armor.armor.strength) {
    speedParts.push({
      label: `${armor.name} (Força abaixo de ${armor.armor.strength})`,
      value: -10,
    });
    walk -= 10;
  }
  const exhaustion = character.play.exhaustion;
  if (exhaustion > 0) {
    speedParts.push({ label: `Exaustão ${exhaustion}`, value: -5 * exhaustion });
    walk -= 5 * exhaustion;
  }
  const [speed, speedOver] = num('deslocamento', Math.max(0, walk));

  // ------------------------------------------------------------ sentidos e defesas
  const darkvision = effectsOf('visao-no-escuro').reduce(
    (m, { effect }) => Math.max(m, effect.range),
    0,
  );
  const resistances = [...new Set(effectsOf('resistencia').map(({ effect }) => effect.damage))];

  // ------------------------------------------------------------ ataques
  const masteries = chosenOfKind('maestria');
  const rangedBonus = effectsOf('ataque-distancia-bonus').reduce(
    (s, { effect }) => s + effect.value,
    0,
  );
  const martialArts = active.find((a) => a.feature.id === 'monk-martial-arts');
  const hasMartialArts = !!martialArts && !armor && !shield;
  const maDieRaw = hasMartialArts
    ? columnValue(
        martialArts.entry?.classDef ?? classDef,
        'artes-marciais',
        martialArts.entry?.levels ?? level,
      )
    : null;
  const martialArtsDie =
    typeof maDieRaw === 'string' ? Number(maDieRaw.replace('d', '')) : undefined;
  const weaponProfList = [...weaponProf];
  const attacks: Attack[] = [];
  const seenWeapons = new Set<string>();
  for (const inv of character.inventory) {
    const item = itemById.get(inv.id);
    if (!item?.weapon || seenWeapons.has(item.id)) continue;
    seenWeapons.add(item.id);
    const monkWeapon =
      martialArtsDie !== undefined &&
      item.weapon.kind === 'corpo-a-corpo' &&
      (item.weapon.group === 'simples' || item.weapon.properties.includes('leve'));
    attacks.push(
      weaponAttack({
        item,
        modifiers: mods,
        proficiencyBonus: pb,
        proficient: isWeaponProficient(item, weaponProfList),
        rangedBonus,
        ...(monkWeapon && { martialArtsDie }),
        masteries,
      }),
    );
  }
  attacks.push(unarmedStrike(mods, pb, martialArtsDie));
  const extraAttacks = effectsOf('ataques-extras').reduce(
    (m, { effect }) => Math.max(m, effect.attacks),
    1,
  );

  // ------------------------------------------------------------ magia
  const grantedSpells: Sheet['grantedSpells'] = effectsOf('magia')
    .filter(({ effect }) => effect.level <= level)
    .map(({ effect, source }) => ({
      spell: effect.spell,
      level: effect.level,
      freeCast: effect.freeCast,
      source,
    }));
  // Magias escolhidas em talentos (Iniciado em Magia): truques e uma de 1º círculo grátis.
  const spellById = new Map(content.spells.map((sp) => [sp.id, sp]));
  for (const f of feats) {
    for (const ch of f.feat.choices ?? []) {
      if (ch.kind !== 'magia') continue;
      for (const id of pick(`${f.scope}:${ch.id}`)) {
        const sp = spellById.get(id);
        if (sp)
          grantedSpells.push({ spell: id, level: 1, freeCast: sp.level > 0, source: f.feat.name });
      }
    }
  }
  let spellcasting: SheetSpellcasting | undefined;
  const casters: SheetCasterClass[] = [];
  for (const e of entries) {
    const sc = e.classDef.spellcasting;
    if (!sc) continue;
    const mod = mods[sc.ability];
    let maxCircle = 0;
    (sc.slots[e.levels - 1] ?? []).forEach((n, i) => {
      if (n > 0) maxCircle = i + 1;
    });
    casters.push({
      classId: e.classDef.id,
      className: e.classDef.name,
      spellKey: e.primary ? 'principal' : e.classDef.id,
      ability: sc.ability,
      modifier: mod,
      saveDc: spellSaveDc(mod, pb),
      attackBonus: spellAttackBonus(mod, pb),
      cantrips: sc.cantrips[e.levels - 1] ?? 0,
      prepared: sc.prepared[e.levels - 1] ?? 0,
      maxCircle,
      alwaysPrepared: (e.subclass?.alwaysPrepared ?? [])
        .filter((g) => g.level <= e.levels)
        .flatMap((g) => g.spells),
    });
  }
  const main = casters[0];
  if (main) {
    const pools = spellSlotPools(entries, content);
    spellcasting = {
      ability: main.ability,
      modifier: main.modifier,
      saveDc: main.saveDc,
      attackBonus: main.attackBonus,
      cantrips: main.cantrips,
      prepared: main.prepared,
      slots: pools.slots,
      pact: pools.pactOnly,
      alwaysPrepared: [...new Set(casters.flatMap((c) => c.alwaysPrepared))],
      classes: casters,
      ...(pools.pactSlots && { pactSlots: pools.pactSlots }),
    };
  }

  // ------------------------------------------------------------ lista de características
  const features: SheetFeature[] = active.map(({ feature, source, sourceName, entry }) => ({
    id: feature.id,
    name: feature.name,
    source,
    sourceName,
    level: feature.level ?? 1,
    text: feature.text,
    ...(feature.plain && { plain: feature.plain }),
    ...(feature.action && { action: feature.action }),
    ...(feature.uses && {
      uses: {
        max: evaluateFormula(feature.uses.max, ctxOf(entry)),
        recharge: feature.uses.recharge,
      },
    }),
  }));

  // ------------------------------------------------------------ carga
  const baseSize: Size = character.size ?? species?.sizes[0] ?? 'Médio';
  const carrySize = effectsOf('carga-tamanho-maior').length ? sizeUp(baseSize) : baseSize;
  const weight =
    character.inventory.reduce((sum, i) => sum + (itemById.get(i.id)?.weight ?? 0) * i.qty, 0) +
    coinWeight(character.coins);
  const capacity = carryingCapacity(abilities.for.score, carrySize);

  return {
    level,
    proficiencyBonus: pb,
    ...(species && { species }),
    ...(lineage && { lineage }),
    ...(classDef && { classDef }),
    ...(subclass && { subclass }),
    classes: entries.map((e) => ({
      classDef: e.classDef,
      ...(e.subclass && { subclass: e.subclass }),
      levels: e.levels,
      primary: e.primary,
    })),
    classLabel: entries.length ? classLabel(entries) : '',
    multiclass: multi,
    ...(background && { background }),
    size: baseSize,
    abilities,
    saves,
    skills,
    passivePerception,
    initiative: { value: initiative, parts: initParts, overridden: initOver },
    hp: { max: hpMax, parts: hpCalc.parts, overridden: hpOver },
    hitDice: {
      die: hitDie,
      total: level,
      pools: multi
        ? [...new Set(entries.map((e) => e.classDef.hitDie))]
            .sort((x, y) => y - x)
            .map((die) => ({
              die,
              total: entries
                .filter((e) => e.classDef.hitDie === die)
                .reduce((sum, e) => sum + e.levels, 0),
            }))
        : [{ die: hitDie, total: level }],
    },
    ac: { ...acBase, value: acValue, overridden: acOver },
    speed: { walk: speed, parts: speedParts, overridden: speedOver },
    darkvision,
    resistances,
    proficiencies: {
      armor: [...armorProf],
      weapons: weaponProfList,
      tools: [...toolProf],
      languages: [...languages],
    },
    masteries,
    attacks,
    extraAttacks,
    ...(spellcasting && { spellcasting }),
    grantedSpells,
    features,
    feats: feats.map(({ feat, source }) => ({ feat, source })),
    carrying: {
      weight,
      capacity,
      dragLiftPush: dragLiftPush(abilities.for.score, carrySize),
      encumbered: weight > capacity,
    },
    d20Penalty: 2 * exhaustion,
    overridden,
  };
}

export { ABILITY_NAMES };
