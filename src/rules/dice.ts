/** Dados e rolagens. O gerador aleatório é injetável para os testes serem determinísticos. */

/** Retorna um número em [0, 1). */
export type Rng = () => number;

export const defaultRng: Rng = () => {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return (buf[0] ?? 0) / 2 ** 32;
  }
  return Math.random();
};

export function rollDie(sides: number, rng: Rng = defaultRng): number {
  return Math.floor(rng() * sides) + 1;
}

export interface DiceExpression {
  count: number;
  sides: number;
  modifier: number;
}

/** Interpreta "2d6+3", "1d8", "d20", "4" ou "1d4 - 1". */
export function parseDice(expr: string): DiceExpression {
  const clean = expr.replace(/\s+/g, '').toLowerCase();
  const match = /^(?:(\d*)d(\d+))?([+-]\d+)?$/.exec(clean);
  const flat = /^[+-]?\d+$/.test(clean);
  if (flat) return { count: 0, sides: 0, modifier: Number(clean) };
  if (!match || (!match[2] && !match[3])) throw new Error(`Expressão de dados inválida: "${expr}"`);
  return {
    count: match[2] ? Number(match[1] || 1) : 0,
    sides: match[2] ? Number(match[2]) : 0,
    modifier: match[3] ? Number(match[3]) : 0,
  };
}

export function formatDice({ count, sides, modifier }: DiceExpression): string {
  const dice = count > 0 ? `${count}d${sides}` : '';
  if (!modifier) return dice || '0';
  if (!dice) return String(modifier);
  return `${dice}${modifier > 0 ? '+' : '−'}${Math.abs(modifier)}`;
}

export interface RollResult {
  total: number;
  rolls: number[];
  modifier: number;
}

export function roll(expr: string | DiceExpression, rng: Rng = defaultRng): RollResult {
  const e = typeof expr === 'string' ? parseDice(expr) : expr;
  const rolls = Array.from({ length: e.count }, () => rollDie(e.sides, rng));
  return { total: rolls.reduce((a, b) => a + b, 0) + e.modifier, rolls, modifier: e.modifier };
}

export type RollMode = 'normal' | 'vantagem' | 'desvantagem';

export interface D20Result {
  total: number;
  kept: number;
  rolls: number[];
  modifier: number;
  natural20: boolean;
  natural1: boolean;
}

/** Teste de d20 com Vantagem/Desvantagem. */
export function rollD20(
  modifier: number,
  mode: RollMode = 'normal',
  rng: Rng = defaultRng,
): D20Result {
  const rolls = mode === 'normal' ? [rollDie(20, rng)] : [rollDie(20, rng), rollDie(20, rng)];
  const kept = mode === 'vantagem' ? Math.max(...rolls) : Math.min(...rolls);
  return {
    total: kept + modifier,
    kept,
    rolls,
    modifier,
    natural20: kept === 20,
    natural1: kept === 1,
  };
}

/** Média arredondada para cima usada nos PV por nível: d8 → 5. */
export function fixedHitDieValue(sides: number): number {
  return sides / 2 + 1;
}
