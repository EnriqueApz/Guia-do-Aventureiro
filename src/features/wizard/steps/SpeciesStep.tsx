import { useRef } from 'react';
import { content } from '@/content';
import { DifficultyBadge, Badge } from '@/components/ui/Badge';
import { Segmented } from '@/components/ui/Segmented';
import { selectLineage, selectSpecies, setLineageSpellAbility, setSize } from '@/model/edits';
import { formatMeters } from '@/rules/encumbrance';
import { ABILITY_LABEL } from '../labels';
import { FeatureChoices } from '../parts/FeatureChoices';
import { FeatureList } from '../parts/FeatureList';
import { Monogram } from '../parts/Icons';
import { OptionCard } from '../parts/OptionCard';
import { Section } from '../parts/Section';
import { StepHeader } from '../parts/StepHeader';
import type { StepProps } from '../WizardPage';
import { useScrollIntoViewOnChange } from '../useScrollIntoView';

export default function SpeciesStep({ wizard }: StepProps) {
  const { character, edit } = wizard;
  const species = content.species.find((s) => s.id === character.speciesId);
  const lineage = species?.lineages.find((l) => l.id === character.lineageId);
  const stubs = content.stubs.filter((s) => s.type === 'especie');
  const detailRef = useRef<HTMLDivElement>(null);
  useScrollIntoViewOnChange(detailRef, character.speciesId);

  return (
    <div className="space-y-8">
      <StepHeader eyebrow="Etapa 2" title="Escolha sua espécie">
        <p>
          A espécie diz de que povo o personagem vem e dá traços especiais. Nas regras de 2024, ela
          não mexe nos atributos: isso fica com o antecedente. Escolha a que mais combina com a
          história que você quer contar.
        </p>
      </StepHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {content.species.map((s) => (
          <OptionCard
            key={s.id}
            selected={s.id === character.speciesId}
            onSelect={() => edit((c) => selectSpecies(c, s.id, content))}
            title={s.name}
            subtitle={s.summary}
            icon={<Monogram name={s.name} />}
          >
            <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
              <DifficultyBadge level={s.beginner.rating} />
              <Badge>{formatMeters(s.speed)}</Badge>
              <Badge>{s.sizes.join(' ou ')}</Badge>
            </span>
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
            disabledReason="Incompleto: fora do SRD. Dá para preencher em “Conteúdo próprio” (em breve)."
            icon={<Monogram name={s.name} />}
          />
        ))}
      </div>

      {species && (
        <div
          ref={detailRef}
          className="scroll-mt-24 space-y-8 rounded-card border border-line bg-surface/60 p-5"
        >
          <div>
            <h2 className="text-3xl font-semibold">{species.name}</h2>
            <p className="mt-2">{species.description}</p>
            <p className="mt-2 text-sm text-ink-muted">
              {species.creatureType} · {species.sizeNote} · Deslocamento{' '}
              {formatMeters(species.speed)}
            </p>
            <p className="mt-3 rounded-lg bg-sunken/70 p-3 text-sm">{species.beginner.note}</p>
          </div>

          {species.sizes.length > 1 && (
            <Segmented
              legend="Tamanho"
              value={character.size ?? ''}
              onChange={(v) => edit((c) => setSize(c, v as 'Pequeno' | 'Médio'))}
              options={species.sizes.map((s) => ({ value: s, label: s }))}
            />
          )}

          {species.lineages.length > 0 && (
            <Section title={species.lineageLabel ?? 'Linhagem'}>
              <div className="grid gap-2 sm:grid-cols-2">
                {species.lineages.map((l) => (
                  <OptionCard
                    key={l.id}
                    compact
                    selected={l.id === character.lineageId}
                    onSelect={() => edit((c) => selectLineage(c, l.id))}
                    title={l.name}
                    subtitle={l.summary}
                  />
                ))}
              </div>
              {lineage && <FeatureList features={lineage.traits} level={character.level} />}
            </Section>
          )}

          {species.lineageSpellAbilities && (
            <div>
              <Segmented
                legend="Atributo de conjuração das magias da linhagem"
                value={character.lineageSpellAbility ?? ''}
                onChange={(v) => edit((c) => setLineageSpellAbility(c, v as 'int' | 'sab' | 'car'))}
                options={species.lineageSpellAbilities.map((a) => ({
                  value: a,
                  label: ABILITY_LABEL[a].name,
                }))}
              />
              <p className="mt-2 text-sm text-ink-muted">
                Dica: escolha o mesmo atributo da sua classe (Inteligência para mago, Sabedoria para
                clérigo e druida, Carisma para bardo, bruxo e feiticeiro).
              </p>
            </div>
          )}

          <Section title="Traços">
            <FeatureList features={species.traits} level={character.level} />
          </Section>

          <FeatureChoices wizard={wizard} scope="especie" features={species.traits} />
          {lineage && <FeatureChoices wizard={wizard} scope="linhagem" features={lineage.traits} />}
        </div>
      )}
    </div>
  );
}
