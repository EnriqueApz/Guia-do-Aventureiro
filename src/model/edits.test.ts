import { content } from '@/content';
import { makeCharacter, thorin } from '@/test/characters';
import {
  selectBackground,
  selectClass,
  selectLineage,
  selectSpecies,
  selectSubclass,
  setChoice,
  setLevel,
  setLineageSpellAbility,
  setPersonality,
  setSize,
  toggleChoice,
} from './edits';

describe('edições do assistente', () => {
  it('nível fica entre 1 e 20', () => {
    const c = makeCharacter({});
    expect(setLevel(c, 0).level).toBe(1);
    expect(setLevel(c, 25).level).toBe(20);
    expect(setLevel(c, 4.6).level).toBe(5);
  });

  it('trocar de espécie limpa linhagem, tamanho e escolhas da espécie', () => {
    let c = makeCharacter({
      speciesId: 'elf',
      lineageId: 'elven-lineage-drow',
      lineageSpellAbility: 'car',
      choices: {
        'especie:keen-senses:keen-senses': ['percepcao'],
        'classe:pericias': ['medicina'],
      },
    });
    c = selectSpecies(c, 'halfling', content);
    expect(c.speciesId).toBe('halfling');
    expect(c.lineageId).toBeUndefined();
    expect(c.lineageSpellAbility).toBeUndefined();
    expect(c.size).toBe('Pequeno'); // só há um tamanho possível
    expect(c.choices).toEqual({ 'classe:pericias': ['medicina'] });
    expect(selectSpecies(c, 'halfling', content)).toBe(c);
    expect(selectSpecies(c, 'nao-existe', content)).toBe(c);
    expect(selectSpecies(c, 'human', content).size).toBeUndefined(); // humano escolhe o tamanho
  });

  it('linhagem, atributo de conjuração e tamanho', () => {
    let c = makeCharacter({ speciesId: 'elf', choices: { 'linhagem:x:y': ['a'] } });
    c = selectLineage(c, 'elven-lineage-drow');
    expect(c).toMatchObject({ lineageId: 'elven-lineage-drow', choices: {} });
    expect(selectLineage(c, 'elven-lineage-drow')).toBe(c);
    expect(setLineageSpellAbility(c, 'sab').lineageSpellAbility).toBe('sab');
    expect(setSize(c, 'Pequeno').size).toBe('Pequeno');
  });

  it('trocar de classe limpa subclasse, escolhas e talentos que não cabem', () => {
    let c = thorin(5);
    c = { ...c, feats: [...c.feats, { level: 19, featId: 'boon-of-fate' }] };
    const fighter = selectClass(c, 'fighter', content);
    expect(fighter.subclassId).toBeUndefined();
    expect(Object.keys(fighter.choices).some((k) => k.startsWith('classe:'))).toBe(false);
    expect(fighter.feats.map((f) => f.level)).toEqual([4, 19]);
    const rogue = selectClass(thorin(5), 'rogue', content);
    expect(rogue.feats).toHaveLength(1); // nível 4 também é de talento para o ladino
    expect(selectClass(c, 'cleric', content)).toBe(c);
    expect(selectClass(c, 'nao-existe', content)).toBe(c);
  });

  it('subclasse da mesma classe continua ao reescolher a classe', () => {
    const c = makeCharacter({ classId: 'cleric', subclassId: 'life-domain' });
    expect(selectSubclass(c, 'life-domain')).toBe(c);
    expect(selectSubclass(c, 'x').subclassId).toBe('x');
  });

  it('trocar de antecedente zera os aumentos e as escolhas do antecedente', () => {
    const c = makeCharacter({
      backgroundId: 'soldier',
      backgroundBonus: { for: 2, con: 1 },
      choices: { 'antecedente:ferramenta': ['dice'] },
      startingEquipment: { backgroundOption: 'a', classOption: 'b' },
    });
    const next = selectBackground(c, 'sage', content);
    expect(next).toMatchObject({
      backgroundId: 'sage',
      backgroundBonus: {},
      // O Iniciado em Magia do Sábio já vem com a lista do Mago.
      choices: { 'talento:magic-initiate:list': ['mago'] },
      startingEquipment: { classOption: 'b' },
    });
    expect(selectBackground(next, 'sage', content)).toBe(next);
  });

  it('escolhas com limite', () => {
    let c = makeCharacter({});
    c = toggleChoice(c, 'k', 'a', 2);
    c = toggleChoice(c, 'k', 'b', 2);
    expect(toggleChoice(c, 'k', 'c', 2)).toBe(c); // cheio
    c = toggleChoice(c, 'k', 'a', 2);
    expect(c.choices.k).toEqual(['b']);
    expect(toggleChoice(c, 'k', 'z', 1).choices.k).toEqual(['z']); // escolha única troca
    c = toggleChoice(c, 'k', 'b', 2);
    expect(c.choices.k).toBeUndefined();
    expect(setChoice(c, 'j', ['x']).choices.j).toEqual(['x']);
  });

  it('personalidade', () => {
    expect(
      setPersonality(makeCharacter({}), 'ideals', 'Liberdade').details.personality.ideals,
    ).toBe('Liberdade');
  });
});
