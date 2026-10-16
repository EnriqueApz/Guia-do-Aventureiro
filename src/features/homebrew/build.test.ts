import { srdContent } from '@/content';
import {
  checkPack,
  EMPTY_PACK,
  firstSentence,
  mergeContent,
  mergePacks,
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

  it('juntar pacotes mantém o que o jogador tinha e atualiza o que chega', () => {
    const mine = { ...EMPTY_PACK, backgrounds: [craftsman], subclasses: [zealot] };
    const renamed = { ...zealot, name: 'Caminho do Fanático (Mestre)' };
    const master = { ...EMPTY_PACK, name: 'Mesa de sexta', subclasses: [renamed] };
    const merged = mergePacks(mine, master);
    expect(merged.name).toBe('Mesa de sexta');
    expect(merged.backgrounds).toEqual([craftsman]);
    expect(merged.subclasses).toEqual([renamed]);
    expect(mergePacks(EMPTY_PACK, EMPTY_PACK)).toEqual(EMPTY_PACK);
  });

  it('pacote pode trazer uma classe inteira, com subclasse própria', () => {
    const fighter = srdContent.classes.find((c) => c.id === 'fighter')!;
    const duelist = {
      ...fighter,
      id: 'duelista',
      name: 'Duelista',
      source: { kind: 'homebrew' as const, ref: 'Anotações da mesa' },
    };
    const school = {
      ...zealot,
      id: 'escola-da-lamina',
      name: 'Escola da Lâmina',
      classId: 'duelista',
    };
    const pack = { ...EMPTY_PACK, classes: [duelist], subclasses: [school] };
    const checked = checkPack(pack, srdContent);
    expect(checked.errors).toEqual([]);
    expect(packSize(pack)).toBe(2);
    const merged = mergeContent(srdContent, pack);
    expect(merged.classes.at(-1)?.name).toBe('Duelista');
    const c = makeCharacter({ classId: 'duelista', subclassId: 'escola-da-lamina', level: 5 });
    expect(derive(c, merged).hp.max).toBeGreaterThan(0);
    // Classe com id do SRD é recusada.
    const clash = { ...EMPTY_PACK, classes: [{ ...duelist, id: 'fighter' }] };
    expect(checkPack(clash, srdContent).errors[0]).toContain('já é do SRD');
    // Juntar pacotes também junta classes.
    expect(mergePacks(EMPTY_PACK, pack).classes).toEqual([duelist]);
  });

  it('ids e explicações automáticas', () => {
    expect(slugify('Caminho do Fanático!')).toBe('caminho-do-fanatico');
    expect(firstSentence('**Um.** Dois. Três.')).toBe('Um.');
    expect(firstSentence('Sem ponto')).toBe('Sem ponto');
  });
});
