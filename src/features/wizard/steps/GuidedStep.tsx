import { ArrowLeft, RotateCcw, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { content } from '@/content';
import { DifficultyBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { applySuggestion } from '@/model/edits';
import { QUESTIONS, suggest, type Answers } from '@/features/guided/suggest';
import { OptionCard } from '../parts/OptionCard';
import { StepHeader } from '../parts/StepHeader';
import type { StepProps } from '../WizardPage';

export default function GuidedStep({ wizard, goTo }: StepProps) {
  const { edit } = wizard;
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [index, setIndex] = useState(0);
  const done = index >= QUESTIONS.length;
  const question = QUESTIONS[index];

  const answer = (value: string) => {
    if (!question) return;
    setAnswers((a) => ({ ...a, [question.id]: value }));
    setIndex((i) => i + 1);
  };

  if (done) {
    const suggestions = suggest(answers as Answers, content);
    return (
      <div className="space-y-6">
        <StepHeader eyebrow="Me guie" title="Três sugestões para você">
          <p>
            Qualquer uma funciona bem numa primeira aventura. Escolha a que mais te empolgar: depois
            você ainda confirma cada detalhe nas próximas etapas.
          </p>
        </StepHeader>
        <ol className="grid gap-4 lg:grid-cols-3">
          {suggestions.map((s, i) => {
            const species = content.species.find((x) => x.id === s.speciesId);
            const cls = content.classes.find((x) => x.id === s.classId);
            const bg = content.backgrounds.find((x) => x.id === s.backgroundId);
            if (!species || !cls || !bg) return null;
            return (
              <motion.li
                key={s.classId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5 shadow-card"
              >
                <p className="font-display text-sm font-semibold tracking-widest text-gold uppercase">
                  Sugestão {i + 1}
                </p>
                <h2 className="text-2xl font-semibold">
                  {species.name} {cls.name}
                </h2>
                <p className="text-sm text-ink-muted">Antecedente: {bg.name}</p>
                <DifficultyBadge level={cls.beginner.rating} className="self-start" />
                <div>
                  <p className="font-semibold">Por que sugeri isso</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                    {s.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
                <Button
                  className="mt-auto justify-center"
                  onClick={() => {
                    edit((c) => applySuggestion(c, s, content));
                    goTo('especie');
                  }}
                >
                  <Sparkles aria-hidden className="size-5" />
                  Quero este
                </Button>
              </motion.li>
            );
          })}
        </ol>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secundario"
            onClick={() => {
              setAnswers({});
              setIndex(0);
            }}
          >
            <RotateCcw aria-hidden className="size-4" /> Responder de novo
          </Button>
          <Button variant="fantasma" onClick={() => goTo('especie')}>
            Prefiro escolher sozinho
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow={`Me guie · pergunta ${index + 1} de ${QUESTIONS.length}`}
        title={question?.title ?? ''}
      >
        <p>Não existe resposta errada: escolha o que parecer mais divertido.</p>
      </StepHeader>
      <div
        className="h-2 overflow-hidden rounded-full bg-sunken"
        role="progressbar"
        aria-label="Progresso do questionário"
        aria-valuemin={0}
        aria-valuemax={QUESTIONS.length}
        aria-valuenow={index}
      >
        <div
          className="h-full rounded-full bg-seal transition-[width]"
          style={{ width: `${(index / QUESTIONS.length) * 100}%` }}
        />
      </div>
      <motion.div
        key={index}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        className="grid gap-3 sm:grid-cols-2"
      >
        {question?.options.map((o) => (
          <OptionCard
            key={o.value}
            selected={answers[question.id] === o.value}
            onSelect={() => answer(o.value)}
            title={o.label}
            subtitle={o.hint}
          />
        ))}
      </motion.div>
      <Button
        variant="fantasma"
        onClick={() => (index === 0 ? goTo('boas-vindas') : setIndex((i) => i - 1))}
      >
        <ArrowLeft aria-hidden className="size-5" />{' '}
        {index === 0 ? 'Voltar ao início' : 'Pergunta anterior'}
      </Button>
    </div>
  );
}
