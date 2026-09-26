import { makeCharacter } from '@/test/characters';
import {
  editPlay,
  isDead,
  isStable,
  setDeathSaves,
  setExhaustion,
  setHeroicInspiration,
  setResourceUsed,
  setSlotsUsed,
  toggleCondition,
} from './play';

const play = makeCharacter({}).play;

describe('edições do modo jogo', () => {
  it('espaços de magia ficam entre 0 e o total', () => {
    expect(setSlotsUsed(play, 0, 2, 3).slotsUsed[0]).toBe(2);
    expect(setSlotsUsed(play, 0, 9, 3).slotsUsed[0]).toBe(3);
    expect(setSlotsUsed(play, 2, -1, 3).slotsUsed[2]).toBe(0);
    expect(setSlotsUsed({ ...play, slotsUsed: [] }, 4, 1, 2).slotsUsed).toHaveLength(9);
  });

  it('recursos: gastar, limitar e limpar', () => {
    let p = setResourceUsed(play, 'fighter-second-wind', 1, 2);
    expect(p.resourcesUsed).toEqual({ 'fighter-second-wind': 1 });
    p = setResourceUsed(p, 'fighter-second-wind', 5, 2);
    expect(p.resourcesUsed['fighter-second-wind']).toBe(2);
    expect(setResourceUsed(p, 'fighter-second-wind', 0, 2).resourcesUsed).toEqual({});
  });

  it('condições, exaustão e inspiração', () => {
    let p = toggleCondition(play, 'poisoned');
    expect(p.conditions).toEqual(['poisoned']);
    p = toggleCondition(p, 'poisoned');
    expect(p.conditions).toEqual([]);
    expect(setExhaustion(play, 9).exhaustion).toBe(6);
    expect(setExhaustion(play, -2).exhaustion).toBe(0);
    expect(isDead(setExhaustion(play, 6))).toBe(true);
    expect(setHeroicInspiration(play, true).heroicInspiration).toBe(true);
  });

  it('salvaguardas contra a morte manuais, estável e morto', () => {
    expect(setDeathSaves(play, 5, -1).deathSaves).toEqual({ successes: 3, failures: 0 });
    expect(isStable(setDeathSaves(play, 3, 1))).toBe(true);
    expect(isStable(setDeathSaves(play, 3, 3))).toBe(false);
    expect(isDead(setDeathSaves(play, 0, 3))).toBe(true);
    expect(isDead(play)).toBe(false);
  });

  it('editPlay só cria um novo personagem quando algo muda', () => {
    const c = makeCharacter({});
    expect(editPlay(c, (p) => p)).toBe(c);
    expect(editPlay(c, (p) => toggleCondition(p, 'prone')).play.conditions).toEqual(['prone']);
  });
});
