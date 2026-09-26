import { useId } from 'react';
import { content } from '@/content';
import { ABILITIES, type Ability, type ClassDef } from '@/content/schema';
import type { FeatPick } from '@/model/character';
import { setLevelFeat, setLevelFeatBonus } from '@/model/edits';
import { allowedFeatCategories } from '@/rules/validate';
import { cn } from '@/lib/cn';
import { ABILITY_LABEL } from '../labels';
import type { LoadedWizard } from '../useWizard';
import { FeatChoices } from './FeatureChoices';

const CATEGORY_LABEL = {
  geral: 'Talentos gerais',
  origem: 'Talentos de origem',
  'estilo-de-luta': 'Estilos de luta',
  'dadiva-epica': 'Dádivas épicas',
} as const;

/** Talentos ganhos por nível (Aumento no Valor de Atributo, outros talentos, Dádiva Épica). */
export function LevelFeats({ wizard, classDef }: { wizard: LoadedWizard; classDef: ClassDef }) {
  const { character } = wizard;
  const levels = [...classDef.featLevels, classDef.epicBoonLevel].filter(
    (l) => l <= character.level,
  );
  if (!levels.length) return null;
  return (
    <div className="space-y-6">
      {levels.map((lvl) => (
        <LevelFeat
          key={lvl}
          wizard={wizard}
          classDef={classDef}
          level={lvl}
          pick={character.feats.find((f) => f.level === lvl)}
        />
      ))}
    </div>
  );
}

function LevelFeat({
  wizard,
  classDef,
  level,
  pick,
}: {
  wizard: LoadedWizard;
  classDef: ClassDef;
  level: number;
  pick: FeatPick | undefined;
}) {
  const id = useId();
  const { edit } = wizard;
  const cats = allowedFeatCategories(level, classDef);
  const feat = content.feats.find((f) => f.id === pick?.featId);
  const epic = level === classDef.epicBoonLevel;
  return (
    <div className="space-y-3 rounded-card border border-line bg-surface p-4">
      <div>
        <label htmlFor={id} className="font-display font-semibold">
          Nível {level}: {epic ? 'Dádiva Épica (ou outro talento)' : 'talento'}
        </label>
        <p className="text-sm text-ink-muted">
          {epic
            ? 'Uma dádiva épica aumenta um atributo em 1 (até 30) e dá um poder lendário.'
            : 'O mais comum é o Aumento no Valor de Atributo: +2 em um atributo ou +1 em dois.'}
        </p>
      </div>
      <select
        id={id}
        value={pick?.featId ?? ''}
        onChange={(e) => edit((c) => setLevelFeat(c, level, e.target.value))}
        className="min-h-11 w-full cursor-pointer rounded-lg border border-line-strong bg-bg px-3 sm:w-auto"
      >
        <option value="">Escolha um talento…</option>
        {cats.map((cat) => (
          <optgroup key={cat} label={CATEGORY_LABEL[cat]}>
            {content.feats
              .filter((f) => f.category === cat)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      {feat && <p className="text-sm">{feat.plain}</p>}
      {feat?.abilityIncrease && (
        <AbilityIncrease
          mode={feat.abilityIncrease.mode}
          options={feat.abilityIncrease.options}
          value={pick?.abilityBonus ?? {}}
          onChange={(b) => edit((c) => setLevelFeatBonus(c, level, b))}
        />
      )}
      {feat && <FeatChoices wizard={wizard} featId={feat.id} scope={`nivel${level}:${feat.id}`} />}
    </div>
  );
}

function AbilityIncrease({
  mode,
  options,
  value,
  onChange,
}: {
  mode: '+1' | 'um+2-ou-dois+1';
  options: Ability[];
  value: Partial<Record<Ability, number>>;
  onChange: (v: Partial<Record<Ability, number>>) => void;
}) {
  const total = Object.values(value).reduce((s, v) => s + (v ?? 0), 0);
  const budget = mode === '+1' ? 1 : 2;
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">
        {mode === '+1' ? 'Aumente um atributo em 1' : 'Distribua +2 (um atributo +2 ou dois +1)'}
        <span className="num ml-2 text-ink-muted">
          {total} de {budget}
        </span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {ABILITIES.filter((a) => options.includes(a)).map((a) => {
          const v = value[a] ?? 0;
          const next = () => {
            if (mode === '+1') return onChange(v ? {} : { [a]: 1 });
            // Ciclo 0 → +1 → +2 → 0, respeitando o total de 2.
            const others = total - v;
            const n = v === 0 ? 1 : v === 1 && others === 0 ? 2 : 0;
            if (others + n > 2) return;
            onChange({ ...value, [a]: n });
          };
          return (
            <button
              key={a}
              type="button"
              onClick={next}
              aria-pressed={v > 0}
              aria-label={`${ABILITY_LABEL[a].name}: +${v}`}
              className={cn(
                'num min-h-11 min-w-16 cursor-pointer rounded-lg border border-line-strong px-3 text-sm font-semibold',
                v === 1 && 'border-seal bg-seal/10',
                v === 2 && 'border-seal bg-seal text-on-seal',
              )}
            >
              {ABILITY_LABEL[a].abbr} {v ? `+${v}` : ''}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
