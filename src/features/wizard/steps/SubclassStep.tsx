import { CalendarClock } from 'lucide-react';
import { useRef, useState } from 'react';
import { content } from '@/content';
import type { ClassDef } from '@/content/schema';
import { DifficultyBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { selectExtraSubclass, selectSubclass } from '@/model/edits';
import { primaryLevels, scopesFor } from '@/rules/classes';
import { FeatureList } from '../parts/FeatureList';
import { ClassIcon } from '../parts/Icons';
import { OptionCard } from '../parts/OptionCard';
import { FeatureChoices } from '../parts/FeatureChoices';
import { Section } from '../parts/Section';
import { BeginnerNote } from '../parts/BeginnerNote';
import { StepHeader } from '../parts/StepHeader';
import { useScrollIntoViewOnChange } from '../useScrollIntoView';
import type { LoadedWizard } from '../useWizard';
import type { StepProps } from '../WizardPage';
import { homebrewBlocked } from '@/model/table';
import { useTable } from '@/state/table';
import { StubsLink } from '../parts/StubsLink';

export default function SubclassStep({ wizard, goTo }: StepProps) {
  const { character, edit } = wizard;
  const cls = content.classes.find((c) => c.id === character.classId);

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

  // Multiclasse: cada classe com 3 níveis ou mais também escolhe a sua.
  const extras = (character.multiclass ?? [])
    .map((m) => ({ m, classDef: content.classes.find((c) => c.id === m.classId) }))
    .filter(
      (x): x is { m: (typeof x)['m']; classDef: ClassDef } => !!x.classDef && x.m.levels >= 3,
    );

  return (
    <div className="space-y-8">
      <StepHeader eyebrow="Etapa 4" title={cls.subclassLabel}>
        <p>
          A subclasse é uma especialização da classe, escolhida no nível 3. Ela dá características
          próprias em alguns níveis e define o “sabor” do seu {cls.name.toLowerCase()}.
        </p>
      </StepHeader>

      <SubclassPicker
        wizard={wizard}
        classDef={cls}
        levels={primaryLevels(character)}
        selectedId={character.subclassId}
        onSelect={(id) => edit((c) => selectSubclass(c, id))}
        primary
      />

      {extras.map(({ m, classDef }) => (
        <section
          key={classDef.id}
          aria-labelledby={`sub-${classDef.id}`}
          className="space-y-6 border-t border-line pt-8"
        >
          <h2 id={`sub-${classDef.id}`} className="text-3xl font-semibold">
            {classDef.subclassLabel}{' '}
            <span className="text-xl text-ink-muted">(multiclasse, {m.levels} níveis)</span>
          </h2>
          <SubclassPicker
            wizard={wizard}
            classDef={classDef}
            levels={m.levels}
            selectedId={m.subclassId}
            onSelect={(id) => edit((c) => selectExtraSubclass(c, classDef.id, id))}
          />
        </section>
      ))}
    </div>
  );
}

function SubclassPicker({
  wizard,
  classDef: cls,
  levels,
  selectedId,
  onSelect,
  primary = false,
}: {
  wizard: LoadedWizard;
  classDef: ClassDef;
  levels: number;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  primary?: boolean;
}) {
  const tableRules = useTable((st) => st.rules);
  const canChoose = levels >= 3;
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const shownId = canChoose ? selectedId : (preview ?? selectedId);
  const shown = content.subclasses.find((s) => s.id === shownId && s.classId === cls.id);
  const detailRef = useRef<HTMLDivElement>(null);
  useScrollIntoViewOnChange(detailRef, shownId);
  const options = content.subclasses.filter((s) => s.classId === cls.id);
  const stubs = content.stubs.filter((s) => s.type === 'subclasse' && s.parentId === cls.id);
  const { subScope } = scopesFor(cls.id, primary);

  return (
    <>
      {!canChoose && (
        <div className="flex gap-3 rounded-lg border border-gold-soft/60 bg-gold-soft/10 p-4">
          <CalendarClock aria-hidden className="mt-0.5 size-5 shrink-0 text-gold" />
          <p>
            {primary && wizard.character.level !== levels
              ? `Seu ${cls.name.toLowerCase()} está no nível ${levels}.`
              : `Seu personagem está no nível ${levels}.`}{' '}
            A subclasse só entra no nível 3, então por enquanto é só uma prévia: toque numa opção
            para ver o que ela oferece. Você decide quando chegar lá.
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
            onSelect={() => (canChoose ? onSelect(s.id) : setPreview(s.id))}
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
      {stubs.length > 0 && <StubsLink />}

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
            <FeatureList features={shown.features} level={levels} />
          </Section>
          {canChoose && (
            <FeatureChoices
              wizard={wizard}
              scope={subScope}
              features={shown.features}
              classDef={cls}
              level={levels}
            />
          )}
        </div>
      )}
    </>
  );
}
