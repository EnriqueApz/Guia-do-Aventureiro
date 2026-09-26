export type Size = 'Minúsculo' | 'Pequeno' | 'Médio' | 'Grande' | 'Enorme' | 'Imenso';

const SIZES: Size[] = ['Minúsculo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Imenso'];
const MULTIPLIER: Record<Size, number> = {
  Minúsculo: 0.5,
  Pequeno: 1,
  Médio: 1,
  Grande: 2,
  Enorme: 4,
  Imenso: 8,
};

export function sizeUp(size: Size): Size {
  return SIZES[SIZES.indexOf(size) + 1] ?? size;
}

/** Capacidade de carga em libras: Força × 15 (ajustada pelo tamanho). */
export function carryingCapacity(strength: number, size: Size): number {
  return strength * 15 * MULTIPLIER[size];
}

/** Arrastar, levantar ou empurrar, em libras: Força × 30 (ajustada pelo tamanho). */
export function dragLiftPush(strength: number, size: Size): number {
  return strength * 30 * MULTIPLIER[size];
}

/** Peso das moedas: 50 moedas pesam 1 libra. */
export function coinWeight(coins: Record<string, number>): number {
  const total = Object.values(coins).reduce((a, b) => a + b, 0);
  return total / 50;
}

export function lbToKg(lb: number): number {
  return Math.round(lb * 0.5 * 10) / 10;
}

/** 5 pés = 1,5 metro (convenção da edição brasileira). */
export function feetToMeters(ft: number): number {
  return Math.round((ft / 5) * 1.5 * 10) / 10;
}

export function formatMeters(ft: number): string {
  return `${feetToMeters(ft).toLocaleString('pt-BR')} m`;
}

export function formatKg(lb: number): string {
  return `${lbToKg(lb).toLocaleString('pt-BR')} kg`;
}
