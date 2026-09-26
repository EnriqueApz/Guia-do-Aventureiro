import { ArrowLeftRight } from 'lucide-react';
import { useId } from 'react';
import { useSearchParams } from 'react-router';
import { usePageTitle } from '@/app/usePageTitle';
import { content } from '@/content';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/routes/PageHeader';
import { compareClasses, compareSpecies, type CompareRow } from './compare';

type Kind = 'classes' | 'especies';

export default function ComparePage() {
  usePageTitle('Comparador');
  const [params, setParams] = useSearchParams();
  const kind: Kind = params.get('tipo') === 'especies' ? 'especies' : 'classes';
  const options =
    kind === 'classes'
      ? content.classes.map((c) => ({ id: c.id, name: c.name }))
      : content.species.map((s) => ({ id: s.id, name: s.name }));
  const valid = (id: string | null, fallback: number) =>
    options.find((o) => o.id === id)?.id ?? options[fallback]?.id ?? '';
  const a = valid(params.get('a'), kind === 'classes' ? 4 : 1);
  const b = valid(params.get('b'), kind === 'classes' ? 11 : 2);
  const onlyDiff = params.get('diferencas') === '1';

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };

  let rows: CompareRow[] = [];
  if (kind === 'classes') {
    const ca = content.classes.find((c) => c.id === a);
    const cb = content.classes.find((c) => c.id === b);
    if (ca && cb) rows = compareClasses(ca, cb, content);
  } else {
    const sa = content.species.find((s) => s.id === a);
    const sb = content.species.find((s) => s.id === b);
    if (sa && sb) rows = compareSpecies(sa, sb, content);
  }
  const shown = onlyDiff ? rows.filter((r) => r.differs) : rows;
  const nameA = options.find((o) => o.id === a)?.name ?? '';
  const nameB = options.find((o) => o.id === b)?.name ?? '';

  return (
    <>
      <PageHeader eyebrow="Apoio" title="Comparador">
        <p>
          Em dúvida entre duas opções? Coloque lado a lado: as linhas diferentes ficam destacadas.
        </p>
      </PageHeader>

      <div className="space-y-4">
        <Segmented
          legend="O que comparar"
          options={[
            { value: 'classes', label: 'Classes' },
            { value: 'especies', label: 'Espécies' },
          ]}
          value={kind}
          onChange={(k) => update({ tipo: k, a: null, b: null })}
        />
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <Picker
            label="Primeira opção"
            value={a}
            options={options}
            onChange={(v) => update({ a: v })}
          />
          <Button
            variant="fantasma"
            size="icone"
            aria-label="Trocar os lados"
            onClick={() => update({ a: b, b: a })}
          >
            <ArrowLeftRight aria-hidden className="size-5" />
          </Button>
          <Picker
            label="Segunda opção"
            value={b}
            options={options}
            onChange={(v) => update({ b: v })}
          />
        </div>
        <Switch
          label="Mostrar só as diferenças"
          checked={onlyDiff}
          onCheckedChange={(v) => update({ diferencas: v ? '1' : null })}
        />
      </div>

      {a === b && (
        <p className="mt-4 rounded-lg border border-gold-soft/60 bg-gold-soft/10 px-4 py-3">
          As duas opções são iguais: escolha outra para comparar.
        </p>
      )}

      <table className="mt-6 w-full border-separate border-spacing-y-2">
        <caption className="sr-only">
          {nameA} comparado com {nameB}
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Característica</th>
            <th scope="col">{nameA}</th>
            <th scope="col">{nameB}</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr
              key={r.label}
              className={cn(
                // No celular, o rótulo vira uma linha inteira acima das duas colunas.
                'grid grid-cols-2 gap-x-3 rounded-card border bg-surface p-3 shadow-card sm:table-row sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none',
                r.differs ? 'border-gold-soft' : 'border-line',
              )}
            >
              <th
                scope="row"
                className="col-span-2 pb-1 text-left font-display text-sm font-semibold text-ink-muted sm:w-44 sm:py-3 sm:pr-4 sm:align-top"
              >
                {r.label}
                {r.differs && (
                  <span className="ml-2 rounded-full bg-gold-soft/30 px-2 text-xs text-gold">
                    diferente
                  </span>
                )}
              </th>
              {[r.a, r.b].map((v, i) => (
                <td
                  key={i}
                  className={cn(
                    'align-top text-sm sm:border sm:bg-surface sm:p-3 sm:text-base',
                    i === 0 ? 'sm:rounded-l-card sm:border-r-0' : 'sm:rounded-r-card',
                    r.differs ? 'sm:border-gold-soft' : 'sm:border-line',
                  )}
                >
                  <span className="mb-0.5 block text-xs font-semibold text-gold sm:hidden">
                    {i === 0 ? nameA : nameB}
                  </span>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {onlyDiff && shown.length === 0 && (
        <p className="text-ink-muted">Nenhuma diferença entre as duas opções.</p>
      )}
    </>
  );
}

function Picker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; name: string }[];
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full cursor-pointer rounded-lg border border-line-strong bg-surface px-2 font-semibold"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}
