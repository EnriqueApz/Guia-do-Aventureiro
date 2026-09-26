import { content } from '@/content';
import { armorClass } from '../armor';
import { isWeaponProficient, unarmedStrike, weaponAttack } from '../attacks';
import {
  carryingCapacity,
  coinWeight,
  dragLiftPush,
  feetToMeters,
  formatKg,
  formatMeters,
  lbToKg,
  sizeUp,
} from '../encumbrance';
import { columnValue, evaluateFormula } from '../formula';
import { maxHitPoints } from '../hp';
import { proficiencyBonus } from '../proficiency';
import {
  cantripDiceMultiplier,
  highestSlotLevel,
  PACT_SLOTS,
  spellAttackBonus,
  spellSaveDc,
  spellSlots,
} from '../spellcasting';

const item = (id: string) => content.items.find((i) => i.id === id)!;
const cls = (id: string) => content.classes.find((c) => c.id === id)!;
const mods = (m: Partial<Record<'for' | 'des' | 'con' | 'int' | 'sab' | 'car', number>>) => ({
  for: 0,
  des: 0,
  con: 0,
  int: 0,
  sab: 0,
  car: 0,
  ...m,
});

describe('bônus de proficiência', () => {
  it('segue a tabela por nível', () => {
    const expected = [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6];
    expect(expected.map((_, i) => proficiencyBonus(i + 1))).toEqual(expected);
  });
  it('rejeita níveis inválidos', () => {
    expect(() => proficiencyBonus(0)).toThrow(RangeError);
    expect(() => proficiencyBonus(21)).toThrow(RangeError);
    expect(() => proficiencyBonus(2.5)).toThrow(RangeError);
  });
});

describe('pontos de vida', () => {
  it('nível 1: máximo do dado + CON', () => {
    expect(maxHitPoints({ hitDie: 8, level: 1, conModifier: 2, method: 'media' }).max).toBe(10);
  });
  it('níveis seguintes usam a média fixa', () => {
    // Guerreiro 5, CON +2: 10+2 + 4×(6+2) = 44
    expect(maxHitPoints({ hitDie: 10, level: 5, conModifier: 2, method: 'media' }).max).toBe(44);
  });
  it('usa as rolagens quando o método é rolagem', () => {
    // Mago 3, CON +1, rolou 2 e 6: 6+1 + (2+1) + (6+1) = 17
    expect(
      maxHitPoints({
        hitDie: 6,
        level: 3,
        conModifier: 1,
        method: 'rolagem',
        rolls: { 2: 2, 3: 6 },
      }).max,
    ).toBe(17);
  });
  it('rolagem ausente num nível cai na média', () => {
    expect(
      maxHitPoints({ hitDie: 6, level: 2, conModifier: 0, method: 'rolagem', rolls: {} }).max,
    ).toBe(10);
  });
  it('soma PV extras por nível e mostra de onde vêm', () => {
    const hp = maxHitPoints({
      hitDie: 8,
      level: 5,
      conModifier: 2,
      method: 'media',
      bonusPerLevel: 1,
    });
    expect(hp.max).toBe(43);
    expect(hp.parts).toContainEqual({ label: 'Traços e características', value: 5 });
  });
  it('cada nível vale pelo menos 1 PV, mesmo com CON negativa', () => {
    expect(
      maxHitPoints({
        hitDie: 6,
        level: 3,
        conModifier: -5,
        method: 'rolagem',
        rolls: { 2: 1, 3: 1 },
      }).max,
    ).toBe(3);
  });
  it('rejeita rolagens e níveis inválidos', () => {
    expect(() =>
      maxHitPoints({ hitDie: 6, level: 2, conModifier: 0, method: 'rolagem', rolls: { 2: 7 } }),
    ).toThrow(RangeError);
    expect(() => maxHitPoints({ hitDie: 6, level: 0, conModifier: 0, method: 'media' })).toThrow(
      RangeError,
    );
  });
});

describe('classe de armadura', () => {
  it('sem armadura: 10 + DES', () => {
    expect(armorClass({ modifiers: mods({ des: 3 }), unarmored: [] }).value).toBe(13);
  });
  it('armadura leve soma toda a DES; média até +2; pesada não soma', () => {
    expect(
      armorClass({ modifiers: mods({ des: 4 }), armor: item('leather-armor'), unarmored: [] })
        .value,
    ).toBe(15);
    expect(
      armorClass({ modifiers: mods({ des: 4 }), armor: item('chain-shirt'), unarmored: [] }).value,
    ).toBe(15);
    expect(
      armorClass({ modifiers: mods({ des: 4 }), armor: item('chain-mail'), unarmored: [] }).value,
    ).toBe(16);
  });
  it('escudo soma +2 e Defesa soma +1 só com armadura', () => {
    const r = armorClass({
      modifiers: mods({ des: 1 }),
      armor: item('chain-mail'),
      shield: item('shield'),
      unarmored: [],
      armoredBonus: 1,
    });
    expect(r.value).toBe(19);
    expect(armorClass({ modifiers: mods({ des: 1 }), unarmored: [], armoredBonus: 1 }).value).toBe(
      11,
    );
  });
  it('escolhe a melhor Defesa sem Armadura e respeita a regra do escudo', () => {
    const barbarian = {
      base: 10,
      abilities: ['des', 'con'] as const,
      allowShield: true,
      source: 'Bárbaro',
    };
    const monk = {
      base: 10,
      abilities: ['des', 'sab'] as const,
      allowShield: false,
      source: 'Monge',
    };
    const m = mods({ des: 2, con: 3, sab: 1 });
    expect(
      armorClass({
        modifiers: m,
        unarmored: [{ ...barbarian, abilities: [...barbarian.abilities] }],
      }).value,
    ).toBe(15);
    expect(
      armorClass({
        modifiers: m,
        shield: item('shield'),
        unarmored: [{ ...barbarian, abilities: [...barbarian.abilities] }],
      }).value,
    ).toBe(17);
    // Monge com escudo perde a Defesa sem Armadura: 10 + 2 + 2 (escudo)
    expect(
      armorClass({
        modifiers: m,
        shield: item('shield'),
        unarmored: [{ ...monk, abilities: [...monk.abilities] }],
      }).value,
    ).toBe(14);
    expect(armorClass({ modifiers: m, unarmored: [], flatBonus: 1 }).value).toBe(13);
  });
});

describe('espaços de magia', () => {
  it('conjurador completo nos níveis 1, 5 e 20', () => {
    expect(spellSlots('completa', 1)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(spellSlots('completa', 5)).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
    expect(spellSlots('completa', 20)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
  });
  it('meio-conjurador (2024) já tem espaços no nível 1', () => {
    expect(spellSlots('meia', 1)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(spellSlots('meia', 5)).toEqual([4, 2, 0, 0, 0, 0, 0, 0, 0]);
    expect(spellSlots('meia', 20)).toEqual([4, 3, 3, 3, 2, 0, 0, 0, 0]);
  });
  it('Magia de Pacto: poucos espaços do mesmo círculo', () => {
    expect(spellSlots('pacto', 1)).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(spellSlots('pacto', 5)).toEqual([0, 0, 2, 0, 0, 0, 0, 0, 0]);
    expect(spellSlots('pacto', 20)).toEqual([0, 0, 0, 0, 4, 0, 0, 0, 0]);
    expect(PACT_SLOTS).toHaveLength(20);
  });
  it('rejeita níveis fora de 1–20', () => {
    expect(() => spellSlots('completa', 0)).toThrow(RangeError);
    expect(() => cantripDiceMultiplier(21)).toThrow(RangeError);
  });
  it('a tabela de cada classe conjuradora bate com as regras', () => {
    for (const c of content.classes) {
      if (!c.spellcasting) continue;
      for (let level = 1; level <= 20; level++) {
        expect({ classe: c.id, level, slots: c.spellcasting.slots[level - 1] }).toEqual({
          classe: c.id,
          level,
          slots: spellSlots(c.spellcasting.progression, level),
        });
      }
    }
  });
  it('maior círculo disponível', () => {
    expect(highestSlotLevel(spellSlots('completa', 5))).toBe(3);
    expect(highestSlotLevel([0, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(0);
  });
  it('CD e ataque de magia', () => {
    expect(spellSaveDc(3, 2)).toBe(13);
    expect(spellAttackBonus(3, 2)).toBe(5);
  });
  it('truques crescem nos níveis 5, 11 e 17', () => {
    expect([1, 4, 5, 10, 11, 16, 17, 20].map(cantripDiceMultiplier)).toEqual([
      1, 1, 2, 2, 3, 3, 4, 4,
    ]);
  });
});

describe('carga e unidades', () => {
  it('capacidade de carga é Força × 15, dobrando para Grande', () => {
    expect(carryingCapacity(10, 'Médio')).toBe(150);
    expect(carryingCapacity(10, 'Pequeno')).toBe(150);
    expect(carryingCapacity(16, sizeUp('Médio'))).toBe(480);
    expect(carryingCapacity(10, 'Minúsculo')).toBe(75);
    expect(dragLiftPush(10, 'Médio')).toBe(300);
    expect(sizeUp('Imenso')).toBe('Imenso');
  });
  it('50 moedas pesam 1 libra', () => {
    expect(coinWeight({ po: 40, pp: 10, pc: 0 })).toBe(1);
  });
  it('converte para metros e quilos', () => {
    expect(feetToMeters(30)).toBe(9);
    expect(feetToMeters(35)).toBe(10.5);
    expect(lbToKg(55)).toBe(27.5);
    expect(formatMeters(35)).toBe('10,5 m');
    expect(formatKg(3)).toBe('1,5 kg');
  });
});

describe('fórmulas', () => {
  const ctx = {
    level: 5,
    proficiencyBonus: 3,
    modifiers: mods({ car: -1, sab: 3 }),
    classDef: cls('barbarian'),
  };
  it('avalia cada tipo de fórmula', () => {
    expect(evaluateFormula(2, ctx)).toBe(2);
    expect(evaluateFormula({ kind: 'proficiencia' }, ctx)).toBe(3);
    expect(evaluateFormula({ kind: 'modificador', ability: 'sab' }, ctx)).toBe(3);
    expect(evaluateFormula({ kind: 'modificador', ability: 'car', min: 1 }, ctx)).toBe(1);
    expect(evaluateFormula({ kind: 'nivel', multiplier: 5 }, ctx)).toBe(25);
    expect(evaluateFormula({ kind: 'nivel' }, ctx)).toBe(5);
    expect(evaluateFormula({ kind: 'coluna', column: 'furias' }, ctx)).toBe(3);
    expect(evaluateFormula({ kind: 'coluna', column: 'nao-existe' }, ctx)).toBe(0);
    expect(
      evaluateFormula({ kind: 'por-nivel', values: Array.from({ length: 20 }, (_, i) => i) }, ctx),
    ).toBe(4);
  });
  it('lê colunas da tabela da classe', () => {
    expect(columnValue(cls('rogue'), 'ataque-furtivo', 5)).toBe('3d6');
    expect(columnValue(undefined, 'x', 1)).toBeNull();
  });
});

describe('ataques', () => {
  it('proficiência com armas por grupo, propriedade e arma específica', () => {
    expect(isWeaponProficient(item('mace'), ['simples'])).toBe(true);
    expect(isWeaponProficient(item('longsword'), ['simples'])).toBe(false);
    expect(isWeaponProficient(item('longsword'), ['marciais'])).toBe(true);
    expect(isWeaponProficient(item('shortsword'), ['marciais:acuidade|leve'])).toBe(true);
    expect(isWeaponProficient(item('longsword'), ['marciais:acuidade|leve'])).toBe(false);
    expect(isWeaponProficient(item('longsword'), ['arma:longsword'])).toBe(true);
    expect(isWeaponProficient(item('shield'), ['simples'])).toBe(false);
    expect(isWeaponProficient(item('mace'), ['desconhecido'])).toBe(false);
  });
  it('acuidade usa o melhor entre FOR e DES; à distância usa DES', () => {
    const m = mods({ for: -1, des: 4 });
    expect(
      weaponAttack({ item: item('dagger'), modifiers: m, proficiencyBonus: 2, proficient: true }),
    ).toMatchObject({
      ability: 'des',
      attackBonus: 6,
      damage: '1d4+4',
    });
    expect(
      weaponAttack({
        item: item('shortbow'),
        modifiers: m,
        proficiencyBonus: 2,
        proficient: true,
        rangedBonus: 2,
      }),
    ).toMatchObject({
      ability: 'des',
      attackBonus: 8,
      damage: '1d6+4',
      range: [80, 320],
    });
    expect(
      weaponAttack({
        item: item('quarterstaff'),
        modifiers: m,
        proficiencyBonus: 2,
        proficient: false,
      }),
    ).toMatchObject({
      ability: 'for',
      attackBonus: -1,
      damage: '1d6−1',
      versatileDamage: '1d8−1',
    });
  });
  it('mostra a maestria só das armas escolhidas', () => {
    const base = {
      item: item('greatsword'),
      modifiers: mods({ for: 3 }),
      proficiencyBonus: 2,
      proficient: true,
    };
    expect(weaponAttack({ ...base, masteries: ['greatsword'] }).mastery).toBe('raspar');
    expect(weaponAttack(base).mastery).toBeUndefined();
  });
  it('arma de monge usa o dado de Artes Marciais quando é maior', () => {
    const r = weaponAttack({
      item: item('dagger'),
      modifiers: mods({ des: 3 }),
      proficiencyBonus: 2,
      proficient: true,
      martialArtsDie: 6,
    });
    expect(r.damage).toBe('1d6+3');
  });
  it('rejeita itens que não são armas', () => {
    expect(() =>
      weaponAttack({
        item: item('shield'),
        modifiers: mods({}),
        proficiencyBonus: 2,
        proficient: true,
      }),
    ).toThrow();
  });
  it('Ataque Desarmado: 1 + FOR, ou dado de Artes Marciais', () => {
    expect(unarmedStrike(mods({ for: 3 }), 2)).toMatchObject({ attackBonus: 5, damage: '4' });
    expect(unarmedStrike(mods({ for: -2 }), 2).damage).toBe('0');
    expect(unarmedStrike(mods({ for: 0, des: 3 }), 2, 6)).toMatchObject({
      ability: 'des',
      damage: '1d6+3',
    });
  });
});
