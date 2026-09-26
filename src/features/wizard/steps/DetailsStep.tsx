import { Dices, Shuffle } from 'lucide-react';
import { useId, useState } from 'react';
import { content } from '@/content';
import { Button } from '@/components/ui/Button';
import { setDetails, setName } from '@/model/edits';
import { rollDie } from '@/rules/dice';
import { cn } from '@/lib/cn';
import { ALIGNMENTS, APPEARANCE_PROMPTS, HOOKS, NAMES } from '../detailsData';
import { GlossaryTerm } from '../parts/GlossaryTerm';
import { Section } from '../parts/Section';
import { StepHeader } from '../parts/StepHeader';
import type { StepProps } from '../WizardPage';

const pickOne = <T,>(list: T[]): T | undefined => list[rollDie(list.length) - 1];

export default function DetailsStep({ wizard }: StepProps) {
  const { character, edit } = wizard;
  const { details } = character;
  const ids = {
    name: useId(),
    pronouns: useId(),
    appearance: useId(),
    backstory: useId(),
    hook: useId(),
  };
  const species = content.species.find((s) => s.id === character.speciesId);
  const names = NAMES[character.speciesId ?? ''] ?? NAMES.human;
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const generate = () => {
    if (!names) return;
    const out = new Set<string>();
    while (out.size < 4) out.add(`${pickOne(names.first)} ${pickOne(names.last)}`);
    setSuggestions([...out]);
  };

  return (
    <div className="space-y-10">
      <StepHeader eyebrow="Etapa 8" title="Detalhes e história">
        <p>
          Nada aqui muda os números da ficha, mas é o que faz o personagem ganhar vida na mesa. Tudo
          é opcional, menos o nome.
        </p>
      </StepHeader>

      <Section title="Nome">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-64">
            <label htmlFor={ids.name} className="mb-1 block font-semibold">
              Nome do personagem
            </label>
            <input
              id={ids.name}
              value={character.name}
              onChange={(e) => edit((c) => setName(c, e.target.value))}
              autoComplete="off"
              className="min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 text-lg"
            />
          </div>
          <Button variant="secundario" onClick={generate}>
            <Shuffle aria-hidden className="size-5" />
            Sugerir nomes{species ? ` de ${species.name.toLowerCase()}` : ''}
          </Button>
        </div>
        {suggestions.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Sugestões de nome">
            {suggestions.map((n) => (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => edit((c) => setName(c, n))}
                  aria-pressed={character.name === n}
                  className="min-h-11 cursor-pointer rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold hover:border-gold aria-pressed:border-seal aria-pressed:bg-seal aria-pressed:text-on-seal"
                >
                  {n}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="max-w-xs">
          <label htmlFor={ids.pronouns} className="mb-1 block font-semibold">
            Pronomes <span className="font-normal text-ink-muted">(opcional)</span>
          </label>
          <input
            id={ids.pronouns}
            value={details.pronouns ?? ''}
            placeholder="ela/dela, ele/dele, elu/delu…"
            onChange={(e) => edit((c) => setDetails(c, { pronouns: e.target.value }))}
            className="min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3"
          />
        </div>
      </Section>

      <Section title="Aparência">
        <label htmlFor={ids.appearance} className="block text-ink-muted">
          Como os outros veem o personagem? Algumas ideias:
        </label>
        <ul className="flex flex-wrap gap-2 text-sm">
          {APPEARANCE_PROMPTS.map((p) => (
            <li key={p} className="rounded-full border border-line px-3 py-1 text-ink-muted">
              {p}
            </li>
          ))}
        </ul>
        <textarea
          id={ids.appearance}
          rows={3}
          value={details.appearance}
          onChange={(e) => edit((c) => setDetails(c, { appearance: e.target.value }))}
          className="w-full rounded-lg border border-line-strong bg-bg px-3 py-2"
        />
      </Section>

      <Section title="Alinhamento">
        <p className="text-ink-muted">
          O <GlossaryTerm id="alinhamento">alinhamento</GlossaryTerm> é uma bússola moral: o eixo
          Leal–Caótico diz como o personagem lida com regras, e o eixo Bom–Mau, com os outros. É
          opcional e pode mudar com a história.
        </p>
        <div
          role="radiogroup"
          aria-label="Alinhamento"
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          {ALIGNMENTS.map((a) => {
            const on = details.alignment === a.id;
            return (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => edit((c) => setDetails(c, { alignment: on ? '' : a.id }))}
                className={cn(
                  'flex cursor-pointer flex-col gap-1 rounded-card border bg-surface p-3 text-left',
                  on ? 'border-seal ring-2 ring-seal/30' : 'border-line hover:border-gold-soft',
                )}
              >
                <span className="font-display font-semibold">{a.name}</span>
                <span className="text-sm">{a.text}</span>
                <span className="text-xs text-ink-muted italic">Ex.: {a.example}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="História">
        <label htmlFor={ids.backstory} className="block text-ink-muted">
          De onde o personagem veio e por que saiu em aventura? Duas ou três frases bastam.
        </label>
        <textarea
          id={ids.backstory}
          rows={4}
          value={details.backstory}
          onChange={(e) => edit((c) => setDetails(c, { backstory: e.target.value }))}
          className="w-full rounded-lg border border-line-strong bg-bg px-3 py-2"
        />
        <div className="space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <label htmlFor={ids.hook} className="font-semibold">
              Gancho de história <span className="font-normal text-ink-muted">(opcional)</span>
              <span className="block text-sm font-normal text-ink-muted">
                Um mistério ou objetivo que o Mestre pode usar na campanha.
              </span>
            </label>
            <Button
              variant="secundario"
              onClick={() => edit((c) => setDetails(c, { hook: pickOne(HOOKS) ?? '' }))}
            >
              <Dices aria-hidden className="size-5" /> Sortear gancho
            </Button>
          </div>
          <textarea
            id={ids.hook}
            rows={2}
            value={details.hook ?? ''}
            onChange={(e) => edit((c) => setDetails(c, { hook: e.target.value }))}
            className="w-full rounded-lg border border-line-strong bg-bg px-3 py-2"
          />
        </div>
      </Section>
    </div>
  );
}
