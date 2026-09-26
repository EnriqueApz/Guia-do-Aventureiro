import { content } from '@/content';
import { compareClasses, compareSpecies } from './compare';

const cls = (id: string) => content.classes.find((c) => c.id === id)!;
const sp = (id: string) => content.species.find((s) => s.id === id)!;
const value = (rows: ReturnType<typeof compareClasses>, label: string) =>
  rows.find((r) => r.label === label);

describe('comparador', () => {
  it('classes: Guerreiro × Mago', () => {
    const rows = compareClasses(cls('fighter'), cls('wizard'), content);
    expect(value(rows, 'Dado de vida')).toMatchObject({ a: 'd10', b: 'd6', differs: true });
    expect(value(rows, 'Magia')?.a).toBe('Não');
    expect(value(rows, 'Magia')?.b).toContain('Inteligência');
    expect(value(rows, 'Atributo principal')?.a).toBe('Força ou Destreza');
    expect(rows.every((r) => r.a && r.b)).toBe(true);
  });

  it('a mesma opção dos dois lados não tem diferenças', () => {
    for (const c of content.classes)
      expect(compareClasses(c, c, content).some((r) => r.differs)).toBe(false);
    for (const s of content.species)
      expect(compareSpecies(s, s, content).some((r) => r.differs)).toBe(false);
  });

  it('espécies: Anão × Elfo', () => {
    const rows = compareSpecies(sp('dwarf'), sp('elf'), content);
    expect(value(rows, 'Resistência')).toMatchObject({ a: 'Veneno', b: 'Nenhuma fixa' });
    expect(value(rows, 'Visão no Escuro')?.a).toBe('36 m');
    expect(value(rows, 'Linhagens')?.a).toBe('Não tem');
    expect(value(rows, 'Deslocamento')?.b).toBe('9 m');
  });
});
