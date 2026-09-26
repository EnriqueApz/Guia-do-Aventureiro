import { CalendarClock } from 'lucide-react';
import { useRef, useState } from 'react';
import { content } from '@/content';
import { DifficultyBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { selectSubclass } from '@/model/edits';
import { FeatureList } from '../parts/FeatureList';
import { ClassIcon } from '../parts/Icons';
import { OptionCard } from '../parts/OptionCard';
import { FeatureChoices } from '../parts/FeatureChoices';
import { Section } from '../parts/Section';
import { BeginnerNote } from '../parts/BeginnerNote';
import { StepHeader } from '../parts/StepHeader';
import { useScrollIntoViewOnChange } from '../useScrollIntoView';
import type { StepProps } from '../WizardPage';
import { homebrewBlocked } from '@/model/table';
import { useTable } from '@/state/table';

export default function SubclassStep({ wizard, goTo }: StepProps) {
  const tableRules = useTable((st) => st.rules);
  const { character, edit } = wizard;
  const cls = content.classes.find((c) => c.id === character.classId);
  const canChoose = character.level >= 3;
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const shownId = canChoose ? character.subclassId : (preview ?? character.subclassId);
  const shown = content.subclasses.find((s) => s.id === shownId && s.classId === cls?.id);
  const detailRef = useRef<HTMLDivElement>(null);
  useScrollIntoViewOnChange(detailRef, shownId);

  if (!cls) {
    return (
      <>
        <StepHeader eyebrow="Etapa 4" title="Subclasse">
          <p>A subclasse é uma especialização da classe. Escolha uma classe primeiro.</p>
        </StepHeader>
        <Button onClick={() => goTo('classe')}>Escolher classe</Button>
      </>
    );
  }

  const options = content.subclasses.filter((s) => s.classId === cls.id);
  const stubs = content.stubs.filter((s) => s.type === 'subclasse' && s.parentId === cls.id);

  return (
    <div className="space-y-8">
      <StepHeader eyebrow="Etapa 4" title={`${cls.subclassLabel} do ${cls.name}`}>
        <p>
          A subclasse é uma especialização da classe, escolhida no nível 3. Ela dá características
          próprias em alguns níveis e define o “sabor” do seu {cls.name.toLowerCase()}.
        </p>
      </StepHeader>

      {!canChoose && (
        <div className="flex gap-3 rounded-lg border border-gold-soft/60 bg-gold-soft/10 p-4">
          <CalendarClock aria-hidden className="mt-0.5 size-5 shrink-0 text-gold" />
          <p>
            Seu personagem está no nível {character.level}. A subclasse só entra no nível 3, então
            por enquanto é só uma prévia: toque numa opção para ver o que ela oferece. Você decide
            quando chegar lá.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((s) => (
          <OptionCard
            key={s.id}
            disabled={homebrewBlocked(tableRules, s)}
            disabledReason="A mesa não permite conteúdo próprio."
            selected={s.id === shownId}
            onSelect={() => (canChoose ? edit((c) => selectSubclass(c, s.id)) : setPreview(s.id))}
            title={s.name}
            subtitle={s.summary}
            icon={<ClassIcon id={cls.id} />}
          >
            {s.beginner && (
              <span className="mt-auto pt-1">
                <DifficultyBadge level={s.beginner.rating} />
              </span>
            )}
          </OptionCard>
        ))}
        {stubs.map((s) => (
          <OptionCard
            key={s.id}
            selected={false}
            onSelect={() => undefined}
            disabled
            title={s.name}
            subtitle={s.ref}
            disabledReason="Incompleto: fora do SRD. Complete em “Conteúdo próprio”."
          />
        ))}
      </div>

      {shown && (
        <div
          ref={detailRef}
          className="scroll-mt-24 space-y-6 rounded-card border border-line bg-surface/60 p-5"
        >
          <div>
            <h2 className="text-3xl font-semibold">{shown.name}</h2>
            <p className="mt-2">{shown.description}</p>
            {shown.beginner && <BeginnerNote beginner={shown.beginner} kind="subclasse" />}
          </div>
          <Section title="Características por nível">
            <FeatureList features={shown.features} level={character.level} />
          </Section>
          {canChoose && (
            <FeatureChoices
              wizard={wizard}
              scope="subclasse"
              features={shown.features}
              classDef={cls}
            />
          )}
        </div>
      )}
    </div>
  );
}
