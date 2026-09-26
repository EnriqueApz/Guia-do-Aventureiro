import { Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { srdContent } from '@/content';
import { checkPack, type HomebrewKind, type HomebrewPack } from '@/content/homebrew';
import {
  ABILITIES,
  type Ability,
  type Background,
  type SkillId,
  type Species,
  type Subclass,
} from '@/content/schema';
import { Button } from '@/components/ui/Button';
import { useHomebrew } from '@/state/homebrew';
import { ABILITY_LABEL } from '@/features/wizard/labels';
import {
  buildBackground,
  buildSpecies,
  buildSubclass,
  type BackgroundForm,
  type FeatureForm,
  type SpeciesForm,
  type SubclassForm,
} from './build';
import { FormErrors, Row, SelectField, TextField } from './fields';

type Entry = HomebrewPack[HomebrewKind][number];

/** Valida o pacote com a entrada nova e salva; devolve os erros, se houver. */
function useSaveEntry(kind: HomebrewKind) {
  const pack = useHomebrew((s) => s.pack);
  const save = useHomebrew((s) => s.save);
  return (entry: Entry): string[] => {
    const list = pack[kind] as Entry[];
    const next = list.some((x) => x.id === entry.id)
      ? list.map((x) => (x.id === entry.id ? entry : x))
      : [...list, entry];
    const { errors } = checkPack({ ...pack, [kind]: next }, srdContent);
    if (!errors.length) save(kind, entry);
    return errors;
  };
}

function Actions({ onCancel, errors }: { onCancel: () => void; errors: string[] }) {
  return (
    <div className="space-y-3 pt-2">
      <FormErrors errors={errors} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit">
          <Save aria-hidden className="size-4" /> Salvar
        </Button>
        <Button variant="fantasma" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

const WARNING = (
  <p className="rounded-lg bg-sunken/70 p-3 text-sm">
    Escreva com as suas palavras, como anotações do grupo: não copie o texto dos livros. O que você
    salvar fica só neste navegador.
  </p>
);

// ---------------------------------------------------------------- subclasse

export function SubclassEditor({
  initial,
  preset,
  onDone,
}: {
  initial?: Subclass;
  preset?: { id: string; name: string; classId?: string };
  onDone: () => void;
}) {
  const saveEntry = useSaveEntry('subclasses');
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<SubclassForm>(() =>
    initial
      ? {
          id: initial.id,
          classId: initial.classId,
          name: initial.name,
          summary: initial.summary,
          description: initial.description,
          features: initial.features.map((f) => ({
            name: f.name,
            level: f.level,
            text: f.text,
            plain: f.plain ?? '',
          })),
        }
      : {
          ...(preset && { id: preset.id }),
          classId: preset?.classId ?? srdContent.classes[0]?.id ?? '',
          name: preset?.name ?? '',
          summary: '',
          description: '',
          features: [{ name: '', level: 3, text: '', plain: '' }],
        },
  );
  const setFeature = (i: number, patch: Partial<FeatureForm>) =>
    setForm((f) => ({
      ...f,
      features: f.features.map((x, j) => (j === i ? { ...x, ...patch } : x)),
    }));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const errs = saveEntry(buildSubclass(form));
        setErrors(errs);
        if (!errs.length) onDone();
      }}
    >
      {WARNING}
      <Row>
        <TextField
          label="Nome"
          required
          value={form.name}
          onChange={(name) => setForm({ ...form, name })}
        />
        <SelectField
          label="Classe"
          value={form.classId}
          options={srdContent.classes.map((c) => ({ value: c.id, label: c.name }))}
          onChange={(classId) => setForm({ ...form, classId })}
        />
      </Row>
      <TextField
        label="Resumo em uma frase"
        value={form.summary}
        onChange={(summary) => setForm({ ...form, summary })}
      />
      <TextField
        label="Descrição"
        multiline
        value={form.description}
        onChange={(description) => setForm({ ...form, description })}
      />
      <fieldset className="space-y-3">
        <legend className="font-display font-semibold">Características</legend>
        {form.features.map((f, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-line p-3">
            <Row>
              <TextField
                label={`Característica ${i + 1}: nome`}
                required
                value={f.name}
                onChange={(name) => setFeature(i, { name })}
              />
              <SelectField
                label="Nível"
                value={f.level}
                options={Array.from({ length: 18 }, (_, k) => ({
                  value: k + 3,
                  label: `${k + 3}`,
                }))}
                onChange={(level) => setFeature(i, { level })}
              />
            </Row>
            <TextField
              label="O que faz"
              required
              multiline
              value={f.text}
              onChange={(text) => setFeature(i, { text })}
            />
            <TextField
              label="Explicação simples"
              hint="Opcional: se ficar em branco, usamos a primeira frase."
              value={f.plain}
              onChange={(plain) => setFeature(i, { plain })}
            />
            {form.features.length > 1 && (
              <Button
                variant="fantasma"
                onClick={() =>
                  setForm({ ...form, features: form.features.filter((_, j) => j !== i) })
                }
              >
                <Trash2 aria-hidden className="size-4" /> Remover característica
              </Button>
            )}
          </div>
        ))}
        <Button
          variant="secundario"
          onClick={() =>
            setForm({
              ...form,
              features: [...form.features, { name: '', level: 6, text: '', plain: '' }],
            })
          }
        >
          <Plus aria-hidden className="size-4" /> Adicionar característica
        </Button>
      </fieldset>
      <Actions onCancel={onDone} errors={errors} />
    </form>
  );
}

// ---------------------------------------------------------------- antecedente

const TOOLS = srdContent.items.filter((i) =>
  ['ferramenta', 'instrumento', 'jogo'].includes(i.category),
);
const ORIGIN_FEATS = srdContent.feats.filter((f) => f.category === 'origem');

export function BackgroundEditor({
  initial,
  preset,
  onDone,
}: {
  initial?: Background;
  preset?: { id: string; name: string };
  onDone: () => void;
}) {
  const saveEntry = useSaveEntry('backgrounds');
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<BackgroundForm>(() =>
    initial
      ? {
          id: initial.id,
          name: initial.name,
          summary: initial.summary,
          description: initial.description,
          abilityOptions: initial.abilityOptions,
          skills: initial.skills,
          tool: typeof initial.tool === 'string' ? initial.tool : (TOOLS[0]?.id ?? ''),
          originFeat: initial.originFeat.id,
          equipmentNote: initial.equipment[0]?.note ?? '',
          equipmentGold: initial.equipment[0]?.gold ?? 50,
          personality: {
            traits: initial.personality.traits.join('\n'),
            ideals: initial.personality.ideals.join('\n'),
            bonds: initial.personality.bonds.join('\n'),
            flaws: initial.personality.flaws.join('\n'),
          },
        }
      : {
          ...(preset && { id: preset.id }),
          name: preset?.name ?? '',
          summary: '',
          description: '',
          abilityOptions: ['for', 'des', 'con'],
          skills: ['atletismo', 'percepcao'],
          tool: TOOLS[0]?.id ?? '',
          originFeat: ORIGIN_FEATS[0]?.id ?? '',
          equipmentNote: '',
          equipmentGold: 50,
          personality: { traits: '', ideals: '', bonds: '', flaws: '' },
        },
  );
  const abilityOptions = ABILITIES.map((a) => ({ value: a, label: ABILITY_LABEL[a].name }));
  const skillOptions = srdContent.skills.map((s) => ({ value: s.id, label: s.name }));
  const setAbility = (i: 0 | 1 | 2, a: Ability) => {
    const next = [...form.abilityOptions] as BackgroundForm['abilityOptions'];
    next[i] = a;
    setForm({ ...form, abilityOptions: next });
  };
  const setSkill = (i: 0 | 1, s: SkillId) => {
    const next = [...form.skills] as BackgroundForm['skills'];
    next[i] = s;
    setForm({ ...form, skills: next });
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const errs = saveEntry(buildBackground(form));
        setErrors(errs);
        if (!errs.length) onDone();
      }}
    >
      {WARNING}
      <TextField
        label="Nome"
        required
        value={form.name}
        onChange={(name) => setForm({ ...form, name })}
      />
      <TextField
        label="Resumo em uma frase"
        value={form.summary}
        onChange={(summary) => setForm({ ...form, summary })}
      />
      <TextField
        label="Descrição"
        multiline
        value={form.description}
        onChange={(description) => setForm({ ...form, description })}
      />
      <fieldset>
        <legend className="mb-2 font-display font-semibold">
          Três atributos que o antecedente aumenta
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {([0, 1, 2] as const).map((i) => (
            <SelectField
              key={i}
              label={`Atributo ${i + 1}`}
              value={form.abilityOptions[i]}
              options={abilityOptions}
              onChange={(a) => setAbility(i, a)}
            />
          ))}
        </div>
      </fieldset>
      <Row>
        <SelectField
          label="Perícia 1"
          value={form.skills[0]}
          options={skillOptions}
          onChange={(s) => setSkill(0, s)}
        />
        <SelectField
          label="Perícia 2"
          value={form.skills[1]}
          options={skillOptions}
          onChange={(s) => setSkill(1, s)}
        />
      </Row>
      <Row>
        <SelectField
          label="Ferramenta"
          value={form.tool}
          options={TOOLS.map((t) => ({ value: t.id, label: t.name }))}
          onChange={(tool) => setForm({ ...form, tool })}
        />
        <SelectField
          label="Talento de origem"
          value={form.originFeat}
          options={ORIGIN_FEATS.map((f) => ({ value: f.id, label: f.name }))}
          onChange={(originFeat) => setForm({ ...form, originFeat })}
        />
      </Row>
      <Row>
        <TextField
          label="Equipamento (opção A)"
          hint="Descreva os itens; a opção B é sempre 50 PO."
          value={form.equipmentNote}
          onChange={(equipmentNote) => setForm({ ...form, equipmentNote })}
        />
        <TextField
          label="Ouro da opção A (PO)"
          value={String(form.equipmentGold)}
          onChange={(v) => setForm({ ...form, equipmentGold: Number(v.replace(/\D/g, '')) || 0 })}
        />
      </Row>
      <fieldset className="space-y-3">
        <legend className="font-display font-semibold">
          Sugestões de personalidade (uma por linha)
        </legend>
        <Row>
          {(
            [
              ['traits', 'Traços'],
              ['ideals', 'Ideais'],
              ['bonds', 'Vínculos'],
              ['flaws', 'Defeitos'],
            ] as const
          ).map(([k, label]) => (
            <TextField
              key={k}
              label={label}
              multiline
              value={form.personality[k]}
              onChange={(v) => setForm({ ...form, personality: { ...form.personality, [k]: v } })}
            />
          ))}
        </Row>
      </fieldset>
      <Actions onCancel={onDone} errors={errors} />
    </form>
  );
}

// ---------------------------------------------------------------- espécie

export function SpeciesEditor({
  initial,
  preset,
  onDone,
}: {
  initial?: Species;
  preset?: { id: string; name: string };
  onDone: () => void;
}) {
  const saveEntry = useSaveEntry('species');
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<SpeciesForm>(() => {
    if (initial) {
      const dv = initial.traits
        .flatMap((t) => t.effects ?? [])
        .find((e) => e.type === 'visao-no-escuro');
      return {
        id: initial.id,
        name: initial.name,
        summary: initial.summary,
        description: initial.description,
        creatureType: initial.creatureType,
        sizes: initial.sizes,
        speed: initial.speed,
        darkvision: dv && dv.type === 'visao-no-escuro' ? dv.range : 0,
        traits: initial.traits
          .filter((t) => !t.id.endsWith('-visao-no-escuro'))
          .map((t) => ({ name: t.name, text: t.text, plain: t.plain ?? '' })),
      };
    }
    return {
      ...(preset && { id: preset.id }),
      name: preset?.name ?? '',
      summary: '',
      description: '',
      creatureType: 'Humanoide',
      sizes: ['Médio'],
      speed: 30,
      darkvision: 0,
      traits: [{ name: '', text: '', plain: '' }],
    };
  });
  const setTrait = (i: number, patch: Partial<SpeciesForm['traits'][number]>) =>
    setForm((f) => ({ ...f, traits: f.traits.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const errs = saveEntry(buildSpecies(form));
        setErrors(errs);
        if (!errs.length) onDone();
      }}
    >
      {WARNING}
      <TextField
        label="Nome"
        required
        value={form.name}
        onChange={(name) => setForm({ ...form, name })}
      />
      <TextField
        label="Resumo em uma frase"
        value={form.summary}
        onChange={(summary) => setForm({ ...form, summary })}
      />
      <TextField
        label="Descrição"
        multiline
        value={form.description}
        onChange={(description) => setForm({ ...form, description })}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField
          label="Tamanho"
          value={form.sizes.join('|')}
          options={[
            { value: 'Médio', label: 'Médio' },
            { value: 'Pequeno', label: 'Pequeno' },
            { value: 'Médio|Pequeno', label: 'Médio ou Pequeno' },
          ]}
          onChange={(v) => setForm({ ...form, sizes: v.split('|') as SpeciesForm['sizes'] })}
        />
        <SelectField
          label="Deslocamento"
          value={form.speed}
          options={[25, 30, 35].map((ft) => ({ value: ft, label: `${(ft / 5) * 1.5} m` }))}
          onChange={(speed) => setForm({ ...form, speed })}
        />
        <SelectField
          label="Visão no Escuro"
          value={form.darkvision}
          options={[
            { value: 0, label: 'Não tem' },
            { value: 60, label: '18 m' },
            { value: 120, label: '36 m' },
          ]}
          onChange={(darkvision) => setForm({ ...form, darkvision })}
        />
      </div>
      <fieldset className="space-y-3">
        <legend className="font-display font-semibold">Traços</legend>
        {form.traits.map((t, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-line p-3">
            <TextField
              label={`Traço ${i + 1}: nome`}
              required
              value={t.name}
              onChange={(name) => setTrait(i, { name })}
            />
            <TextField
              label="O que faz"
              required
              multiline
              value={t.text}
              onChange={(text) => setTrait(i, { text })}
            />
            <TextField
              label="Explicação simples"
              hint="Opcional: se ficar em branco, usamos a primeira frase."
              value={t.plain}
              onChange={(plain) => setTrait(i, { plain })}
            />
            {form.traits.length > 1 && (
              <Button
                variant="fantasma"
                onClick={() => setForm({ ...form, traits: form.traits.filter((_, j) => j !== i) })}
              >
                <Trash2 aria-hidden className="size-4" /> Remover traço
              </Button>
            )}
          </div>
        ))}
        <Button
          variant="secundario"
          onClick={() =>
            setForm({ ...form, traits: [...form.traits, { name: '', text: '', plain: '' }] })
          }
        >
          <Plus aria-hidden className="size-4" /> Adicionar traço
        </Button>
      </fieldset>
      <Actions onCancel={onDone} errors={errors} />
    </form>
  );
}
