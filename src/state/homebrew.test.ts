import { EMPTY_PACK, HOMEBREW_KEY, loadHomebrew } from '@/content/homebrew';
import { srdContent } from '@/content';
import { useHomebrew } from './homebrew';

const bg = srdContent.backgrounds[0]!;

beforeEach(() => useHomebrew.setState({ pack: EMPTY_PACK }));

describe('conteúdo próprio salvo', () => {
  it('salva, atualiza, remove e é lido de volta ao carregar', () => {
    const mine = { ...bg, id: 'meu', name: 'Meu', source: { kind: 'homebrew' as const } };
    useHomebrew.getState().save('backgrounds', mine);
    useHomebrew.getState().save('backgrounds', { ...mine, name: 'Meu 2' });
    expect(useHomebrew.getState().pack.backgrounds.map((b) => b.name)).toEqual(['Meu 2']);
    expect(loadHomebrew().backgrounds[0]?.name).toBe('Meu 2');
    useHomebrew.getState().remove('backgrounds', 'meu');
    expect(loadHomebrew().backgrounds).toEqual([]);
  });

  it('dados corrompidos no navegador não quebram o site', () => {
    localStorage.setItem(HOMEBREW_KEY, '{quebrado');
    expect(loadHomebrew()).toEqual(EMPTY_PACK);
    localStorage.setItem(HOMEBREW_KEY, JSON.stringify({ state: { pack: { species: 'x' } } }));
    expect(loadHomebrew()).toEqual(EMPTY_PACK);
  });
});
