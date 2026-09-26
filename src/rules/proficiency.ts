/** Bônus de Proficiência por nível de personagem: +2 (1–4) até +6 (17–20). */
export function proficiencyBonus(level: number): number {
  if (level < 1 || level > 20 || !Number.isInteger(level)) {
    throw new RangeError(`Nível deve ser um inteiro de 1 a 20 (recebi ${level}).`);
  }
  return Math.ceil(level / 4) + 1;
}
