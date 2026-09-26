/**
 * Personagens de referência para os testes do motor de regras.
 * Os números esperados foram calculados à mão (veja os comentários nos testes).
 */
import { choiceKey, emptyCharacter, type Character } from '@/model/character';

export function makeCharacter(patch: Partial<Character>): Character {
  return { ...emptyCharacter('teste', '2026-01-01T00:00:00.000Z'), ...patch };
}

/** Anão Clérigo (Acólito), array padrão, +2 SAB +1 CAR. */
export function thorin(level = 1): Character {
  return makeCharacter({
    name: 'Thorin',
    level,
    speciesId: 'dwarf',
    classId: 'cleric',
    ...(level >= 3 && { subclassId: 'life-domain' }),
    backgroundId: 'acolyte',
    backgroundBonus: { sab: 2, car: 1 },
    abilities: { method: 'padrao', base: { for: 13, des: 12, con: 14, int: 8, sab: 15, car: 10 } },
    feats:
      level >= 4
        ? [{ level: 4, featId: 'ability-score-improvement', abilityBonus: { sab: 2 } }]
        : [],
    choices: {
      'classe:pericias': ['medicina', 'persuasao'],
      idiomas: ['dwarvish', 'giant'],
      [choiceKey('classe', 'cleric-divine-order', 'divine-order')]: ['protector'],
    },
    inventory: [
      { id: 'chain-shirt', qty: 1, equipped: true },
      { id: 'shield', qty: 1, equipped: true },
      { id: 'mace', qty: 1 },
    ],
  });
}

/** Alta Elfa Maga (Sábia), array padrão, +2 INT +1 CON. */
export function lira(level = 3): Character {
  return makeCharacter({
    name: 'Lira',
    level,
    speciesId: 'elf',
    lineageId: 'elven-lineage-high-elf',
    lineageSpellAbility: 'int',
    classId: 'wizard',
    ...(level >= 3 && { subclassId: 'evoker' }),
    backgroundId: 'sage',
    backgroundBonus: { int: 2, con: 1 },
    abilities: { method: 'padrao', base: { for: 8, des: 13, con: 14, int: 15, sab: 12, car: 10 } },
    choices: {
      'classe:pericias': ['investigacao', 'medicina'],
      idiomas: ['elvish', 'draconic'],
      [choiceKey('especie', 'keen-senses', 'keen-senses')]: ['percepcao'],
      [choiceKey('classe', 'wizard-scholar', 'scholar')]: ['arcanismo'],
    },
    inventory: [
      { id: 'quarterstaff', qty: 1 },
      { id: 'dagger', qty: 2 },
    ],
  });
}

/** Halfling Ladino (Criminoso), array padrão, +2 DES +1 CON; nível 4: +1 DES +1 CON. */
export function pip(level = 4): Character {
  return makeCharacter({
    name: 'Pip',
    level,
    speciesId: 'halfling',
    classId: 'rogue',
    ...(level >= 3 && { subclassId: 'thief' }),
    backgroundId: 'criminal',
    backgroundBonus: { des: 2, con: 1 },
    abilities: { method: 'padrao', base: { for: 8, des: 15, con: 14, int: 12, sab: 13, car: 10 } },
    feats:
      level >= 4
        ? [{ level: 4, featId: 'ability-score-improvement', abilityBonus: { des: 1, con: 1 } }]
        : [],
    choices: {
      'classe:pericias': ['acrobacia', 'percepcao', 'enganacao', 'investigacao'],
      idiomas: ['halfling', 'goblin'],
      [choiceKey('classe', 'rogue-expertise', 'expertise')]: ['furtividade', 'prestidigitacao'],
      [choiceKey('classe', 'rogue-weapon-mastery', 'weapon-mastery')]: ['shortsword', 'shortbow'],
      [choiceKey('classe', 'rogue-thieves-cant', 'language')]: ['elvish'],
    },
    inventory: [
      { id: 'leather-armor', qty: 1, equipped: true },
      { id: 'shortsword', qty: 1 },
      { id: 'shortbow', qty: 1 },
      { id: 'longsword', qty: 1 },
      { id: 'arrows', qty: 1 },
    ],
  });
}

/** Humano Guerreiro (Soldado), array padrão, +2 FOR +1 CON, estilo Defesa. */
export function brom(level = 1): Character {
  return makeCharacter({
    name: 'Brom',
    level,
    speciesId: 'human',
    size: 'Médio',
    classId: 'fighter',
    backgroundId: 'soldier',
    backgroundBonus: { for: 2, con: 1 },
    abilities: { method: 'padrao', base: { for: 15, des: 13, con: 14, int: 8, sab: 12, car: 10 } },
    choices: {
      'classe:pericias': ['acrobacia', 'percepcao'],
      'antecedente:ferramenta': ['dice'],
      idiomas: ['orc', 'giant'],
      [choiceKey('classe', 'fighter-fighting-style', 'fighting-style')]: ['defense'],
      [choiceKey('classe', 'fighter-weapon-mastery', 'weapon-mastery')]: [
        'greatsword',
        'javelin',
        'longsword',
      ],
      [choiceKey('especie', 'skillful', 'skillful')]: ['furtividade'],
      [choiceKey('especie', 'versatile', 'versatile')]: ['skilled'],
      'talento:skilled:proficiencies': ['historia', 'sobrevivencia', 'thieves-tools'],
    },
    inventory: [
      { id: 'chain-mail', qty: 1, equipped: true },
      { id: 'greatsword', qty: 1 },
    ],
  });
}
