import { useId } from 'react';
import { Link, useParams } from 'react-router';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { Card } from '@/components/ui/Card';
import { StepProgress } from '@/components/ui/Progress';
import { usePageTitle } from '@/app/usePageTitle';
import { useCharacters } from '@/state/characters';
import { PageHeader } from './PageHeader';
import { WIZARD_STEPS } from './wizardSteps';

/** Casca provisória do assistente (as etapas chegam nas fases 3 e 4). */
export default function WizardPage() {
  const { id = '' } = useParams();
  const character = useCharacters((s) => s.characters[id]);
  const update = useCharacters((s) => s.update);
  const nameId = useId();
  usePageTitle(character?.name || 'Novo personagem');

  if (!character) {
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

  return (
    <>
      <StepProgress steps={WIZARD_STEPS} currentIndex={0} className="mb-8" />
      <PageHeader eyebrow="Novo personagem" title="Boas-vindas, aventureiro">
        <p>
          O assistente completo chega nas próximas fases. Por enquanto, dê um nome ao seu
          personagem: ele fica salvo neste aparelho, mesmo se você fechar a página.
        </p>
      </PageHeader>
      <Card className="max-w-xl">
        <label htmlFor={nameId} className="block font-display text-lg font-semibold">
          Nome do personagem
        </label>
        <input
          id={nameId}
          value={character.name}
          onChange={(e) => update(character.id, { name: e.target.value })}
          placeholder="Ex.: Lira Vento-Sul"
          autoComplete="off"
          className="mt-2 min-h-12 w-full rounded-lg border border-line-strong bg-bg px-4 text-lg placeholder:text-ink-muted/70 focus-visible:border-focus"
        />
      </Card>
    </>
  );
}
