import { Copy, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { usePageTitle } from '@/app/usePageTitle';
import { sortByRecent, useCharacters, type CharacterDraft } from '@/state/characters';
import { PageHeader } from './PageHeader';
import { useStartCharacter } from './useStartCharacter';

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });

export default function CharactersPage() {
  usePageTitle('Meus personagens');
  const characters = useCharacters((s) => s.characters);
  const { duplicate, remove, restore } = useCharacters();
  const start = useStartCharacter();
  const [lastRemoved, setLastRemoved] = useState<CharacterDraft | null>(null);
  const list = sortByRecent(characters);

  return (
    <>
      <PageHeader eyebrow="Salvos neste aparelho" title="Meus personagens">
        <p>Tudo fica guardado no seu navegador. Nada vai para servidor nenhum.</p>
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-3">
        <Button onClick={start}>
          <Plus aria-hidden className="size-5" />
          Novo personagem
        </Button>
      </div>

      <div aria-live="polite">
        {lastRemoved && (
          <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 py-3">
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
        <Card className="max-w-xl text-center">
          <p className="font-display text-xl font-semibold">Nenhum aventureiro por aqui ainda.</p>
          <p className="mt-2 text-ink-muted">Que tal criar o primeiro? Leva uns 15 minutos.</p>
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((c) => (
            <li key={c.id}>
              <Card className="flex items-center justify-between gap-3 py-4">
                <Link to={`/criar/${c.id}`} className="min-w-0 flex-1 rounded-md">
                  <span className="block truncate font-display text-xl font-semibold">
                    {c.name || 'Personagem sem nome'}
                  </span>
                  <span className="block text-sm text-ink-muted">
                    Nível <span className="num">{c.level}</span> · editado em{' '}
                    {dateFormat.format(new Date(c.updatedAt))}
                  </span>
                </Link>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="fantasma"
                    size="icone"
                    aria-label={`Duplicar ${c.name || 'personagem sem nome'}`}
                    onClick={() => duplicate(c.id)}
                  >
                    <Copy aria-hidden className="size-5" />
                  </Button>
                  <Button
                    variant="fantasma"
                    size="icone"
                    aria-label={`Excluir ${c.name || 'personagem sem nome'}`}
                    onClick={() => setLastRemoved(remove(c.id) ?? null)}
                  >
                    <Trash2 aria-hidden className="size-5" />
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
