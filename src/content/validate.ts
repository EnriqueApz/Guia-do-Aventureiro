/**
 * Validação do conteúdo: esquema (Zod) + consistência entre coleções.
 * Usada pelo `npm run content:check`, pelos testes e (fase 7) pelo editor de
 * conteúdo próprio.
 */
import {
  ContentBundle,
  SKILLS,
  type ClassDef,
  type Effect,
  type Feature,
  type Formula,
} from './schema';

export interface ContentReport {
  errors: string[];
  warnings: string[];
}

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export function validateContent(
  raw: unknown,
  options: { spellIds?: Set<string> } = {},
): ContentReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const parsed = ContentBundle.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`esquema: ${issue.path.join('.')}: ${issue.message}`);
    }
    return { errors, warnings };
  }
  const c = parsed.data;

  // ---- ids únicos por coleção
  const collections = {
    especies: c.species,
    classes: c.classes,
    subclasses: c.subclasses,
    antecedentes: c.backgrounds,
    talentos: c.feats,
    itens: c.items,
    magias: c.spells,
    idiomas: c.languages,
    condicoes: c.conditions,
    glossario: c.glossary,
    stubs: c.stubs,
  } as const;
  for (const [name, list] of Object.entries(collections)) {
    const seen = new Set<string>();
    for (const entry of list) {
      if (seen.has(entry.id)) errors.push(`${name}: id duplicado "${entry.id}"`);
      seen.add(entry.id);
    }
  }

  const itemIds = new Set(c.items.map((i) => i.id));
  const featIds = new Set(c.feats.map((f) => f.id));
  const classIds = new Set(c.classes.map((x) => x.id));
  const languageIds = new Set(c.languages.map((l) => l.id));
  const skillIds = new Set<string>(SKILLS);
  const glossaryIds = new Set(c.glossary.map((g) => g.id));

  const checkItem = (where: string, id: string) => {
    if (!itemIds.has(id)) errors.push(`${where}: item "${id}" não existe`);
  };

  const spellIds = options.spellIds ?? new Set(c.spells.map((s) => s.id));
  const checkSpell = (where: string, id: string) => {
    if (!spellIds.has(id)) errors.push(`${where}: magia "${id}" não existe`);
  };

  const checkFormula = (where: string, f: Formula, cls?: ClassDef) => {
    if (typeof f === 'object' && f.kind === 'coluna') {
      if (!cls) errors.push(`${where}: fórmula de coluna fora de uma classe`);
      else if (!cls.columns.some((col) => col.id === f.column)) {
        errors.push(`${where}: coluna "${f.column}" não existe em ${cls.id}`);
      }
    }
  };

  const checkEffects = (where: string, effects: Effect[] | undefined, cls?: ClassDef) => {
    for (const e of effects ?? []) {
      if (e.type === 'magia') checkSpell(where, e.spell);
      if (e.type === 'deslocamento-bonus') checkFormula(where, e.value, cls);
      if (e.type === 'proficiencia') {
        for (const id of e.ids) {
          if (e.category === 'pericia' && !skillIds.has(id))
            errors.push(`${where}: perícia "${id}" não existe`);
          if (e.category === 'idioma' && !languageIds.has(id))
            errors.push(`${where}: idioma "${id}" não existe`);
          if (e.category === 'ferramenta' && !itemIds.has(id))
            errors.push(`${where}: ferramenta "${id}" não existe`);
        }
      }
    }
  };

  const checkFeatures = (where: string, features: Feature[], cls?: ClassDef, needPlainUpTo = 0) => {
    const seen = new Set<string>();
    for (const f of features) {
      const at = `${where} › ${f.id}`;
      if (seen.has(f.id)) errors.push(`${where}: característica duplicada "${f.id}"`);
      seen.add(f.id);
      if (!f.plain && (f.level ?? 1) <= needPlainUpTo) {
        errors.push(`${at}: falta a explicação simples ("plain")`);
      }
      if (f.uses) checkFormula(at, f.uses.max, cls);
      checkEffects(at, f.effects, cls);
      for (const ch of f.choices ?? []) {
        checkFormula(`${at} › ${ch.id}`, ch.count, cls);
        if (ch.kind === 'pericia' && Array.isArray(ch.from)) {
          for (const s of ch.from)
            if (!skillIds.has(s)) errors.push(`${at}: perícia "${s}" não existe`);
        }
        if (ch.kind === 'talento' && !ch.featCategory && !ch.from) {
          errors.push(`${at}: escolha de talento sem categoria nem lista`);
        }
        if (ch.kind === 'opcao' && !ch.options?.length)
          errors.push(`${at}: escolha de opção sem opções`);
        for (const opt of ch.options ?? []) checkEffects(`${at} › ${opt.id}`, opt.effects, cls);
      }
    }
  };

  // ---- espécies
  for (const s of c.species) {
    checkFeatures(`espécie ${s.id}`, s.traits, undefined, 20);
    const lineageIds = new Set<string>();
    for (const l of s.lineages) {
      if (lineageIds.has(l.id)) errors.push(`espécie ${s.id}: linhagem duplicada "${l.id}"`);
      lineageIds.add(l.id);
      checkFeatures(`espécie ${s.id} › ${l.id}`, l.traits);
    }
    if (s.lineages.length > 0 && !s.lineageLabel) {
      errors.push(`espécie ${s.id}: tem linhagens mas falta "lineageLabel"`);
    }
  }

  // ---- classes
  for (const cls of c.classes) {
    const at = `classe ${cls.id}`;
    checkFeatures(at, cls.features, cls, 3);
    if (cls.beginnerKit) checkKit(at, cls);
    const sorted = Object.values(cls.recommendedScores).sort((a, b) => b - a);
    if (
      Object.keys(cls.recommendedScores).length !== 6 ||
      sorted.join() !== STANDARD_ARRAY.join()
    ) {
      errors.push(
        `${at}: recommendedScores precisa usar exatamente o array padrão 15,14,13,12,10,8`,
      );
    }
    if (!cls.saves.every((s, i, arr) => arr.indexOf(s) === i))
      errors.push(`${at}: salvaguardas repetidas`);
    for (const t of cls.tools) checkItem(at, t);
    if (cls.toolChoice && Array.isArray(cls.toolChoice.from)) {
      for (const t of cls.toolChoice.from) checkItem(`${at} › ferramentas`, t);
    }
    for (const opt of cls.startingEquipment)
      for (const it of opt.items) checkItem(`${at} › equipamento ${opt.id}`, it.id);
    for (const lvl of cls.featLevels)
      if (lvl < 1 || lvl > 20) errors.push(`${at}: nível de talento inválido ${lvl}`);
    if (cls.spellcasting) {
      const { cantrips, prepared } = cls.spellcasting;
      for (let i = 1; i < 20; i++) {
        if ((cantrips[i] ?? 0) < (cantrips[i - 1] ?? 0))
          errors.push(`${at}: truques diminuem no nível ${i + 1}`);
        if ((prepared[i] ?? 0) < (prepared[i - 1] ?? 0))
          errors.push(`${at}: magias preparadas diminuem no nível ${i + 1}`);
      }
    }
    if (!c.subclasses.some((s) => s.classId === cls.id))
      warnings.push(`${at}: nenhuma subclasse disponível`);
  }

  // ---- subclasses
  for (const sub of c.subclasses) {
    const at = `subclasse ${sub.id}`;
    const cls = c.classes.find((x) => x.id === sub.classId);
    if (!cls) errors.push(`${at}: classe "${sub.classId}" não existe`);
    checkFeatures(at, sub.features, cls, 3);
    for (const group of sub.alwaysPrepared ?? []) for (const sp of group.spells) checkSpell(at, sp);
  }

  // ---- magias
  function checkKit(at: string, cls: ClassDef) {
    const kit = cls.beginnerKit;
    if (!kit) return;
    const w = `${at} › kit para iniciantes`;
    if (kit.skills.length !== cls.skillChoice.count)
      errors.push(`${w}: precisa de ${cls.skillChoice.count} perícias`);
    const from = cls.skillChoice.from;
    for (const sk of kit.skills)
      if (from !== 'qualquer' && !from.includes(sk))
        errors.push(`${w}: perícia "${sk}" fora da lista`);
    if (!cls.startingEquipment.some((o) => o.id === kit.equipment))
      errors.push(`${w}: opção de equipamento "${kit.equipment}" não existe`);
    const sc = cls.spellcasting;
    const checkList = (ids: string[] | undefined, circle: (n: number) => boolean, max: number) => {
      if (!ids) return;
      if (!sc) errors.push(`${w}: classe sem conjuração não pode ter magias no kit`);
      if (ids.length > max)
        errors.push(`${w}: magias demais para o 1º nível (${ids.length} de ${max})`);
      for (const id of ids) {
        const sp = c.spells.find((x) => x.id === id);
        if (!sp) errors.push(`${w}: magia "${id}" não existe`);
        else if (!sp.classes.includes(cls.id) || !circle(sp.level))
          errors.push(`${w}: magia "${id}" não serve para ${cls.id} no 1º nível`);
      }
    };
    checkList(kit.cantrips, (l) => l === 0, sc?.cantrips[0] ?? 0);
    checkList(kit.spells, (l) => l === 1, sc?.prepared[0] ?? 0);
  }

  for (const sp of c.spells) {
    for (const cls of sp.classes)
      if (!classIds.has(cls)) errors.push(`magia ${sp.id}: classe "${cls}" não existe`);
    if (sp.beginner && sp.level > 2)
      warnings.push(`magia ${sp.id}: marcada para iniciantes, mas é de ${sp.level}º círculo`);
  }

  // ---- antecedentes
  for (const bg of c.backgrounds) {
    const at = `antecedente ${bg.id}`;
    if (new Set(bg.abilityOptions).size !== 3)
      errors.push(`${at}: os três atributos precisam ser diferentes`);
    if (bg.skills[0] === bg.skills[1]) errors.push(`${at}: perícias repetidas`);
    const feat = c.feats.find((f) => f.id === bg.originFeat.id);
    if (!feat) errors.push(`${at}: talento "${bg.originFeat.id}" não existe`);
    else if (feat.category !== 'origem') errors.push(`${at}: talento "${feat.id}" não é de origem`);
    if (typeof bg.tool === 'string') checkItem(at, bg.tool);
    else if (Array.isArray(bg.tool.from)) for (const t of bg.tool.from) checkItem(at, t);
    for (const opt of bg.equipment)
      for (const it of opt.items) checkItem(`${at} › equipamento ${opt.id}`, it.id);
  }

  // ---- talentos
  for (const f of c.feats) checkEffects(`talento ${f.id}`, f.effects);
  void featIds;

  // ---- itens
  for (const it of c.items) {
    for (const x of it.contents ?? []) checkItem(`item ${it.id}`, x.id);
    if (it.category === 'arma' && !it.weapon) errors.push(`item ${it.id}: arma sem dados de arma`);
    if (it.category === 'armadura' && !it.armor)
      errors.push(`item ${it.id}: armadura sem dados de armadura`);
  }

  // ---- glossário
  const aliasOwner = new Map<string, string>();
  for (const g of c.glossary) {
    for (const ref of g.seeAlso) {
      if (!glossaryIds.has(ref))
        errors.push(`glossário ${g.id}: "veja também" aponta para "${ref}", que não existe`);
    }
    for (const alias of [g.term, ...g.aliases].map(normalize)) {
      const owner = aliasOwner.get(alias);
      if (owner && owner !== g.id)
        errors.push(`glossário: "${alias}" aparece em "${owner}" e "${g.id}"`);
      aliasOwner.set(alias, g.id);
    }
  }

  // ---- stubs
  for (const s of c.stubs) {
    if (s.type === 'subclasse' && (!s.parentId || !classIds.has(s.parentId))) {
      errors.push(`stub ${s.id}: subclasse precisa de "parentId" de uma classe existente`);
    }
  }

  return { errors, warnings };
}

/** Normaliza texto para comparação e busca: minúsculas, sem acentos. */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
