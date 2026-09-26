/**
 * Links de compartilhamento: o dado vai comprimido no #hash da URL, que nunca
 * chega a servidor nenhum.
 */
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export function encodeShare(data: unknown): string {
  return compressToEncodedURIComponent(JSON.stringify(data));
}

/** Devolve `undefined` se o texto não for um link válido. */
export function decodeShare(encoded: string): unknown {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return undefined;
    return JSON.parse(json) as unknown;
  } catch {
    return undefined;
  }
}

/** Lê um parâmetro do hash ("#d=..."). */
export function hashParam(hash: string, key: string): string | undefined {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return params.get(key) ?? undefined;
}

/** URL absoluta dentro do site, respeitando a base do GitHub Pages. */
export function siteUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${window.location.origin}${base}${path}`;
}
