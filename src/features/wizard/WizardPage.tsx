import { ArrowLeft, ArrowRight, ScrollText } from 'lucide-react';
import { MotionConfig } from 'motion/react';
import { lazy, Suspense, useEffect, useRef, useState, type ComponentType } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { usePageTitle } from '@/app/usePageTitle';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { Card } from '@/components/ui/Card';
import { Drawer } from '@/components/ui/Drawer';
import { formatBonus } from './labels';
import { LiveSheet } from './LiveSheet';
import { StepIssues } from './parts/StepIssues';
import { STEPS, stepAt, stepIndex } from './steps';
import { useWizard, type LoadedWizard } from './useWizard';
import { WizardProgress, type StepStatus } from './WizardProgress';
import { useSettings } from '@/state/settings';

export interface StepProps {
  stepId: string;
  wizard: LoadedWizard;
  goTo: (stepId: string) => void;
}

const STEP_COMPONENTS: Record<string, ComponentType<StepProps>> = {
  'boas-vindas': lazy(() => import('./steps/WelcomeStep')),
  especie: lazy(() => import('./steps/SpeciesStep')),
  classe: lazy(() => import('./steps/ClassStep')),
  subclasse: lazy(() => import('./steps/SubclassStep')),
  antecedente: lazy(() => import('./steps/BackgroundStep')),
};
const ComingStep = lazy(() => import('./steps/ComingStep'));

const DONE_TEXT: Record<string, string> = {
  especie: 'Espécie escolhida. Tudo certo por aqui!',
  classe: 'Classe escolhida. Tudo certo por aqui!',
  subclasse: 'Subclasse resolvida. Tudo certo por aqui!',
  antecedente: 'Antecedente escolhido. Tudo certo por aqui!',
};

export default function WizardPage() {
  const { id = '', etapa } = useParams();
  const wizard = useWizard(id);
  const navigate = useNavigate();
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const [sheetOpen, setSheetOpen] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);
  const { character, sheet, issues, edit } = wizard;
  usePageTitle(character ? character.name || 'Novo personagem' : 'Personagem não encontrado');

  const current = stepIndex(etapa);
  const step = stepAt(current);

  // Lembra a etapa para o "continuar de onde parei" e leva o foco para o topo da etapa.
  useEffect(() => {
    if (!character || !etapa) return;
    if (character.wizardStep !== etapa) edit((c) => ({ ...c, wizardStep: etapa }));
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa]);

  if (!character || !sheet) {
    return (
      <Card className="max-w-xl">
        <h1 className="text-2xl font-semibold">Personagem não encontrado</h1>
        <p className="mt-2 text-ink-muted">
          Talvez ele tenha sido criado em outro aparelho ou navegador.
        </p>
        <Link to="/personagens" className={`${buttonClasses('secundario')} mt-4`}>
          Ver meus personagens
        </Link>
      </Card>
    );
  }

  if (!etapa || !STEPS.some((s) => s.id === etapa)) {
    const resume = stepAt(stepIndex(character.wizardStep)).id;
    return <Navigate to={`/criar/${id}/${resume}`} replace />;
  }

  const loaded = wizard as LoadedWizard;
  const goTo = (stepId: string) => navigate(`/criar/${id}/${stepId}`);
  const prev = STEPS[current - 1];
  const next = STEPS[current + 1];
  const stepIssues = step.issueStep ? issues.filter((i) => i.step === step.issueStep) : [];
  const statuses: StepStatus[] = STEPS.map((s, i) => {
    if (s.phase > 3) return 'em-breve';
    if (!s.issueStep) return i <= current || character.speciesId ? 'feito' : 'pendente';
    if (s.id === 'subclasse' && !character.classId) return 'pendente';
    return issues.some((x) => x.step === s.issueStep && x.severity === 'erro')
      ? 'pendente'
      : 'feito';
  });
  const StepComponent = STEP_COMPONENTS[step.id] ?? ComingStep;

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
          <WizardProgress characterId={id} current={current} statuses={statuses} />
          <div ref={headingRef} tabIndex={-1} className="outline-none">
            <Suspense fallback={<StepLoading />}>
              <StepComponent stepId={step.id} wizard={loaded} goTo={goTo} />
            </Suspense>
          </div>

          {step.issueStep && step.phase <= 3 && (
            <div className="mt-8">
              <StepIssues
                issues={stepIssues}
                doneText={DONE_TEXT[step.id] ?? 'Tudo certo por aqui!'}
              />
            </div>
          )}

          {/* Navegação no desktop (no celular fica na barra fixa). */}
          <div className="mt-8 hidden justify-between gap-3 lg:flex">
            {prev ? (
              <Button variant="secundario" onClick={() => goTo(prev.id)}>
                <ArrowLeft aria-hidden className="size-5" /> {prev.label}
              </Button>
            ) : (
              <span />
            )}
            {next && (
              <Button onClick={() => goTo(next.id)}>
                {next.label} <ArrowRight aria-hidden className="size-5" />
              </Button>
            )}
          </div>
        </div>

        <aside
          aria-label="Ficha do personagem"
          className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] self-start overflow-y-auto rounded-card border border-line-strong bg-surface p-5 shadow-card lg:block"
        >
          <LiveSheet character={character} sheet={sheet} />
        </aside>
      </div>

      {/* Barra fixa do celular: voltar, abrir a ficha e avançar. */}
      <nav
        aria-label="Navegação da criação"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2">
          <Button
            variant="fantasma"
            size="icone"
            aria-label={prev ? `Voltar para ${prev.label}` : 'Voltar'}
            disabled={!prev}
            onClick={() => prev && goTo(prev.id)}
          >
            <ArrowLeft aria-hidden className="size-5" />
          </Button>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line-strong bg-bg px-3 text-sm font-semibold"
          >
            <ScrollText aria-hidden className="size-4 text-gold" />
            Ficha
            <span className="num text-ink-muted">
              CA {sheet.ac.value} · PV {sheet.hp.max} · {formatBonus(sheet.initiative.value)}
            </span>
          </button>
          <Button
            size="icone"
            aria-label={next ? `Avançar para ${next.label}` : 'Avançar'}
            disabled={!next}
            onClick={() => next && goTo(next.id)}
          >
            <ArrowRight aria-hidden className="size-5" />
          </Button>
        </div>
      </nav>

      <Drawer
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Ficha"
        description="Atualizada a cada escolha."
      >
        <LiveSheet character={character} sheet={sheet} />
      </Drawer>
    </MotionConfig>
  );
}

function StepLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando etapa">
      <div className="h-9 w-2/3 animate-pulse rounded-lg bg-sunken" />
      <div className="h-5 w-full animate-pulse rounded bg-sunken" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-card bg-sunken" />
        ))}
      </div>
    </div>
  );
}
