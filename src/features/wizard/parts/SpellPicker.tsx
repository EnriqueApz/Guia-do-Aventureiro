import { Check, Lock, Search, Sprout } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { content } from '@/content';
import { RichText } from '@/components/ui/RichText';
import { Switch } from '@/components/ui/Switch';
import type { Spell } from '@/content/schema';
import { toggleSpell } from '@/model/edits';
import { cn } from '@/lib/cn';
import { classSpells, spellBudget } from '@/rules/spells';
import { circleLabel, SCHOOL_LABEL, spellName } from '../spellLabels';
import type { LoadedWizard } from '../useWizard';
import { GlossaryTerm } from './GlossaryTerm';

/** Truques e magias preparadas da classe, com filtros e detalhes de cada magia. */
export function SpellPicker({ wizard }: { wizard: LoadedWizard }) {
  const { character, edit } = wizard;
  const budget = spellBudget(character, content);
  if (!budget || !character.classId) return null;
  const classId = character.classId;
  return (
    <div className="space-y-8">
      {budget.alwaysPrepared.length > 0 && (
        <p className="rounded-lg border border-line bg-sunken/60 px-4 py-3 text-sm">
          <Lock aria-hidden className="mr-1 inline size-4 text-gold" />
          <strong>Sempre preparadas pela subclasse</strong> (não contam no limite):{' '}
          {budget.alwaysPrepared.map(spellName).join(', ')}.
        </p>
      )}
      {budget.cantrips > 0 && (
        <SpellList
          title="Truques"
          help="Magias simples que você lança à vontade, sem gastar espaço de magia."
          spells={classSpells(content, classId, 0, 0)}
          selected={character.spells.cantrips}
          max={budget.cantrips}
          onToggle={(id) => edit((c) => toggleSpell(c, 'cantrips', id, budget.cantrips))}
        />
      )}
      {budget.prepared > 0 && (
        <SpellList
          title="Magias preparadas"
          help={`Cada vez que lança uma, você gasta um espaço de magia. No seu nível dá para escolher até o ${budget.maxCircle}º círculo.`}
          spells={classSpells(content, classId, 1, budget.maxCircle).filter(
            (s) => !budget.alwaysPrepared.includes(s.id),
          )}
          selected={character.spells.prepared}
          max={budget.prepared}
          onToggle={(id) => edit((c) => toggleSpell(c, 'prepared', id, budget.prepared))}
          showCircles={budget.maxCircle > 1}
        />
      )}
    </div>
  );
}

interface SpellListProps {
  title: string;
  help: string;
  spells: Spell[];
  selected: string[];
  max: number;
  onToggle: (id: string) => void;
  showCircles?: boolean;
}

function SpellList({ title, help, spells, selected, max, onToggle, showCircles }: SpellListProps) {
  const searchId = useId();
  const [onlyEasy, setOnlyEasy] = useState(false);
  const [query, setQuery] = useState('');
  const [circle, setCircle] = useState<number | null>(null);
  const hasEasy = spells.some((s) => s.beginner);
  const visible = useMemo(() => {
    const q = query
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
    return spells.filter((s) => {
      if (onlyEasy && !s.beginner && !selected.includes(s.id)) return false;
      if (circle !== null && s.level !== circle) return false;
      if (!q) return true;
      return s.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .includes(q);
    });
  }, [spells, onlyEasy, circle, query, selected]);
  const circles = [...new Set(spells.map((s) => s.level))];
  const full = selected.length >= max;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-lg font-semibold">{title}</h4>
        <span
          className={cn(
            'num text-sm font-semibold',
            selected.length === max ? 'text-forest' : 'text-ink-muted',
          )}
          aria-live="polite"
        >
          {selected.length} de {max}
        </span>
      </div>
      <p className="text-sm text-ink-muted">{help}</p>
      {selected.length > 0 && (
        <p className="text-sm">
          <strong>Escolhidas:</strong> {selected.map(spellName).join(', ')}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Buscar em {title.toLowerCase()}
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            id={searchId}
            type="search"
            placeholder="Buscar pelo nome"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-line-strong bg-bg pr-3 pl-9"
          />
        </div>
        {hasEasy && (
          <Switch
            label="Só as boas para iniciantes"
            checked={onlyEasy}
            onCheckedChange={setOnlyEasy}
          />
        )}
      </div>
      {showCircles && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por círculo">
          {[null, ...circles].map((c) => (
            <button
              key={c ?? 'todos'}
              type="button"
              aria-pressed={circle === c}
              onClick={() => setCircle(c)}
              className="min-h-9 cursor-pointer rounded-full border border-line-strong px-3 text-sm font-semibold aria-pressed:border-seal aria-pressed:bg-seal aria-pressed:text-on-seal"
            >
              {c === null ? 'Todos' : `${c}º`}
            </button>
          ))}
        </div>
      )}
      <ul className="divide-y divide-line rounded-card border border-line bg-surface">
        {visible.map((s) => {
          const on = selected.includes(s.id);
          const blocked = !on && full;
          return (
            <li key={s.id} className="flex items-start gap-3 px-3 py-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                aria-disabled={blocked || undefined}
                aria-label={`${s.name}, ${circleLabel(s.level)}`}
                onClick={() => !blocked && onToggle(s.id)}
                className={cn(
                  'mt-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-2',
                  on ? 'border-seal bg-seal text-on-seal' : 'border-line-strong bg-bg',
                  blocked && 'cursor-not-allowed opacity-40',
                )}
              >
                {on && <Check aria-hidden className="size-4" />}
              </button>
              <details className="min-w-0 flex-1">
                <summary className="flex min-h-9 cursor-pointer flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-xs text-ink-muted">
                    {circleLabel(s.level)} · {SCHOOL_LABEL[s.school]}
                    {s.concentration && ' · Concentração'}
                    {s.ritual && ' · Ritual'}
                  </span>
                  {s.beginner && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-forest">
                      <Sprout aria-hidden className="size-3.5" />
                      iniciante
                    </span>
                  )}
                </summary>
                <SpellDetails spell={s} />
              </details>
            </li>
          );
        })}
        {!visible.length && (
          <li className="px-3 py-4 text-sm text-ink-muted">Nenhuma magia com esse filtro.</li>
        )}
      </ul>
    </section>
  );
}

export function SpellDetails({ spell: s }: { spell: Spell }) {
  const comps = [s.components.v && 'V', s.components.s && 'S', s.components.m && 'M']
    .filter(Boolean)
    .join(', ');
  return (
    <div className="mt-2 space-y-2 pb-2 text-sm">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-ink-muted">Tempo</dt>
          <dd>{s.castingTime}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Alcance</dt>
          <dd>{s.range}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">
            <GlossaryTerm id="componentes">Componentes</GlossaryTerm>
          </dt>
          <dd>
            {comps}
            {s.components.m && <span className="block text-xs">({s.components.m})</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Duração</dt>
          <dd>{s.duration}</dd>
        </div>
      </dl>
      {s.plain && (
        <p className="rounded-lg bg-sunken/70 px-3 py-2">
          <strong>Na prática:</strong> {s.plain}
        </p>
      )}
      <RichText text={s.text} />
      {s.higherLevels && (
        <p>
          <strong>Em círculos maiores.</strong> {s.higherLevels}
        </p>
      )}
    </div>
  );
}
