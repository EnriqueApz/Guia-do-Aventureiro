import { Search } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { usePageTitle } from '@/app/usePageTitle';
import { content } from '@/content';
import { Badge } from '@/components/ui/Badge';
import { RichText } from '@/components/ui/RichText';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/routes/PageHeader';
import {
  buildGlossary,
  initialOf,
  KIND_LABEL,
  searchGlossary,
  type GlossaryItem,
  type GlossaryKind,
} from './entries';

const ALL = buildGlossary(content);
const BY_ID = new Map(ALL.map((i) => [i.id, i]));
const KINDS: (GlossaryKind | 'todos')[] = ['todos', 'regra', 'condicao', 'propriedade', 'maestria'];

export default function GlossaryPage() {
  usePageTitle('Glossário');
  const searchId = useId();
  const { hash } = useLocation();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<GlossaryKind | 'todos'>('todos');
  const target = decodeURIComponent(hash.slice(1));

  const results = useMemo(
    () => searchGlossary(ALL, query).filter((i) => kind === 'todos' || i.kind === kind),
    [query, kind],
  );
  const groups = useMemo(() => {
    const map = new Map<string, GlossaryItem[]>();
    for (const item of results) {
      const letter = initialOf(item.term);
      map.set(letter, [...(map.get(letter) ?? []), item]);
    }
    return [...map];
  }, [results]);

  // Abre direto no termo vindo de um link (ex.: "Ver no glossário" no popover).
  // Ao chegar por um link para um termo, limpa busca e filtro para ele aparecer.
  const [lastTarget, setLastTarget] = useState(target);
  if (target !== lastTarget) {
    setLastTarget(target);
    if (target) {
      setQuery('');
      setKind('todos');
    }
  }
  useEffect(() => {
    if (target) document.getElementById(target)?.scrollIntoView({ block: 'start' });
  }, [target]);

  const searching = query.trim().length > 0;

  return (
    <>
      <PageHeader eyebrow="Apoio" title="Glossário">
        <p>
          Os termos de D&amp;D explicados em uma linha. A busca ignora acentos e também acha pelos
          nomes em inglês.
        </p>
      </PageHeader>

      <div className="sticky top-16 z-10 -mx-4 mb-6 space-y-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur-md">
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Buscar termo
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-ink-muted"
          />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: salvaguarda, vantagem, cego…"
            className="min-h-12 w-full rounded-lg border border-line-strong bg-surface pr-3 pl-10 text-lg"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className="min-h-11 cursor-pointer rounded-full border border-line-strong px-3 text-sm font-semibold aria-pressed:border-seal aria-pressed:bg-seal aria-pressed:text-on-seal"
            >
              {k === 'todos' ? 'Tudo' : KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <p className="text-sm text-ink-muted" aria-live="polite">
          {results.length === 1 ? '1 termo' : `${results.length} termos`}
        </p>
      </div>

      {!searching && (
        <nav aria-label="Índice por letra" className="mb-6 flex flex-wrap gap-1">
          {groups.map(([letter]) => (
            <a
              key={letter}
              href={`#letra-${letter}`}
              className="flex size-11 items-center justify-center rounded-lg border border-line font-display font-semibold hover:border-gold"
            >
              {letter}
            </a>
          ))}
        </nav>
      )}

      {results.length === 0 && (
        <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-ink-muted">
          Nenhum termo encontrado para “{query}”. Tente uma palavra mais curta.
        </p>
      )}

      {searching ? (
        <ul className="space-y-3">
          {results.map((item) => (
            <li key={item.id}>
              <Entry item={item} highlighted={item.id === target} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-8">
          {groups.map(([letter, items]) => (
            <section key={letter} aria-labelledby={`letra-${letter}`}>
              <h2
                id={`letra-${letter}`}
                className="mb-3 scroll-mt-48 border-b border-line pb-1 text-3xl font-semibold text-gold"
              >
                {letter}
              </h2>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.id}>
                    <Entry item={item} highlighted={item.id === target} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function Entry({ item, highlighted }: { item: GlossaryItem; highlighted: boolean }) {
  const see = item.seeAlso.map((id) => BY_ID.get(id)).filter((x) => !!x);
  return (
    <article
      id={item.id}
      className={cn(
        'scroll-mt-48 rounded-card border bg-surface p-4 shadow-card',
        highlighted ? 'border-seal ring-2 ring-seal/30' : 'border-line',
      )}
    >
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-xl font-semibold">{item.term}</h3>
        {item.kind !== 'regra' && <Badge>{KIND_LABEL[item.kind]}</Badge>}
      </header>
      {item.aliases.length > 0 && item.kind === 'regra' && (
        <p className="text-sm text-ink-muted">Também: {item.aliases.join(', ')}</p>
      )}
      <p className="mt-1">{item.short}</p>
      {item.long && (
        <details className="mt-2" open={highlighted}>
          <summary className="min-h-11 cursor-pointer text-sm font-semibold text-gold">
            {item.kind === 'regra' ? 'Saiba mais' : 'Regra completa'}
          </summary>
          <RichText text={item.long} className="mt-1 text-sm text-ink-muted" />
        </details>
      )}
      {see.length > 0 && (
        <p className="mt-2 text-sm">
          Veja também:{' '}
          {see.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ', '}
              <Link
                to={`#${s.id}`}
                className="font-semibold text-ink underline decoration-seal decoration-2 underline-offset-2"
              >
                {s.term}
              </Link>
            </span>
          ))}
        </p>
      )}
    </article>
  );
}
