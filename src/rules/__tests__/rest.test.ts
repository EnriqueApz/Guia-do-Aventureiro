import type { PlayState } from '@/model/character';
import { content } from '@/content';
import { makeCharacter, thorin } from '@/test/characters';
import { derive } from '../derive';
import {
  applyDamage,
  applyHealing,
  currentHp,
  deathSave,
  gainTempHp,
  longRest,
  shortRest,
  takeDamage,
} from '../rest';

const sheetOf = (c = thorin(1)) => derive(c, content);

describe('modo jogo: dano, cura e descansos', () => {
  it('dano consome primeiro os PV temporários', () => {
    const sheet = sheetOf();
    let play = gainTempHp(thorin(1).play, 5);
    play = gainTempHp(play, 3); // não soma: fica o maior
    expect(play.hpTemp).toBe(5);
    play = applyDamage(play, sheet, 7);
    expect(play.hpTemp).toBe(0);
    expect(currentHp(play, sheet)).toBe(9);
    play = applyDamage(play, sheet, 50);
    expect(play.hpCurrent).toBe(0);
    expect(() => applyDamage(play, sheet, -1)).toThrow(RangeError);
  });

  it('cura não passa do máximo e zera as salvaguardas contra a morte', () => {
    const sheet = sheetOf();
    let play: PlayState = {
      ...thorin(1).play,
      hpCurrent: 0,
      deathSaves: { successes: 1, failures: 2 },
    };
    play = applyHealing(play, sheet, 4);
    expect(play.hpCurrent).toBe(4);
    expect(play.deathSaves).toEqual({ successes: 0, failures: 0 });
    play = applyHealing(play, sheet, 100);
    expect(play.hpCurrent).toBeNull();
    expect(currentHp(play, sheet)).toBe(11);
    expect(() => applyHealing(play, sheet, -2)).toThrow(RangeError);
  });

  it('descanso curto gasta Dados de Vida e recupera usos de descanso curto', () => {
    const c = makeCharacter({
      level: 3,
      classId: 'fighter',
      speciesId: 'orc',
      abilities: {
        method: 'manual',
        base: { for: 16, des: 12, con: 14, int: 8, sab: 10, car: 10 },
      },
    });
    const sheet = derive(c, content);
    const play = {
      ...c.play,
      hpCurrent: 5,
      resourcesUsed: { 'fighter-action-surge': 1, 'adrenaline-rush': 1, 'relentless-endurance': 1 },
    };
    const after = shortRest(play, sheet, { hitDiceRolls: [4, 1] });
    // 5 + (4+2) + (1+2) = 14
    expect(after.hpCurrent).toBe(14);
    expect(after.hitDiceUsed).toBe(2);
    expect(after.resourcesUsed).toEqual({ 'relentless-endurance': 1 });
    expect(() => shortRest(after, sheet, { hitDiceRolls: [1, 1] })).toThrow(/Dado\(s\) de Vida/);
    expect(
      shortRest({ ...play, hpCurrent: 30 }, sheet, { hitDiceRolls: [10] }).hpCurrent,
    ).toBeNull();
  });

  it('descanso curto recupera os espaços de Magia de Pacto, mas não os de outros conjuradores', () => {
    const warlock = makeCharacter({ level: 2, classId: 'warlock' });
    const w = shortRest(
      { ...warlock.play, slotsUsed: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
      derive(warlock, content),
      { hitDiceRolls: [] },
    );
    expect(w.slotsUsed[0]).toBe(0);
    const cleric = thorin(1);
    const cl = shortRest(
      { ...cleric.play, slotsUsed: [1, 0, 0, 0, 0, 0, 0, 0, 0] },
      sheetOf(cleric),
      { hitDiceRolls: [] },
    );
    expect(cl.slotsUsed[0]).toBe(1);
  });

  it('descanso longo recupera tudo e tira um nível de Exaustão', () => {
    const play = {
      ...thorin(1).play,
      hpCurrent: 3,
      hpTemp: 4,
      hitDiceUsed: 1,
      slotsUsed: [2, 0, 0, 0, 0, 0, 0, 0, 0],
      resourcesUsed: { stonecunning: 2 },
      exhaustion: 2,
      deathSaves: { successes: 1, failures: 1 },
    };
    expect(longRest(play)).toMatchObject({
      hpCurrent: null,
      hpTemp: 0,
      hitDiceUsed: 0,
      slotsUsed: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      resourcesUsed: {},
      exhaustion: 1,
      deathSaves: { successes: 0, failures: 0 },
    });
    expect(longRest({ ...play, exhaustion: 0 }).exhaustion).toBe(0);
  });

  it('salvaguardas contra a morte', () => {
    const base = { ...thorin(1).play, hpCurrent: 0 };
    expect(deathSave(base, 12).play.deathSaves).toEqual({ successes: 1, failures: 0 });
    expect(deathSave(base, 5).play.deathSaves).toEqual({ successes: 0, failures: 1 });
    expect(deathSave(base, 1).play.deathSaves).toEqual({ successes: 0, failures: 2 });
    expect(deathSave(base, 20)).toMatchObject({ outcome: 'recuperou', play: { hpCurrent: 1 } });
    expect(deathSave({ ...base, deathSaves: { successes: 2, failures: 0 } }, 10).outcome).toBe(
      'estavel',
    );
    expect(deathSave({ ...base, deathSaves: { successes: 0, failures: 2 } }, 3).outcome).toBe(
      'morto',
    );
    expect(deathSave(base, 15).outcome).toBe('continua');
  });

  it('dano com as regras de 0 PV: cair, falhas e morte instantânea', () => {
    const sheet = sheetOf(); // Thorin 1: 11 PV máximos
    const max = sheet.hp.max;
    let r = takeDamage(thorin(1).play, sheet, 0);
    expect(r.outcome).toBe('ok');
    r = takeDamage(thorin(1).play, sheet, 4);
    expect(r).toMatchObject({ outcome: 'ok', play: { hpCurrent: max - 4 } });
    // Cai a 0: o que sobra é menor que o máximo.
    r = takeDamage(thorin(1).play, sheet, max + 3);
    expect(r).toMatchObject({ outcome: 'caiu', play: { hpCurrent: 0 } });
    // Dano já com 0 PV: uma falha; crítico, duas.
    const down = r.play;
    expect(takeDamage(down, sheet, 2).play.deathSaves.failures).toBe(1);
    expect(takeDamage(down, sheet, 2, { critical: true })).toMatchObject({
      outcome: 'falha',
      play: { deathSaves: { failures: 2 } },
    });
    expect(
      takeDamage({ ...down, deathSaves: { successes: 0, failures: 2 } }, sheet, 1).outcome,
    ).toBe('morto');
    // Dano enorme com 0 PV ou que sobra do máximo: morte instantânea.
    expect(takeDamage(down, sheet, max).outcome).toBe('morto');
    expect(takeDamage(thorin(1).play, sheet, max * 2).outcome).toBe('morto');
    // Com 0 PV, PV temporários absorvem sem contar falha.
    expect(takeDamage({ ...down, hpTemp: 5 }, sheet, 3)).toMatchObject({
      outcome: 'ok',
      play: { hpTemp: 2, deathSaves: { failures: 0 } },
    });
    expect(() => takeDamage(down, sheet, -1)).toThrow(RangeError);
  });
});
