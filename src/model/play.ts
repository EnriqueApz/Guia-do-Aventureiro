/**
 * Edições do modo jogo: funções puras sobre `PlayState`. As regras de dano, cura
 * e descanso ficam em `@/rules/rest`; aqui ficam os marcadores da mesa.
 */
import type { Character, PlayState } from './character';

export const MAX_EXHAUSTION = 6;

/** Aplica uma edição no estado de jogo do personagem. */
export function editPlay(c: Character, fn: (p: PlayState) => PlayState): Character {
  const play = fn(c.play);
  return play === c.play ? c : { ...c, play };
}

/** Define quantos espaços de um círculo (índice 0 = 1º) já foram gastos. */
export function setSlotsUsed(
  play: PlayState,
  circle: number,
  used: number,
  total: number,
): PlayState {
  const slotsUsed = [...play.slotsUsed];
  while (slotsUsed.length < 9) slotsUsed.push(0);
  slotsUsed[circle] = Math.min(total, Math.max(0, Math.round(used)));
  return { ...play, slotsUsed };
}

/** Define quantos usos de um recurso (Fúria, Retomar o Fôlego...) já foram gastos. */
export function setResourceUsed(play: PlayState, id: string, used: number, max: number): PlayState {
  const n = Math.min(max, Math.max(0, Math.round(used)));
  const { [id]: _old, ...rest } = play.resourcesUsed;
  return { ...play, resourcesUsed: n ? { ...rest, [id]: n } : rest };
}

export function toggleCondition(play: PlayState, id: string): PlayState {
  const on = play.conditions.includes(id);
  return {
    ...play,
    conditions: on ? play.conditions.filter((c) => c !== id) : [...play.conditions, id],
  };
}

export function setExhaustion(play: PlayState, level: number): PlayState {
  return { ...play, exhaustion: Math.min(MAX_EXHAUSTION, Math.max(0, Math.round(level))) };
}

export function setHeroicInspiration(play: PlayState, on: boolean): PlayState {
  return { ...play, heroicInspiration: on };
}

/** Marca manualmente sucessos/falhas nas salvaguardas contra a morte (0 a 3). */
export function setDeathSaves(play: PlayState, successes: number, failures: number): PlayState {
  const clamp = (n: number) => Math.min(3, Math.max(0, Math.round(n)));
  return { ...play, deathSaves: { successes: clamp(successes), failures: clamp(failures) } };
}

/** Estabilizado (3 sucessos ou Medicina): fica com 0 PV, mas para de rolar. */
export function isStable(play: PlayState): boolean {
  return play.deathSaves.successes >= 3 && play.deathSaves.failures < 3;
}

export function isDead(play: PlayState): boolean {
  return play.deathSaves.failures >= 3 || play.exhaustion >= MAX_EXHAUSTION;
}
