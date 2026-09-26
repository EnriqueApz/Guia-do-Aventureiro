import { Copy, Download, Pencil, Play, Plus, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { content } from '@/content';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { Card } from '@/components/ui/Card';
import { usePageTitle } from '@/app/usePageTitle';
import { downloadText } from '@/lib/download';
import { exportCharacters, exportFileName, parseImport, type ImportResult } from '@/model/transfer';
import { validateCharacter } from '@/rules/validate';
import { sortByRecent, useCharacters, type CharacterDraft } from '@/state/characters';
import { PageHeader } from './PageHeader';
import { useStartCharacter } from './useStartCharacter';

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });

function identity(c: CharacterDraft): string {
  const species = content.species.find((s) => s.id === c.speciesId)?.name;
  const cls = content.classes.find((x) => x.id === c.classId)?.name;
  return [species, cls && `${cls} ${c.level}`].filter(Boolean).join(' · ') || `Nível ${c.level}`;
}

export default function CharactersPage() {
  usePageTitle('Meus personagens');
  const characters = useCharacters((s) => s.characters);
  const { duplicate, remove, restore, importMany } = useCharacters();
  const start = useStartCharacter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [lastRemoved, setLastRemoved] = useState<CharacterDraft | null>(null);
  const [imported, setImported] = useState<ImportResult | null>(null);
  const list = sortByRecent(characters);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const result = parseImport(await file.text(), new Set(Object.keys(characters)));
    importMany(result.characters);
    setImported(result);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <PageHeader eyebrow="Salvos neste aparelho" title="Meus personagens">
        <p>
          Tudo fica guardado no seu navegador. Para levar para outro aparelho, exporte e importe o
          arquivo.
        </p>
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-3">
        <Button onClick={start}>
          <Plus aria-hidden className="size-5" />
          Novo personagem
        </Button>
        <Button variant="secundario" onClick={() => fileRef.current?.click()}>
          <Upload aria-hidden className="size-5" />
          Importar arquivo
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Arquivo de personagens para importar"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        {list.length > 0 && (
          <Button
            variant="secundario"
            onClick={() => downloadText(exportFileName(list), exportCharacters(list))}
          >
            <Download aria-hidden className="size-5" />
            Exportar todos
          </Button>
        )}
      </div>

      <div aria-live="polite" className="space-y-3">
        {imported && (
          <Card className="space-y-2 py-3">
            {imported.characters.length > 0 && (
              <p className="font-semibold text-forest">
                {imported.characters.length === 1
                  ? '1 personagem importado.'
                  : `${imported.characters.length} personagens importados.`}
                {imported.renamed.length > 0 &&
                  ` ${imported.renamed.join(', ')} já existia${imported.renamed.length > 1 ? 'm' : ''} aqui e entrou como outro personagem.`}
              </p>
            )}
            {imported.errors.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-danger">
                {imported.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            <Button variant="fantasma" onClick={() => setImported(null)}>
              Fechar aviso
            </Button>
          </Card>
        )}
        {lastRemoved && (
          <Card className="flex flex-wrap items-center justify-between gap-3 py-3">
            <p>
              <strong>{lastRemoved.name || 'Personagem sem nome'}</strong> foi excluído.
            </p>
            <Button
              variant="secundario"
              onClick={() => {
                restore(lastRemoved);
                setLastRemoved(null);
              }}
            >
              Desfazer
            </Button>
          </Card>
        )}
      </div>

      {list.length === 0 ? (
        <Card className="mt-3 max-w-xl text-center">
          <p className="font-display text-xl font-semibold">Nenhum aventureiro por aqui ainda.</p>
          <p className="mt-2 text-ink-muted">Que tal criar o primeiro? Leva uns 15 minutos.</p>
        </Card>
      ) : (
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {list.map((c) => {
            const name = c.name || 'Personagem sem nome';
            const pending = validateCharacter(c, content).filter(
              (i) => i.severity === 'erro',
            ).length;
            return (
              <li key={c.id}>
                <Card className="flex h-full flex-col gap-3 py-4">
                  <Link to={`/ficha/${c.id}`} className="min-w-0 rounded-md">
                    <span className="block truncate font-display text-xl font-semibold">
                      {name}
                    </span>
                    <span className="block text-sm text-ink-muted">{identity(c)}</span>
                    <span className="block text-xs text-ink-muted">
                      {pending
                        ? `Em criação: falta${pending > 1 ? 'm' : ''} ${pending} ${pending > 1 ? 'coisas' : 'coisa'}`
                        : 'Ficha pronta'}{' '}
                      · editado em {dateFormat.format(new Date(c.updatedAt))}
                    </span>
                  </Link>
                  <div className="mt-auto flex flex-wrap items-center gap-1">
                    <Link
                      to={`/ficha/${c.id}?modo=jogo`}
                      className={buttonClasses(pending ? 'secundario' : 'primario')}
                      aria-label={`Jogar com ${name}`}
                    >
                      <Play aria-hidden className="size-4" /> Jogar
                    </Link>
                    <Link
                      to={`/criar/${c.id}`}
                      className={buttonClasses('fantasma')}
                      aria-label={`Editar ${name}`}
                    >
                      <Pencil aria-hidden className="size-4" /> Editar
                    </Link>
                    <span className="ml-auto flex gap-1">
                      <Button
                        variant="fantasma"
                        size="icone"
                        aria-label={`Exportar ${name}`}
                        onClick={() => downloadText(exportFileName([c]), exportCharacters([c]))}
                      >
                        <Download aria-hidden className="size-5" />
                      </Button>
                      <Button
                        variant="fantasma"
                        size="icone"
                        aria-label={`Duplicar ${name}`}
                        onClick={() => duplicate(c.id)}
                      >
                        <Copy aria-hidden className="size-5" />
                      </Button>
                      <Button
                        variant="fantasma"
                        size="icone"
                        aria-label={`Excluir ${name}`}
                        onClick={() => setLastRemoved(remove(c.id) ?? null)}
                      >
                        <Trash2 aria-hidden className="size-5" />
                      </Button>
                    </span>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
