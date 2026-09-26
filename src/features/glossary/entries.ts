/**
 * Glossário unificado: termos de regra + condições, propriedades de arma e
 * maestrias vindas do conteúdo do SRD. Busca instantânea que ignora acentos.
 */
import type { ContentBundle } from '@/content/schema';

export type GlossaryKind = 'regra' | 'condicao' | 'propriedade' | 'maestria';

export interface GlossaryItem {
  id: string;
  term: string;
  aliases: string[];
  short: string;
  long?: string;
  seeAlso: string[];
  kind: GlossaryKind;
}

export const KIND_LABEL: Record<GlossaryKind, string> = {
  regra: 'Regra',
  condicao: 'Condição',
  propriedade: 'Propriedade de arma',
  maestria: 'Maestria',
};

/** Minúsculas e sem acentos: "Salvaguarda" e "salváguarda" batem. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

export function buildGlossary(content: ContentBundle): GlossaryItem[] {
  const items: GlossaryItem[] = content.glossary.map((g) => ({
    id: g.id,
    term: g.term,
    aliases: g.aliases,
    short: g.short,
    ...(g.long && { long: g.long }),
    seeAlso: g.seeAlso,
    kind: 'regra',
  }));
  const terms = new Set(items.map((i) => normalize(i.term)));
  const add = (item: GlossaryItem) => {
    // Se já existe um termo de regra com o mesmo nome, ele tem prioridade.
    if (terms.has(normalize(item.term))) return;
    terms.add(normalize(item.term));
    items.push(item);
  };
  for (const c of content.conditions)
    add({
      id: `condicao-${c.id}`,
      term: c.name,
      aliases: [c.id],
      short: c.plain,
      long: c.text,
      seeAlso: ['condicao'],
      kind: 'condicao',
    });
  for (const p of content.weaponProperties)
    add({
      id: `propriedade-${p.id}`,
      term: p.name,
      aliases: [],
      short: p.plain,
      long: p.text,
      seeAlso: [],
      kind: 'propriedade',
    });
  for (const m of content.masteries)
    add({
      id: `maestria-${m.id}`,
      term: m.name,
      aliases: [],
      short: m.plain,
      long: m.text,
      seeAlso: ['maestria'],
      kind: 'maestria',
    });
  return items.sort((a, b) => normalize(a.term).localeCompare(normalize(b.term)));
}

/**
 * Busca: primeiro os termos que começam com a busca, depois os que a contêm,
 * depois sinônimos e, por fim, a explicação. Busca vazia devolve tudo.
 */
export function searchGlossary(items: GlossaryItem[], query: string): GlossaryItem[] {
  const q = normalize(query);
  if (!q) return items;
  const scored: { item: GlossaryItem; score: number }[] = [];
  for (const item of items) {
    const term = normalize(item.term);
    let score = 0;
    if (term === q) score = 100;
    else if (term.startsWith(q)) score = 80;
    else if (term.includes(q)) score = 60;
    else if (item.aliases.some((a) => normalize(a).startsWith(q))) score = 50;
    else if (item.aliases.some((a) => normalize(a).includes(q))) score = 40;
    else if (normalize(item.short).includes(q)) score = 20;
    else if (item.long && normalize(item.long).includes(q)) score = 10;
    if (score) scored.push({ item, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.item);
}

/** Letra inicial (sem acento, maiúscula) para o índice A–Z. */
export function initialOf(term: string): string {
  return normalize(term).charAt(0).toUpperCase();
}
