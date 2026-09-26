import { Dices } from 'lucide-react';
import { motion } from 'motion/react';
import { useId, useRef, useState } from 'react';
import { content } from '@/content';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RichText } from '@/components/ui/RichText';
import type { Background } from '@/content/schema';
import type { Character } from '@/model/character';
import { selectBackground, setPersonality, toggleChoice } from '@/model/edits';
import { rollDie } from '@/rules/dice';
import { ABILITY_LABEL, featName, itemName, joinPt, skillName } from '../labels';
import { ChoicePicker } from '../parts/ChoicePicker';
import { GlossaryTerm } from '../parts/GlossaryTerm';
import { OptionCard } from '../parts/OptionCard';
import { Fact, Section } from '../parts/Section';
import { StepHeader } from '../parts/StepHeader';
import { useScrollIntoViewOnChange } from '../useScrollIntoView';
import type { StepProps } from '../WizardPage';

type PersonalityField = keyof Character['details']['personality'];

const FIELDS: {
  id: PersonalityField;
  table: keyof Background['personality'];
  label: string;
  hint: string;
}[] = [
  {
    id: 'traits',
    table: 'traits',
    label: 'Traço de personalidade',
    hint: 'Um jeito de ser que os outros notam.',
  },
  { id: 'ideals', table: 'ideals', label: 'Ideal', hint: 'Aquilo em que o personagem acredita.' },
  {
    id: 'bonds',
    table: 'bonds',
    label: 'Vínculo',
    hint: 'Uma pessoa, lugar ou objetivo que importa muito.',
  },
  {
    id: 'flaws',
    table: 'flaws',
    label: 'Defeito',
    hint: 'Uma fraqueza que pode meter o grupo em confusão.',
  },
];

export default function BackgroundStep({ wizard }: StepProps) {
  const { character, edit } = wizard;
  const bg = content.backgrounds.find((b) => b.id === character.backgroundId);
  const detailRef = useRef<HTMLDivElement>(null);
  useScrollIntoViewOnChange(detailRef, character.backgroundId);
  const stubs = content.stubs.filter((s) => s.type === 'antecedente');
  const feat = bg && content.feats.find((f) => f.id === bg.originFeat.id);

  return (
    <div className="space-y-8">
      <StepHeader eyebrow="Etapa 5" title="Escolha seu antecedente">
        <p>
          O antecedente é o que o personagem fazia antes da aventura. Ele dá duas perícias, uma
          ferramenta, um talento de origem e os aumentos de atributo, que você distribui na etapa
          Atributos.
        </p>
      </StepHeader>

      <div className="grid gap-3 sm:grid-cols-2">
        {content.backgrounds.map((b) => (
          <OptionCard
            key={b.id}
            selected={b.id === character.backgroundId}
            onSelect={() => edit((c) => selectBackground(c, b.id))}
            title={b.name}
            subtitle={b.summary}
          >
            <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
              {b.skills.map((s) => (
                <Badge key={s}>{skillName(s)}</Badge>
              ))}
              <Badge>{featName(b.originFeat.id)}</Badge>
            </span>
          </OptionCard>
        ))}
        {stubs.map((s) => (
          <OptionCard
            key={s.id}
            compact
            selected={false}
            onSelect={() => undefined}
            disabled
            title={s.name}
            subtitle={s.ref}
            disabledReason="Incompleto: fora do SRD."
          />
        ))}
      </div>

      {bg && (
        <div
          ref={detailRef}
          className="scroll-mt-24 space-y-8 rounded-card border border-line bg-surface/60 p-5"
        >
          <div>
            <h2 className="text-3xl font-semibold">{bg.name}</h2>
            <p className="mt-2">{bg.description}</p>
          </div>

          <Section title="O que você ganha">
            <dl>
              <Fact label={<GlossaryTerm id="atributo">Atributos</GlossaryTerm>}>
                +2 e +1, ou +1 em cada, entre{' '}
                {joinPt(
                  bg.abilityOptions.map((a) => ABILITY_LABEL[a].name),
                  'e',
                )}
                <span className="block text-sm text-ink-muted">
                  Você distribui na etapa Atributos.
                </span>
              </Fact>
              <Fact label={<GlossaryTerm id="pericia">Perícias</GlossaryTerm>}>
                {joinPt(bg.skills.map(skillName))}
              </Fact>
              <Fact label="Ferramenta">
                {typeof bg.tool === 'string' ? itemName(bg.tool) : bg.tool.label}
              </Fact>
              <Fact label={<GlossaryTerm id="talento">Talento de origem</GlossaryTerm>}>
                <strong>{feat?.name}</strong>
                {bg.originFeat.note &&
                  ` (lista do ${bg.originFeat.note === 'clerigo' ? 'Clérigo' : bg.originFeat.note === 'mago' ? 'Mago' : bg.originFeat.note})`}
                {feat && <span className="block">{feat.plain}</span>}
                {feat && (
                  <details className="mt-1">
                    <summary className="min-h-9 cursor-pointer text-sm font-semibold text-gold">
                      Ver regra completa
                    </summary>
                    <RichText text={feat.text} className="mt-1 text-sm text-ink-muted" />
                  </details>
                )}
              </Fact>
              <Fact label="Equipamento">
                <ul className="space-y-1">
                  {bg.equipment.map((opt) => (
                    <li key={opt.id}>
                      <strong className="uppercase">{opt.id})</strong>{' '}
                      {opt.items.length
                        ? `${joinPt(opt.items.map((i) => (i.qty > 1 ? `${i.qty}× ${itemName(i.id)}` : itemName(i.id))))} e ${opt.gold} PO`
                        : `${opt.gold} PO`}
                      {opt.note && <span className="block text-sm text-ink-muted">{opt.note}</span>}
                    </li>
                  ))}
                </ul>
                <span className="block text-sm text-ink-muted">
                  Você escolhe o pacote na etapa Equipamento.
                </span>
              </Fact>
            </dl>
          </Section>

          {typeof bg.tool !== 'string' && (
            <ChoicePicker
              label={bg.tool.label}
              options={(Array.isArray(bg.tool.from) ? bg.tool.from : []).map((id) => ({
                id,
                label: itemName(id),
              }))}
              selected={character.choices['antecedente:ferramenta'] ?? []}
              max={1}
              onToggle={(id) => edit((c) => toggleChoice(c, 'antecedente:ferramenta', id, 1))}
            />
          )}

          <Section title="Personalidade">
            <p className="text-ink-muted">
              Opcional, mas ajuda muito a interpretar. Escolha uma sugestão, role os dados ou
              escreva do seu jeito.
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              {FIELDS.map((f) => (
                <PersonalityField
                  key={f.id}
                  label={f.label}
                  hint={f.hint}
                  suggestions={bg.personality[f.table]}
                  value={character.details.personality[f.id]}
                  onChange={(v) => edit((c) => setPersonality(c, f.id, v))}
                />
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

interface PersonalityFieldProps {
  label: string;
  hint: string;
  suggestions: string[];
  value: string;
  onChange: (value: string) => void;
}

function PersonalityField({ label, hint, suggestions, value, onChange }: PersonalityFieldProps) {
  const id = useId();
  const [rolled, setRolled] = useState<number | null>(null);
  const roll = () => {
    const n = rollDie(suggestions.length);
    setRolled(n);
    onChange(suggestions[n - 1] ?? '');
  };
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <label htmlFor={id} className="font-display font-semibold">
          {label}
          <span className="block font-body text-sm font-normal text-ink-muted">{hint}</span>
        </label>
        <Button
          variant="secundario"
          onClick={roll}
          aria-label={`Sortear ${label.toLowerCase()} (d${suggestions.length})`}
        >
          <motion.span
            key={rolled ?? 'idle'}
            initial={{ rotate: -180, scale: 0.6 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            className="inline-flex"
          >
            <Dices aria-hidden className="size-5" />
          </motion.span>
          d{suggestions.length}
          {rolled !== null && <span className="num">: {rolled}</span>}
        </Button>
      </div>
      <textarea
        id={id}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line-strong bg-bg px-3 py-2"
      />
      <ul className="flex flex-col gap-1.5">
        {suggestions.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => onChange(s)}
              aria-pressed={value === s}
              className="w-full cursor-pointer rounded-lg border border-line px-3 py-2 text-left text-sm hover:border-gold-soft aria-pressed:border-seal aria-pressed:bg-seal/5"
            >
              <span className="num mr-2 text-ink-muted">{i + 1}.</span>
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
