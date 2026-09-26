import { Copy, Printer } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { usePageTitle } from '@/app/usePageTitle';
import { content } from '@/content';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { Card } from '@/components/ui/Card';
import { newId } from '@/lib/id';
import { decodeShare, hashParam } from '@/lib/share';
import { parseSharedCharacter } from '@/model/transfer';
import { derive } from '@/rules/derive';
import { useCharacters } from '@/state/characters';
import { PrintSheet } from './PrintSheet';
import { SheetDetails } from './SheetDetails';

/** `/ver#d=...`: ficha recebida por link, só para ler, com opção de salvar uma cópia. */
export default function SharedPage() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const importMany = useCharacters((s) => s.importMany);
  const { character, error } = useMemo(() => {
    const code = hashParam(hash, 'd');
    return code
      ? parseSharedCharacter(decodeShare(code))
      : { error: 'Este link não traz ficha nenhuma.' };
  }, [hash]);
  usePageTitle(
    character ? `${character.name || 'Personagem'} (compartilhado)` : 'Ficha compartilhada',
  );

  if (!character) {
    return (
      <Card className="max-w-xl space-y-3">
        <h1 className="text-2xl font-semibold">Não deu para abrir esta ficha</h1>
        <p>{error}</p>
        <p className="text-ink-muted">Peça para a pessoa copiar o link de novo, inteiro.</p>
        <Link to="/" className={buttonClasses('secundario')}>
          Ir para o início
        </Link>
      </Card>
    );
  }
  const sheet = derive(character, content);

  const saveCopy = () => {
    const now = new Date().toISOString();
    const copy = { ...structuredClone(character), id: newId(), createdAt: now, updatedAt: now };
    importMany([copy]);
    void navigate(`/ficha/${copy.id}`);
  };

  return (
    <>
      <header className="mb-6 space-y-3 print:hidden">
        <p className="font-display text-sm font-semibold tracking-[0.2em] text-gold uppercase">
          Ficha compartilhada · só leitura
        </p>
        <h1 className="text-4xl font-semibold">{character.name || 'Personagem sem nome'}</h1>
        <p className="text-ink-muted">
          Você está vendo uma ficha que alguém mandou. Nada aqui muda os seus personagens até você
          salvar uma cópia.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={saveCopy}>
            <Copy aria-hidden className="size-4" /> Salvar uma cópia
          </Button>
          <Button variant="secundario" onClick={() => window.print()}>
            <Printer aria-hidden className="size-4" /> Imprimir
          </Button>
        </div>
      </header>
      <div className="print:hidden">
        <SheetDetails character={character} sheet={sheet} />
      </div>
      <div className="hidden print:block">
        <PrintSheet character={character} sheet={sheet} />
      </div>
    </>
  );
}
