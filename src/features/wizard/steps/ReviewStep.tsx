import { CircleAlert, CircleCheck, Copy, PartyPopper } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { content } from '@/content';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { Section } from '../parts/Section';
import { StepHeader } from '../parts/StepHeader';
import { SheetDetails } from '@/features/sheet/SheetDetails';
import { STEPS } from '../steps';
import { characterSummary } from '../summary';
import type { StepProps } from '../WizardPage';

export default function ReviewStep({ wizard, goTo }: StepProps) {
  const { character, sheet, issues } = wizard;
  const errors = issues.filter((i) => i.severity === 'erro');
  const summary = characterSummary(character, sheet, content);
  const [copied, setCopied] = useState(false);
  const ready = errors.length === 0;
  const checklist = STEPS.filter((s) => s.issueStep);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-10">
      <StepHeader eyebrow="Etapa 9" title="Revisão">
        <p>Confira a ficha completa. Se algo estiver faltando, o checklist leva direto à etapa.</p>
      </StepHeader>

      <Section title="Está tudo pronto?">
        {ready ? (
          <p className="flex items-center gap-2 rounded-lg border border-forest/30 bg-forest/5 px-4 py-3 text-lg font-semibold text-forest">
            <PartyPopper aria-hidden className="size-6 shrink-0" />
            Ficha completa e dentro das regras. Boa aventura!
          </p>
        ) : (
          <p className="flex items-center gap-2 font-semibold">
            <CircleAlert aria-hidden className="size-5 text-gold" />
            Ainda {errors.length === 1 ? 'falta 1 coisa' : `faltam ${errors.length} coisas`}.
          </p>
        )}
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {checklist.map((s) => {
            const list = issues.filter((i) => i.step === s.issueStep);
            const errs = list.filter((i) => i.severity === 'erro');
            const ok = errs.length === 0;
            return (
              <li key={s.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
                {ok ? (
                  <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-forest" />
                ) : (
                  <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-gold" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {s.label}
                    <span className="sr-only">{ok ? ': pronto' : ': pendente'}</span>
                  </p>
                  {list.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-sm text-ink-muted">
                      {list.map((i) => (
                        <li key={i.message} className={cn(i.severity === 'erro' && 'text-ink')}>
                          {i.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {!ok && (
                  <Button variant="secundario" onClick={() => goTo(s.id)}>
                    Resolver
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Resumo">
        <Card className="space-y-3">
          <p className="text-lg leading-relaxed" data-testid="resumo">
            {summary}
          </p>
          <Button variant="secundario" onClick={() => void copy()}>
            <Copy aria-hidden className="size-4" /> {copied ? 'Copiado!' : 'Copiar resumo'}
          </Button>
        </Card>
      </Section>

      <Section title="Ficha completa">
        <SheetDetails character={character} sheet={sheet} />
      </Section>

      <div className="flex flex-wrap gap-3">
        {ready ? (
          <Link to={`/ficha/${character.id}?modo=jogo`} className={buttonClasses('primario', 'lg')}>
            Concluir e ir para o modo jogo
          </Link>
        ) : (
          <Link to="/personagens" className={buttonClasses('primario', 'lg')}>
            Salvar e continuar depois
          </Link>
        )}
      </div>
    </div>
  );
}
