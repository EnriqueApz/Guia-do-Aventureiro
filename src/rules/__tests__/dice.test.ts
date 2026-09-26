import {
  fixedHitDieValue,
  formatDice,
  parseDice,
  roll,
  rollD20,
  rollDie,
  defaultRng,
} from '../dice';
import { diceRng } from './helpers';

describe('dados', () => {
  it('interpreta expressões de dados', () => {
    expect(parseDice('2d6+3')).toEqual({ count: 2, sides: 6, modifier: 3 });
    expect(parseDice('d20')).toEqual({ count: 1, sides: 20, modifier: 0 });
    expect(parseDice('1d4 - 1')).toEqual({ count: 1, sides: 4, modifier: -1 });
    expect(parseDice('4')).toEqual({ count: 0, sides: 0, modifier: 4 });
    expect(parseDice('+2')).toEqual({ count: 0, sides: 0, modifier: 2 });
    expect(() => parseDice('banana')).toThrow(/inválida/);
    expect(() => parseDice('')).toThrow(/inválida/);
  });

  it('formata expressões de dados', () => {
    expect(formatDice({ count: 1, sides: 8, modifier: 3 })).toBe('1d8+3');
    expect(formatDice({ count: 1, sides: 6, modifier: -1 })).toBe('1d6−1');
    expect(formatDice({ count: 2, sides: 6, modifier: 0 })).toBe('2d6');
    expect(formatDice({ count: 0, sides: 0, modifier: 5 })).toBe('5');
    expect(formatDice({ count: 0, sides: 0, modifier: 0 })).toBe('0');
  });

  it('rola dados com gerador controlado', () => {
    expect(rollDie(6, diceRng(6, [4]))).toBe(4);
    expect(roll('2d6+3', diceRng(6, [2, 5]))).toEqual({ total: 10, rolls: [2, 5], modifier: 3 });
  });

  it('rola d20 com vantagem e desvantagem', () => {
    expect(rollD20(5, 'normal', diceRng(20, [12]))).toMatchObject({
      total: 17,
      kept: 12,
      rolls: [12],
    });
    expect(rollD20(2, 'vantagem', diceRng(20, [4, 18]))).toMatchObject({ total: 20, kept: 18 });
    expect(rollD20(2, 'desvantagem', diceRng(20, [4, 18]))).toMatchObject({ total: 6, kept: 4 });
    expect(rollD20(0, 'normal', diceRng(20, [20])).natural20).toBe(true);
    expect(rollD20(0, 'normal', diceRng(20, [1])).natural1).toBe(true);
  });

  it('o gerador padrão fica entre 0 e 1 e os dados nos limites', () => {
    for (let i = 0; i < 200; i++) {
      const r = defaultRng();
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
      const d = rollDie(20);
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(20);
    }
  });

  it('usa Math.random quando não há crypto', () => {
    const original = globalThis.crypto;
    vi.stubGlobal('crypto', undefined);
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.25);
    expect(defaultRng()).toBe(0.25);
    spy.mockRestore();
    vi.stubGlobal('crypto', original);
  });

  it('valor fixo do dado de vida é a média arredondada para cima', () => {
    expect([6, 8, 10, 12].map(fixedHitDieValue)).toEqual([4, 5, 6, 7]);
  });
});
