import type { PlayState } from '@/model/character';
import type { Sheet } from './derive';

/** Estado de jogo com os valores atuais resolvidos (PV nulo = cheio). */
export function currentHp(play: PlayState, sheet: Sheet): number {
  return play.hpCurrent ?? sheet.hp.max;
}

export interface ShortRestInput {
  /** Resultados dos Dados de Vida gastos (só os dados; a CON é somada aqui). */
  hitDiceRolls: number[];
}

/**
 * Descanso Curto: gasta Dados de Vida para curar (dado + CON, mínimo 0 por dado),
 * recupera usos que voltam em Descanso Curto e os espaços de Magia de Pacto.
 */
export function shortRest(play: PlayState, sheet: Sheet, input: ShortRestInput): PlayState {
  const available = sheet.hitDice.total - play.hitDiceUsed;
  if (input.hitDiceRolls.length > available) {
    throw new RangeError(`Você só tem ${available} Dado(s) de Vida disponível(is).`);
  }
  const con = sheet.abilities.con.modifier;
  const healed = input.hitDiceRolls.reduce((sum, r) => sum + Math.max(0, r + con), 0);
  const hp = Math.min(sheet.hp.max, currentHp(play, sheet) + healed);

  const shortRecharge = new Set(
    sheet.features.filter((f) => f.uses?.recharge === 'descanso-curto').map((f) => f.id),
  );
  const resourcesUsed = Object.fromEntries(
    Object.entries(play.resourcesUsed).filter(([id]) => !shortRecharge.has(id)),
  );
  const slotsUsed = sheet.spellcasting?.pact ? play.slotsUsed.map(() => 0) : [...play.slotsUsed];

  return {
    ...play,
    hpCurrent: hp >= sheet.hp.max ? null : hp,
    hitDiceUsed: play.hitDiceUsed + input.hitDiceRolls.length,
    resourcesUsed,
    slotsUsed,
  };
}

/**
 * Descanso Longo: PV cheios, PV temporários zerados, todos os Dados de Vida,
 * espaços e usos recuperados, e 1 nível de Exaustão a menos.
 */
export function longRest(play: PlayState): PlayState {
  return {
    ...play,
    hpCurrent: null,
    hpTemp: 0,
    hitDiceUsed: 0,
    slotsUsed: play.slotsUsed.map(() => 0),
    resourcesUsed: {},
    exhaustion: Math.max(0, play.exhaustion - 1),
    deathSaves: { successes: 0, failures: 0 },
  };
}

/** Aplica dano: primeiro nos PV temporários, depois nos PV. */
export function applyDamage(play: PlayState, sheet: Sheet, amount: number): PlayState {
  if (amount < 0) throw new RangeError('Dano não pode ser negativo.');
  const fromTemp = Math.min(play.hpTemp, amount);
  const rest = amount - fromTemp;
  const hp = Math.max(0, currentHp(play, sheet) - rest);
  return { ...play, hpTemp: play.hpTemp - fromTemp, hpCurrent: hp };
}

/** Cura, sem passar do máximo. Curar alguém com 0 PV zera as salvaguardas contra a morte. */
export function applyHealing(play: PlayState, sheet: Sheet, amount: number): PlayState {
  if (amount < 0) throw new RangeError('Cura não pode ser negativa.');
  const before = currentHp(play, sheet);
  const hp = Math.min(sheet.hp.max, before + amount);
  return {
    ...play,
    hpCurrent: hp >= sheet.hp.max ? null : hp,
    ...(before === 0 && amount > 0 && { deathSaves: { successes: 0, failures: 0 } }),
  };
}

/** PV temporários não se somam: fica o maior valor. */
export function gainTempHp(play: PlayState, amount: number): PlayState {
  return { ...play, hpTemp: Math.max(play.hpTemp, amount) };
}

export type DeathSaveOutcome = 'continua' | 'estavel' | 'morto' | 'recuperou';

/** Salvaguarda contra a morte: 10+ sucesso, 20 volta com 1 PV, 1 conta como duas falhas. */
export function deathSave(
  play: PlayState,
  d20: number,
): { play: PlayState; outcome: DeathSaveOutcome } {
  if (d20 === 20) {
    return {
      play: { ...play, hpCurrent: 1, deathSaves: { successes: 0, failures: 0 } },
      outcome: 'recuperou',
    };
  }
  const { successes, failures } = play.deathSaves;
  const next =
    d20 >= 10
      ? { successes: successes + 1, failures }
      : { successes, failures: failures + (d20 === 1 ? 2 : 1) };
  const outcome: DeathSaveOutcome =
    next.failures >= 3 ? 'morto' : next.successes >= 3 ? 'estavel' : 'continua';
  return { play: { ...play, deathSaves: next }, outcome };
}
