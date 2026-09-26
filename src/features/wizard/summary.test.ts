import { content } from '@/content';
import { derive } from '@/rules/derive';
import { makeCharacter, thorin } from '@/test/characters';
import { characterSummary } from './summary';

describe('resumo do personagem', () => {
  it('descreve identidade, números, magias e detalhes sem marcar gênero', () => {
    const c = thorin(1);
    c.details.alignment = 'NB';
    c.details.personality.traits = 'Fala baixo e escuta muito.';
    c.details.hook = 'Procura o irmão desaparecido.';
    const text = characterSummary(c, derive(c, content), content);
    expect(text).toContain('Thorin: Anão, Clérigo de 1º nível, com o antecedente Acólito.');
    expect(text).toContain('Sabedoria (17)');
    expect(text).toMatch(/CA \d+, \d+ Pontos de Vida e deslocamento de 9 m/);
    expect(text).toContain('Conta com magias como');
    expect(text).toContain('logo nota: fala baixo e escuta muito.');
    expect(text).toContain('Alinhamento: Neutro e Bom.');
    expect(text).toMatch(/Procura o irmão desaparecido\.$/);
  });

  it('funciona com a ficha vazia e cita armas quando não há magias', () => {
    const empty = makeCharacter({});
    expect(characterSummary(empty, derive(empty, content), content)).toContain(
      'Seu personagem: personagem de 1º nível.',
    );
    const f = makeCharacter({
      name: 'Brom',
      classId: 'fighter',
      inventory: [{ id: 'longsword', qty: 1 }],
    });
    expect(characterSummary(f, derive(f, content), content)).toContain('Luta com espada longa.');
  });
});
