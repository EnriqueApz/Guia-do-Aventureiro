import { CHARACTERS_KEY, sortByRecent, useCharacters } from './characters';

beforeEach(() => useCharacters.setState({ characters: {} }));

describe('personagens salvos', () => {
  it('cria, atualiza e persiste', () => {
    const c = useCharacters.getState().create({ name: 'Brisa' });
    useCharacters.getState().update(c.id, { level: 3 });
    const stored = useCharacters.getState().characters[c.id];
    expect(stored).toMatchObject({ name: 'Brisa', level: 3 });
    const saved = JSON.parse(localStorage.getItem(CHARACTERS_KEY) ?? '{}');
    expect(saved.state.characters[c.id].level).toBe(3);
  });

  it('duplica com novo id e marca como cópia', () => {
    const c = useCharacters.getState().create({ name: 'Brisa' });
    const copy = useCharacters.getState().duplicate(c.id);
    expect(copy?.id).not.toBe(c.id);
    expect(copy?.name).toBe('Brisa (cópia)');
    expect(Object.keys(useCharacters.getState().characters)).toHaveLength(2);
  });

  it('exclui e permite desfazer', () => {
    const c = useCharacters.getState().create();
    const removed = useCharacters.getState().remove(c.id);
    expect(useCharacters.getState().characters[c.id]).toBeUndefined();
    if (!removed) throw new Error('deveria ter removido');
    useCharacters.getState().restore(removed);
    expect(useCharacters.getState().characters[c.id]).toEqual(c);
  });

  it('ignora ids inexistentes', () => {
    expect(useCharacters.getState().duplicate('nada')).toBeUndefined();
    expect(useCharacters.getState().remove('nada')).toBeUndefined();
  });

  it('ordena do mais recente para o mais antigo', () => {
    const list = sortByRecent({
      a: { id: 'a', name: '', level: 1, createdAt: '', updatedAt: '2026-01-01' },
      b: { id: 'b', name: '', level: 1, createdAt: '', updatedAt: '2026-02-01' },
    });
    expect(list.map((c) => c.id)).toEqual(['b', 'a']);
  });
});
