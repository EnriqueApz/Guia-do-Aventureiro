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
import { choiceKey, type Character } from '@/model/character';
import { abilityModifier } from './abilities';
import { armorClass, type AcResult, type UnarmoredOption } from './armor';
import { isWeaponProficient, unarmedStrike, weaponAttack, type Attack } from './attacks';
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
}

export interface Sheet {
  level: number;
  proficiencyBonus: number;
  species?: Species;
  lineage?: Lineage;
  classDef?: ClassDef;
  subclass?: Subclass;
  background?: Background;
  size: Size;
  abilities: Record<Ability, { score: number; modifier: number; parts: Part[] }>;
  saves: Record<Ability, { bonus: number; proficient: boolean; overridden: boolean }>;
  skills: Record<SkillId, SheetSkill>;
  passivePerception: number;
  initiative: { value: number; parts: Part[]; overridden: boolean };
  hp: { max: number; parts: Part[]; overridden: boolean };
  hitDice: { die: number; total: number };
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
  const classDef = content.classes.find((c) => c.id === character.classId);
  const subclass =
    level >= 3
      ? content.subclasses.find((s) => s.id === character.subclassId && s.classId === classDef?.id)
      : undefined;
  const background = content.backgrounds.find((b) => b.id === character.backgroundId);
  const featById = new Map(content.feats.map((f) => [f.id, f]));
  const itemById = new Map(content.items.map((i) => [i.id, i]));

  // ------------------------------------------------------------ características ativas
  const active: ActiveFeature[] = [];
  const add = (features: Feature[], source: SourceKind, sourceName: string, scope: string) => {
    for (const f of features)
      if ((f.level ?? 1) <= level) active.push({ feature: f, source, sourceName, scope });
  };
  if (species) add(species.traits, 'especie', species.name, 'especie');
  if (lineage) add(lineage.traits, 'linhagem', lineage.name, 'linhagem');
  if (classDef) add(classDef.features, 'classe', classDef.name, 'classe');
  if (subclass) add(subclass.features, 'subclasse', subclass.name, 'subclasse');

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
    if (fp.level <= level)
      addFeat(fp.featId, `Nível ${fp.level}`, `nivel${fp.level}:${fp.featId}`, fp.abilityBonus);
  }

  // ------------------------------------------------------------ efeitos
  const effects: { effect: Effect; source: string }[] = [];
  for (const a of active) {
    for (const e of a.feature.effects ?? []) effects.push({ effect: e, source: a.feature.name });
    for (const ch of a.feature.choices ?? []) {
      if (ch.kind !== 'opcao') continue;
      const selected = pick(choiceKey(a.scope, a.feature.id, ch.id));
      for (const opt of ch.options ?? []) {
        if (selected.includes(opt.id))
          for (const e of opt.effects ?? []) effects.push({ effect: e, source: opt.name });
      }
    }
  }
  for (const f of feats)
    for (const e of f.feat.effects ?? []) effects.push({ effect: e, source: f.feat.name });
  const effectsOf = <T extends Effect['type']>(type: T) =>
    effects.filter(
      (e): e is { effect: Extract<Effect, { type: T }>; source: string } => e.effect.type === type,
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
  const expertise = new Set(chosenOfKind('especializacao').filter((s) => skillProf.has(s)));

  const saveProf = new Set<Ability>(classDef?.saves ?? []);
  const armorProf = new Set<ArmorProficiency>(classDef?.armor ?? []);
  const weaponProf = new Set<string>(classDef?.weapons ?? []);
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
  const bonusPerLevel = effectsOf('pv-por-nivel').reduce(
    (sum, { effect }) => sum + effect.value,
    0,
  );
  const hpCalc = maxHitPoints({
    hitDie,
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
  for (const { effect, source } of effectsOf('deslocamento-bonus')) {
    if (effect.condition === 'sem-armadura-pesada' && heavy) continue;
    if (effect.condition === 'sem-armadura-e-escudo' && (armor || shield)) continue;
    const v = evaluateFormula(effect.value, ctx);
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
  const hasMartialArts =
    active.some((a) => a.feature.id === 'monk-martial-arts') && !armor && !shield;
  const maDieRaw = hasMartialArts ? columnValue(classDef, 'artes-marciais', level) : null;
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
  if (classDef?.spellcasting) {
    const sc = classDef.spellcasting;
    const mod = mods[sc.ability];
    const alwaysPrepared = [
      ...(subclass?.alwaysPrepared ?? []).filter((g) => g.level <= level).flatMap((g) => g.spells),
    ];
    spellcasting = {
      ability: sc.ability,
      modifier: mod,
      saveDc: spellSaveDc(mod, pb),
      attackBonus: spellAttackBonus(mod, pb),
      cantrips: sc.cantrips[level - 1] ?? 0,
      prepared: sc.prepared[level - 1] ?? 0,
      slots: [...(sc.slots[level - 1] ?? [])],
      pact: sc.progression === 'pacto',
      alwaysPrepared,
    };
  }

  // ------------------------------------------------------------ lista de características
  const features: SheetFeature[] = active.map(({ feature, source, sourceName }) => ({
    id: feature.id,
    name: feature.name,
    source,
    sourceName,
    level: feature.level ?? 1,
    text: feature.text,
    ...(feature.plain && { plain: feature.plain }),
    ...(feature.action && { action: feature.action }),
    ...(feature.uses && {
      uses: { max: evaluateFormula(feature.uses.max, ctx), recharge: feature.uses.recharge },
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
    ...(background && { background }),
    size: baseSize,
    abilities,
    saves,
    skills,
    passivePerception,
    initiative: { value: initiative, parts: initParts, overridden: initOver },
    hp: { max: hpMax, parts: hpCalc.parts, overridden: hpOver },
    hitDice: { die: hitDie, total: level },
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
