import type { Rng } from '../dice';

/** RNG que produz, em sequência, os resultados de dado pedidos (para um dado de `sides` lados). */
export function diceRng(sides: number, results: number[]): Rng {
  let i = 0;
  return () => {
    const r = results[i++ % results.length]!;
    return (r - 1) / sides + 0.5 / sides;
  };
}
