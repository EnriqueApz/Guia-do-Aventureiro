import { fixedHitDieValue } from './dice';

export interface HpInput {
  hitDie: number;
  /** Multiclasse: dado de vida de cada nível, em ordem (substitui `hitDie`). */
  hitDiceByLevel?: number[];
  level: number;
  conModifier: number;
  method: 'media' | 'rolagem';
  /** Resultados rolados por nível (do 2 em diante). Níveis sem rolagem usam a média. */
  rolls?: Record<number, number>;
  /** PV extras por nível (Robustez Anã, Resiliência Dracônica...). */
  bonusPerLevel?: number;
}

export interface HpBreakdown {
  max: number;
  parts: { label: string; value: number }[];
}

/**
 * PV máximos: no nível 1, o valor máximo do dado de vida + CON;
 * a cada nível seguinte, a média fixa (ou a rolagem) + CON. Mínimo de 1 por nível.
 */
export function maxHitPoints(input: HpInput): HpBreakdown {
  const { hitDie, level, conModifier, method, rolls = {}, bonusPerLevel = 0 } = input;
  if (level < 1 || level > 20) throw new RangeError(`Nível deve ser de 1 a 20 (recebi ${level}).`);
  const dieAt = (l: number) => input.hitDiceByLevel?.[l - 1] ?? hitDie;
  let dice = 0;
  let con = 0;
  for (let l = 1; l <= level; l++) {
    const size = dieAt(l);
    const rolled = l > 1 && method === 'rolagem' ? rolls[l] : undefined;
    if (rolled !== undefined && (rolled < 1 || rolled > size || !Number.isInteger(rolled))) {
      throw new RangeError(`Rolagem de PV inválida no nível ${l}: ${rolled} (d${size}).`);
    }
    const die = l === 1 ? size : (rolled ?? fixedHitDieValue(size));
    dice += die;
    // Constituição negativa nunca deixa um nível valer menos de 1 PV.
    con += Math.max(conModifier, 1 - die);
  }
  const bonus = bonusPerLevel * level;
  const sizes = [...new Set(Array.from({ length: level }, (_, i) => dieAt(i + 1)))];
  const parts = [
    { label: `Dados de vida (${sizes.map((d) => `d${d}`).join(', ')})`, value: dice },
    { label: 'Constituição', value: con },
  ];
  if (bonus) parts.push({ label: 'Traços e características', value: bonus });
  return { max: dice + con + bonus, parts };
}
