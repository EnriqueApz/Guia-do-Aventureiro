import { Dices, PackageOpen, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { content } from '@/content';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Segmented';
import type { Background, ClassDef } from '@/content/schema';
import {
  applyBeginnerKit,
  chooseEquipment,
  setHpMethod,
  setHpRoll,
  toggleChoice,
} from '@/model/edits';
import { rollDie } from '@/rules/dice';
import { fixedHitDieValue } from '@/rules/dice';
import { cn } from '@/lib/cn';
import { itemName, joinPt, languageName, skillName } from '../labels';
import { ChoicePicker } from '../parts/ChoicePicker';
import { D6 } from '../parts/Dice';
import { ChoiceField, FeatChoices, FeatureChoices } from '../parts/FeatureChoices';
import { GlossaryTerm } from '../parts/GlossaryTerm';
import { LevelFeats } from '../parts/LevelFeats';
import { Section } from '../parts/Section';
import { SpellPicker } from '../parts/SpellPicker';
import { spellName } from '../spellLabels';
import { StepHeader } from '../parts/StepHeader';
import type { LoadedWizard } from '../useWizard';
import type { StepProps } from '../WizardPage';
import { useTable } from '@/state/table';

export default function ChoicesStep({ wizard, goTo }: StepProps) {
  const { character, sheet, edit } = wizard;
  const classDef = content.classes.find((c) => c.id === character.classId);
  const background = content.backgrounds.find((b) => b.id === character.backgroundId);
  const subclass = sheet.subclass;
  const [kitApplied, setKitApplied] = useState(false);

  if (!classDef || !background) {
    return (
      <>
        <StepHeader eyebrow="Etapa 7" title="Perícias, equipamento e magias" />
        <Card className="max-w-xl space-y-3">
          <p>Para esta etapa, escolha antes a classe e o antecedente.</p>
          <Button variant="secundario" onClick={() => goTo(classDef ? 'antecedente' : 'classe')}>
            Ir para {classDef ? 'Antecedente' : 'Classe'}
          </Button>
        </Card>
      </>
    );
  }

  const kit = classDef.beginnerKit;
  const sections = [
    { id: 'pericias', label: 'Perícias e idiomas' },
    { id: 'caracteristicas', label: 'Características' },
    { id: 'equipamento', label: 'Equipamento' },
    ...(sheet.spellcasting ? [{ id: 'magias', label: 'Magias' }] : []),
    ...(character.level > 1 ? [{ id: 'pv', label: 'Pontos de Vida' }] : []),
  ];

  return (
    <div className="space-y-10">
      <StepHeader eyebrow="Etapa 7" title="Perícias, equipamento e magias">
        <p>
          Aqui ficam as escolhas da classe e do antecedente. Os contadores mostram quantas faltam, e
          nada ilegal passa: o que não pode ser escolhido fica bloqueado.
        </p>
      </StepHeader>

      {kit && (
        <Card className="space-y-3 border-gold-soft bg-sunken/40">
          <div className="flex items-start gap-3">
            <Sparkles aria-hidden className="mt-0.5 size-6 shrink-0 text-gold" />
            <div>
              <h2 className="text-xl font-semibold">Kit recomendado para iniciantes</h2>
              <p className="mt-1">{kit.why}</p>
              <p className="mt-2 text-sm text-ink-muted">
                Preenche perícias ({joinPt(kit.skills.map(skillName))}), o equipamento{' '}
                {kit.equipment.toUpperCase()}
                {kit.cantrips && `, truques (${joinPt(kit.cantrips.map(spellName))})`}
                {kit.spells && `, magias (${joinPt(kit.spells.map(spellName))})`} e as escolhas da
                classe. Depois dá para trocar qualquer coisa.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => {
                edit((c) => applyBeginnerKit(c, content));
                setKitApplied(true);
              }}
            >
              <Sparkles aria-hidden className="size-5" />
              Usar kit recomendado
            </Button>
            {kitApplied && (
              <p className="text-sm font-semibold text-forest" role="status">
                Kit aplicado! Confira abaixo.
              </p>
            )}
          </div>
        </Card>
      )}

      <nav aria-label="Seções desta etapa" className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="min-h-9 rounded-full border border-line-strong px-3 py-1.5 text-sm font-semibold hover:border-gold"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <Section title="Perícias e idiomas" className="scroll-mt-24">
        <span id="pericias" className="block scroll-mt-24" />
        <ClassSkills wizard={wizard} classDef={classDef} background={background} />
        {classDef.toolChoice && (
          <ChoiceField
            wizard={wizard}
            storeKey="classe:ferramentas"
            choice={classDef.toolChoice}
            classDef={classDef}
          />
        )}
        <Languages wizard={wizard} />
      </Section>

      <Section title="Características e talentos">
        <span id="caracteristicas" className="block scroll-mt-24" />
        <FeatureChoices
          wizard={wizard}
          scope="classe"
          features={classDef.features}
          classDef={classDef}
        />
        {subclass && (
          <FeatureChoices
            wizard={wizard}
            scope="subclasse"
            features={subclass.features}
            classDef={classDef}
          />
        )}
        <OriginFeat wizard={wizard} background={background} />
        <LevelFeats wizard={wizard} classDef={classDef} />
      </Section>

      <Section title="Equipamento inicial">
        <span id="equipamento" className="block scroll-mt-24" />
        <Equipment wizard={wizard} classDef={classDef} background={background} />
      </Section>

      {sheet.spellcasting && (
        <Section title="Magias">
          <span id="magias" className="block scroll-mt-24" />
          <p className="text-ink-muted">{classDef.spellcasting?.explainer}</p>
          <SpellPicker wizard={wizard} />
        </Section>
      )}

      {character.level > 1 && (
        <Section title="Pontos de Vida">
          <span id="pv" className="block scroll-mt-24" />
          <HitPoints wizard={wizard} classDef={classDef} />
        </Section>
      )}
    </div>
  );
}

function ClassSkills({
  wizard,
  classDef,
  background,
}: {
  wizard: LoadedWizard;
  classDef: ClassDef;
  background: Background;
}) {
  const { character, edit } = wizard;
  const { count, from } = classDef.skillChoice;
  const ids = from === 'qualquer' ? content.skills.map((s) => s.id) : from;
  const selected = character.choices['classe:pericias'] ?? [];
  return (
    <div className="space-y-1">
      <ChoicePicker
        label={`Perícias de ${classDef.name}`}
        options={ids.map((id) => {
          const fromBg = background.skills.includes(id as never) && !selected.includes(id);
          return {
            id,
            label: skillName(id),
            ...(fromBg && { disabled: true, hint: 'já vem do antecedente' }),
          };
        })}
        selected={selected}
        max={count}
        onToggle={(id) => edit((c) => toggleChoice(c, 'classe:pericias', id, count))}
      />
      <p className="text-sm text-ink-muted">
        O antecedente já dá {joinPt(background.skills.map(skillName))}.
      </p>
    </div>
  );
}

function Languages({ wizard }: { wizard: LoadedWizard }) {
  const { character, sheet, edit } = wizard;
  const selected = character.choices.idiomas ?? [];
  const standard = content.languages.filter((l) => l.rarity === 'padrao' && l.id !== 'common');
  const rare = content.languages.filter((l) => l.rarity === 'raro');
  const known = new Set(sheet.proficiencies.languages);
  const option = (id: string) => {
    const already = known.has(id) && !selected.includes(id);
    return {
      id,
      label: languageName(id),
      ...(already && { disabled: true, hint: 'você já fala' }),
    };
  };
  return (
    <div className="space-y-2">
      <ChoicePicker
        label="Dois idiomas além do Comum"
        options={standard.map((l) => option(l.id))}
        selected={selected}
        max={2}
        onToggle={(id) => edit((c) => toggleChoice(c, 'idiomas', id, 2))}
      />
      <details>
        <summary className="min-h-9 cursor-pointer text-sm font-semibold text-gold">
          Idiomas raros (só com permissão do Mestre)
        </summary>
        <div className="mt-2">
          <ChoicePicker
            label="Idiomas raros"
            options={rare.map((l) => option(l.id))}
            selected={selected}
            max={2}
            onToggle={(id) => edit((c) => toggleChoice(c, 'idiomas', id, 2))}
          />
        </div>
      </details>
    </div>
  );
}

function OriginFeat({ wizard, background }: { wizard: LoadedWizard; background: Background }) {
  const { character } = wizard;
  const feat = content.feats.find((f) => f.id === background.originFeat.id);
  // Talentos ganhos por traços (ex.: Versátil do Humano) também podem ter escolhas.
  const extra = wizard.sheet.feats
    .map((f) => f.feat)
    .filter(
      (f) =>
        f.id !== feat?.id && f.choices?.length && !character.feats.some((p) => p.featId === f.id),
    );
  if (!feat?.choices?.length && !extra.length) return null;
  return (
    <div className="space-y-5">
      {feat?.choices?.length ? (
        <div className="space-y-3 rounded-card border border-line bg-surface p-4">
          <p className="font-display font-semibold">
            <GlossaryTerm id="talento">Talento de origem</GlossaryTerm>: {feat.name}
          </p>
          <p className="text-sm text-ink-muted">{feat.plain}</p>
          <FeatChoices
            wizard={wizard}
            featId={feat.id}
            scope={`talento:${feat.id}`}
            fixedList={background.originFeat.note}
          />
        </div>
      ) : null}
      {extra.map((f) => (
        <div key={f.id} className="space-y-3 rounded-card border border-line bg-surface p-4">
          <p className="font-display font-semibold">{f.name}</p>
          <FeatChoices wizard={wizard} featId={f.id} scope={`talento:${f.id}`} />
        </div>
      ))}
    </div>
  );
}

function Equipment({
  wizard,
  classDef,
  background,
}: {
  wizard: LoadedWizard;
  classDef: ClassDef;
  background: Background;
}) {
  const { character, edit } = wizard;
  const groups = [
    { which: 'classOption' as const, title: classDef.name, options: classDef.startingEquipment },
    { which: 'backgroundOption' as const, title: background.name, options: background.equipment },
  ];
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <fieldset key={g.which} className="space-y-2">
          <legend className="mb-2 font-display font-semibold">Pacote de {g.title}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {g.options.map((opt) => {
              const on = character.startingEquipment[g.which] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => edit((c) => chooseEquipment(c, g.which, opt.id, content))}
                  className={cn(
                    'flex cursor-pointer flex-col gap-1 rounded-card border bg-surface p-4 text-left shadow-card',
                    on ? 'border-seal ring-2 ring-seal/30' : 'border-line hover:border-gold-soft',
                  )}
                >
                  <span className="font-display font-semibold">
                    Opção {opt.id.toUpperCase()}
                    {opt.items.length === 0 && ' · só ouro'}
                  </span>
                  <span className="text-sm">
                    {opt.items.length
                      ? `${joinPt(opt.items.map((i) => (i.qty > 1 ? `${i.qty}× ${itemName(i.id)}` : itemName(i.id))))} e ${opt.gold} PO`
                      : `${opt.gold} PO para comprar o que quiser`}
                  </span>
                  {opt.note && <span className="text-xs text-ink-muted">{opt.note}</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      {character.inventory.length > 0 && (
        <div className="rounded-card border border-line bg-surface p-4">
          <p className="flex items-center gap-2 font-display font-semibold">
            <PackageOpen aria-hidden className="size-5 text-gold" /> Sua mochila
          </p>
          <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {character.inventory.map((i) => (
              <li key={i.id}>
                {i.qty > 1 && <span className="num">{i.qty}× </span>}
                {itemName(i.id)}
                {i.equipped && <span className="text-forest"> · equipado</span>}
              </li>
            ))}
          </ul>
          <p className="num mt-2 text-sm">Ouro: {character.coins.po} PO</p>
        </div>
      )}
    </div>
  );
}

function HitPoints({ wizard, classDef }: { wizard: LoadedWizard; classDef: ClassDef }) {
  const { character, sheet, edit } = wizard;
  const die = classDef.hitDie;
  const [rolling, setRolling] = useState(0);
  const levels = Array.from({ length: character.level - 1 }, (_, i) => i + 2);
  const tableHp = useTable((st) => st.rules?.hpMethod);
  const fixedHp = tableHp && tableHp !== 'livre' ? tableHp : undefined;
  const rollAll = () => {
    setRolling((n) => n + 1);
    edit((c) => levels.reduce((acc, l) => setHpRoll(acc, l, rollDie(die)), c));
  };
  return (
    <div className="space-y-3">
      <p className="text-ink-muted">
        No 1º nível você tem o máximo do dado de vida (d{die}) mais a Constituição. A cada nível
        seguinte, use a média fixa ({fixedHitDieValue(die)}) ou role o d{die}.{' '}
        <GlossaryTerm id="pv">PV</GlossaryTerm> máximos agora:{' '}
        <strong className="num">{sheet.hp.max}</strong>.
      </p>
      {fixedHp && (
        <p className="text-sm font-semibold text-gold">
          A mesa combinou PV {fixedHp === 'media' ? 'pela média' : 'rolados'} a cada nível.
        </p>
      )}
      <Segmented
        legend="Pontos de Vida por nível"
        options={[
          { value: 'media' as const, label: `Média (${fixedHitDieValue(die)})` },
          { value: 'rolagem' as const, label: `Rolar d${die}` },
        ].filter((o) => !fixedHp || o.value === fixedHp)}
        value={character.hp.method}
        onChange={(m) => edit((c) => setHpMethod(c, m))}
      />
      {character.hp.method === 'rolagem' && (
        <div className="space-y-2">
          <Button variant="secundario" onClick={rollAll}>
            <Dices aria-hidden className="size-5" /> Rolar todos os níveis
          </Button>
          <ul className="flex flex-wrap gap-2">
            {levels.map((l) => {
              const v = character.hp.rolls[l];
              return (
                <li
                  key={l}
                  className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2"
                >
                  <span className="text-sm text-ink-muted">Nível {l}</span>
                  {v !== undefined && die === 6 ? (
                    <D6 value={v} rollKey={`${rolling}-${l}`} delay={(l - 2) * 0.04} />
                  ) : (
                    <span className="num font-semibold">{v ?? '—'}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
