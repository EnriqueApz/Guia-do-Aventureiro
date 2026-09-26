import {
  abilityModifier,
  canChangePointBuy,
  formatModifier,
  isStandardArray,
  isValidAsi,
  isValidBackgroundBonus,
  pointBuyCost,
  pointBuySpent,
  roll4d6DropLowest,
} from '../abilities';
import { diceRng } from './helpers';

const scores = (v: number[]) => ({
  for: v[0]!,
  des: v[1]!,
  con: v[2]!,
  int: v[3]!,
  sab: v[4]!,
  car: v[5]!,
});

describe('atributos', () => {
  it('calcula modificadores', () => {
    const table: [number, number][] = [
      [1, -5],
      [3, -4],
      [8, -1],
      [9, -1],
      [10, 0],
      [11, 0],
      [12, 1],
      [15, 2],
      [17, 3],
      [20, 5],
      [30, 10],
    ];
    for (const [score, mod] of table) expect(abilityModifier(score)).toBe(mod);
  });

  it('formata modificadores com sinal', () => {
    expect(formatModifier(3)).toBe('+3');
    expect(formatModifier(0)).toBe('+0');
    expect(formatModifier(-1)).toBe('−1');
  });

  it('reconhece o array padrão em qualquer ordem', () => {
    expect(isStandardArray(scores([8, 10, 12, 13, 14, 15]))).toBe(true);
    expect(isStandardArray(scores([15, 15, 12, 13, 14, 8]))).toBe(false);
  });

  it('compra de pontos: custos e orçamento de 27', () => {
    expect([8, 9, 10, 11, 12, 13, 14, 15].map(pointBuyCost)).toEqual([0, 1, 2, 3, 4, 5, 7, 9]);
    expect(() => pointBuyCost(16)).toThrow(RangeError);
    expect(pointBuySpent(scores([15, 15, 15, 8, 8, 8]))).toBe(27);
    expect(pointBuySpent(scores([13, 13, 13, 12, 12, 12]))).toBe(27);
    const base = scores([15, 15, 15, 8, 8, 8]);
    expect(canChangePointBuy(base, 'int', 1)).toBe(false); // estouraria o orçamento
    expect(canChangePointBuy(base, 'for', -1)).toBe(true);
    expect(canChangePointBuy(base, 'for', 1)).toBe(false); // acima de 15
    expect(canChangePointBuy(base, 'int', -1)).toBe(false); // abaixo de 8
  });

  it('rola 4d6 e descarta o menor', () => {
    const r = roll4d6DropLowest(diceRng(6, [3, 6, 1, 5]));
    expect(r).toEqual({ dice: [3, 6, 1, 5], dropped: 1, total: 14 });
  });

  it('valida o aumento do antecedente', () => {
    const opts = ['int', 'sab', 'car'] as const;
    expect(isValidBackgroundBonus({ sab: 2, car: 1 }, opts)).toBe(true);
    expect(isValidBackgroundBonus({ int: 1, sab: 1, car: 1 }, opts)).toBe(true);
    expect(isValidBackgroundBonus({ sab: 2, for: 1 }, opts)).toBe(false);
    expect(isValidBackgroundBonus({ sab: 3 }, opts)).toBe(false);
    expect(isValidBackgroundBonus({ sab: 2, car: 2 }, opts)).toBe(false);
    expect(isValidBackgroundBonus({}, opts)).toBe(false);
  });

  it('valida o Aumento no Valor de Atributo', () => {
    expect(isValidAsi({ for: 2 })).toBe(true);
    expect(isValidAsi({ for: 1, con: 1 })).toBe(true);
    expect(isValidAsi({ for: 1 })).toBe(false);
    expect(isValidAsi({ for: 2, con: 1 })).toBe(false);
  });
});
