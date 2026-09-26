import { Dices, Sparkles, Swords } from 'lucide-react';
import { useRef } from 'react';
import { content } from '@/content';
import { Badge, DifficultyBadge } from '@/components/ui/Badge';
import { selectClass } from '@/model/edits';
import {
  ABILITY_LABEL,
  armorList,
  itemName,
  joinPt,
  ROLE_LABEL,
  skillName,
  weaponList,
} from '../labels';
import { FeatureList } from '../parts/FeatureList';
import { GlossaryTerm } from '../parts/GlossaryTerm';
import { ClassIcon } from '../parts/Icons';
import { OptionCard } from '../parts/OptionCard';
import { Fact, Section } from '../parts/Section';
import { BeginnerNote } from '../parts/BeginnerNote';
import { StepHeader } from '../parts/StepHeader';
import { useScrollIntoViewOnChange } from '../useScrollIntoView';
import type { StepProps } from '../WizardPage';
import { allowed, homebrewBlocked } from '@/model/table';
import { useTable } from '@/state/table';

export default function ClassStep({ wizard, goTo }: StepProps) {
  const tableRules = useTable((st) => st.rules);
  const { character, edit } = wizard;
  const cls = content.classes.find((c) => c.id === character.classId);
  const detailRef = useRef<HTMLDivElement>(null);
  useScrollIntoViewOnChange(detailRef, character.classId);
  const primary = (ids: string[], mode: 'e' | 'ou') =>
    joinPt(
      ids.map((a) => ABILITY_LABEL[a as keyof typeof ABILITY_LABEL].name),
      mode,
    );

  const current =
    cls?.features.filter((f) => f.level <= character.level && !f.id.endsWith('-subclass')) ?? [];
  const upcoming = cls?.features.filter((f) => f.level > character.level) ?? [];

  return (
    <div className="space-y-8">
      <StepHeader eyebrow="Etapa 3" title="Escolha sua classe">
        <p>
          A classe é o que o personagem faz de melhor: lutar, lançar magias, curar ou resolver
          problemas com astúcia. É a escolha que mais muda o jeito de jogar.
        </p>
      </StepHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {content.classes.map((c) => (
          <OptionCard
            key={c.id}
            disabled={!allowed(tableRules?.classes, c.id) || homebrewBlocked(tableRules, c)}
            disabledReason="Não liberado pela mesa."
            selected={c.id === character.classId}
            onSelect={() => edit((ch) => selectClass(ch, c.id, content))}
            title={c.name}
            subtitle={c.summary}
            icon={<ClassIcon id={c.id} />}
          >
            <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
              <DifficultyBadge level={c.beginner.rating} />
              {c.roles.slice(0, 2).map((r) => (
                <Badge key={r}>{ROLE_LABEL[r]}</Badge>
              ))}
            </span>
            <span className="text-sm text-ink-muted">
              {primary(c.primaryAbilities, c.primaryMode)} · d{c.hitDie}
            </span>
          </OptionCard>
        ))}
      </div>

      {cls && (
        <div
          ref={detailRef}
          className="scroll-mt-24 space-y-8 rounded-card border border-line bg-surface/60 p-5"
        >
          <div>
            <h2 className="flex items-center gap-3 text-3xl font-semibold">
              <ClassIcon id={cls.id} className="size-7 text-gold" /> {cls.name}
            </h2>
            <p className="mt-2">{cls.description}</p>
            <BeginnerNote beginner={cls.beginner} kind="classe" id={cls.id} />
          </div>

          <Section title="Como isso funciona na mesa?">
            <div className="flex gap-3 rounded-lg border border-gold-soft/60 bg-gold-soft/10 p-4">
              <Swords aria-hidden className="mt-0.5 size-5 shrink-0 text-gold" />
              <p>{cls.typicalTurn}</p>
            </div>
          </Section>

          {cls.spellcasting && (
            <Section title="Como funciona a magia">
              <div className="flex gap-3 rounded-lg border border-sky/30 bg-sky/5 p-4">
                <Sparkles aria-hidden className="mt-0.5 size-5 shrink-0 text-sky" />
                <p>{cls.spellcasting.explainer}</p>
              </div>
            </Section>
          )}

          <Section title="Resumo">
            <dl>
              <Fact label="Papel no grupo">{joinPt(cls.roles.map((r) => ROLE_LABEL[r] ?? r))}</Fact>
              <Fact label="Atributo principal">
                {primary(cls.primaryAbilities, cls.primaryMode)}
              </Fact>
              <Fact label={<GlossaryTerm id="dados-de-vida">Dado de vida</GlossaryTerm>}>
                d{cls.hitDie} (PV no nível 1: {cls.hitDie} + Constituição)
              </Fact>
              <Fact label={<GlossaryTerm id="salvaguarda">Salvaguardas</GlossaryTerm>}>
                {joinPt(cls.saves.map((a) => ABILITY_LABEL[a].name))}
              </Fact>
              <Fact label="Armaduras">{armorList(cls.armor)}</Fact>
              <Fact label="Armas">{weaponList(cls.weapons)}</Fact>
              {cls.tools.length > 0 && (
                <Fact label="Ferramentas">{joinPt(cls.tools.map(itemName))}</Fact>
              )}
              {cls.toolChoice && <Fact label="Ferramentas">{cls.toolChoice.label}</Fact>}
              <Fact label={<GlossaryTerm id="pericia">Perícias</GlossaryTerm>}>
                Escolha {cls.skillChoice.count}{' '}
                {cls.skillChoice.from === 'qualquer'
                  ? 'perícias quaisquer'
                  : `entre ${joinPt(cls.skillChoice.from.map(skillName), 'ou')}`}
                <span className="block text-sm text-ink-muted">
                  Você escolhe na etapa Perícias.
                </span>
              </Fact>
              <Fact label="Equipamento inicial">
                <ul className="space-y-1">
                  {cls.startingEquipment.map((opt) => (
                    <li key={opt.id}>
                      <strong className="uppercase">{opt.id})</strong>{' '}
                      {opt.items.length
                        ? `${joinPt(opt.items.map((i) => (i.qty > 1 ? `${i.qty}× ${itemName(i.id)}` : itemName(i.id))))} e ${opt.gold} PO`
                        : `${opt.gold} PO para comprar o que quiser`}
                      {opt.note && <span className="block text-sm text-ink-muted">{opt.note}</span>}
                    </li>
                  ))}
                </ul>
              </Fact>
            </dl>
          </Section>

          <Section
            title={
              character.level > 1
                ? `O que você ganha até o nível ${character.level}`
                : 'O que você ganha no nível 1'
            }
          >
            <FeatureList features={current} level={character.level} />
          </Section>

          {upcoming.length > 0 && (
            <details className="group rounded-lg border border-line p-4">
              <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-display text-lg font-semibold">
                <Dices aria-hidden className="size-5 text-gold" /> Mais adiante ({upcoming.length}{' '}
                características)
              </summary>
              <FeatureList features={upcoming} level={character.level} className="mt-3" />
            </details>
          )}

          {character.level >= 3 && (
            <p>
              No nível {character.level} você já tem uma subclasse.{' '}
              <button
                type="button"
                className="cursor-pointer font-semibold text-ink underline decoration-seal decoration-2"
                onClick={() => goTo('subclasse')}
              >
                Escolher subclasse
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
