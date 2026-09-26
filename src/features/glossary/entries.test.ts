import { content } from '@/content';
import { buildGlossary, initialOf, normalize, searchGlossary } from './entries';

const all = buildGlossary(content);

// Código-fonte das telas, como texto (os testes ficam de fora).
const sources = import.meta.glob(['/src/**/*.tsx', '!/src/**/*.test.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('glossário', () => {
  it('junta regras, condições, propriedades e maestrias, sem ids nem termos repetidos', () => {
    expect(new Set(all.map((i) => i.id)).size).toBe(all.length);
    expect(new Set(all.map((i) => normalize(i.term))).size).toBe(all.length);
    expect(all.some((i) => i.kind === 'condicao' && i.term === 'Cego')).toBe(true);
    expect(all.some((i) => i.kind === 'maestria' && i.term === 'Trespassar')).toBe(true);
    expect(all.some((i) => i.kind === 'propriedade' && i.term === 'Acuidade')).toBe(true);
    // Em ordem alfabética, sem se importar com acentos.
    const terms = all.map((i) => normalize(i.term));
    expect(terms).toEqual([...terms].sort((a, b) => a.localeCompare(b)));
  });

  it('todo "veja também" aponta para um termo que existe', () => {
    const ids = new Set(all.map((i) => i.id));
    for (const i of all)
      for (const ref of i.seeAlso) expect(ids.has(ref), `${i.id} → ${ref}`).toBe(true);
  });

  it('todo termo marcado nas telas tem entrada no glossário', () => {
    const ids = new Set(content.glossary.map((g) => g.id));
    const used = new Set<string>();
    for (const text of Object.values(sources)) {
      for (const m of text.matchAll(/GlossaryTerm id="([a-z0-9-]+)"/g)) used.add(m[1] ?? '');
    }
    expect(used.size).toBeGreaterThan(10);
    expect([...used].filter((id) => !ids.has(id))).toEqual([]);
  });

  it('busca ignora acentos e maiúsculas e ordena pelo mais relevante', () => {
    expect(searchGlossary(all, 'SALVAGUARDA')[0]?.id).toBe('salvaguarda');
    expect(searchGlossary(all, 'resistencia')[0]?.term).toBe('Resistência');
    expect(searchGlossary(all, 'saving throw')[0]?.id).toBe('salvaguarda');
    expect(searchGlossary(all, 'teste de resistência')[0]?.id).toBe('salvaguarda');
    expect(searchGlossary(all, 'cego').map((i) => i.term)).toContain('Cego');
    // Acha também pela explicação.
    expect(searchGlossary(all, 'dois d20').length).toBeGreaterThan(0);
    expect(searchGlossary(all, '   ')).toHaveLength(all.length);
    expect(searchGlossary(all, 'xyzzy')).toEqual([]);
  });

  it('letra inicial sem acento', () => {
    expect(initialOf('Ação')).toBe('A');
    expect(initialOf('Área')).toBe('A');
  });
});
