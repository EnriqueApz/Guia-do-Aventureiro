import { srdContent } from '@/content';
import { checkPack, PACK_APP, type HomebrewPack } from '@/content/homebrew';

export type ReadResult = { pack: HomebrewPack; errors?: undefined } | { errors: string[] };

/** Lê um arquivo de pacote e confere contra o SRD. Não grava nada. */
export async function readPackFile(file: File): Promise<ReadResult> {
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    return { errors: ['Este arquivo não é um pacote do Guia do Aventureiro (não é um JSON).'] };
  }
  const obj = data as { app?: unknown; kind?: unknown } | null;
  if (!obj || typeof obj !== 'object' || obj.app !== PACK_APP || obj.kind !== 'conteudo')
    return { errors: ['Este arquivo não é um pacote de conteúdo do Guia do Aventureiro.'] };
  const { pack, errors } = checkPack(data, srdContent);
  return pack ? { pack } : { errors };
}
