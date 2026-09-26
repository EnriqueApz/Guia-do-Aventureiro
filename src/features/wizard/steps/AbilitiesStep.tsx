import { Dices, Lightbulb, Minus, Plus, Wand2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useId, useState } from 'react';
import { content } from '@/content';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Segmented';
import { ABILITIES, type Ability } from '@/content/schema';
import type { AbilityMethod, Character } from '@/model/character';
import {
  applyClassSuggestion,
  assignScore,
  changePointBuy,
  ensureStandardArray,
  setAbilityMethod,
  setAbilityRolls,
  setBackgroundBonus,
  setManualScore,
} from '@/model/edits';
import {
  abilityModifier,
  isStandardArray,
  canChangePointBuy,
  POINT_BUY_BUDGET,
  pointBuyCost,
  pointBuySpent,
  roll4d6DropLowest,
  STANDARD_ARRAY,
} from '@/rules/abilities';
import { ABILITY_LABEL, formatBonus, joinPt } from '../labels';
import { D6 } from '../parts/Dice';
import { GlossaryTerm } from '../parts/GlossaryTerm';
import { Section } from '../parts/Section';
import { StepHeader } from '../parts/StepHeader';
import type { StepProps } from '../WizardPage';
import { useTable } from '@/state/table';

const METHODS: { value: AbilityMethod; label: string }[] = [
  { value: 'padrao', label: 'Array padrão' },
  { value: 'compra', label: 'Compra' },
  { value: 'rolagem', label: 'Rolar dados' },
  { value: 'manual', label: 'Digitar' },
];

const METHOD_HELP: Record<AbilityMethod, string> = {
  padrao:
    'Seis valores prontos (15, 14, 13, 12, 10 e 8) para distribuir. É o jeito mais rápido e equilibrado: recomendado para a primeira ficha.',
  compra:
    'Todos começam em 8 e você tem 27 pontos para gastar. Valores altos custam mais. Bom para quem quer ajustar cada detalhe.',
  rolagem:
    'Role 4d6 seis vezes e descarte o menor dado de cada rolagem. Pode sair um herói fortíssimo ou bem fraco: combine com a mesa antes.',
  manual:
    'Para quem rolou os dados na mesa, com o grupo. Digite os valores de 3 a 18 que vocês tiraram.',
};

export default function AbilitiesStep({ wizard }: StepProps) {
  const tableRules = useTable((st) => st.rules);
  const { character, sheet, edit } = wizard;
  const { method, base } = character.abilities;
  const classDef = content.classes.find((c) => c.id === character.classId);
  const background = content.backgrounds.find((b) => b.id === character.backgroundId);
  const abilityInfo = new Map(content.abilities.map((a) => [a.id, a]));

  // Primeira visita com o array padrão: já distribui os valores pela sugestão da classe.
  useEffect(() => {
    if (method === 'padrao' && !isStandardArray(base)) edit((c) => ensureStandardArray(c, content));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8">
      <StepHeader eyebrow="Etapa 6" title="Defina seus atributos">
        <p>
          Os seis <GlossaryTerm id="atributo">atributos</GlossaryTerm> dizem no que o personagem é
          bom. Cada valor vira um <GlossaryTerm id="modificador">modificador</GlossaryTerm>, o
          número que você soma nos dados: 10 é mediano (+0), 15 é ótimo (+2) e 8 é fraco (−1).
        </p>
      </StepHeader>

      <Segmented
        legend="Como gerar os valores"
        options={METHODS.filter((m) => tableRules?.abilityMethods.includes(m.value) ?? true)}
        value={method}
        onChange={(m) => edit((c) => setAbilityMethod(c, m, content))}
      />
      <p className="-mt-5 text-ink-muted">{METHOD_HELP[method]}</p>

      {classDef && (
        <Card className="flex flex-col gap-3 border-gold-soft sm:flex-row sm:items-start">
          <Lightbulb aria-hidden className="size-6 shrink-0 text-gold" />
          <div className="flex-1">
            <p className="font-display font-semibold">Sugestão para {classDef.name}</p>
            <p className="num mt-1 text-sm">
              {ABILITIES.slice()
                .sort(
                  (x, y) =>
                    (classDef.recommendedScores[y] ?? 0) - (classDef.recommendedScores[x] ?? 0),
                )
                .map((a) => `${ABILITY_LABEL[a].abbr} ${classDef.recommendedScores[a]}`)
                .join(' · ')}
            </p>
            <p className="mt-1 text-sm text-ink-muted">{classDef.recommendedWhy}</p>
          </div>
          <Button
            variant="secundario"
            onClick={() => edit((c) => applyClassSuggestion(c, content))}
            disabled={method === 'rolagem' && !character.abilities.rolls}
          >
            <Wand2 aria-hidden className="size-5" />
            {method === 'padrao' || method === 'compra' ? 'Usar sugestão' : 'Organizar valores'}
          </Button>
        </Card>
      )}

      {method === 'rolagem' && <RollPanel character={character} edit={edit} />}

      <Section title="Seus valores">
        {method === 'compra' && (
          <p className="num font-semibold" aria-live="polite">
            Pontos gastos: {pointBuySpent(base)} de {POINT_BUY_BUDGET}
          </p>
        )}
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {ABILITIES.map((a) => (
            <li key={a} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1 basis-48">
                <p className="font-display font-semibold">
                  {ABILITY_LABEL[a].name}{' '}
                  <span className="text-sm text-ink-muted">({ABILITY_LABEL[a].abbr})</span>
                </p>
                <p className="text-sm text-ink-muted">{abilityInfo.get(a)?.plain}</p>
              </div>
              <ScoreControl character={character} ability={a} edit={edit} />
              <p
                className="num w-16 text-right text-lg font-semibold"
                aria-label={`Total de ${ABILITY_LABEL[a].name}`}
              >
                {sheet.abilities[a].score}
                <span className="block text-sm font-normal text-ink-muted">
                  {formatBonus(sheet.abilities[a].modifier)}
                </span>
              </p>
            </li>
          ))}
        </ul>
        <p className="text-sm text-ink-muted">
          O total à direita já soma os aumentos do antecedente e de talentos.
        </p>
      </Section>

      {background && (
        <BackgroundBonus
          options={background.abilityOptions}
          name={background.name}
          bonus={character.backgroundBonus}
          onChange={(b) => edit((c) => setBackgroundBonus(c, b))}
        />
      )}
    </div>
  );
}

type Edit = (fn: (c: Character) => Character) => void;

function ScoreControl({
  character,
  ability,
  edit,
}: {
  character: Character;
  ability: Ability;
  edit: Edit;
}) {
  const id = useId();
  const { method, base } = character.abilities;
  const label = `Valor de ${ABILITY_LABEL[ability].name}`;
  const value = base[ability];

  if (method === 'compra') {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="secundario"
          size="icone"
          aria-label={`Diminuir ${ABILITY_LABEL[ability].name}`}
          disabled={!canChangePointBuy(base, ability, -1)}
          onClick={() => edit((c) => changePointBuy(c, ability, -1))}
        >
          <Minus aria-hidden className="size-4" />
        </Button>
        <span className="num w-14 text-center" aria-label={label}>
          <span className="block text-lg font-semibold">{value}</span>
          <span className="block text-xs text-ink-muted">
            {value >= 8 && value <= 15 ? `custo ${pointBuyCost(value)}` : '—'}
          </span>
        </span>
        <Button
          variant="secundario"
          size="icone"
          aria-label={`Aumentar ${ABILITY_LABEL[ability].name}`}
          disabled={!canChangePointBuy(base, ability, 1)}
          onClick={() => edit((c) => changePointBuy(c, ability, 1))}
        >
          <Plus aria-hidden className="size-4" />
        </Button>
      </div>
    );
  }

  if (method === 'manual') {
    return (
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={3}
          max={18}
          value={value}
          onChange={(e) => edit((c) => setManualScore(c, ability, e.target.valueAsNumber))}
          className="num min-h-11 w-20 rounded-lg border border-line-strong bg-bg px-3 text-lg"
        />
      </div>
    );
  }

  // Array padrão e rolagem: escolher entre os seis valores (trocando com quem tinha).
  const pool =
    method === 'padrao' ? [...STANDARD_ARRAY] : ABILITIES.map((a) => base[a]).sort((x, y) => y - x);
  const disabled = method === 'rolagem' && !character.abilities.rolls;
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => edit((c) => assignScore(c, ability, Number(e.target.value)))}
        className="num min-h-11 w-32 cursor-pointer rounded-lg border border-line-strong bg-bg px-3 text-lg disabled:opacity-50"
      >
        {[...new Set(pool)].map((v) => (
          <option key={v} value={v}>
            {v} ({formatBonus(abilityModifier(v))})
          </option>
        ))}
      </select>
    </div>
  );
}

function RollPanel({ character, edit }: { character: Character; edit: Edit }) {
  const [rollCount, setRollCount] = useState(0);
  const rolls = character.abilities.rolls;
  const roll = () => {
    const next = Array.from({ length: 6 }, () => roll4d6DropLowest().dice);
    setRollCount((n) => n + 1);
    edit((c) => setAbilityRolls(c, next, content));
  };
  return (
    <Section title="Rolagens">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={roll}>
          <Dices aria-hidden className="size-5" />
          {rolls ? 'Rolar tudo de novo' : 'Rolar 4d6 seis vezes'}
        </Button>
        <p className="text-sm text-ink-muted">
          Os totais vão para os atributos mais importantes da sua classe; depois você pode trocar.
        </p>
      </div>
      {rolls && (
        <ol className="grid gap-2 sm:grid-cols-2" aria-live="polite">
          {rolls.map((dice, i) => {
            const low = dice.indexOf(Math.min(...dice));
            const total = dice.reduce((s, d) => s + d, 0) - Math.min(...dice);
            return (
              <li
                key={i}
                className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2"
              >
                <span className="num w-5 text-sm text-ink-muted">{i + 1}.</span>
                {dice.map((d, j) => (
                  <D6
                    key={j}
                    value={d}
                    dropped={j === low}
                    delay={i * 0.08 + j * 0.05}
                    rollKey={`${rollCount}-${i}-${j}`}
                  />
                ))}
                <motion.span
                  key={`${rollCount}-${i}-t`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="num ml-auto text-xl font-semibold"
                >
                  = {total}
                </motion.span>
              </li>
            );
          })}
        </ol>
      )}
    </Section>
  );
}

function BackgroundBonus({
  options,
  name,
  bonus,
  onChange,
}: {
  options: readonly Ability[];
  name: string;
  bonus: Character['backgroundBonus'];
  onChange: (b: Character['backgroundBonus']) => void;
}) {
  const plusTwoId = useId();
  const plusOneId = useId();
  const values = Object.values(bonus).filter(Boolean);
  const mode: 'dois' | 'tres' = values.length === 3 ? 'tres' : 'dois';
  const two = options.find((a) => bonus[a] === 2);
  const one = options.find((a) => bonus[a] === 1);
  const setTwoOne = (t: Ability | undefined, o: Ability | undefined) =>
    onChange({ ...(t && { [t]: 2 }), ...(o && o !== t && { [o]: 1 }) });

  return (
    <Section title={`Aumentos do antecedente (${name})`}>
      <p className="text-ink-muted">
        O antecedente aumenta {joinPt(options.map((a) => ABILITY_LABEL[a].name))}: dê +2 em um e +1
        em outro, ou +1 nos três. Nenhum valor passa de 20.
      </p>
      <Segmented
        legend="Como distribuir"
        options={[
          { value: 'dois', label: '+2 e +1' },
          { value: 'tres', label: '+1 em cada' },
        ]}
        value={mode}
        onChange={(m) =>
          m === 'tres'
            ? onChange(Object.fromEntries(options.map((a) => [a, 1])))
            : setTwoOne(options[0], options[1])
        }
      />
      {mode === 'dois' && (
        <div className="flex flex-wrap gap-4">
          <div>
            <label htmlFor={plusTwoId} className="mb-1 block font-semibold">
              +2 em
            </label>
            <select
              id={plusTwoId}
              value={two ?? ''}
              onChange={(e) =>
                setTwoOne(
                  (e.target.value || undefined) as Ability | undefined,
                  one === e.target.value ? two : one,
                )
              }
              className="min-h-11 cursor-pointer rounded-lg border border-line-strong bg-bg px-3"
            >
              <option value="">Escolha…</option>
              {options.map((a) => (
                <option key={a} value={a}>
                  {ABILITY_LABEL[a].name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={plusOneId} className="mb-1 block font-semibold">
              +1 em
            </label>
            <select
              id={plusOneId}
              value={one ?? ''}
              onChange={(e) =>
                setTwoOne(
                  two === e.target.value ? one : two,
                  (e.target.value || undefined) as Ability | undefined,
                )
              }
              className="min-h-11 cursor-pointer rounded-lg border border-line-strong bg-bg px-3"
            >
              <option value="">Escolha…</option>
              {options.map((a) => (
                <option key={a} value={a}>
                  {ABILITY_LABEL[a].name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </Section>
  );
}
