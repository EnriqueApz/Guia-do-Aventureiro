import { thorin } from '@/test/characters';
import { parseSharedCharacter } from '@/model/transfer';
import { decodeShare, encodeShare, hashParam } from './share';

describe('links de compartilhamento', () => {
  it('ida e volta de um personagem, com URL curta o bastante', () => {
    const c = thorin(5);
    const code = encodeShare(c);
    expect(code).toMatch(/^[A-Za-z0-9+\-$]+$/);
    expect(code.length).toBeLessThan(4000);
    expect(parseSharedCharacter(decodeShare(code))).toEqual({ character: c });
  });

  it('links quebrados dão mensagens claras', () => {
    expect(decodeShare('lixo!!')).toBeUndefined();
    expect(parseSharedCharacter(undefined).error).toContain('incompleto');
    expect(parseSharedCharacter(decodeShare(encodeShare({ nome: 'x' }))).error).toContain(
      'não traz um personagem válido',
    );
  });

  it('lê parâmetros do hash', () => {
    expect(hashParam('#d=abc&x=1', 'd')).toBe('abc');
    expect(hashParam('', 'd')).toBeUndefined();
  });
});
