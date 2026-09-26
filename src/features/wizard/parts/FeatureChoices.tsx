import { content } from '@/content';
import { ABILITIES, type Choice, type ClassDef, type Feature } from '@/content/schema';
import { choiceKey } from '@/model/character';
import { toggleChoice } from '@/model/edits';
import { isWeaponProficient } from '@/rules/attacks';
import { evaluateFormula } from '@/rules/formula';
import { featSpellOptions } from '@/rules/spells';
import type { LoadedWizard } from '../useWizard';
import { ABILITY_LABEL, featName, itemName, languageName, skillName } from '../labels';
import { ChoicePicker, type PickerOption } from './ChoicePicker';

interface ChoiceFieldProps {
  wizard: LoadedWizard;
  /** Chave em `character.choices`. */
  storeKey: string;
  choice: Choice;
  classDef?: ClassDef | undefined;
  /** Para escolhas "magia" de talentos: id do talento e lista de magias escolhida. */
  spellSource?: { featId: string; list: string | undefined } | undefined;
}

/** Uma escolha com contador, com as opções certas para cada tipo. */
export function ChoiceField({
  wizard,
  storeKey,
  choice: ch,
  classDef,
  spellSource,
}: ChoiceFieldProps) {
  const { character, sheet, edit } = wizard;
  const ctx = {
    level: character.level,
    proficiencyBonus: sheet.proficiencyBonus,
    modifiers: Object.fromEntries(
      Object.entries(sheet.abilities).map(([a, v]) => [a, v.modifier]),
    ) as never,
    ...(classDef && { classDef }),
  };
  const selected = character.choices[storeKey] ?? [];
  const max = evaluateFormula(ch.count, ctx);
  const from = ch.from === 'qualquer' || !ch.from ? undefined : ch.from;
  let options: PickerOption[] = [];
  let empty: string | undefined;

  if (ch.kind === 'pericia') {
    const ids = from ?? content.skills.map((s) => s.id);
    options = ids.map((id) => {
      const already =
        sheet.skills[id as keyof typeof sheet.skills]?.proficient && !selected.includes(id);
      return { id, label: skillName(id), ...(already && { disabled: true, hint: 'você já tem' }) };
    });
  } else if (ch.kind === 'idioma') {
    const ids = from ?? content.languages.map((l) => l.id);
    options = ids
      .filter((id) => id !== 'common')
      .map((id) => {
        const already = sheet.proficiencies.languages.includes(id) && !selected.includes(id);
        return {
          id,
          label: languageName(id),
          ...(already && { disabled: true, hint: 'você já fala' }),
        };
      });
  } else if (ch.kind === 'ferramenta') {
    options = (from ?? []).map((id) => ({ id, label: itemName(id) }));
  } else if (ch.kind === 'opcao') {
    options = (ch.options ?? []).map((o) => ({ id: o.id, label: o.name, hint: o.text }));
  } else if (ch.kind === 'talento') {
    const feats = content.feats.filter((x) =>
      ch.featCategory ? x.category === ch.featCategory : from?.includes(x.id),
    );
    options = feats.map((x) => ({ id: x.id, label: featName(x.id), hint: x.plain }));
  } else if (ch.kind === 'atributo') {
    options = (from ?? [...ABILITIES]).map((id) => ({
      id,
      label: ABILITY_LABEL[id as keyof typeof ABILITY_LABEL]?.name ?? id,
    }));
  } else if (ch.kind === 'maestria') {
    const weapons = content.items.filter((i) => i.weapon && (from ? from.includes(i.id) : true));
    options = weapons
      .filter((i) => isWeaponProficient(i, sheet.proficiencies.weapons))
      .map((i) => ({ id: i.id, label: i.name, hint: `maestria: ${i.weapon?.mastery}` }));
  } else if (ch.kind === 'especializacao') {
    const ids = (from ?? content.skills.map((s) => s.id)).filter(
      (id) => sheet.skills[id as keyof typeof sheet.skills]?.proficient,
    );
    options = ids.map((id) => ({ id, label: skillName(id) }));
    empty = 'Escolha primeiro as perícias em que você tem proficiência.';
  } else if (ch.kind === 'magia' && spellSource) {
    options = featSpellOptions(content, spellSource.featId, ch.id, spellSource.list).map((s) => ({
      id: s.id,
      label: s.name,
      ...(s.plain && { hint: s.plain }),
    }));
    empty = 'Escolha primeiro a lista de magias.';
  }

  const chosenFeat =
    ch.kind === 'talento' ? content.feats.find((x) => x.id === selected[0]) : undefined;
  const chosenOption =
    ch.kind === 'opcao' ? ch.options?.find((o) => o.id === selected[0]) : undefined;

  if (!options.length && empty)
    return (
      <div>
        <p className="font-display font-semibold">{ch.label}</p>
        <p className="text-sm text-ink-muted">{empty}</p>
      </div>
    );

  return (
    <div>
      <ChoicePicker
        label={ch.label}
        options={options}
        selected={selected}
        max={max}
        onToggle={(id) => edit((c) => toggleChoice(c, storeKey, id, max))}
      />
      {(chosenFeat || chosenOption) && (
        <p className="mt-2 text-sm text-ink-muted">
          <strong className="text-ink">{chosenFeat?.name ?? chosenOption?.name}:</strong>{' '}
          {chosenFeat?.plain ?? chosenOption?.text}
        </p>
      )}
    </div>
  );
}

interface FeatureChoicesProps {
  wizard: LoadedWizard;
  scope: string;
  features: Feature[];
  classDef?: ClassDef | undefined;
}

/** Escolhas das características ativas (perícias, idiomas, opções, talentos, maestrias...). */
export function FeatureChoices({ wizard, scope, features, classDef }: FeatureChoicesProps) {
  const pickers = features
    .filter((f) => (f.level ?? 1) <= wizard.character.level)
    .flatMap((f) => (f.choices ?? []).filter((ch) => ch.kind !== 'magia').map((ch) => ({ f, ch })));
  if (!pickers.length) return null;
  return (
    <div className="space-y-5">
      {pickers.map(({ f, ch }) => {
        const key = choiceKey(scope, f.id, ch.id);
        return (
          <ChoiceField key={key} wizard={wizard} storeKey={key} choice={ch} classDef={classDef} />
        );
      })}
    </div>
  );
}

/** Escolhas internas de um talento (ex.: Iniciado em Magia, Habilidoso). */
export function FeatChoices({
  wizard,
  featId,
  scope,
  fixedList,
}: {
  wizard: LoadedWizard;
  featId: string;
  scope: string;
  /** Lista de magias definida pelo antecedente (não dá para trocar). */
  fixedList?: string | undefined;
}) {
  const feat = content.feats.find((f) => f.id === featId);
  if (!feat?.choices?.length) return null;
  const list = wizard.character.choices[`${scope}:list`]?.[0] ?? fixedList;
  return (
    <div className="space-y-5">
      {feat.choices.map((ch) => {
        if (fixedList && ch.id === 'list') return null;
        const key = `${scope}:${ch.id}`;
        return (
          <ChoiceField
            key={key}
            wizard={wizard}
            storeKey={key}
            choice={ch}
            spellSource={{ featId, list }}
          />
        );
      })}
    </div>
  );
}
