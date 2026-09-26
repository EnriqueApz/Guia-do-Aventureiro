/**
 * Formulários simples → entidades do conteúdo. As mecânicas automáticas ficam de
 * fora (só texto), exceto o que os formulários pedem explicitamente (visão no escuro,
 * perícias, atributos). O que não couber vai no texto das características.
 */
import type { Ability, Background, SkillId, Species, Subclass } from '@/content/schema';
import { firstSentence, slugify } from '@/content/homebrew';

const HOMEBREW = { kind: 'homebrew' as const, ref: 'Conteúdo próprio do grupo' };

export interface FeatureForm {
  name: string;
  level: number;
  text: string;
  plain: string;
}

export interface SubclassForm {
  id?: string;
  classId: string;
  name: string;
  summary: string;
  description: string;
  features: FeatureForm[];
}

export function buildSubclass(f: SubclassForm): Subclass {
  const id = f.id || slugify(f.name);
  return {
    id,
    classId: f.classId,
    name: f.name.trim(),
    source: HOMEBREW,
    summary: f.summary.trim() || firstSentence(f.description),
    description: f.description.trim() || f.summary.trim(),
    features: f.features.map((x, i) => ({
      id: `${id}-${slugify(x.name) || i + 1}`,
      name: x.name.trim(),
      level: Math.min(20, Math.max(3, Math.round(x.level))),
      text: x.text.trim(),
      plain: x.plain.trim() || firstSentence(x.text),
    })),
  };
}

export interface BackgroundForm {
  id?: string;
  name: string;
  summary: string;
  description: string;
  abilityOptions: [Ability, Ability, Ability];
  skills: [SkillId, SkillId];
  tool: string;
  originFeat: string;
  equipmentNote: string;
  equipmentGold: number;
  personality: { traits: string; ideals: string; bonds: string; flaws: string };
}

const lines = (text: string, fallback: string) => {
  const list = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return list.length ? list : [fallback];
};

export function buildBackground(f: BackgroundForm): Background {
  return {
    id: f.id || slugify(f.name),
    name: f.name.trim(),
    source: HOMEBREW,
    summary: f.summary.trim() || firstSentence(f.description),
    description: f.description.trim() || f.summary.trim(),
    abilityOptions: f.abilityOptions,
    originFeat: { id: f.originFeat },
    skills: f.skills,
    tool: f.tool,
    equipment: [
      {
        id: 'a',
        items: [],
        gold: Math.max(0, Math.round(f.equipmentGold)),
        ...(f.equipmentNote.trim() && { note: f.equipmentNote.trim() }),
      },
      { id: 'b', items: [], gold: 50 },
    ],
    personality: {
      traits: lines(f.personality.traits, 'Escreva um traço de personalidade.'),
      ideals: lines(f.personality.ideals, 'Escreva um ideal.'),
      bonds: lines(f.personality.bonds, 'Escreva um vínculo.'),
      flaws: lines(f.personality.flaws, 'Escreva um defeito.'),
    },
  };
}

export interface SpeciesForm {
  id?: string;
  name: string;
  summary: string;
  description: string;
  creatureType: string;
  sizes: ('Pequeno' | 'Médio')[];
  speed: number;
  darkvision: number;
  traits: { name: string; text: string; plain: string }[];
}

export function buildSpecies(f: SpeciesForm): Species {
  const id = f.id || slugify(f.name);
  const traits: Species['traits'] = [];
  if (f.darkvision > 0)
    traits.push({
      id: `${id}-visao-no-escuro`,
      name: 'Visão no Escuro',
      text: `Você tem Visão no Escuro com alcance de ${(f.darkvision / 5) * 1.5} metros.`,
      plain: `Você enxerga no escuro (em tons de cinza) até ${(f.darkvision / 5) * 1.5} metros.`,
      effects: [{ type: 'visao-no-escuro', range: f.darkvision }],
    });
  f.traits.forEach((t, i) =>
    traits.push({
      id: `${id}-${slugify(t.name) || i + 1}`,
      name: t.name.trim(),
      text: t.text.trim(),
      plain: t.plain.trim() || firstSentence(t.text),
    }),
  );
  return {
    id,
    name: f.name.trim(),
    source: HOMEBREW,
    summary: f.summary.trim() || firstSentence(f.description),
    description: f.description.trim() || f.summary.trim(),
    creatureType: f.creatureType.trim() || 'Humanoide',
    sizes: f.sizes.length ? f.sizes : ['Médio'],
    speed: Math.max(0, Math.round(f.speed)),
    traits,
    lineages: [],
    beginner: {
      rating: 'medio',
      note: 'Conteúdo próprio do grupo: combine os detalhes com o Mestre.',
    },
  };
}
