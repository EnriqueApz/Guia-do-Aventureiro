/**
 * Edições do personagem feitas pelo assistente. Funções puras: recebem o personagem
 * e devolvem uma cópia alterada, limpando escolhas que deixaram de fazer sentido.
 */
import type { Ability, ContentBundle } from '@/content/schema';
import type { Character } from './character';

function withoutChoices(choices: Character['choices'], prefixes: string[]): Character['choices'] {
  return Object.fromEntries(
    Object.entries(choices).filter(([key]) => !prefixes.some((p) => key.startsWith(p))),
  );
}

export function setLevel(c: Character, level: number): Character {
  const clamped = Math.min(20, Math.max(1, Math.round(level)));
  return { ...c, level: clamped };
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
  const next: Character = {
    ...c,
    classId,
    choices: withoutChoices(c.choices, ['classe:', 'subclasse:']),
    // Talentos só continuam se o novo nível de talento existir na nova classe.
    feats: c.feats.filter((f) => f.level === 19 || cls.featLevels.includes(f.level)),
    startingEquipment: { ...c.startingEquipment },
    spells: { cantrips: [], prepared: [] },
  };
  delete next.startingEquipment.classOption;
  const sub = content.subclasses.find((s) => s.id === c.subclassId);
  if (!sub || sub.classId !== classId) delete next.subclassId;
  return next;
}

export function selectSubclass(c: Character, subclassId: string): Character {
  if (c.subclassId === subclassId) return c;
  return { ...c, subclassId, choices: withoutChoices(c.choices, ['subclasse:']) };
}

export function selectBackground(c: Character, backgroundId: string): Character {
  if (c.backgroundId === backgroundId) return c;
  const next: Character = {
    ...c,
    backgroundId,
    backgroundBonus: {},
    choices: withoutChoices(c.choices, ['antecedente:']),
    startingEquipment: { ...c.startingEquipment },
  };
  delete next.startingEquipment.backgroundOption;
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
