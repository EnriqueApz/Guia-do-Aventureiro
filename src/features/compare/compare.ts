/**
 * Linhas do comparador: duas espécies ou duas classes lado a lado.
 * Função pura; a tela só mostra as linhas e destaca as diferentes.
 */
import type { ClassDef, ContentBundle, Species } from '@/content/schema';

export interface CompareRow {
  label: string;
  a: string;
  b: string;
  differs: boolean;
}

const RATING = { facil: 'Fácil', medio: 'Média', avancado: 'Avançada' } as const;
const ROLE: Record<string, string> = {
  combatente: 'Combatente',
  defensor: 'Defensor',
  curandeiro: 'Curandeiro',
  conjurador: 'Conjurador',
  especialista: 'Especialista',
  suporte: 'Suporte',
};
const ARMOR: Record<string, string> = {
  leve: 'leves',
  media: 'médias',
  pesada: 'pesadas',
  escudo: 'escudos',
};
const PROGRESSION = { completa: 'completa', meia: 'metade', pacto: 'de pacto' } as const;

function meters(ft: number): string {
  return `${((ft / 5) * 1.5).toLocaleString('pt-BR')} m`;
}

function list(items: string[], empty = '—'): string {
  return items.length ? items.join(', ') : empty;
}

function row(label: string, a: string, b: string): CompareRow {
  return { label, a, b, differs: a !== b };
}

function speciesFacts(s: Species, content: ContentBundle) {
  const effects = s.traits.flatMap((t) => t.effects ?? []);
  const darkvision = Math.max(
    0,
    ...effects.flatMap((e) => (e.type === 'visao-no-escuro' ? [e.range] : [])),
  );
  const damage = new Map(content.damageTypes.map((d) => [d.id, d.name]));
  const resist = effects.flatMap((e) =>
    e.type === 'resistencia' ? [damage.get(e.damage) ?? e.damage] : [],
  );
  return {
    dificuldade: RATING[s.beginner.rating],
    tamanho: s.sizes.join(' ou '),
    deslocamento: meters(s.speed),
    tipo: s.creatureType,
    visao: darkvision ? meters(darkvision) : 'Não',
    resistencia: list(resist, 'Nenhuma fixa'),
    linhagens: list(
      s.lineages.map((l) => l.name.replace(/ \(.*\)$/, '')),
      'Não tem',
    ),
    tracos: list(s.traits.map((t) => t.name)),
  };
}

export function compareSpecies(a: Species, b: Species, content: ContentBundle): CompareRow[] {
  const fa = speciesFacts(a, content);
  const fb = speciesFacts(b, content);
  return [
    row('Dificuldade', fa.dificuldade, fb.dificuldade),
    row('Tamanho', fa.tamanho, fb.tamanho),
    row('Deslocamento', fa.deslocamento, fb.deslocamento),
    row('Tipo de criatura', fa.tipo, fb.tipo),
    row('Visão no Escuro', fa.visao, fb.visao),
    row('Resistência', fa.resistencia, fb.resistencia),
    row('Linhagens', fa.linhagens, fb.linhagens),
    row('Traços', fa.tracos, fb.tracos),
  ];
}

function classFacts(c: ClassDef, content: ContentBundle) {
  const ability = new Map(content.abilities.map((x) => [x.id, x.name]));
  const skill = new Map<string, string>(content.skills.map((x) => [x.id, x.name]));
  const subclasses = content.subclasses.filter((s) => s.classId === c.id).map((s) => s.name);
  const sc = c.spellcasting;
  return {
    papel: list(c.roles.map((r) => ROLE[r] ?? r)),
    dificuldade: RATING[c.beginner.rating],
    principal: c.primaryAbilities
      .map((a) => ability.get(a) ?? a)
      .join(c.primaryMode === 'e' ? ' e ' : ' ou '),
    dado: `d${c.hitDie}`,
    pv1: `${c.hitDie} + Constituição`,
    salvaguardas: c.saves.map((a) => ability.get(a) ?? a).join(' e '),
    armaduras: c.armor.length ? `Armaduras ${list(c.armor.map((a) => ARMOR[a] ?? a))}` : 'Nenhuma',
    pericias:
      c.skillChoice.from === 'qualquer'
        ? `${c.skillChoice.count} à escolha, de qualquer perícia`
        : `${c.skillChoice.count} entre ${list(c.skillChoice.from.map((s) => skill.get(s) ?? s))}`,
    magia: sc
      ? `Sim, com ${ability.get(sc.ability)} (progressão ${PROGRESSION[sc.progression]})`
      : 'Não',
    subclasse: `${c.subclassLabel} no nível 3${subclasses.length ? ` (SRD: ${list(subclasses)})` : ''}`,
    nivel1: list(c.features.filter((f) => f.level === 1).map((f) => f.name)),
    turno: c.typicalTurn,
  };
}

export function compareClasses(a: ClassDef, b: ClassDef, content: ContentBundle): CompareRow[] {
  const fa = classFacts(a, content);
  const fb = classFacts(b, content);
  return [
    row('Papel no grupo', fa.papel, fb.papel),
    row('Dificuldade', fa.dificuldade, fb.dificuldade),
    row('Atributo principal', fa.principal, fb.principal),
    row('Dado de vida', fa.dado, fb.dado),
    row('PV no 1º nível', fa.pv1, fb.pv1),
    row('Salvaguardas', fa.salvaguardas, fb.salvaguardas),
    row('Armaduras', fa.armaduras, fb.armaduras),
    row('Perícias', fa.pericias, fb.pericias),
    row('Magia', fa.magia, fb.magia),
    row('Subclasse', fa.subclasse, fb.subclasse),
    row('No 1º nível', fa.nivel1, fb.nivel1),
    row('Turno típico', fa.turno, fb.turno),
  ];
}
