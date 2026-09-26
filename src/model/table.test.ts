import { content } from '@/content';
import { decodeShare, encodeShare } from '@/lib/share';
import { brom, makeCharacter, thorin } from '@/test/characters';
import { allowed, applyTableDefaults, DEFAULT_TABLE, homebrewBlocked, tableIssues } from './table';
import { parseTable } from './tableSchema';

const rules = {
  ...DEFAULT_TABLE,
  name: 'Sexta à noite',
  level: 3,
  species: ['dwarf', 'human'],
  classes: ['fighter', 'cleric'],
  backgrounds: ['soldier'],
  abilityMethods: ['padrao' as const],
  hpMethod: 'media' as const,
};

describe('código da mesa', () => {
  it('vai e volta pelo link', () => {
    expect(parseTable(decodeShare(encodeShare(rules)))).toEqual(rules);
    expect(parseTable({ v: 2 })).toBeUndefined();
    expect(parseTable({ ...rules, abilityMethods: [] })).toBeUndefined();
  });

  it('lista ausente libera tudo', () => {
    expect(allowed(undefined, 'elf')).toBe(true);
    expect(allowed(['dwarf'], 'elf')).toBe(false);
    expect(allowed(['dwarf'], undefined)).toBe(false);
  });

  it('aponta o que foge das regras, na etapa certa', () => {
    const t = thorin(3); // Anão Clérigo Acólito, array padrão
    const msgs = tableIssues(t, rules, content).map((i) => `${i.step}: ${i.message}`);
    expect(msgs).toEqual([
      'antecedente: A mesa “Sexta à noite” não liberou o antecedente Acólito.',
    ]);
    const b = { ...brom(1), abilities: { ...brom(1).abilities, method: 'rolagem' as const } };
    const bm = tableIssues(
      { ...b, speciesId: 'elf', hp: { method: 'rolagem', rolls: {} } },
      rules,
      content,
    ).map((i) => i.message);
    expect(bm).toContain('A mesa “Sexta à noite” começa no nível 3.');
    expect(bm).toContain('A mesa “Sexta à noite” não liberou a espécie Elfo.');
    expect(bm).toContain('A mesa “Sexta à noite” não usa rolagem 4d6.');
    const lvl3 = {
      ...b,
      level: 3,
      speciesId: 'dwarf',
      classId: 'wizard',
      abilities: brom(1).abilities,
      hp: { method: 'rolagem' as const, rolls: {} },
    };
    expect(tableIssues(lvl3, { ...rules, name: undefined }, content).map((i) => i.message)).toEqual(
      ['A mesa não liberou a classe Mago.', 'A mesa usa PV pela média a cada nível.'],
    );
    expect(tableIssues(t, DEFAULT_TABLE, content)).toEqual([]);
  });

  it('personagem novo já nasce dentro das regras', () => {
    const c = applyTableDefaults(
      makeCharacter({ abilities: { method: 'manual', base: thorin().abilities.base } }),
      { ...rules, abilityMethods: ['compra'], hpMethod: 'rolagem' },
    );
    expect(c).toMatchObject({
      level: 3,
      abilities: { method: 'compra' },
      hp: { method: 'rolagem' },
    });
    const same = makeCharacter({});
    expect(applyTableDefaults(same, DEFAULT_TABLE)).toEqual(same);
  });
});

describe('mesa sem conteúdo próprio', () => {
  it('bloqueia e aponta opções do grupo', () => {
    const own = {
      ...content.backgrounds[0]!,
      id: 'meu',
      name: 'Meu',
      source: { kind: 'homebrew' as const },
    };
    const strict = { ...DEFAULT_TABLE, allowHomebrew: false };
    expect(homebrewBlocked(strict, own)).toBe(true);
    expect(homebrewBlocked(DEFAULT_TABLE, own)).toBe(false);
    expect(homebrewBlocked(null, own)).toBe(false);
    const withOwn = { ...content, backgrounds: [...content.backgrounds, own] };
    const c = { ...thorin(1), backgroundId: 'meu' };
    expect(tableIssues(c, strict, withOwn).map((i) => i.message)).toEqual([
      'A mesa não permite conteúdo próprio (Meu).',
    ]);
  });
});
