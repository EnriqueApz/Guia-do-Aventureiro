import { emptyCharacter } from '@/model/character';
import { CHARACTERS_KEY, migrateCharacters, sortByRecent, useCharacters } from './characters';

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
      a: { ...emptyCharacter('a', ''), updatedAt: '2026-01-01' },
      b: { ...emptyCharacter('b', ''), updatedAt: '2026-02-01' },
    });
    expect(list.map((c) => c.id)).toEqual(['b', 'a']);
  });

  it('migra rascunhos da versão 1 para o modelo completo', () => {
    const migrated = migrateCharacters(
      {
        characters: {
          x: { id: 'x', name: 'Zynn', level: 2, createdAt: '2026-01-01', updatedAt: '2026-01-02' },
        },
      },
      1,
    );
    expect(migrated.characters.x).toMatchObject({
      id: 'x',
      name: 'Zynn',
      level: 2,
      schemaVersion: 2,
      updatedAt: '2026-01-02',
      choices: {},
    });
  });
});
