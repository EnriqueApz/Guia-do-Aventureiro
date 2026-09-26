import { brom, lira, makeCharacter, thorin } from '@/test/characters';
import { CharacterSchema, exportCharacters, exportFileName, parseImport } from './transfer';

describe('exportar e importar', () => {
  it('ida e volta preserva os personagens', () => {
    const list = [
      { ...thorin(5), id: 'a' },
      { ...lira(3), id: 'b' },
      { ...brom(1), id: 'c' },
    ];
    const text = exportCharacters(list, new Date('2026-09-26T12:00:00Z'));
    expect(JSON.parse(text)).toMatchObject({ app: 'guia-do-aventureiro', version: 2 });
    const r = parseImport(text);
    expect(r.errors).toEqual([]);
    expect(r.characters).toEqual(list);
  });

  it('os personagens de referência seguem o esquema', () => {
    for (const c of [thorin(1), lira(3), brom(1), makeCharacter({})])
      expect(CharacterSchema.safeParse(c).success).toBe(true);
  });

  it('aceita um personagem solto ou uma lista', () => {
    expect(parseImport(JSON.stringify(thorin(1))).characters).toHaveLength(1);
    expect(parseImport(JSON.stringify([thorin(1), brom(1)])).characters).toHaveLength(2);
  });

  it('id repetido ganha um id novo', () => {
    const c = thorin(1);
    const r = parseImport(JSON.stringify(c), new Set([c.id]));
    expect(r.characters[0]?.id).not.toBe(c.id);
    expect(r.renamed).toEqual(['Thorin']);
  });

  it('importa personagens da versão 1 (só nome e nível)', () => {
    const r = parseImport(
      JSON.stringify({
        app: 'guia-do-aventureiro',
        version: 1,
        characters: [{ id: 'a', name: 'Antigo', level: 3, createdAt: 'x', updatedAt: 'y' }],
      }),
    );
    expect(r.errors).toEqual([]);
    expect(r.characters[0]).toMatchObject({ id: 'a', name: 'Antigo', level: 3, schemaVersion: 2 });
  });

  it('mensagens claras para arquivos quebrados', () => {
    expect(parseImport('isto não é json').errors[0]).toContain('não é um JSON válido');
    expect(parseImport('42').errors[0]).toContain('nenhum personagem');
    expect(parseImport('[]').errors[0]).toContain('nenhum personagem');
    expect(parseImport(JSON.stringify({ app: 'outro', characters: [] })).errors[0]).toContain(
      'não é do Guia',
    );
    expect(parseImport(JSON.stringify({ version: 9, characters: [] })).errors[0]).toContain(
      'versão mais nova',
    );
    expect(parseImport(JSON.stringify({ characters: 'x' })).errors[0]).toContain(
      'lista de personagens',
    );
    const bad = { ...thorin(1), level: 42 };
    const r = parseImport(JSON.stringify({ version: 2, characters: [bad, brom(1)] }));
    expect(r.characters.map((c) => c.name)).toEqual(['Brom']);
    expect(r.errors).toEqual([
      'Personagem “Thorin” não foi importado: nível: valor fora do permitido.',
    ]);
    const missing = { ...thorin(1) } as Record<string, unknown>;
    delete missing.abilities;
    expect(parseImport(JSON.stringify([missing])).errors[0]).toContain('atributos: está faltando');
  });

  it('nome de arquivo sem acentos nem espaços', () => {
    const d = new Date('2026-09-26T12:00:00Z');
    expect(exportFileName([makeCharacter({ name: 'Lira Vento-Sul Ávila' })], d)).toBe(
      'lira-vento-sul-avila-2026-09-26.json',
    );
    expect(exportFileName([thorin(1), brom(1)], d)).toBe('personagens-2026-09-26.json');
    expect(exportFileName([makeCharacter({ name: '???' })], d)).toBe('personagem-2026-09-26.json');
  });
});
