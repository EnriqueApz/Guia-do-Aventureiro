/**
 * Progressão do nível 1 ao 20 em todas as classes: um personagem montado só com
 * escolhas válidas não pode ter erros, e a ficha precisa crescer com o nível.
 */
import { content } from '@/content';
import type { Choice, ClassDef, SkillId } from '@/content/schema';
import { choiceKey, type Character } from '@/model/character';
import { abilityPriority, applyBeginnerKit, setLevelFeat, setLevelFeatBonus } from '@/model/edits';
import { makeCharacter, withSpells } from '@/test/characters';
import { derive } from '../derive';
import { evaluateFormula } from '../formula';
import { proficiencyBonus } from '../proficiency';
import { validateCharacter } from '../validate';

/** Primeiras opções válidas para uma escolha de característica. */
function firstValid(ch: Choice, c: Character, cls: ClassDef): string[] {
  const sheet = derive(c, content);
  const need = evaluateFormula(ch.count, {
    level: c.level,
    proficiencyBonus: proficiencyBonus(c.level),
    modifiers: Object.fromEntries(
      Object.entries(sheet.abilities).map(([a, v]) => [a, v.modifier]),
    ) as never,
    classDef: cls,
  });
  const from = Array.isArray(ch.from) ? ch.from : undefined;
  let pool: string[] = [];
  if (ch.kind === 'opcao') pool = (ch.options ?? []).map((o) => o.id);
  else if (ch.kind === 'talento')
    pool = content.feats.filter((f) => f.category === ch.featCategory).map((f) => f.id);
  else if (ch.kind === 'maestria')
    pool = from ?? content.items.filter((i) => i.weapon).map((i) => i.id);
  else if (ch.kind === 'especializacao')
    pool = (from ?? content.skills.map((s) => s.id)).filter(
      (s) => sheet.skills[s as SkillId].proficient,
    );
  else if (ch.kind === 'idioma')
    pool = (from ?? content.languages.map((l) => l.id)).filter(
      (l) => !sheet.proficiencies.languages.includes(l),
    );
  else if (ch.kind === 'pericia')
    pool = (from ?? content.skills.map((s) => s.id)).filter(
      (s) => !sheet.skills[s as SkillId].proficient,
    );
  else pool = from ?? [];
  return pool.slice(0, need);
}

function build(cls: ClassDef, level: number): Character {
  let c = makeCharacter({
    name: 'Teste',
    level,
    speciesId: 'dwarf',
    classId: cls.id,
    backgroundId: 'criminal',
    backgroundBonus: { des: 2, con: 1 },
    abilities: {
      method: 'padrao',
      base: { ...cls.recommendedScores } as Character['abilities']['base'],
    },
    startingEquipment: { backgroundOption: 'a' },
  });
  if (level >= 3) c.subclassId = content.subclasses.find((s) => s.classId === cls.id)?.id;
  c = applyBeginnerKit(c, content);

  // Talentos por nível: Aumento no Valor de Atributo; no 19, Dádiva do Destino.
  const [first, second] = abilityPriority(cls);
  for (const lvl of cls.featLevels.filter((l) => l <= level)) {
    c = setLevelFeat(c, lvl, 'ability-score-improvement');
    c = setLevelFeatBonus(c, lvl, { [first as string]: 1, [second as string]: 1 });
  }
  if (level >= 19) {
    const boon = content.feats.find((f) => f.id === 'boon-of-fate');
    c = setLevelFeat(c, 19, 'boon-of-fate');
    c = setLevelFeatBonus(c, 19, { [boon?.abilityIncrease?.options[0] as string]: 1 });
  }

  // Escolhas de características que o kit não cobre (níveis altos, subclasse).
  const subclass = content.subclasses.find((s) => s.id === c.subclassId);
  const scopes: [string, ClassDef['features']][] = [
    ['classe', cls.features],
    ['subclasse', subclass?.features ?? []],
  ];
  for (const [scope, features] of scopes)
    for (const f of features) {
      if (f.level > level) continue;
      for (const ch of f.choices ?? []) {
        const key = choiceKey(scope, f.id, ch.id);
        const kept = c.choices[key];
        const values = firstValid(ch, { ...c, choices: { ...c.choices, [key]: [] } }, cls);
        if (!kept || kept.length !== values.length)
          c = { ...c, choices: { ...c.choices, [key]: values } };
      }
    }
  return withSpells(c);
}

describe('progressão do nível 1 ao 20', () => {
  for (const cls of content.classes) {
    it(`${cls.name}: sem erros em todos os níveis e a ficha cresce`, () => {
      let lastHp = 0;
      for (let level = 1; level <= 20; level++) {
        const c = build(cls, level);
        const errs = validateCharacter(c, content)
          .filter((i) => i.severity === 'erro')
          .map((i) => i.message);
        expect({ level, errs }).toEqual({ level, errs: [] });
        const sheet = derive(c, content);
        expect(sheet.hp.max).toBeGreaterThan(lastHp);
        lastHp = sheet.hp.max;
        expect(sheet.proficiencyBonus).toBe(proficiencyBonus(level));
        expect(sheet.hitDice.total).toBe(level);
        // Características de classe até o nível entram na ficha; as acima, não.
        for (const f of cls.features)
          expect(sheet.features.some((x) => x.id === f.id)).toBe(f.level <= level);
        if (cls.spellcasting) {
          const slots = sheet.spellcasting?.slots ?? [];
          expect(slots).toEqual(cls.spellcasting.slots[level - 1]);
          expect(c.spells.prepared).toHaveLength(cls.spellcasting.prepared[level - 1] ?? 0);
        }
        // Cada Aumento no Valor de Atributo soma +1 no atributo principal (até 20).
        const top = abilityPriority(cls)[0];
        if (top && level < 19) {
          const asis = cls.featLevels.filter((l) => l <= level).length;
          const expected = (cls.recommendedScores[top] ?? 0) + (c.backgroundBonus[top] ?? 0) + asis;
          expect(sheet.abilities[top].score).toBe(Math.min(20, expected));
        }
      }
    });
  }
});
