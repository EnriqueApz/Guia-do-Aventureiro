import { AlertTriangle, Check, Minus, Plus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { content } from '@/content';
import { Button } from '@/components/ui/Button';
import {
  addExtraClass,
  freeMulticlassLevels,
  removeExtraClass,
  setExtraClassLevels,
} from '@/model/edits';
import { allowed, homebrewBlocked } from '@/model/table';
import { meetsMulticlassRequirement, primaryLevels, requirementLabel } from '@/rules/classes';
import { ABILITY_NAMES } from '@/rules/derive';
import { useTable } from '@/state/table';
import type { ClassDef } from '@/content/schema';
import { multiclassGains } from '../labels';
import { ClassIcon } from './Icons';
import { Section } from './Section';
import type { LoadedWizard } from '../useWizard';

/** Seção da etapa Classe: dividir os níveis entre mais de uma classe. */
export function Multiclass({ wizard }: { wizard: LoadedWizard }) {
  const { character, sheet, edit } = wizard;
  const tableRules = useTable((s) => s.rules);
  const selectId = useId();
  const [toAdd, setToAdd] = useState('');
  const primary = content.classes.find((c) => c.id === character.classId);
  if (!primary) return null;
  if (tableRules?.multiclass === false) return null;

  const extras = character.multiclass ?? [];
  const free = freeMulticlassLevels(character);
  const scores = Object.fromEntries(
    Object.entries(sheet.abilities).map(([a, v]) => [a, v.score]),
  ) as Parameters<typeof meetsMulticlassRequirement>[1];
  const requirement = (cls: ClassDef) => {
    const ok = meetsMulticlassRequirement(cls, scores);
    return (
      <span className={`inline-flex items-center gap-1 text-sm ${ok ? 'text-forest' : 'text-ink'}`}>
        {ok ? (
          <Check aria-hidden className="size-4" />
        ) : (
          <AlertTriangle aria-hidden className="size-4 text-gold" />
        )}
        Pede {requirementLabel(cls, ABILITY_NAMES)}
        {ok ? '' : ' (seus atributos ainda não chegam)'}
      </span>
    );
  };
  const available = content.classes.filter(
    (c) =>
      c.id !== primary.id &&
      !extras.some((m) => m.classId === c.id) &&
      allowed(tableRules?.classes, c.id) &&
      !homebrewBlocked(tableRules, c),
  );

  return (
    <Section title="Multiclasse (opcional)">
      <p className="text-ink-muted">
        Divida os níveis do personagem entre mais de uma classe. {primary.name} é a classe
        principal: ela dá as salvaguardas e o equipamento inicial. Cada classe nova dá só parte das
        proficiências, e cada uma exige 13 nos atributos principais.
      </p>
      {character.level < 2 ? (
        <p className="rounded-lg border border-line bg-sunken/60 px-4 py-3 text-sm">
          A partir do nível 2 dá para pegar outra classe. Suba o nível acima para usar.
        </p>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2">
            <li className="flex flex-wrap items-center gap-3 rounded-lg border border-line px-4 py-3">
              <ClassIcon id={primary.id} className="size-5 text-gold" />
              <span className="font-semibold">
                {primary.name} {primaryLevels(character)}
              </span>
              <span className="text-sm text-ink-muted">principal (os níveis que sobram)</span>
              {extras.length > 0 && requirement(primary)}
            </li>
            {extras.map((m) => {
              const cls = content.classes.find((c) => c.id === m.classId);
              if (!cls) return null;
              return (
                <li key={m.classId} className="space-y-2 rounded-lg border border-line px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <ClassIcon id={cls.id} className="size-5 text-gold" />
                    <span className="font-semibold">{cls.name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="secundario"
                        size="icone"
                        aria-label={`Menos níveis de ${cls.name}`}
                        disabled={m.levels <= 1}
                        onClick={() => edit((c) => setExtraClassLevels(c, cls.id, m.levels - 1))}
                      >
                        <Minus aria-hidden className="size-4" />
                      </Button>
                      <span
                        className="num w-10 text-center text-lg font-semibold"
                        aria-live="polite"
                      >
                        {m.levels}
                      </span>
                      <Button
                        variant="secundario"
                        size="icone"
                        aria-label={`Mais níveis de ${cls.name}`}
                        disabled={free < 1}
                        onClick={() => edit((c) => setExtraClassLevels(c, cls.id, m.levels + 1))}
                      >
                        <Plus aria-hidden className="size-4" />
                      </Button>
                    </div>
                    <Button
                      variant="fantasma"
                      size="icone"
                      className="ml-auto"
                      aria-label={`Tirar ${cls.name} da multiclasse`}
                      onClick={() => edit((c) => removeExtraClass(c, cls.id))}
                    >
                      <Trash2 aria-hidden className="size-5" />
                    </Button>
                  </div>
                  <p className="text-sm">
                    Ganha {multiclassGains(cls)}. {requirement(cls)}
                  </p>
                </li>
              );
            })}
          </ul>
          {free > 0 ? (
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-0 flex-1 basis-56">
                <label htmlFor={selectId} className="mb-1 block font-semibold">
                  Adicionar classe
                </label>
                <select
                  id={selectId}
                  value={toAdd}
                  onChange={(e) => setToAdd(e.target.value)}
                  className="min-h-11 w-full cursor-pointer rounded-lg border border-line-strong bg-bg px-3"
                >
                  <option value="">Escolha uma classe…</option>
                  {available.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({requirementLabel(c, ABILITY_NAMES)})
                    </option>
                  ))}
                </select>
              </div>
              <Button
                disabled={!toAdd}
                onClick={() => {
                  edit((c) => addExtraClass(c, toAdd, content));
                  setToAdd('');
                }}
              >
                <Plus aria-hidden className="size-4" /> Adicionar
              </Button>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">
              Todos os níveis já estão divididos. Suba o nível total para adicionar mais.
            </p>
          )}
          {extras.length > 0 && (
            <p className="text-sm text-ink-muted">
              As características, talentos, subclasses e magias de cada classe aparecem nas próximas
              etapas.
            </p>
          )}
        </div>
      )}
    </Section>
  );
}
