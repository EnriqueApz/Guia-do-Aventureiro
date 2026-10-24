/**
 * Validação do personagem: tudo o que falta ou está fora das regras.
 * Retorna uma lista de problemas, cada um ligado à etapa do assistente que resolve.
 */
import type { Choice, ContentBundle, Feat, Feature } from '@/content/schema';
import { ABILITIES } from '@/content/schema';
import { choiceKey, featScope, type Character } from '@/model/character';
import {
  isStandardArray,
  isValidAsi,
  isValidBackgroundBonus,
  pointBuySpent,
  POINT_BUY_BUDGET,
} from './abilities';
import { evaluateFormula } from './formula';
import { abilityModifier } from './abilities';
import { proficiencyBonus } from './proficiency';
import {
  classEntries,
  extraLevels,
  meetsMulticlassRequirement,
  requirementLabel,
  hitDiceByLevel,
} from './classes';
import { ABILITY_NAMES, derive } from './derive';
import { chosenSpells, featSpellOptions, spellBudgets } from './spells';

export type WizardStep =
  'especie' | 'classe' | 'subclasse' | 'antecedente' | 'atributos' | 'escolhas' | 'detalhes';

export interface Issue {
  step: WizardStep;
  severity: 'erro' | 'aviso';
  message: string;
}

export function validateCharacter(c: Character, content: ContentBundle): Issue[] {
  const issues: Issue[] = [];
  const err = (step: WizardStep, message: string) =>
    issues.push({ step, severity: 'erro', message });
  const warn = (step: WizardStep, message: string) =>
    issues.push({ step, severity: 'aviso', message });
  const pick = (key: string) => c.choices[key] ?? [];

  if (!Number.isInteger(c.level) || c.level < 1 || c.level > 20) {
    err('classe', 'O nível precisa ser um número de 1 a 20.');
    return issues;
  }

  // ---- espécie
  const species = content.species.find((s) => s.id === c.speciesId);
  if (!species) err('especie', 'Escolha uma espécie.');
  else {
    if (species.lineages.length && !species.lineages.some((l) => l.id === c.lineageId)) {
      err('especie', `Escolha ${species.lineageLabel?.toLowerCase() ?? 'uma linhagem'}.`);
    }
    if (species.lineageSpellAbilities && !c.lineageSpellAbility) {
      err('especie', 'Escolha o atributo de conjuração das magias da sua linhagem.');
    }
    if (species.sizes.length > 1 && !c.size) err('especie', 'Escolha o tamanho do personagem.');
  }

  // ---- classe e subclasse
  const classDef = content.classes.find((x) => x.id === c.classId);
  if (!classDef) err('classe', 'Escolha uma classe.');
  const entries = classEntries(c, content);
  for (const e of entries) {
    if (e.levels < 3) continue;
    const id = e.primary
      ? c.subclassId
      : c.multiclass?.find((m) => m.classId === e.classDef.id)?.subclassId;
    const sub = content.subclasses.find((s) => s.id === id);
    const at = e.primary ? `No nível ${e.levels}` : `Com ${e.levels} níveis de ${e.classDef.name}`;
    if (!sub) err('subclasse', `${at}, escolha uma subclasse de ${e.classDef.name}.`);
    else if (sub.classId !== e.classDef.id)
      err('subclasse', `${sub.name} não é uma subclasse de ${e.classDef.name}.`);
  }

  // ---- multiclasse
  if (c.multiclass?.length) {
    if (extraLevels(c) > c.level - 1)
      err('classe', 'A soma dos níveis das classes passa do nível do personagem.');
    const seen = new Set<string>([c.classId ?? '']);
    for (const m of c.multiclass) {
      if (!content.classes.some((x) => x.id === m.classId))
        err('classe', `Classe desconhecida na multiclasse (${m.classId}).`);
      if (seen.has(m.classId)) err('classe', 'A mesma classe aparece duas vezes na multiclasse.');
      seen.add(m.classId);
      if (!Number.isInteger(m.levels) || m.levels < 1)
        err('classe', 'Cada classe da multiclasse precisa de pelo menos 1 nível.');
    }
    // Requisito: 13 nos atributos principais de TODAS as classes (aviso: o Mestre decide).
    const scores = Object.fromEntries(
      ABILITIES.map((a) => [a, derive(c, content).abilities[a].score]),
    ) as Record<(typeof ABILITIES)[number], number>;
    for (const e of entries)
      if (!meetsMulticlassRequirement(e.classDef, scores))
        warn(
          'atributos',
          `Multiclasse pede ${requirementLabel(e.classDef, ABILITY_NAMES)} para ${e.classDef.name}.`,
        );
    for (const e of entries.filter((x) => !x.primary))
      for (const ch of e.classDef.multiclass?.choices ?? []) {
        const got = pick(`multiclasse:${e.classDef.id}:${ch.id}`);
        const need = evaluateFormula(ch.count, ctxFor(c, e.classDef, e.levels));
        if (got.length !== need)
          err('escolhas', `${e.classDef.name} (multiclasse): ${ch.label.toLowerCase()}.`);
        if (Array.isArray(ch.from) && got.some((v) => !(ch.from as string[]).includes(v)))
          err('escolhas', `${e.classDef.name} (multiclasse): há escolhas fora da lista.`);
      }
  }

  // ---- antecedente
  const background = content.backgrounds.find((b) => b.id === c.backgroundId);
  if (!background) err('antecedente', 'Escolha um antecedente.');
  else {
    if (!isValidBackgroundBonus(c.backgroundBonus, background.abilityOptions)) {
      err('atributos', 'Distribua os aumentos do antecedente: +2 e +1, ou +1 em três atributos.');
    }
    if (typeof background.tool !== 'string' && pick('antecedente:ferramenta').length !== 1) {
      err('antecedente', `${background.tool.label}.`);
    }
  }

  // ---- atributos
  const { method, base } = c.abilities;
  if (method === 'padrao' && !isStandardArray(base)) {
    err('atributos', 'Use cada valor do array padrão (15, 14, 13, 12, 10, 8) uma vez.');
  }
  if (method === 'compra') {
    const valid = ABILITIES.every((a) => base[a] >= 8 && base[a] <= 15);
    if (!valid) err('atributos', 'Na compra de pontos, cada atributo vai de 8 a 15.');
    else if (pointBuySpent(base) > POINT_BUY_BUDGET) {
      err('atributos', `Você gastou ${pointBuySpent(base)} de ${POINT_BUY_BUDGET} pontos.`);
    }
  }
  if (method === 'rolagem' && (c.abilities.rolls?.length ?? 0) !== 6)
    err('atributos', 'Role os seis valores (4d6, descartando o menor).');
  if (method === 'rolagem' || method === 'manual') {
    if (ABILITIES.some((a) => base[a] < 3 || base[a] > 18))
      err('atributos', 'Valores rolados vão de 3 a 18.');
  }

  // ---- talentos por nível (cada classe nos níveis dela)
  for (const e of entries) {
    const cd = e.classDef;
    const classId = e.primary ? undefined : cd.id;
    const where = (lvl: number) => (e.primary ? `do nível ${lvl}` : `de ${cd.name} ${lvl}`);
    const inLevel = (lvl: number) => (e.primary ? `no nível ${lvl}` : `em ${cd.name} ${lvl}`);
    const label = (lvl: number) => (e.primary ? `Nível ${lvl}` : `${cd.name} ${lvl}`);
    for (const lvl of [...cd.featLevels, cd.epicBoonLevel]) {
      if (lvl > e.levels) continue;
      const fp = c.feats.find((f) => f.level === lvl && f.classId === classId);
      if (!fp) {
        err('escolhas', `Escolha o talento ${where(lvl)}.`);
        continue;
      }
      const feat = content.feats.find((f) => f.id === fp.featId);
      if (!feat) err('escolhas', `Talento desconhecido ${inLevel(lvl)}.`);
      else if (!allowedFeatCategories(lvl, cd).includes(feat.category)) {
        err('escolhas', `${feat.name} não pode ser escolhido ${inLevel(lvl)}.`);
      } else if (feat.prerequisite?.level && feat.prerequisite.level > c.level) {
        err('escolhas', `${feat.name} exige nível ${feat.prerequisite.level}.`);
      } else if (
        feat.abilityIncrease?.mode === 'um+2-ou-dois+1' &&
        !isValidAsi(fp.abilityBonus ?? {})
      ) {
        err('escolhas', `${label(lvl)}: distribua o aumento (+2 em um atributo ou +1 em dois).`);
      } else if (feat.abilityIncrease?.mode === '+1') {
        const picks = Object.entries(fp.abilityBonus ?? {}).filter(([, v]) => v);
        const [first] = picks;
        if (
          picks.length !== 1 ||
          !first ||
          first[1] !== 1 ||
          !feat.abilityIncrease.options.includes(first[0] as never)
        )
          err('escolhas', `${label(lvl)}: escolha o atributo que ${feat.name} aumenta em 1.`);
      }
    }
  }

  // ---- perícias da classe
  if (classDef) {
    const chosen = pick('classe:pericias');
    const { count, from } = classDef.skillChoice;
    if (chosen.length !== count)
      err('escolhas', `Escolha ${count} perícias da classe (${chosen.length} de ${count}).`);
    if (from !== 'qualquer' && chosen.some((s) => !(from as string[]).includes(s))) {
      err('escolhas', 'Há perícias que não estão na lista da classe.');
    }
    if (new Set(chosen).size !== chosen.length) err('escolhas', 'Há perícias repetidas.');
    const dup = chosen.filter((s) => background?.skills.includes(s as never));
    if (dup.length)
      warn('escolhas', 'Uma perícia da classe repete uma do antecedente; troque por outra.');
    if (classDef.toolChoice) {
      const n = evaluateFormula(classDef.toolChoice.count, ctxFor(c));
      if (pick('classe:ferramentas').length !== n) err('escolhas', `${classDef.toolChoice.label}.`);
    }
  }

  // ---- escolhas das características (espécie, linhagem, classe, subclasse)
  const lineage = species?.lineages.find((l) => l.id === c.lineageId);
  const primaryEntry = entries.find((e) => e.primary);
  const scopes: [string, Feature[], number, ReturnType<typeof ctxFor>][] = [
    ['especie', species?.traits ?? [], c.level, ctxFor(c)],
    ['linhagem', lineage?.traits ?? [], c.level, ctxFor(c)],
  ];
  for (const e of entries) {
    const ectx = ctxFor(c, e.classDef, e.levels);
    scopes.push([e.scope, e.classDef.features, e.levels, ectx]);
    if (e.subclass) scopes.push([e.subScope, e.subclass.features, e.levels, ectx]);
  }
  const ctx = ctxFor(c, classDef, primaryEntry?.levels);
  const itemById = new Map(content.items.map((i) => [i.id, i]));
  for (const [scope, features, upTo, sctx] of scopes) {
    for (const f of features) {
      if ((f.level ?? 1) > upTo) continue;
      for (const ch of f.choices ?? ([] as Choice[])) {
        // Magias de características vêm como efeitos (não como escolha) no SRD.
        if (ch.kind === 'magia') continue;
        const need = evaluateFormula(ch.count, sctx);
        const values = pick(choiceKey(scope, f.id, ch.id));
        const got = values.length;
        if (got < need) err('escolhas', `${ch.label}: escolha ${need} (${got} de ${need}).`);
        if (got > need) err('escolhas', `${ch.label}: escolha só ${need}.`);
        if (Array.isArray(ch.from) && values.some((v) => !(ch.from as string[]).includes(v)))
          err('escolhas', `${ch.label}: há escolhas fora da lista.`);
        if (ch.kind === 'maestria' && values.some((v) => !itemById.get(v)?.weapon))
          err('escolhas', `${ch.label}: escolha armas.`);
        if (ch.kind === 'talento' && ch.featCategory) {
          const wrong = values.some(
            (v) => content.feats.find((x) => x.id === v)?.category !== ch.featCategory,
          );
          if (wrong) err('escolhas', `${ch.label}: escolha um talento da categoria certa.`);
        }
      }
    }
  }

  // ---- talentos: escolhas internas (origem, estilos de luta, talentos por nível)
  const featEntries: { featId: string; scope: string; at: string }[] = [];
  if (background)
    featEntries.push({
      featId: background.originFeat.id,
      scope: `talento:${background.originFeat.id}`,
      at: 'Talento de origem',
    });
  for (const [scope, features, upTo] of scopes)
    for (const f of features) {
      if ((f.level ?? 1) > upTo) continue;
      for (const ch of f.choices ?? [])
        if (ch.kind === 'talento')
          for (const id of pick(choiceKey(scope, f.id, ch.id)))
            featEntries.push({ featId: id, scope: `talento:${id}`, at: f.name });
    }
  for (const fp of c.feats) {
    const e = entries.find((x) => (fp.classId ? x.classDef.id === fp.classId : x.primary));
    if (e && fp.level <= e.levels)
      featEntries.push({
        featId: fp.featId,
        scope: `${featScope(fp)}:${fp.featId}`,
        at: fp.classId
          ? `Talento de ${e.classDef.name} ${fp.level}`
          : `Talento do nível ${fp.level}`,
      });
  }
  const seenFeats = new Set<string>();
  for (const { featId, scope, at } of featEntries) {
    const feat = content.feats.find((f) => f.id === featId);
    if (!feat) continue;
    if (seenFeats.has(feat.id) && !feat.repeatable)
      err('escolhas', `${feat.name} não pode ser escolhido duas vezes.`);
    seenFeats.add(feat.id);
    for (const ch of feat.choices ?? []) {
      const need = evaluateFormula(ch.count, ctx);
      const got = pick(`${scope}:${ch.id}`);
      const label = `${at} (${feat.name}): ${ch.label.toLowerCase()}`;
      if (got.length !== need) {
        err('escolhas', `${label}: escolha ${need} (${got.length} de ${need}).`);
        continue;
      }
      if (Array.isArray(ch.from) && got.some((v) => !(ch.from as string[]).includes(v)))
        err('escolhas', `${label}: há escolhas fora da lista.`);
      if (ch.kind === 'opcao' && got.some((v) => !ch.options?.some((o) => o.id === v)))
        err('escolhas', `${label}: opção desconhecida.`);
      if (ch.kind === 'magia') {
        const list = pick(`${scope}:list`)[0];
        const allowed = new Set(featSpellOptions(content, feat.id, ch.id, list).map((x) => x.id));
        if (got.some((v) => !allowed.has(v)))
          err('escolhas', `${label}: escolha magias da lista e do círculo certos.`);
      }
    }
  }

  // ---- magias de cada classe conjuradora
  const byId = new Map(content.spells.map((x) => [x.id, x]));
  const budgets = spellBudgets(c, content);
  for (const budget of budgets) {
    const { cantrips, prepared } = chosenSpells(c, budget.key);
    const name = budget.className;
    const of = budgets.length > 1 ? ` de ${name}` : '';
    const fits = (id: string, min: number, max: number) => {
      const sp = byId.get(id);
      return !!sp && sp.classes.includes(budget.classId) && sp.level >= min && sp.level <= max;
    };
    if (cantrips.length > budget.cantrips)
      err('escolhas', `Truques${of} demais: ${cantrips.length} de ${budget.cantrips}.`);
    else if (cantrips.length < budget.cantrips)
      err(
        'escolhas',
        `Escolha ${budget.cantrips} truques${of} (${cantrips.length} de ${budget.cantrips}).`,
      );
    if (cantrips.some((id) => !fits(id, 0, 0)))
      err('escolhas', `Há truques que não são da lista de ${name}.`);
    if (prepared.length > budget.prepared)
      err('escolhas', `Magias preparadas${of} demais: ${prepared.length} de ${budget.prepared}.`);
    else if (prepared.length < budget.prepared)
      err(
        'escolhas',
        `Escolha ${budget.prepared} magias preparadas${of} (${prepared.length} de ${budget.prepared}).`,
      );
    if (prepared.some((id) => !fits(id, 1, budget.maxCircle)))
      err(
        'escolhas',
        `Há magias preparadas fora da lista de ${name} ou acima do ${budget.maxCircle}º círculo.`,
      );
    if (new Set([...cantrips, ...prepared]).size !== cantrips.length + prepared.length)
      err('escolhas', 'Há magias repetidas.');
    if (prepared.some((id) => budget.alwaysPrepared.includes(id)))
      warn(
        'escolhas',
        'Uma magia preparada já vem sempre preparada pela subclasse; troque por outra.',
      );
  }
  if (
    !budgets.some((b) => b.key === 'principal') &&
    (c.spells.cantrips.length || c.spells.prepared.length)
  )
    err('escolhas', 'Sua classe não tem magias próprias; remova as magias escolhidas.');
  for (const key of Object.keys(c.spells.byClass ?? {}))
    if (
      !budgets.some((b) => b.key === key) &&
      (c.spells.byClass?.[key]?.cantrips.length || c.spells.byClass?.[key]?.prepared.length)
    )
      err('escolhas', 'Há magias de uma classe que não lança magias (ou que saiu da multiclasse).');

  // ---- equipamento
  if (classDef && !classDef.startingEquipment.some((o) => o.id === c.startingEquipment.classOption))
    err('escolhas', 'Escolha o equipamento inicial da classe.');
  if (
    background &&
    !background.equipment.some((o) => o.id === c.startingEquipment.backgroundOption)
  )
    err('escolhas', 'Escolha o equipamento inicial do antecedente.');

  // ---- pontos de vida
  if (classDef && c.hp.method === 'rolagem') {
    const dice = hitDiceByLevel(entries);
    for (let l = 2; l <= c.level; l++) {
      const die = dice[l - 1] ?? classDef.hitDie;
      const r = c.hp.rolls[l];
      if (r === undefined || !Number.isInteger(r) || r < 1 || r > die) {
        err('escolhas', `Role o dado de vida do nível ${l} (1 a ${die}).`);
        break;
      }
    }
  }

  // ---- idiomas
  if (pick('idiomas').length !== 2) err('escolhas', 'Escolha dois idiomas além do Comum.');

  // ---- detalhes
  if (!c.name.trim()) warn('detalhes', 'Seu personagem ainda não tem nome.');

  return issues;
}

/** Categorias de talento permitidas num nível de talento da classe. */
export function allowedFeatCategories(
  level: number,
  classDef: ContentBundle['classes'][number],
): Feat['category'][] {
  const cats: Feat['category'][] = ['geral', 'origem'];
  if (classDef.features.some((f) => f.choices?.some((ch) => ch.featCategory === 'estilo-de-luta')))
    cats.push('estilo-de-luta');
  if (level >= classDef.epicBoonLevel) cats.push('dadiva-epica');
  return cats;
}

function ctxFor(c: Character, classDef?: ContentBundle['classes'][number], classLevel?: number) {
  const modifiers = Object.fromEntries(
    ABILITIES.map((a) => [a, abilityModifier(c.abilities.base[a])]),
  ) as Record<(typeof ABILITIES)[number], number>;
  return {
    level: classLevel ?? c.level,
    proficiencyBonus: proficiencyBonus(c.level),
    modifiers,
    ...(classDef && { classDef }),
  };
}
