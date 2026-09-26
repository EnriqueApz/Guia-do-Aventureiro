import { content } from '@/content';
import { choiceKey } from '@/model/character';
import { brom, lira, makeCharacter, pip, thorin } from '@/test/characters';
import { derive } from '../derive';

describe('ficha derivada — personagens de referência', () => {
  it('Thorin, Anão Clérigo 1 (Acólito)', () => {
    const s = derive(thorin(1), content);
    // SAB 15+2 = 17 (+3); CAR 10+1 = 11 (+0); CON 14 (+2)
    expect(s.abilities.sab).toMatchObject({ score: 17, modifier: 3 });
    expect(s.abilities.car).toMatchObject({ score: 11, modifier: 0 });
    expect(s.proficiencyBonus).toBe(2);
    // PV: 8 (d8) + 2 (CON) + 1 (Robustez Anã) = 11
    expect(s.hp.max).toBe(11);
    // CA: Camisão de Malha 13 + DES 1 + Escudo 2 = 16
    expect(s.ac.value).toBe(16);
    expect(s.speed.walk).toBe(30);
    expect(s.initiative.value).toBe(1);
    expect(s.saves.sab).toMatchObject({ bonus: 5, proficient: true });
    expect(s.saves.for).toMatchObject({ bonus: 1, proficient: false });
    expect(s.skills.medicina).toMatchObject({ bonus: 5, proficient: true });
    expect(s.skills.religiao).toMatchObject({ bonus: 1, proficient: true });
    expect(s.skills.atletismo).toMatchObject({ bonus: 1, proficient: false });
    expect(s.passivePerception).toBe(13);
    expect(s.spellcasting).toMatchObject({
      ability: 'sab',
      saveDc: 13,
      attackBonus: 5,
      cantrips: 3,
      prepared: 4,
      pact: false,
    });
    expect(s.spellcasting?.slots).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(s.darkvision).toBe(120);
    expect(s.resistances).toEqual(['veneno']);
    expect(s.proficiencies.languages).toEqual(
      expect.arrayContaining(['common', 'dwarvish', 'giant']),
    );
    // Ordem Divina: Protetor dá armas marciais e armadura pesada
    expect(s.proficiencies.weapons).toContain('marciais');
    expect(s.proficiencies.armor).toContain('pesada');
    expect(s.attacks.find((a) => a.id === 'mace')).toMatchObject({
      attackBonus: 3,
      damage: '1d6+1',
    });
    expect(s.features.find((f) => f.id === 'stonecunning')?.uses).toEqual({
      max: 2,
      recharge: 'descanso-longo',
    });
    expect(s.feats.map((f) => f.feat.id)).toEqual(['magic-initiate']);
    expect(s.subclass).toBeUndefined();
  });

  it('Thorin no nível 5, com Domínio da Vida e +2 SAB no nível 4', () => {
    const s = derive(thorin(5), content);
    expect(s.abilities.sab).toMatchObject({ score: 19, modifier: 4 });
    expect(s.proficiencyBonus).toBe(3);
    // PV: 8+2 + 4×(5+2) + 5 (Robustez Anã) = 43
    expect(s.hp.max).toBe(43);
    expect(s.spellcasting).toMatchObject({ saveDc: 15, attackBonus: 7, cantrips: 4, prepared: 9 });
    expect(s.spellcasting?.slots.slice(0, 3)).toEqual([4, 3, 2]);
    expect(s.spellcasting?.alwaysPrepared).toEqual([
      'aid',
      'bless',
      'cure-wounds',
      'lesser-restoration',
      'mass-healing-word',
      'revivify',
    ]);
    expect(s.features.find((f) => f.id === 'cleric-channel-divinity')?.uses?.max).toBe(2);
    expect(s.features.some((f) => f.id === 'preserve-life')).toBe(true);
    expect(s.skills.medicina.bonus).toBe(7);
  });

  it('Lira, Alta Elfa Maga 3 (Sábia)', () => {
    const s = derive(lira(3), content);
    expect(s.abilities.int).toMatchObject({ score: 17, modifier: 3 });
    expect(s.abilities.con).toMatchObject({ score: 15, modifier: 2 });
    // PV: 6+2 + 2×(4+2) = 20
    expect(s.hp.max).toBe(20);
    expect(s.ac.value).toBe(11);
    expect(s.skills.percepcao).toMatchObject({ bonus: 3, proficient: true });
    expect(s.passivePerception).toBe(13);
    // Erudito: Especialização em Arcanismo (proficiência do antecedente)
    expect(s.skills.arcanismo).toMatchObject({ bonus: 7, expertise: true });
    expect(s.spellcasting).toMatchObject({ saveDc: 13, attackBonus: 5, cantrips: 3, prepared: 6 });
    expect(s.spellcasting?.slots.slice(0, 2)).toEqual([4, 2]);
    expect(s.grantedSpells.map((g) => g.spell)).toEqual(['prestidigitation', 'detect-magic']);
    expect(s.darkvision).toBe(60);
    expect(s.attacks.find((a) => a.id === 'quarterstaff')).toMatchObject({
      attackBonus: 1,
      damage: '1d6−1',
      versatileDamage: '1d8−1',
    });
    expect(s.attacks.find((a) => a.id === 'dagger')).toMatchObject({
      ability: 'des',
      attackBonus: 3,
      damage: '1d4+1',
    });
    expect(s.subclass?.id).toBe('evoker');
  });

  it('Pip, Halfling Ladino 4 (Criminoso)', () => {
    const s = derive(pip(4), content);
    expect(s.abilities.des).toMatchObject({ score: 18, modifier: 4 });
    expect(s.abilities.con).toMatchObject({ score: 16, modifier: 3 });
    // PV: 8+3 + 3×(5+3) = 35
    expect(s.hp.max).toBe(35);
    // CA: Armadura de Couro 11 + DES 4
    expect(s.ac.value).toBe(15);
    // Iniciativa: DES 4 + Alerta (proficiência 2)
    expect(s.initiative.value).toBe(6);
    expect(s.skills.furtividade).toMatchObject({ bonus: 8, expertise: true });
    expect(s.skills.prestidigitacao).toMatchObject({ bonus: 8, expertise: true });
    expect(s.skills.percepcao.bonus).toBe(3);
    expect(s.size).toBe('Pequeno');
    expect(s.attacks.find((a) => a.id === 'shortsword')).toMatchObject({
      attackBonus: 6,
      damage: '1d6+4',
      mastery: 'afligir',
      proficient: true,
    });
    expect(s.attacks.find((a) => a.id === 'shortbow')).toMatchObject({
      attackBonus: 6,
      damage: '1d6+4',
      mastery: 'afligir',
    });
    expect(s.attacks.find((a) => a.id === 'longsword')).toMatchObject({
      proficient: false,
      attackBonus: -1,
    });
    expect(s.proficiencies.tools).toContain('thieves-tools');
    expect(s.proficiencies.languages).toEqual(
      expect.arrayContaining(['thieves-cant', 'elvish', 'halfling']),
    );
    expect(s.carrying.capacity).toBe(120);
    expect(s.spellcasting).toBeUndefined();
  });

  it('Brom, Humano Guerreiro 1 (Soldado) com Defesa', () => {
    const s = derive(brom(1), content);
    expect(s.abilities.for).toMatchObject({ score: 17, modifier: 3 });
    // CA: Cota de Malha 16 + Defesa 1
    expect(s.ac.value).toBe(17);
    expect(s.ac.parts).toContainEqual({ label: 'Estilo de luta Defesa', value: 1 });
    expect(s.hp.max).toBe(12);
    expect(s.speed.walk).toBe(30);
    expect(s.attacks.find((a) => a.id === 'greatsword')).toMatchObject({
      attackBonus: 5,
      damage: '2d6+3',
      mastery: 'raspar',
    });
    // Humano: Habilidoso (Furtividade) + talento Habilidoso (História, Sobrevivência, Ferramentas de Ladrão)
    expect(s.skills.furtividade.proficient).toBe(true);
    expect(s.skills.historia.proficient).toBe(true);
    expect(s.proficiencies.tools).toEqual(expect.arrayContaining(['thieves-tools', 'dice']));
    expect(s.feats.map((f) => f.feat.id).sort()).toEqual(['defense', 'savage-attacker', 'skilled']);
    expect(s.carrying.weight).toBe(61);
    expect(s.features.find((f) => f.id === 'fighter-second-wind')?.uses?.max).toBe(2);
  });
});

describe('ficha derivada — casos especiais', () => {
  it('armadura pesada sem Força suficiente reduz o deslocamento em 3 m', () => {
    const c = brom(1);
    c.abilities.base.for = 10; // 10 + 2 = 12 < 13
    expect(derive(c, content).speed.walk).toBe(20);
  });

  it('Bárbaro: Defesa sem Armadura e Movimento Rápido', () => {
    const c = makeCharacter({
      level: 5,
      speciesId: 'goliath',
      classId: 'barbarian',
      abilities: { method: 'manual', base: { for: 16, des: 14, con: 16, int: 8, sab: 10, car: 8 } },
    });
    let s = derive(c, content);
    expect(s.ac.value).toBe(15); // 10 + 2 + 3
    expect(s.speed.walk).toBe(45); // Golias 35 + Movimento Rápido 10
    expect(s.carrying.capacity).toBe(480); // Constituição Poderosa conta como Grande
    expect(s.extraAttacks).toBe(2);
    expect(s.features.find((f) => f.id === 'barbarian-rage')?.uses?.max).toBe(3);
    c.inventory = [{ id: 'chain-mail', qty: 1, equipped: true }];
    s = derive(c, content);
    expect(s.speed.walk).toBe(35); // armadura pesada anula o Movimento Rápido
    expect(s.ac.value).toBe(16);
  });

  it('Monge: movimento e Artes Marciais só sem armadura e escudo', () => {
    const c = makeCharacter({
      level: 2,
      speciesId: 'human',
      classId: 'monk',
      abilities: {
        method: 'manual',
        base: { for: 10, des: 16, con: 12, int: 10, sab: 14, car: 8 },
      },
      inventory: [{ id: 'spear', qty: 1 }],
    });
    let s = derive(c, content);
    expect(s.speed.walk).toBe(40);
    expect(s.ac.value).toBe(15); // 10 + 3 + 2
    expect(s.attacks.find((a) => a.id === 'ataque-desarmado')).toMatchObject({ damage: '1d6+3' });
    expect(s.attacks.find((a) => a.id === 'spear')).toMatchObject({
      ability: 'des',
      damage: '1d6+3',
    });
    c.inventory.push({ id: 'shield', qty: 1, equipped: true });
    s = derive(c, content);
    expect(s.speed.walk).toBe(30);
    expect(s.ac.value).toBe(15); // 10 + 3 + escudo 2, sem Sabedoria
    expect(s.attacks.find((a) => a.id === 'ataque-desarmado')?.damage).toBe('1');
  });

  it('Feiticeiro dracônico: PV extras e CA de escamas', () => {
    const c = makeCharacter({
      level: 3,
      speciesId: 'human',
      classId: 'sorcerer',
      subclassId: 'draconic-sorcery',
      abilities: {
        method: 'manual',
        base: { for: 8, des: 14, con: 14, int: 10, sab: 10, car: 16 },
      },
    });
    const s = derive(c, content);
    // PV: 6+2 + 2×(4+2) + 3 = 23; CA: 10 + 2 + 3 = 15
    expect(s.hp.max).toBe(23);
    expect(s.ac.value).toBe(15);
    expect(s.spellcasting?.alwaysPrepared).toContain('dragons-breath');
  });

  it('Bruxo 5: Magia de Pacto', () => {
    const c = makeCharacter({
      level: 5,
      speciesId: 'tiefling',
      lineageId: 'fiendish-legacy-infernal',
      classId: 'warlock',
    });
    const s = derive(c, content);
    expect(s.spellcasting).toMatchObject({ pact: true, cantrips: 3, prepared: 6 });
    expect(s.spellcasting?.slots).toEqual([0, 0, 2, 0, 0, 0, 0, 0, 0]);
    expect(s.resistances).toEqual(['fogo']);
    expect(s.grantedSpells.map((g) => g.spell)).toEqual([
      'thaumaturgy',
      'fire-bolt',
      'hellish-rebuke',
      'darkness',
    ]);
  });

  it('Elfo silvestre anda 10,5 m e Draconato resiste ao elemento do ancestral', () => {
    expect(
      derive(makeCharacter({ speciesId: 'elf', lineageId: 'elven-lineage-wood-elf' }), content)
        .speed.walk,
    ).toBe(35);
    const dragonborn = derive(
      makeCharacter({ speciesId: 'dragonborn', lineageId: 'draconic-ancestor-red' }),
      content,
    );
    expect(dragonborn.resistances).toEqual(['fogo']);
  });

  it('Bardo: Pau pra Toda Obra soma metade da proficiência', () => {
    const c = makeCharacter({
      level: 2,
      classId: 'bard',
      abilities: {
        method: 'manual',
        base: { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
      },
    });
    const s = derive(c, content);
    expect(s.skills.atletismo.bonus).toBe(1);
  });

  it('limites de atributo: 20 no talento comum, 30 na Dádiva, 25 no Campeão Primitivo', () => {
    const c = makeCharacter({
      level: 20,
      classId: 'barbarian',
      abilities: {
        method: 'manual',
        base: { for: 18, des: 10, con: 18, int: 10, sab: 10, car: 10 },
      },
      feats: [
        { level: 4, featId: 'ability-score-improvement', abilityBonus: { for: 2 } },
        { level: 19, featId: 'boon-of-combat-prowess', abilityBonus: { for: 1 } },
      ],
    });
    const s = derive(c, content);
    // 18 +2 (ASI, máx. 20) = 20; +1 (Dádiva, máx. 30) = 21; +4 (Campeão Primitivo, máx. 25) = 25
    expect(s.abilities.for.score).toBe(25);
    expect(s.abilities.con.score).toBe(22);
  });

  it('subclasse só vale a partir do nível 3', () => {
    const c = thorin(2);
    c.subclassId = 'life-domain';
    expect(derive(c, content).subclass).toBeUndefined();
  });

  it('sobrescritas manuais aparecem sinalizadas', () => {
    const c = thorin(1);
    c.overrides = {
      ca: 20,
      pvMax: 15,
      'pericias.furtividade': 9,
      'salvaguardas.for': 4,
      iniciativa: 3,
      deslocamento: 25,
      percepcaoPassiva: 18,
    };
    const s = derive(c, content);
    expect(s.ac).toMatchObject({ value: 20, overridden: true });
    expect(s.hp).toMatchObject({ max: 15, overridden: true });
    expect(s.skills.furtividade).toMatchObject({ bonus: 9, overridden: true });
    expect(s.saves.for).toMatchObject({ bonus: 4, overridden: true });
    expect(s.initiative.value).toBe(3);
    expect(s.speed.walk).toBe(25);
    expect(s.passivePerception).toBe(18);
    expect(s.overridden).toHaveLength(7);
  });

  it('Exaustão reduz o deslocamento e os testes de d20', () => {
    const c = thorin(1);
    c.play.exhaustion = 2;
    const s = derive(c, content);
    expect(s.speed.walk).toBe(20);
    expect(s.d20Penalty).toBe(4);
  });

  it('personagem vazio gera uma ficha básica sem quebrar', () => {
    const s = derive(makeCharacter({}), content);
    expect(s.hp.max).toBe(8);
    expect(s.ac.value).toBe(10);
    expect(s.attacks).toHaveLength(1);
    expect(s.features).toEqual([]);
  });

  it('opções escolhidas em características aplicam seus efeitos (Ordem Primal: Guardião)', () => {
    const c = makeCharacter({
      classId: 'druid',
      choices: { [choiceKey('classe', 'druid-primal-order', 'primal-order')]: ['warden'] },
    });
    const s = derive(c, content);
    expect(s.proficiencies.armor).toContain('media');
    expect(s.proficiencies.languages).toContain('druidic');
  });
});
