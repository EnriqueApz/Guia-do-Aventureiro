import { Compass, Minus, Plus, Sparkles } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { setLevel } from '@/model/edits';
import { GlossaryTerm } from '../parts/GlossaryTerm';
import { OptionCard } from '../parts/OptionCard';
import { StepHeader } from '../parts/StepHeader';
import type { StepProps } from '../WizardPage';

const PIECES = [
  {
    term: 'especie',
    title: 'Espécie',
    text: 'De que povo você é: humano, elfo, anão... Dá traços como visão no escuro.',
  },
  {
    term: 'classe',
    title: 'Classe',
    text: 'O que você faz de melhor: lutar, lançar magias, curar, se esgueirar...',
  },
  {
    term: 'antecedente',
    title: 'Antecedente',
    text: 'Sua vida antes da aventura. Dá perícias, um talento e aumentos de atributo.',
  },
  {
    term: 'atributo',
    title: 'Atributos',
    text: 'Seis números que dizem no que você é bom: Força, Destreza, Carisma...',
  },
];

export default function WelcomeStep({ wizard, goTo }: StepProps) {
  const { character, edit } = wizard;
  const levelId = useId();
  const nameId = useId();
  const [guided, setGuided] = useState(false);

  return (
    <div className="space-y-8">
      <StepHeader eyebrow="Etapa 1" title="Vamos criar seu personagem">
        <p>
          Um personagem é quem você interpreta na história. Ele é feito de quatro peças, e a ficha
          vai se montando conforme você escolhe cada uma (no celular, toque em “Ficha” lá embaixo).
        </p>
      </StepHeader>

      <ul className="grid gap-3 sm:grid-cols-2">
        {PIECES.map((p, i) => (
          <li key={p.term} className="flex gap-3 rounded-card border border-line bg-surface/70 p-4">
            <span className="num flex size-8 shrink-0 items-center justify-center rounded-full border border-gold-soft text-gold">
              {i + 1}
            </span>
            <span>
              <span className="block font-display text-lg font-semibold">
                <GlossaryTerm id={p.term}>{p.title}</GlossaryTerm>
              </span>
              <span className="text-ink-muted">{p.text}</span>
            </span>
          </li>
        ))}
      </ul>

      <section className="grid gap-6 rounded-card border border-line bg-surface p-5 shadow-card sm:grid-cols-2">
        <div>
          <label htmlFor={nameId} className="block font-display text-lg font-semibold">
            Nome do personagem
          </label>
          <p className="text-ink-muted">Pode deixar para depois, se ainda não souber.</p>
          <input
            id={nameId}
            value={character.name}
            onChange={(e) => edit((c) => ({ ...c, name: e.target.value }))}
            placeholder="Ex.: Lira Vento-Sul"
            autoComplete="off"
            className="mt-3 min-h-11 w-full rounded-lg border border-line-strong bg-bg px-4 text-lg placeholder:text-ink-muted/70"
          />
        </div>
        <div>
          <label htmlFor={levelId} className="block font-display text-lg font-semibold">
            Nível inicial
          </label>
          <p className="text-ink-muted">
            Pergunte ao Mestre em que <GlossaryTerm id="nivel">nível</GlossaryTerm> a aventura
            começa. Na dúvida, comece no 1.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="secundario"
              size="icone"
              aria-label="Diminuir nível"
              disabled={character.level <= 1}
              onClick={() => edit((c) => setLevel(c, c.level - 1))}
            >
              <Minus aria-hidden className="size-5" />
            </Button>
            <input
              id={levelId}
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              value={character.level}
              onChange={(e) => edit((c) => setLevel(c, Number(e.target.value) || 1))}
              className="num h-11 w-20 rounded-lg border border-line-strong bg-bg text-center text-xl font-semibold"
            />
            <Button
              variant="secundario"
              size="icone"
              aria-label="Aumentar nível"
              disabled={character.level >= 20}
              onClick={() => edit((c) => setLevel(c, c.level + 1))}
            >
              <Plus aria-hidden className="size-5" />
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="modo" className="space-y-3">
        <h2 id="modo" className="text-2xl font-semibold">
          Como você quer escolher?
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <OptionCard
            selected={false}
            onSelect={() => goTo('especie')}
            title="Já sei o que quero"
            subtitle="Vá direto às opções. Os selos “Bom para iniciantes” ajudam no caminho."
            icon={<Compass className="size-5" />}
          />
          <OptionCard
            selected={guided}
            onSelect={() => setGuided(true)}
            title="Me guie"
            subtitle="Responda algumas perguntas e receba três sugestões com o porquê."
            icon={<Sparkles className="size-5" />}
          />
        </div>
        {guided && (
          <div role="status" className="rounded-lg border border-gold-soft/60 bg-gold-soft/10 p-4">
            <p>
              O questionário “Me guie” chega numa próxima atualização. Enquanto isso, uma boa
              receita para a primeira aventura: <strong>Humano ou Anão</strong> com{' '}
              <strong>Guerreiro</strong> ou <strong>Bárbaro</strong>. Tudo marcado com o selo verde
              é tranquilo de jogar.
            </p>
            <Button className="mt-3" onClick={() => goTo('especie')}>
              Começar pela espécie
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
