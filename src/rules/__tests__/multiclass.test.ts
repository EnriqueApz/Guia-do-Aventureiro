/**
 * Multiclasse (SRD 5.2): níveis por classe, PV com dados diferentes, proficiências
 * parciais, espaços de magia combinados, Magia de Pacto à parte e requisitos.
 */
import { describe, expect, it } from 'vitest';
import { content } from '@/content';
import type { Character } from '@/model/character';
import {
  addExtraClass,
  removeExtraClass,
  selectClass,
  setChoice,
  setExtraClassLevels,
  setLevel,
  setLevelFeat,
  toggleSpell,
} from '@/model/edits';
import {
  classEntries,
  meetsMulticlassRequirement,
  multiclassCasterLevel,
  primaryLevels,
} from '../classes';
import { derive } from '../derive';
import { hitDiceAvailable, longRest, shortRest } from '../rest';
import { spellBudgets } from '../spells';
import { validateCharacter } from '../validate';
import { makeCharacter } from '@/test/characters';

const base = (patch: Partial<Character>) =>
  makeCharacter({
    abilities: {
      method: 'manual',
      base: { for: 14, des: 14, con: 14, int: 14, sab: 14, car: 14 },
    },
    ...patch,
  });

describe('multiclasse: classes e níveis', () => {
  it('a classe principal fica com o que sobra do nível', () => {
    const c = base({
      level: 5,
      classId: 'cleric',
      multiclass: [{ classId: 'fighter', levels: 2 }],
    });
    expect(primaryLevels(c)).toBe(3);
    const entries = classEntries(c, content);
    expect(entries.map((e) => [e.classDef.id, e.levels, e.primary])).toEqual([
      ['cleric', 3, true],
      ['fighter', 2, false],
    ]);
    const sheet = derive(c, content);
    expect(sheet.classLabel).toBe('Clérigo 3 / Guerreiro 2');
    expect(sheet.multiclass).toBe(true);
  });

  it('características vêm de cada classe até o nível dela', () => {
    const c = base({
      level: 5,
      classId: 'cleric',
      multiclass: [{ classId: 'fighter', levels: 2 }],
    });
    const ids = derive(c, content).features.map((f) => f.id);
    expect(ids).toContain('fighter-second-wind');
    expect(ids).toContain('fighter-action-surge'); // nível 2 de Guerreiro
    expect(ids).not.toContain('fighter-extra-attack'); // só no nível 5 de Guerreiro
  });

  it('salvaguardas só da principal; da classe nova, só as proficiências de multiclasse', () => {
    const c = base({
      level: 5,
      classId: 'cleric',
      multiclass: [{ classId: 'fighter', levels: 2 }],
    });
    const sheet = derive(c, content);
    const saves = Object.entries(sheet.saves)
      .filter(([, s]) => s.proficient)
      .map(([a]) => a);
    expect(saves.sort()).toEqual(['car', 'sab']);
    expect(sheet.proficiencies.weapons).toContain('marciais');
    expect(sheet.proficiencies.armor).not.toContain('pesada');
  });

  it('perícia escolhida ao entrar como Ladino', () => {
    let c = base({ level: 4, classId: 'fighter', multiclass: [{ classId: 'rogue', levels: 1 }] });
    c = setChoice(c, 'multiclasse:rogue:pericia', ['furtividade']);
    const sheet = derive(c, content);
    expect(sheet.skills.furtividade.proficient).toBe(true);
    expect(sheet.proficiencies.tools).toContain('thieves-tools');
  });
});

describe('multiclasse: PV e Dados de Vida', () => {
  it('PV médios somam o dado de cada classe (CON +2)', () => {
    // Clérigo 3 (d8): 8 + 5 + 5; Guerreiro 2 (d10): 6 + 6 → 30 + 5 × 2 de CON = 40.
    const c = base({
      level: 5,
      classId: 'cleric',
      multiclass: [{ classId: 'fighter', levels: 2 }],
    });
    const sheet = derive(c, content);
    expect(sheet.hp.max).toBe(40);
    expect(sheet.hitDice.pools).toEqual([
      { die: 10, total: 2 },
      { die: 8, total: 3 },
    ]);
  });

  it('descanso curto gasta dados de cada tamanho; longo devolve tudo', () => {
    const c = base({
      level: 5,
      classId: 'cleric',
      multiclass: [{ classId: 'fighter', levels: 2 }],
    });
    const sheet = derive(c, content);
    const play = { ...c.play, hpCurrent: 10 };
    const after = shortRest(play, sheet, { hitDiceRolls: [7, 3], diceSpent: { 10: 1, 8: 1 } });
    expect(after.hitDiceUsed).toBe(2);
    expect(hitDiceAvailable(after, sheet)).toEqual([
      { die: 10, left: 1 },
      { die: 8, left: 2 },
    ]);
    expect(() => shortRest(after, sheet, { hitDiceRolls: [1, 1], diceSpent: { 10: 2 } })).toThrow();
    expect(longRest(after).hitDiceUsedByDie).toBeUndefined();
  });
});

describe('multiclasse: magia', () => {
  it('uma classe conjuradora só: usa a tabela dela', () => {
    const c = base({
      level: 5,
      classId: 'cleric',
      multiclass: [{ classId: 'fighter', levels: 2 }],
    });
    expect(derive(c, content).spellcasting?.slots.slice(0, 3)).toEqual([4, 2, 0]);
  });

  it('duas conjuradoras completas: nível de conjurador somado', () => {
    const c = base({ level: 5, classId: 'wizard', multiclass: [{ classId: 'cleric', levels: 2 }] });
    const entries = classEntries(c, content);
    expect(multiclassCasterLevel(entries)).toBe(5);
    const sc = derive(c, content).spellcasting;
    expect(sc?.slots.slice(0, 3)).toEqual([4, 3, 2]);
    // Cada classe prepara pela própria tabela: Mago 3 até 2º círculo, Clérigo 2 só 1º.
    const budgets = spellBudgets(c, content);
    expect(budgets.map((b) => [b.classId, b.maxCircle])).toEqual([
      ['wizard', 2],
      ['cleric', 1],
    ]);
    expect(sc?.classes.map((x) => x.ability)).toEqual(['int', 'sab']);
  });

  it('meia conjuração conta metade, arredondando para cima', () => {
    const c = base({
      level: 6,
      classId: 'paladin',
      multiclass: [{ classId: 'sorcerer', levels: 3 }],
    });
    // Paladino 3 → 2 (arredondado para cima) + Feiticeiro 3 = 5.
    expect(multiclassCasterLevel(classEntries(c, content))).toBe(5);
  });

  it('Bruxo com outra conjuradora: Magia de Pacto fica à parte', () => {
    const c = base({
      level: 3,
      classId: 'warlock',
      multiclass: [{ classId: 'wizard', levels: 1 }],
    });
    const sc = derive(c, content).spellcasting;
    expect(sc?.pact).toBe(false);
    expect(sc?.slots[0]).toBe(2); // Mago 1
    expect(sc?.pactSlots?.[0]).toBe(2); // Bruxo 2
    const play = { ...c.play, pactSlotsUsed: [2, 0, 0, 0, 0, 0, 0, 0, 0] };
    expect(shortRest(play, derive(c, content), { hitDiceRolls: [] }).pactSlotsUsed?.[0]).toBe(0);
  });

  it('magias de cada classe ficam separadas', () => {
    let c = base({ level: 3, classId: 'wizard', multiclass: [{ classId: 'cleric', levels: 1 }] });
    c = toggleSpell(c, 'cantrips', 'guidance', 3, 'cleric');
    c = toggleSpell(c, 'cantrips', 'fire-bolt', 3);
    expect(c.spells.cantrips).toEqual(['fire-bolt']);
    expect(c.spells.byClass?.cleric?.cantrips).toEqual(['guidance']);
  });
});

describe('multiclasse: regras especiais', () => {
  it('requisito de 13 nos atributos principais', () => {
    const barb = content.classes.find((x) => x.id === 'barbarian')!;
    const fighter = content.classes.find((x) => x.id === 'fighter')!;
    const scores = { for: 12, des: 13, con: 10, int: 10, sab: 10, car: 10 };
    expect(meetsMulticlassRequirement(barb, scores)).toBe(false);
    expect(meetsMulticlassRequirement(fighter, scores)).toBe(true); // Força OU Destreza
  });

  it('Defesa sem Armadura de uma segunda classe não vale', () => {
    // Monge (10 + DES 2 + SAB 3 = 15); a do Bárbaro daria 10 + DES 2 + CON 4 = 16.
    const c = makeCharacter({
      level: 2,
      classId: 'monk',
      multiclass: [{ classId: 'barbarian', levels: 1 }],
      abilities: {
        method: 'manual',
        base: { for: 13, des: 14, con: 18, int: 10, sab: 16, car: 10 },
      },
    });
    expect(derive(c, content).ac.value).toBe(15);
  });

  it('usos contam o nível da própria classe (Fúrias do Bárbaro 1)', () => {
    const c = base({
      level: 6,
      classId: 'fighter',
      multiclass: [{ classId: 'barbarian', levels: 1 }],
    });
    const rage = derive(c, content).features.find((f) => f.id === 'barbarian-rage');
    expect(rage?.uses?.max).toBe(2);
  });
});

describe('multiclasse: edições e validação', () => {
  it('adicionar, mudar níveis e remover classes', () => {
    let c = base({ level: 4, classId: 'cleric' });
    c = addExtraClass(c, 'fighter', content);
    expect(c.multiclass).toEqual([{ classId: 'fighter', levels: 1 }]);
    c = setExtraClassLevels(c, 'fighter', 10);
    expect(c.multiclass?.[0]?.levels).toBe(3); // sobra 1 para o Clérigo
    expect(addExtraClass(c, 'rogue', content)).toBe(c); // sem nível livre
    c = setChoice(c, 'classe@fighter:fighter-fighting-style:style', ['defense']);
    c = removeExtraClass(c, 'fighter');
    expect(c.multiclass).toEqual([]);
    expect(Object.keys(c.choices).some((k) => k.startsWith('classe@fighter'))).toBe(false);
  });

  it('baixar o nível tira níveis das classes extras', () => {
    let c = base({ level: 6, classId: 'cleric', multiclass: [{ classId: 'fighter', levels: 3 }] });
    c = setLevel(c, 3);
    expect(c.multiclass).toEqual([{ classId: 'fighter', levels: 2 }]);
    c = setLevel(c, 1);
    expect(c.multiclass).toEqual([]);
  });

  it('escolher como principal uma classe da multiclasse tira ela da lista', () => {
    const c = base({
      level: 4,
      classId: 'cleric',
      multiclass: [{ classId: 'fighter', levels: 2 }],
    });
    expect(selectClass(c, 'fighter', content).multiclass).toEqual([]);
  });

  it('validação: subclasse e talento de cada classe nos níveis dela', () => {
    let c = base({
      level: 8,
      classId: 'cleric',
      subclassId: 'life-domain',
      multiclass: [{ classId: 'fighter', levels: 4 }],
    });
    const messages = () => validateCharacter(c, content).map((i) => i.message);
    expect(messages()).toContain('Com 4 níveis de Guerreiro, escolha uma subclasse de Guerreiro.');
    expect(messages()).toContain('Escolha o talento de Guerreiro 4.');
    c = setLevelFeat(c, 4, 'ability-score-improvement', 'fighter');
    expect(messages()).not.toContain('Escolha o talento de Guerreiro 4.');
    expect(messages()).toContain(
      'Guerreiro 4: distribua o aumento (+2 em um atributo ou +1 em dois).',
    );
  });

  it('validação: requisito vira aviso, não erro', () => {
    const c = makeCharacter({
      level: 3,
      classId: 'wizard',
      multiclass: [{ classId: 'barbarian', levels: 1 }],
    });
    const issue = validateCharacter(c, content).find((i) => /Multiclasse pede/.test(i.message));
    expect(issue?.severity).toBe('aviso');
  });
});
