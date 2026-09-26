/**
 * Conteúdo próprio do grupo: espécies, subclasses, antecedentes e talentos criados
 * no navegador (ou recebidos num pacote JSON). Fica só neste aparelho e é mesclado
 * por cima do SRD quando o site carrega.
 */
import { z } from 'zod';
import { Background, Feat, Species, Subclass, type ContentBundle } from './schema';
import { validateContent } from './validate';

export const HOMEBREW_KEY = 'guia:conteudo';
export const PACK_APP = 'guia-do-aventureiro';

export const HomebrewPack = z.object({
  app: z.literal(PACK_APP).default(PACK_APP),
  kind: z.literal('conteudo').default('conteudo'),
  version: z.literal(1).default(1),
  name: z.string().optional(),
  species: z.array(Species).default([]),
  subclasses: z.array(Subclass).default([]),
  backgrounds: z.array(Background).default([]),
  feats: z.array(Feat).default([]),
});
export type HomebrewPack = z.infer<typeof HomebrewPack>;
export type HomebrewKind = 'species' | 'subclasses' | 'backgrounds' | 'feats';

export const EMPTY_PACK: HomebrewPack = {
  app: PACK_APP,
  kind: 'conteudo',
  version: 1,
  species: [],
  subclasses: [],
  backgrounds: [],
  feats: [],
};

export function packSize(p: HomebrewPack): number {
  return p.species.length + p.subclasses.length + p.backgrounds.length + p.feats.length;
}

/**
 * SRD + conteúdo próprio. Um stub some quando o grupo cria uma opção com o mesmo
 * id (é assim que "completar" funciona).
 */
export function mergeContent(base: ContentBundle, pack: HomebrewPack): ContentBundle {
  if (!packSize(pack)) return base;
  const ids = new Set([
    ...pack.species.map((x) => x.id),
    ...pack.subclasses.map((x) => x.id),
    ...pack.backgrounds.map((x) => x.id),
    ...pack.feats.map((x) => x.id),
  ]);
  return {
    ...base,
    species: [...base.species, ...pack.species],
    subclasses: [...base.subclasses, ...pack.subclasses],
    backgrounds: [...base.backgrounds, ...pack.backgrounds],
    feats: [...base.feats, ...pack.feats],
    stubs: base.stubs.filter((s) => !ids.has(s.id)),
  };
}

/** Erros do pacote: formato (Zod) e consistência com o SRD (ids, referências). */
export function checkPack(
  data: unknown,
  base: ContentBundle,
): { pack?: HomebrewPack; errors: string[] } {
  const parsed = HomebrewPack.safeParse(data);
  if (!parsed.success)
    return {
      errors: parsed.error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join(' › ') || 'pacote'}: ${i.message}`),
    };
  const pack = parsed.data;
  const errors: string[] = [];
  const srdIds = new Set(
    [...base.species, ...base.subclasses, ...base.backgrounds, ...base.feats]
      .filter((x) => x.source.kind === 'srd')
      .map((x) => x.id),
  );
  for (const list of [pack.species, pack.subclasses, pack.backgrounds, pack.feats])
    for (const x of list)
      if (srdIds.has(x.id)) errors.push(`“${x.name}” usa o id "${x.id}", que já é do SRD.`);
  if (errors.length) return { errors };
  const report = validateContent(mergeContent(base, pack));
  return report.errors.length ? { errors: report.errors } : { pack, errors: [] };
}

/** Lê o conteúdo próprio salvo no navegador (sem quebrar se estiver corrompido). */
export function loadHomebrew(): HomebrewPack {
  try {
    if (typeof localStorage === 'undefined') return EMPTY_PACK;
    const raw = localStorage.getItem(HOMEBREW_KEY);
    if (!raw) return EMPTY_PACK;
    const stored = JSON.parse(raw) as { state?: { pack?: unknown } };
    const parsed = HomebrewPack.safeParse(stored.state?.pack);
    return parsed.success ? parsed.data : EMPTY_PACK;
  } catch {
    return EMPTY_PACK;
  }
}

/** Id em kebab-case a partir do nome ("Caminho do Fanático" → "caminho-do-fanatico"). */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Primeira frase de um texto, usada como explicação simples quando o grupo não escreve uma. */
export function firstSentence(text: string): string {
  const clean = text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  const m = /^(.+?[.!?])(\s|$)/.exec(clean);
  return (m?.[1] ?? clean).slice(0, 200);
}
