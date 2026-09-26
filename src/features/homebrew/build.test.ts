import { srdContent } from '@/content';
import {
  checkPack,
  EMPTY_PACK,
  firstSentence,
  mergeContent,
  packSize,
  slugify,
} from '@/content/homebrew';
import { derive } from '@/rules/derive';
import { makeCharacter } from '@/test/characters';
import { buildBackground, buildSpecies, buildSubclass } from './build';

const zealot = buildSubclass({
  id: 'caminho-do-fanatico',
  classId: 'barbarian',
  name: 'Caminho do Fanático',
  summary: '',
  description: 'Fúria alimentada pela fé. Anotado pelo grupo.',
  features: [{ name: 'Fúria Divina', level: 3, text: 'Texto do grupo. Mais detalhes.', plain: '' }],
});
const craftsman = buildBackground({
  id: 'antecedente-artesao',
  name: 'Artesão',
  summary: 'Trabalhou numa oficina.',
  description: '',
  abilityOptions: ['for', 'des', 'int'],
  skills: ['investigacao', 'persuasao'],
  tool: 'smiths-tools',
  originFeat: 'alert',
  equipmentNote: 'Ferramentas e roupas de viagem.',
  equipmentGold: 32,
  personality: { traits: 'Detalhista\nPaciente', ideals: '', bonds: '', flaws: '' },
});
const aasimar = buildSpecies({
  id: 'aasimar',
  name: 'Aasimar',
  summary: '',
  description: 'Tocado pelos planos celestiais.',
  creatureType: '',
  sizes: ['Médio', 'Pequeno'],
  speed: 30,
  darkvision: 60,
  traits: [{ name: 'Mãos Curativas', text: 'Texto do grupo.', plain: 'Cura com as mãos.' }],
});

describe('conteúdo próprio', () => {
  it('formulários geram opções válidas que completam os stubs', () => {
    const pack = {
      ...EMPTY_PACK,
      subclasses: [zealot],
      backgrounds: [craftsman],
      species: [aasimar],
    };
    expect(checkPack(pack, srdContent)).toEqual({ pack, errors: [] });
    const merged = mergeContent(srdContent, pack);
    expect(merged.stubs.some((s) => s.id === 'caminho-do-fanatico')).toBe(false);
    expect(merged.stubs.length).toBe(srdContent.stubs.length - 3);
    expect(zealot.features[0]).toMatchObject({ plain: 'Texto do grupo.', level: 3 });
    expect(craftsman.personality.traits).toEqual(['Detalhista', 'Paciente']);
    expect(craftsman.personality.ideals).toHaveLength(1);
    // A visão no escuro vira efeito e aparece na ficha.
    const c = makeCharacter({ speciesId: 'aasimar', size: 'Médio' });
    expect(derive(c, merged).darkvision).toBe(60);
  });

  it('pacote vazio não muda nada', () => {
    expect(mergeContent(srdContent, EMPTY_PACK)).toBe(srdContent);
    expect(packSize(EMPTY_PACK)).toBe(0);
  });

  it('erros claros: formato, id do SRD e referência quebrada', () => {
    expect(checkPack({ subclasses: 'x' }, srdContent).errors[0]).toContain('subclasses');
    const clash = { ...EMPTY_PACK, backgrounds: [{ ...craftsman, id: 'soldier' }] };
    expect(checkPack(clash, srdContent).errors[0]).toContain('já é do SRD');
    const orphan = { ...EMPTY_PACK, subclasses: [{ ...zealot, classId: 'nao-existe' }] };
    expect(checkPack(orphan, srdContent).errors.join()).toContain('nao-existe');
  });

  it('ids e explicações automáticas', () => {
    expect(slugify('Caminho do Fanático!')).toBe('caminho-do-fanatico');
    expect(firstSentence('**Um.** Dois. Três.')).toBe('Um.');
    expect(firstSentence('Sem ponto')).toBe('Sem ponto');
  });
});
