import { content } from '@/content';
import type { ClassDef, Feature } from '@/content/schema';
import { choiceKey } from '@/model/character';
import { toggleChoice } from '@/model/edits';
import { evaluateFormula } from '@/rules/formula';
import type { LoadedWizard } from '../useWizard';
import { featName, itemName, languageName, skillName } from '../labels';
import { ChoicePicker, type PickerOption } from './ChoicePicker';

const SUPPORTED = new Set(['pericia', 'idioma', 'ferramenta', 'opcao', 'talento']);

interface FeatureChoicesProps {
  wizard: LoadedWizard;
  scope: string;
  features: Feature[];
  classDef?: ClassDef;
}

/** Escolhas simples de traços e características (perícias, idiomas, opções, talentos). */
export function FeatureChoices({ wizard, scope, features, classDef }: FeatureChoicesProps) {
  const { character, sheet, edit } = wizard;
  const ctx = {
    level: character.level,
    proficiencyBonus: sheet.proficiencyBonus,
    modifiers: Object.fromEntries(
      Object.entries(sheet.abilities).map(([a, v]) => [a, v.modifier]),
    ) as never,
    ...(classDef && { classDef }),
  };

  const pickers = features
    .filter((f) => (f.level ?? 1) <= character.level)
    .flatMap((f) =>
      (f.choices ?? []).filter((ch) => SUPPORTED.has(ch.kind)).map((ch) => ({ f, ch })),
    );
  if (!pickers.length) return null;

  return (
    <div className="space-y-5">
      {pickers.map(({ f, ch }) => {
        const key = choiceKey(scope, f.id, ch.id);
        const selected = character.choices[key] ?? [];
        const max = evaluateFormula(ch.count, ctx);
        const from = ch.from === 'qualquer' || !ch.from ? undefined : ch.from;
        let options: PickerOption[] = [];
        if (ch.kind === 'pericia') {
          const ids = from ?? content.skills.map((s) => s.id);
          options = ids.map((id) => {
            const already =
              sheet.skills[id as keyof typeof sheet.skills]?.proficient && !selected.includes(id);
            return {
              id,
              label: skillName(id),
              ...(already && { disabled: true, hint: 'você já tem' }),
            };
          });
        } else if (ch.kind === 'idioma') {
          const ids = from ?? content.languages.map((l) => l.id);
          options = ids
            .filter((id) => id !== 'common')
            .map((id) => ({ id, label: languageName(id) }));
        } else if (ch.kind === 'ferramenta') {
          options = (from ?? []).map((id) => ({ id, label: itemName(id) }));
        } else if (ch.kind === 'opcao') {
          options = (ch.options ?? []).map((o) => ({ id: o.id, label: o.name, hint: o.text }));
        } else if (ch.kind === 'talento') {
          const feats = content.feats.filter((x) =>
            ch.featCategory ? x.category === ch.featCategory : from?.includes(x.id),
          );
          options = feats.map((x) => ({ id: x.id, label: featName(x.id), hint: x.plain }));
        }
        const chosenFeat =
          ch.kind === 'talento' ? content.feats.find((x) => x.id === selected[0]) : undefined;
        const chosenOption =
          ch.kind === 'opcao' ? ch.options?.find((o) => o.id === selected[0]) : undefined;
        return (
          <div key={key}>
            <ChoicePicker
              label={ch.label}
              options={options}
              selected={selected}
              max={max}
              onToggle={(id) => edit((c) => toggleChoice(c, key, id, max))}
            />
            {(chosenFeat || chosenOption) && (
              <p className="mt-2 text-sm text-ink-muted">
                <strong className="text-ink">{chosenFeat?.name ?? chosenOption?.name}:</strong>{' '}
                {chosenFeat?.plain ?? chosenOption?.text}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
