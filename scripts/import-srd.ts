/**
 * Importação do SRD 5.2 (inglês) a partir do projeto aberto 5e-bits/5e-database.
 *
 * Gera RASCUNHOS em `content-drafts/` (fora do git) já no nosso formato, com as
 * mecânicas convertidas e o texto ainda em inglês. A tradução e a curadoria são
 * feitas a partir desses rascunhos e salvas em `src/content/srd/`.
 *
 * Uso:
 *   git clone --depth 1 https://github.com/5e-bits/5e-database .cache/5e-database
 *   npm run content:import
 *
 * Variável opcional: SRD_DB=/caminho/para/5e-database/src/2024/en
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DB = resolve(process.env.SRD_DB ?? '.cache/5e-database/src/2024/en');
const OUT = resolve('content-drafts');

if (!existsSync(DB)) {
  console.error(`Não encontrei os dados do SRD em ${DB}.`);
  console.error(
    'Clone com: git clone --depth 1 https://github.com/5e-bits/5e-database .cache/5e-database',
  );
  process.exit(1);
}

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const load = (name: string): Json[] =>
  JSON.parse(readFileSync(join(DB, `5e-SRD-${name}.json`), 'utf8'));

export const ABILITY: Record<string, string> = {
  str: 'for',
  dex: 'des',
  con: 'con',
  int: 'int',
  wis: 'sab',
  cha: 'car',
};

export const SKILL: Record<string, string> = {
  acrobatics: 'acrobacia',
  'animal-handling': 'adestrar-animais',
  arcana: 'arcanismo',
  athletics: 'atletismo',
  performance: 'atuacao',
  deception: 'enganacao',
  stealth: 'furtividade',
  history: 'historia',
  intimidation: 'intimidacao',
  insight: 'intuicao',
  investigation: 'investigacao',
  medicine: 'medicina',
  nature: 'natureza',
  perception: 'percepcao',
  persuasion: 'persuasao',
  'sleight-of-hand': 'prestidigitacao',
  religion: 'religiao',
  survival: 'sobrevivencia',
};

export const DAMAGE: Record<string, string> = {
  acid: 'acido',
  bludgeoning: 'concussao',
  slashing: 'cortante',
  lightning: 'eletrico',
  force: 'energia',
  fire: 'fogo',
  cold: 'frio',
  necrotic: 'necrotico',
  piercing: 'perfurante',
  psychic: 'psiquico',
  radiant: 'radiante',
  thunder: 'trovejante',
  poison: 'veneno',
};

export const PROPERTY: Record<string, string> = {
  finesse: 'acuidade',
  reach: 'alcance',
  thrown: 'arremesso',
  'two-handed': 'duas-maos',
  light: 'leve',
  ammunition: 'municao',
  heavy: 'pesada',
  loading: 'recarga',
  versatile: 'versatil',
};

export const MASTERY: Record<string, string> = {
  vex: 'afligir',
  topple: 'derrubar',
  slow: 'desacelerar',
  sap: 'enfraquecer',
  push: 'empurrar',
  graze: 'raspar',
  nick: 'talho',
  cleave: 'trespassar',
};

const COIN: Record<string, string> = { cp: 'pc', sp: 'pp', ep: 'pe', gp: 'po', pp: 'pl' };

const srd = { kind: 'srd', ref: 'SRD 5.2' };
const cats = (e: Json): string[] => (e.equipment_categories ?? []).map((c: Json) => c.index);

// ------------------------------------------------------------------ Itens

function item(e: Json): Json {
  const c = cats(e);
  const out: Json = {
    id: e.index,
    name: e.name,
    source: srd,
    category: 'equipamento',
    cost: e.cost ? { qty: e.cost.quantity, unit: COIN[e.cost.unit] } : null,
    weight: e.weight ?? null,
  };
  if (e.description) out.description = e.description;
  if (c.includes('weapons')) {
    out.category = 'arma';
    const twoHanded = e.two_handed_damage?.damage_dice;
    out.weapon = {
      group: c.includes('martial-weapons') ? 'marcial' : 'simples',
      kind: c.includes('ranged-weapons') ? 'distancia' : 'corpo-a-corpo',
      damage: e.damage?.damage_dice ?? '1',
      damageType: DAMAGE[e.damage?.damage_type?.index] ?? 'concussao',
      ...(twoHanded && { versatile: twoHanded }),
      ...(e.range?.long && { range: [e.range.normal, e.range.long] }),
      ...(e.throw_range && { range: [e.throw_range.normal, e.throw_range.long] }),
      properties: (e.properties ?? []).map((p: Json) => PROPERTY[p.index] ?? p.index),
      mastery: MASTERY[e.mastery?.index] ?? e.mastery?.index,
      ...(e.ammunition && { ammunition: e.ammunition.index }),
    };
  } else if (c.includes('shields')) {
    out.category = 'escudo';
    out.shield = { bonus: e.armor_class.base };
  } else if (c.includes('armor')) {
    out.category = 'armadura';
    const type = c.includes('heavy-armor')
      ? 'pesada'
      : c.includes('medium-armor')
        ? 'media'
        : 'leve';
    out.armor = {
      type,
      base: e.armor_class.base,
      dexCap: e.armor_class.dex_bonus ? (e.armor_class.max_bonus ?? null) : 0,
      ...(e.str_minimum && { strength: e.str_minimum }),
      stealthDisadvantage: !!e.stealth_disadvantage,
    };
  } else if (c.includes('ammunition')) out.category = 'municao';
  else if (c.includes('equipment-packs')) out.category = 'pacote';
  else if (c.includes('musical-instruments')) out.category = 'instrumento';
  else if (c.includes('gaming-sets')) out.category = 'jogo';
  else if (c.includes('tools')) out.category = 'ferramenta';

  if (c.includes('arcane-foci')) out.focus = 'arcano';
  else if (c.includes('druidic-foci')) out.focus = 'druidico';
  else if (c.includes('holy-symbols')) out.focus = 'sagrado';
  if (out.focus && out.category === 'equipamento') out.category = 'foco';

  if (e.ability) {
    out.tool = {
      ability: ABILITY[e.ability.index],
      uses: (e.utilize ?? []).map((u: Json) => u.name),
    };
  }
  if (e.contents) {
    out.contents = e.contents.map((x: Json) => ({ id: x.item.index, qty: x.quantity }));
  }
  return out;
}

// ------------------------------------------------------------------ Classes

function equipmentOptions(options: Json[] | undefined): Json[] {
  const opts = options?.[0]?.from?.options ?? [];
  return opts.map((o: Json, i: number) => {
    const entries: Json[] = o.option_type === 'multiple' ? o.items : [o];
    const items: Json[] = [];
    let gold = 0;
    for (const x of entries) {
      if (x.option_type === 'money') gold += x.count;
      else if (x.option_type === 'counted_reference') items.push({ id: x.of.index, qty: x.count });
    }
    return { id: 'abc'[i], items, gold };
  });
}

function classes(): Json[] {
  const features = load('Features');
  const levels = load('Levels');
  return load('Classes').map((c) => {
    const lv = levels
      .filter((l) => l.class?.index === c.index && !l.subclass)
      .sort((a, b) => a.level - b.level);
    const columns: Record<string, (number | string | null)[]> = {};
    lv.forEach((l, i) => {
      for (const [k, v] of Object.entries(l.class_specific ?? {})) {
        columns[k] ??= Array(20).fill(null);
        columns[k][i] =
          v && typeof v === 'object'
            ? `${(v as Json).dice_count}d${(v as Json).dice_value}`
            : (v as number);
      }
    });
    const sc = lv[0]?.spellcasting ? lv : null;
    const skills = c.proficiency_choices?.[0];
    return {
      id: c.index,
      name: c.name,
      hitDie: c.hit_die,
      saves: c.saving_throws.map((s: Json) => ABILITY[s.index]),
      primary: c.primary_ability?.desc,
      proficiencies: c.proficiencies.map((p: Json) => p.index),
      skillChoice: {
        count: skills?.choose,
        from: (skills?.from?.options ?? []).map(
          (o: Json) => SKILL[o.item?.index?.replace('skill-', '')] ?? o.item?.index,
        ),
        desc: skills?.desc,
      },
      otherChoices: (c.proficiency_choices ?? []).slice(1).map((p: Json) => p.desc),
      startingEquipment: equipmentOptions(c.starting_equipment_options),
      startingEquipmentText: c.starting_equipment_options?.[0]?.desc,
      spellcasting: sc
        ? {
            ability: ABILITY[c.spellcasting.spellcasting_ability.index],
            cantrips: sc.map((l) => l.spellcasting.cantrips_known ?? 0),
            prepared: sc.map((l) => l.spellcasting.prepared_spells ?? 0),
            slots: sc.map((l) =>
              Array.from(
                { length: 9 },
                (_, n) => l.spellcasting[`spell_slots_level_${n + 1}`] ?? 0,
              ),
            ),
            info: c.spellcasting.info,
          }
        : undefined,
      proficiencyBonus: lv.map((l) => l.prof_bonus),
      columns,
      features: features
        .filter((f) => f.class?.index === c.index && !f.subclass)
        .map((f) => ({
          id: f.index,
          name: f.name,
          level: Number(String(f.level?.name ?? f.level).match(/\d+/)?.[0]),
          text: f.description,
        }))
        .sort((a, b) => a.level - b.level),
      levels: lv.map((l) => ({ level: l.level, features: l.features.map((f: Json) => f.index) })),
    };
  });
}

function subclasses(): Json[] {
  return load('Subclasses').map((s) => ({
    id: s.index,
    classId: s.class.index,
    name: s.name,
    summary: s.summary,
    description: s.description,
    features: s.features.map((f: Json) => ({ name: f.name, level: f.level, text: f.description })),
  }));
}

// ------------------------------------------------------------------ Espécies

function species(): Json[] {
  const traits = new Map(load('Traits').map((t) => [t.index, t]));
  const subs = load('Subspecies');
  const trait = (ref: Json) => {
    const t = traits.get(ref.index);
    return {
      id: ref.index,
      name: ref.name,
      text: t?.description ?? '',
      ...(ref.level && { level: ref.level }),
    };
  };
  return load('Species').map((s) => ({
    id: s.index,
    name: s.name,
    creatureType: s.type,
    size: s.size,
    speed: s.speed,
    traits: s.traits.map(trait),
    lineages: subs
      .filter((x) => x.species.index === s.index)
      .map((x) => ({ id: x.index, name: x.name, traits: x.traits.map(trait) })),
  }));
}

// ------------------------------------------------------------------ Antecedentes e talentos

function backgrounds(): Json[] {
  return load('Backgrounds').map((b) => ({
    id: b.index,
    name: b.name,
    abilityOptions: b.ability_scores.map((a: Json) => ABILITY[a.index]),
    originFeat: { id: b.feat.index, ...(b.feat.note && { note: b.feat.note }) },
    proficiencies: b.proficiencies.map(
      (p: Json) => SKILL[p.index.replace('skill-', '')] ?? p.index,
    ),
    equipment: equipmentOptions(b.equipment_options),
    equipmentText: b.equipment_options?.[0]?.desc,
  }));
}

function feats(): Json[] {
  return load('Feats').map((f) => ({
    id: f.index,
    name: f.name,
    category: {
      origin: 'origem',
      general: 'geral',
      'fighting-style': 'estilo-de-luta',
      'epic-boon': 'dadiva-epica',
    }[f.type as string],
    prerequisites: f.prerequisites,
    repeatable: !!f.repeatable,
    text: f.description,
  }));
}

// ------------------------------------------------------------------ Saída

mkdirSync(OUT, { recursive: true });
const write = (name: string, data: unknown) => {
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(data, null, 2) + '\n');
  console.log(`✓ ${name}.json (${Array.isArray(data) ? data.length : 1})`);
};

write('items', load('Equipment').map(item));
write('classes', classes());
write('subclasses', subclasses());
write('species', species());
write('backgrounds', backgrounds());
write('feats', feats());
write(
  'conditions',
  load('Conditions').map((c) => ({ id: c.index, name: c.name, text: c.description })),
);
write(
  'languages',
  load('Languages').map((l) => ({ id: l.index, name: l.name, rare: l.is_rare, note: l.note })),
);
write(
  'weapon-properties',
  load('Weapon-Properties').map((p) => ({
    id: PROPERTY[p.index] ?? p.index,
    name: p.name,
    text: p.description,
  })),
);
write(
  'masteries',
  load('Weapon-Mastery-Properties').map((p) => ({
    id: MASTERY[p.index] ?? p.index,
    name: p.name,
    text: p.description,
  })),
);
write(
  'skills',
  load('Skills').map((s) => ({
    id: SKILL[s.index],
    name: s.name,
    ability: ABILITY[s.ability_score.index],
    text: s.description,
  })),
);
