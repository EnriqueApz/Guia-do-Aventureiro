import { content } from '@/content';
import { QUESTIONS, suggest, type Answers } from './suggest';

/** Todas as combinações de respostas possíveis. */
function allAnswers(): Answers[] {
  let combos: Partial<Answers>[] = [{}];
  for (const q of QUESTIONS)
    combos = combos.flatMap((c) => q.options.map((o) => ({ ...c, [q.id]: o.value })));
  return combos as Answers[];
}

describe('Me guie', () => {
  const combos = allAnswers();

  it('cobre todas as combinações de respostas', () => {
    expect(combos.length).toBe(QUESTIONS.reduce((n, q) => n * q.options.length, 1));
  });

  it('sempre devolve 3 sugestões válidas, diferentes e com justificativa', () => {
    const classIds = new Set(content.classes.map((c) => c.id));
    const speciesIds = new Set(content.species.map((s) => s.id));
    const bgIds = new Set(content.backgrounds.map((b) => b.id));
    for (const a of combos) {
      const out = suggest(a, content);
      expect(out).toHaveLength(3);
      expect(new Set(out.map((s) => s.classId)).size).toBe(3);
      for (const s of out) {
        expect(classIds.has(s.classId)).toBe(true);
        expect(speciesIds.has(s.speciesId)).toBe(true);
        expect(bgIds.has(s.backgroundId)).toBe(true);
        expect(s.reasons.length).toBeGreaterThanOrEqual(2);
        expect(s.reasons.every((r) => r.length > 10)).toBe(true);
      }
    }
  });

  it('quem quer o mínimo de regras nunca recebe classe avançada', () => {
    const advanced = new Set(
      content.classes.filter((c) => c.beginner.rating === 'avancado').map((c) => c.id),
    );
    for (const a of combos.filter((c) => c.complexity === 'pouca'))
      for (const s of suggest(a, content)) expect(advanced.has(s.classId)).toBe(false);
  });

  it('respostas típicas levam a sugestões esperadas', () => {
    const tank = suggest(
      {
        approach: 'perto',
        role: 'proteger',
        complexity: 'pouca',
        style: 'for',
        flavor: 'resistente',
      },
      content,
    );
    expect(['fighter', 'barbarian']).toContain(tank[0]?.classId);
    expect(['dwarf', 'goliath', 'orc']).toContain(tank[0]?.speciesId);
    const caster = suggest(
      { approach: 'magia', role: 'dano', complexity: 'muita', style: 'int', flavor: 'agil' },
      content,
    );
    expect(caster[0]?.classId).toBe('wizard');
    const healer = suggest(
      { approach: 'magia', role: 'curar', complexity: 'alguma', style: 'sab', flavor: 'versatil' },
      content,
    );
    expect(healer[0]?.classId).toBe('cleric');
    expect(healer[0]?.reasons.join(' ')).toContain('cura e apoia');
  });

  it('é determinístico', () => {
    const a = combos[123] as Answers;
    expect(suggest(a, content)).toEqual(suggest(a, content));
  });
});
