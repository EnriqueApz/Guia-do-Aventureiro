import { content } from '@/content';
import { lira, makeCharacter, thorin } from '@/test/characters';
import { classSpells, featSpellOptions, maxSpellCircle, spellBudget } from '../spells';

const byId = (id: string) => content.classes.find((c) => c.id === id);

describe('magias disponíveis', () => {
  it('círculo máximo pelos espaços', () => {
    expect(maxSpellCircle(byId('wizard'), 1)).toBe(1);
    expect(maxSpellCircle(byId('wizard'), 5)).toBe(3);
    expect(maxSpellCircle(byId('wizard'), 17)).toBe(9);
    expect(maxSpellCircle(byId('paladin'), 5)).toBe(2);
    expect(maxSpellCircle(byId('warlock'), 11)).toBe(5);
    expect(maxSpellCircle(byId('fighter'), 20)).toBe(0);
    expect(maxSpellCircle(undefined, 1)).toBe(0);
  });

  it('limites do nível e magias da subclasse', () => {
    expect(spellBudget(thorin(1), content)).toMatchObject({
      cantrips: 3,
      prepared: 4,
      maxCircle: 1,
      alwaysPrepared: [],
    });
    expect(spellBudget(thorin(3), content)?.alwaysPrepared).toContain('bless');
    expect(spellBudget(lira(3), content)?.alwaysPrepared).toEqual([]);
    expect(spellBudget(makeCharacter({ classId: 'fighter' }), content)).toBeUndefined();
  });

  it('listas por classe e círculo', () => {
    const cantrips = classSpells(content, 'cleric', 0, 0);
    expect(cantrips.every((s) => s.level === 0 && s.classes.includes('cleric'))).toBe(true);
    expect(cantrips.map((s) => s.id)).toContain('sacred-flame');
    expect(classSpells(content, 'paladin', 0, 0)).toEqual([]);
  });

  it('Iniciado em Magia: truques e 1º círculo da lista escolhida', () => {
    const c = featSpellOptions(content, 'magic-initiate', 'cantrips', 'druida');
    expect(c.every((s) => s.level === 0 && s.classes.includes('druid'))).toBe(true);
    const s = featSpellOptions(content, 'magic-initiate', 'spell', 'mago');
    expect(s.every((x) => x.level === 1 && x.classes.includes('wizard'))).toBe(true);
    expect(featSpellOptions(content, 'magic-initiate', 'spell', undefined)).toEqual([]);
    expect(featSpellOptions(content, 'skilled', 'spell', 'mago')).toEqual([]);
  });
});
