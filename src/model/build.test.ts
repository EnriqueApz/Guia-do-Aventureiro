import { content } from '@/content';
import { validateCharacter } from '@/rules/validate';
import { pointBuySpent } from '@/rules/abilities';
import { makeCharacter, thorin } from '@/test/characters';
import {
  abilityPriority,
  applyBeginnerKit,
  applyClassSuggestion,
  assignScore,
  changePointBuy,
  chooseEquipment,
  selectBackground,
  selectClass,
  setAbilityMethod,
  setAbilityRolls,
  setBackgroundBonus,
  setHpMethod,
  setHpRoll,
  setLevelFeat,
  setLevelFeatBonus,
  setManualScore,
  toggleSpell,
} from './edits';

const cleric = content.classes.find((c) => c.id === 'cleric');

describe('atributos', () => {
  it('array padrão segue a sugestão da classe e troca valores sem repetir', () => {
    let c = makeCharacter({
      classId: 'cleric',
      abilities: { method: 'manual', base: thorin().abilities.base },
    });
    c = setAbilityMethod(c, 'padrao', content);
    expect(c.abilities.base).toEqual({ ...cleric?.recommendedScores });
    c = assignScore(c, 'int', 15);
    expect(c.abilities.base.int).toBe(15);
    expect(c.abilities.base.sab).toBe(8); // trocou com quem tinha o 15
    expect(setAbilityMethod(c, 'padrao', content)).toBe(c);
  });

  it('array padrão sem classe usa a ordem FOR→CAR', () => {
    const c = setAbilityMethod(
      makeCharacter({ abilities: { method: 'manual', base: thorin().abilities.base } }),
      'padrao',
      content,
    );
    expect(c.abilities.base).toEqual({ for: 15, des: 14, con: 13, int: 12, sab: 10, car: 8 });
    expect(abilityPriority(undefined)[0]).toBe('for');
  });

  it('compra de pontos respeita 8–15 e o orçamento de 27', () => {
    let c = setAbilityMethod(makeCharacter({}), 'compra', content);
    expect(pointBuySpent(c.abilities.base)).toBe(0);
    expect(changePointBuy(c, 'for', -1)).toBe(c);
    for (let i = 0; i < 7; i++) c = changePointBuy(c, 'for', 1);
    expect(c.abilities.base.for).toBe(15);
    for (let i = 0; i < 7; i++) c = changePointBuy(c, 'des', 1);
    for (let i = 0; i < 7; i++) c = changePointBuy(c, 'con', 1);
    expect(pointBuySpent(c.abilities.base)).toBeLessThanOrEqual(27);
    expect(
      changePointBuy(setAbilityMethod(c, 'manual', content), 'int', 1).abilities.base.int,
    ).toBe(8);
  });

  it('rolagem guarda os dados e distribui pela prioridade da classe', () => {
    const rolls = [
      [6, 6, 6, 1],
      [5, 5, 5, 1],
      [4, 4, 4, 1],
      [3, 3, 3, 1],
      [2, 2, 2, 1],
      [1, 1, 1, 1],
    ];
    const c = setAbilityRolls(makeCharacter({ classId: 'cleric' }), rolls, content);
    expect(c.abilities.method).toBe('rolagem');
    expect(c.abilities.base.sab).toBe(18);
    expect(c.abilities.base.int).toBe(3);
    expect(c.abilities.rolls).toHaveLength(6);
    expect(setAbilityMethod(c, 'rolagem', content)).toBe(c);
  });

  it('sugestão da classe reordena os valores do método atual', () => {
    const base = { for: 18, des: 8, con: 10, int: 12, sab: 3, car: 14 };
    const c = applyClassSuggestion(
      makeCharacter({ classId: 'cleric', abilities: { method: 'rolagem', base } }),
      content,
    );
    expect(c.abilities.base.sab).toBe(18);
    const p = applyClassSuggestion(
      setAbilityMethod(makeCharacter({ classId: 'cleric' }), 'compra', content),
      content,
    );
    expect(p.abilities.base).toEqual({ ...cleric?.recommendedScores });
    expect(pointBuySpent(p.abilities.base)).toBe(27);
    const none = makeCharacter({});
    expect(applyClassSuggestion(none, content)).toBe(none);
  });

  it('valores manuais ficam entre 3 e 18', () => {
    const c = makeCharacter({});
    expect(setManualScore(c, 'for', 25).abilities.base.for).toBe(18);
    expect(setManualScore(c, 'for', 1).abilities.base.for).toBe(3);
    expect(setManualScore(c, 'for', Number.NaN)).toBe(c);
  });

  it('aumento do antecedente descarta zeros', () => {
    expect(
      setBackgroundBonus(makeCharacter({}), { sab: 2, car: 1, for: 0 }).backgroundBonus,
    ).toEqual({ sab: 2, car: 1 });
  });
});

describe('equipamento', () => {
  it('monta inventário, moedas e equipa armadura e escudo', () => {
    let c = makeCharacter({ classId: 'cleric', backgroundId: 'acolyte' });
    c = chooseEquipment(c, 'classOption', 'a', content);
    c = chooseEquipment(c, 'backgroundOption', 'a', content);
    expect(c.inventory.find((i) => i.id === 'chain-shirt')).toMatchObject({ equipped: true });
    expect(c.inventory.find((i) => i.id === 'shield')).toMatchObject({ equipped: true });
    expect(c.inventory.find((i) => i.id === 'amulet')?.qty).toBe(2); // classe + antecedente
    expect(c.coins.po).toBe(15);
    c = chooseEquipment(c, 'classOption', 'b', content);
    expect(c.inventory.some((i) => i.id === 'shield')).toBe(false);
    expect(c.coins.po).toBe(118);
  });

  it('trocar classe ou antecedente refaz o inventário', () => {
    let c = chooseEquipment(
      makeCharacter({ classId: 'cleric', backgroundId: 'acolyte' }),
      'classOption',
      'a',
      content,
    );
    c = chooseEquipment(c, 'backgroundOption', 'b', content);
    const other = selectClass(c, 'wizard', content);
    expect(other.inventory).toEqual([]);
    expect(other.coins.po).toBe(50);
    const bg = selectBackground(c, 'soldier', content);
    expect(bg.coins.po).toBe(7);
  });
});

describe('magias, talentos e PV', () => {
  it('magias com limite', () => {
    let c = makeCharacter({});
    c = toggleSpell(c, 'cantrips', 'light', 1);
    expect(toggleSpell(c, 'cantrips', 'guidance', 1)).toBe(c);
    expect(toggleSpell(c, 'cantrips', 'light', 1).spells.cantrips).toEqual([]);
  });

  it('talento de nível e aumento', () => {
    let c = makeCharacter({ choices: { 'nivel4:skilled:proficiencies': ['atletismo'] } });
    c = setLevelFeat(c, 8, 'ability-score-improvement');
    c = setLevelFeat(c, 4, 'skilled');
    expect(c.feats.map((f) => f.level)).toEqual([4, 8]);
    expect(c.choices).toEqual({});
    c = setLevelFeatBonus(c, 8, { for: 2, des: 0 });
    expect(c.feats[1]?.abilityBonus).toEqual({ for: 2 });
    expect(setLevelFeat(c, 4, '').feats).toHaveLength(1);
  });

  it('PV por rolagem', () => {
    let c = setHpMethod(makeCharacter({}), 'rolagem');
    c = setHpRoll(c, 2, 5);
    expect(c.hp).toEqual({ method: 'rolagem', rolls: { 2: 5 } });
    expect(setHpRoll(c, 2, undefined).hp.rolls).toEqual({});
  });
});

describe('kit para iniciantes', () => {
  it('um toque deixa as escolhas da classe prontas e legais', () => {
    for (const bg of content.backgrounds) {
      for (const cls of content.classes) {
        let c = makeCharacter({
          name: 'Kit',
          speciesId: 'dwarf',
          classId: cls.id,
          backgroundId: bg.id,
          abilities: { method: 'padrao', base: { ...cls.recommendedScores } as never },
        });
        c = selectBackground({ ...c, backgroundId: undefined }, bg.id, content);
        const [a, b] = bg.abilityOptions;
        c = setBackgroundBonus(c, { [a]: 2, [b]: 1 });
        if (typeof bg.tool !== 'string')
          c.choices['antecedente:ferramenta'] = [
            bg.tool.from === 'qualquer' ? '' : (bg.tool.from?.[0] ?? ''),
          ];
        c = applyBeginnerKit(c, content);
        const errs = validateCharacter(c, content).filter((i) => i.severity === 'erro');
        expect({ cls: cls.id, bg: bg.id, errs: errs.map((e) => e.message) }).toEqual({
          cls: cls.id,
          bg: bg.id,
          errs: [],
        });
        // Perícias do kit nunca repetem as do antecedente.
        expect(c.choices['classe:pericias']?.some((s) => bg.skills.includes(s as never))).toBe(
          false,
        );
      }
    }
  });

  it('sem classe ou sem kit, nada muda', () => {
    const c = makeCharacter({});
    expect(applyBeginnerKit(c, content)).toBe(c);
  });
});
