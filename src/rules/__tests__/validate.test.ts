import { content } from '@/content';
import { choiceKey } from '@/model/character';
import { brom, lira, makeCharacter, pip, thorin } from '@/test/characters';
import { validateCharacter } from '../validate';

const errors = (c: ReturnType<typeof makeCharacter>) =>
  validateCharacter(c, content)
    .filter((i) => i.severity === 'erro')
    .map((i) => i.message);

describe('validação do personagem', () => {
  it('os personagens de referência estão completos e legais', () => {
    for (const c of [thorin(1), thorin(5), lira(3), pip(4), brom(1)]) {
      expect({ name: c.name, level: c.level, errors: errors(c) }).toEqual({
        name: c.name,
        level: c.level,
        errors: [],
      });
    }
  });

  it('um personagem novo lista tudo o que falta', () => {
    const msgs = errors(makeCharacter({}));
    expect(msgs).toEqual(
      expect.arrayContaining([
        'Escolha uma espécie.',
        'Escolha uma classe.',
        'Escolha um antecedente.',
        'Use cada valor do array padrão (15, 14, 13, 12, 10, 8) uma vez.',
        'Escolha dois idiomas além do Comum.',
      ]),
    );
    expect(validateCharacter(makeCharacter({}), content)).toContainEqual({
      step: 'detalhes',
      severity: 'aviso',
      message: 'Seu personagem ainda não tem nome.',
    });
  });

  it('nível inválido', () => {
    expect(errors(makeCharacter({ level: 21 }))).toEqual([
      'O nível precisa ser um número de 1 a 20.',
    ]);
  });

  it('linhagem, atributo de conjuração e tamanho da espécie', () => {
    const c = lira(3);
    delete c.lineageId;
    delete c.lineageSpellAbility;
    expect(errors(c)).toEqual(
      expect.arrayContaining([
        'Escolha linhagem élfica.',
        'Escolha o atributo de conjuração das magias da sua linhagem.',
      ]),
    );
    const h = brom(1);
    delete h.size;
    expect(errors(h)).toContain('Escolha o tamanho do personagem.');
  });

  it('subclasse obrigatória a partir do nível 3 e da classe certa', () => {
    const c = thorin(3);
    delete c.subclassId;
    expect(errors(c)).toContain('No nível 3, escolha uma subclasse de Clérigo.');
    c.subclassId = 'evoker';
    expect(errors(c)).toContain('Evocador não é uma subclasse de Clérigo.');
  });

  it('aumentos do antecedente e ferramenta à escolha', () => {
    const c = brom(1);
    c.backgroundBonus = { for: 2, int: 1 };
    c.choices['antecedente:ferramenta'] = [];
    expect(errors(c)).toEqual(
      expect.arrayContaining([
        'Distribua os aumentos do antecedente: +2 e +1, ou +1 em três atributos.',
        'Escolha um tipo de jogo.',
      ]),
    );
  });

  it('compra de pontos acima do orçamento e rolagens fora da faixa', () => {
    const c = thorin(1);
    c.abilities = {
      method: 'compra',
      base: { for: 15, des: 15, con: 15, int: 15, sab: 8, car: 8 },
    };
    expect(errors(c)).toContain('Você gastou 36 de 27 pontos.');
    c.abilities = { method: 'compra', base: { for: 16, des: 8, con: 8, int: 8, sab: 8, car: 8 } };
    expect(errors(c)).toContain('Na compra de pontos, cada atributo vai de 8 a 15.');
    c.abilities = { method: 'rolagem', base: { for: 19, des: 8, con: 8, int: 8, sab: 8, car: 8 } };
    expect(errors(c)).toContain('Valores rolados vão de 3 a 18.');
  });

  it('talentos de nível: faltando, inválido ou mal distribuído', () => {
    const c = thorin(5);
    c.feats = [];
    expect(errors(c)).toContain('Escolha o talento do nível 4.');
    c.feats = [{ level: 4, featId: 'ability-score-improvement', abilityBonus: { sab: 1 } }];
    expect(errors(c)).toContain('Nível 4: distribua o aumento (+2 em um atributo ou +1 em dois).');
    c.feats = [{ level: 4, featId: 'boon-of-fate' }];
    expect(errors(c)).toContain('Dádiva do Destino exige nível 19.');
    c.feats = [{ level: 4, featId: 'nao-existe' }];
    expect(errors(c)).toContain('Talento desconhecido no nível 4.');
  });

  it('perícias da classe: quantidade, lista, repetidas e iguais às do antecedente', () => {
    const c = thorin(1);
    c.choices['classe:pericias'] = ['medicina'];
    expect(errors(c)).toContain('Escolha 2 perícias da classe (1 de 2).');
    c.choices['classe:pericias'] = ['medicina', 'furtividade'];
    expect(errors(c)).toContain('Há perícias que não estão na lista da classe.');
    c.choices['classe:pericias'] = ['medicina', 'medicina'];
    expect(errors(c)).toContain('Há perícias repetidas.');
    c.choices['classe:pericias'] = ['medicina', 'religiao'];
    expect(
      validateCharacter(c, content).some((i) => i.severity === 'aviso' && i.step === 'escolhas'),
    ).toBe(true);
  });

  it('escolhas das características: de menos e de mais', () => {
    const c = pip(4);
    c.choices[choiceKey('classe', 'rogue-expertise', 'expertise')] = ['furtividade'];
    expect(errors(c)).toContain('Especialização em perícias: escolha 2 (1 de 2).');
    c.choices[choiceKey('classe', 'rogue-expertise', 'expertise')] = [
      'furtividade',
      'acrobacia',
      'percepcao',
    ];
    expect(errors(c)).toContain('Especialização em perícias: escolha só 2.');
  });

  it('ferramentas da classe (Monge)', () => {
    const c = makeCharacter({ classId: 'monk' });
    expect(errors(c)).toContain('Um tipo de ferramenta de artesão ou um instrumento musical.');
  });
});
