import { content, rawContent } from './index';
import type { ContentBundle } from './schema';
import { normalize, validateContent } from './validate';

type Raw = ContentBundle;

/** Cópia profunda do conteúdo para quebrar de propósito. */
function broken(mutate: (c: Raw) => void): Raw {
  const copy = structuredClone(content);
  mutate(copy);
  return copy;
}

function errorsOf(raw: unknown) {
  return validateContent(raw).errors;
}

describe('validação do conteúdo', () => {
  it('o conteúdo do SRD é válido', () => {
    const report = validateContent(rawContent);
    expect(report.errors).toEqual([]);
  });

  it('acusa erro de esquema (id fora do padrão)', () => {
    const errors = errorsOf(
      broken((c) => {
        c.feats[0]!.id = 'Alerta Com Espaço';
      }),
    );
    expect(errors.some((e) => e.startsWith('esquema:') && e.includes('kebab-case'))).toBe(true);
  });

  it('acusa ids duplicados', () => {
    const errors = errorsOf(
      broken((c) => {
        c.items.push({ ...c.items[0]! });
      }),
    );
    expect(errors).toContainEqual(expect.stringMatching(/itens: id duplicado/));
  });

  it('acusa item inexistente no equipamento inicial', () => {
    const errors = errorsOf(
      broken((c) => {
        c.classes[0]!.startingEquipment[0]!.items.push({ id: 'espada-lendaria', qty: 1 });
      }),
    );
    expect(errors).toContainEqual(expect.stringMatching(/item "espada-lendaria" não existe/));
  });

  it('acusa subclasse de classe inexistente', () => {
    const errors = errorsOf(
      broken((c) => {
        c.subclasses[0]!.classId = 'artifice';
      }),
    );
    expect(errors).toContainEqual(expect.stringMatching(/classe "artifice" não existe/));
  });

  it('acusa coluna de tabela inexistente', () => {
    const errors = errorsOf(
      broken((c) => {
        c.classes[0]!.features[0]!.uses = {
          max: { kind: 'coluna', column: 'nao-existe' },
          recharge: 'descanso-longo',
        };
      }),
    );
    expect(errors).toContainEqual(
      expect.stringMatching(/coluna "nao-existe" não existe em barbarian/),
    );
  });

  it('acusa magia inexistente', () => {
    const errors = errorsOf(
      broken((c) => {
        c.subclasses[2]!.alwaysPrepared![0]!.spells.push('bola-de-neve');
      }),
    );
    expect(errors).toContainEqual(expect.stringMatching(/magia "bola-de-neve" não existe/));
  });

  it('exige explicação simples nas características dos primeiros níveis', () => {
    const errors = errorsOf(
      broken((c) => {
        delete c.classes[0]!.features[0]!.plain;
      }),
    );
    expect(errors).toContainEqual(
      expect.stringMatching(/barbarian-rage: falta a explicação simples/),
    );
  });

  it('exige que a sugestão de atributos use o array padrão', () => {
    const errors = errorsOf(
      broken((c) => {
        c.classes[0]!.recommendedScores.for = 16;
      }),
    );
    expect(errors).toContainEqual(expect.stringMatching(/array padrão/));
  });

  it('exige talento de origem no antecedente', () => {
    const errors = errorsOf(
      broken((c) => {
        c.backgrounds[0]!.originFeat.id = 'grappler';
      }),
    );
    expect(errors).toContainEqual(expect.stringMatching(/não é de origem/));
  });

  it('acusa "veja também" quebrado e sinônimos em conflito no glossário', () => {
    const errors = errorsOf(
      broken((c) => {
        c.glossary[0]!.seeAlso.push('termo-fantasma');
        c.glossary[1]!.aliases.push('Ação');
      }),
    );
    expect(errors).toContainEqual(expect.stringMatching(/"termo-fantasma", que não existe/));
    expect(errors).toContainEqual(expect.stringMatching(/"acao" aparece em/));
  });

  it('acusa tabela de truques que diminui', () => {
    const errors = errorsOf(
      broken((c) => {
        c.classes[3]!.spellcasting!.cantrips[7] = 1;
      }),
    );
    expect(errors).toContainEqual(expect.stringMatching(/truques diminuem no nível 8/));
  });

  it('normaliza textos para busca', () => {
    expect(normalize('  Salvaguarda Contra a MORTE ')).toBe('salvaguarda contra a morte');
    expect(normalize('Ação Bônus')).toBe('acao bonus');
  });
});
