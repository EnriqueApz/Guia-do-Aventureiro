/**
 * Validação do personagem: tudo o que falta ou está fora das regras.
 * Retorna uma lista de problemas, cada um ligado à etapa do assistente que resolve.
 */
import type { Choice, ContentBundle, Feature } from '@/content/schema';
import { ABILITIES } from '@/content/schema';
import { choiceKey, type Character } from '@/model/character';
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
  if (classDef && c.level >= 3) {
    const sub = content.subclasses.find((s) => s.id === c.subclassId);
    if (!sub) err('subclasse', `No nível ${c.level}, escolha uma subclasse de ${classDef.name}.`);
    else if (sub.classId !== classDef.id)
      err('subclasse', `${sub.name} não é uma subclasse de ${classDef.name}.`);
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
  if (method === 'rolagem' || method === 'manual') {
    if (ABILITIES.some((a) => base[a] < 3 || base[a] > 18))
      err('atributos', 'Valores rolados vão de 3 a 18.');
  }

  // ---- talentos por nível
  if (classDef) {
    for (const lvl of [...classDef.featLevels, classDef.epicBoonLevel]) {
      if (lvl > c.level) continue;
      const fp = c.feats.find((f) => f.level === lvl);
      if (!fp) {
        err('escolhas', `Escolha o talento do nível ${lvl}.`);
        continue;
      }
      const feat = content.feats.find((f) => f.id === fp.featId);
      if (!feat) err('escolhas', `Talento desconhecido no nível ${lvl}.`);
      else if (feat.prerequisite?.level && feat.prerequisite.level > c.level) {
        err('escolhas', `${feat.name} exige nível ${feat.prerequisite.level}.`);
      } else if (
        feat.abilityIncrease?.mode === 'um+2-ou-dois+1' &&
        !isValidAsi(fp.abilityBonus ?? {})
      ) {
        err('escolhas', `Nível ${lvl}: distribua o aumento (+2 em um atributo ou +1 em dois).`);
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
  const subclass = c.level >= 3 ? content.subclasses.find((x) => x.id === c.subclassId) : undefined;
  const scopes: [string, Feature[]][] = [
    ['especie', species?.traits ?? []],
    ['linhagem', lineage?.traits ?? []],
    ['classe', classDef?.features ?? []],
    ['subclasse', subclass?.features ?? []],
  ];
  const ctx = ctxFor(c, classDef);
  for (const [scope, features] of scopes) {
    for (const f of features) {
      if ((f.level ?? 1) > c.level) continue;
      for (const ch of f.choices ?? ([] as Choice[])) {
        // Magias ficam para a etapa de magias (fase 4).
        if (ch.kind === 'magia') continue;
        const need = evaluateFormula(ch.count, ctx);
        const got = pick(choiceKey(scope, f.id, ch.id)).length;
        if (got < need) err('escolhas', `${ch.label}: escolha ${need} (${got} de ${need}).`);
        if (got > need) err('escolhas', `${ch.label}: escolha só ${need}.`);
      }
    }
  }

  // ---- idiomas
  if (pick('idiomas').length !== 2) err('escolhas', 'Escolha dois idiomas além do Comum.');

  // ---- detalhes
  if (!c.name.trim()) warn('detalhes', 'Seu personagem ainda não tem nome.');

  return issues;
}

function ctxFor(c: Character, classDef?: ContentBundle['classes'][number]) {
  const modifiers = Object.fromEntries(
    ABILITIES.map((a) => [a, abilityModifier(c.abilities.base[a])]),
  ) as Record<(typeof ABILITIES)[number], number>;
  return {
    level: c.level,
    proficiencyBonus: proficiencyBonus(c.level),
    modifiers,
    ...(classDef && { classDef }),
  };
}
