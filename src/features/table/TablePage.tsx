import { Check, Copy, LogOut, Users } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { usePageTitle } from '@/app/usePageTitle';
import { content } from '@/content';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { decodeShare, encodeShare, hashParam, siteUrl } from '@/lib/share';
import {
  ABILITY_METHODS,
  DEFAULT_TABLE,
  METHOD_LABEL,
  parseTable,
  type TableRules,
} from '@/model/table';
import { PageHeader } from '@/routes/PageHeader';
import { useTable } from '@/state/table';

export default function TablePage() {
  usePageTitle('Modo mesa');
  const { hash } = useLocation();
  const code = hashParam(hash, 'm');
  const received = useMemo(() => (code ? parseTable(decodeShare(code)) : undefined), [code]);
  const active = useTable((s) => s.rules);

  return (
    <>
      <PageHeader eyebrow="Para o Mestre" title="Modo mesa">
        <p>
          Escolha as regras da sua mesa e mande o link para o grupo. Quem abrir entra na mesa, e o
          assistente só deixa escolher o que você liberou.
        </p>
      </PageHeader>
      {code && !received && (
        <Card className="mb-6 border-danger/40">
          <p className="font-semibold">Este link de mesa está quebrado ou incompleto.</p>
          <p className="text-ink-muted">Peça ao Mestre para mandar o link de novo, inteiro.</p>
        </Card>
      )}
      {received && <JoinCard rules={received} />}
      {active && !received && <ActiveCard rules={active} />}
      <Builder initial={received ?? active ?? DEFAULT_TABLE} />
    </>
  );
}

function RulesSummary({ rules }: { rules: TableRules }) {
  const names = (list: string[] | undefined, all: { id: string; name: string }[]) =>
    list
      ? all
          .filter((x) => list.includes(x.id))
          .map((x) => x.name)
          .join(', ')
      : 'Todas';
  return (
    <dl className="grid gap-1 text-sm sm:grid-cols-[10rem_1fr]">
      <dt className="font-semibold">Nível inicial</dt>
      <dd>{rules.level ?? 'Livre'}</dd>
      <dt className="font-semibold">Espécies</dt>
      <dd>{names(rules.species, content.species)}</dd>
      <dt className="font-semibold">Classes</dt>
      <dd>{names(rules.classes, content.classes)}</dd>
      <dt className="font-semibold">Antecedentes</dt>
      <dd>{names(rules.backgrounds, content.backgrounds)}</dd>
      <dt className="font-semibold">Atributos</dt>
      <dd>{rules.abilityMethods.map((m) => METHOD_LABEL[m]).join(', ')}</dd>
      <dt className="font-semibold">PV por nível</dt>
      <dd>
        {rules.hpMethod === 'livre'
          ? 'À escolha'
          : rules.hpMethod === 'media'
            ? 'Média'
            : 'Rolados'}
      </dd>
      <dt className="font-semibold">Conteúdo próprio</dt>
      <dd>{rules.allowHomebrew ? 'Permitido' : 'Não permitido'}</dd>
    </dl>
  );
}

function JoinCard({ rules }: { rules: TableRules }) {
  const join = useTable((s) => s.join);
  const navigate = useNavigate();
  return (
    <Card className="mb-8 space-y-3 border-gold-soft">
      <h2 className="flex items-center gap-2 text-2xl font-semibold">
        <Users aria-hidden className="size-6 text-gold" />
        Convite para a mesa{rules.name ? ` “${rules.name}”` : ''}
      </h2>
      <RulesSummary rules={rules} />
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            join(rules);
            void navigate('/', { replace: true });
          }}
        >
          <Check aria-hidden className="size-5" /> Entrar na mesa
        </Button>
      </div>
    </Card>
  );
}

function ActiveCard({ rules }: { rules: TableRules }) {
  const leave = useTable((s) => s.leave);
  return (
    <Card className="mb-8 space-y-3 border-gold-soft">
      <h2 className="text-2xl font-semibold">Mesa ativa{rules.name ? `: ${rules.name}` : ''}</h2>
      <RulesSummary rules={rules} />
      <Button variant="secundario" onClick={leave}>
        <LogOut aria-hidden className="size-4" /> Sair da mesa
      </Button>
    </Card>
  );
}

type Pick = 'species' | 'classes' | 'backgrounds';

function Builder({ initial }: { initial: TableRules }) {
  const nameId = useId();
  const levelId = useId();
  const [rules, setRules] = useState<TableRules>(initial);
  const [copied, setCopied] = useState(false);
  const link = siteUrl(`/mesa#m=${encodeShare(rules)}`);
  const update = (patch: Partial<TableRules>) => {
    setCopied(false);
    setRules((r) => ({ ...r, ...patch }));
  };

  const toggle = (key: Pick, id: string, all: string[]) => {
    const current = rules[key] ?? all;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    // Tudo marcado = sem restrição (a lista some do link).
    const { [key]: _old, ...rest } = rules;
    setCopied(false);
    setRules(next.length === all.length ? (rest as TableRules) : { ...rest, [key]: next });
  };

  const groups: { key: Pick; title: string; all: { id: string; name: string }[] }[] = [
    { key: 'species', title: 'Espécies liberadas', all: content.species },
    { key: 'classes', title: 'Classes liberadas', all: content.classes },
    { key: 'backgrounds', title: 'Antecedentes liberados', all: content.backgrounds },
  ];

  return (
    <section aria-labelledby="montar" className="space-y-6">
      <h2 id="montar" className="text-2xl font-semibold">
        Montar as regras da mesa
      </h2>
      <div className="flex flex-wrap gap-4">
        <div className="min-w-0 flex-1 basis-60">
          <label htmlFor={nameId} className="mb-1 block font-semibold">
            Nome da mesa <span className="font-normal text-ink-muted">(opcional)</span>
          </label>
          <input
            id={nameId}
            value={rules.name ?? ''}
            maxLength={80}
            onChange={(e) => update({ name: e.target.value || undefined })}
            className="min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3"
          />
        </div>
        <div>
          <label htmlFor={levelId} className="mb-1 block font-semibold">
            Nível inicial
          </label>
          <select
            id={levelId}
            value={rules.level ?? ''}
            onChange={(e) => update({ level: e.target.value ? Number(e.target.value) : undefined })}
            className="min-h-11 cursor-pointer rounded-lg border border-line-strong bg-bg px-3"
          >
            <option value="">Livre</option>
            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {groups.map((g) => (
        <fieldset key={g.key} className="space-y-2">
          <legend className="mb-1 font-semibold">{g.title}</legend>
          <div className="flex flex-wrap gap-2">
            {g.all.map((x) => {
              const on = !rules[g.key] || rules[g.key]?.includes(x.id);
              return (
                <button
                  key={x.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() =>
                    toggle(
                      g.key,
                      x.id,
                      g.all.map((y) => y.id),
                    )
                  }
                  className="min-h-11 cursor-pointer rounded-full border border-line-strong px-4 text-sm font-semibold aria-checked:border-seal aria-checked:bg-seal aria-checked:text-on-seal"
                >
                  {x.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <fieldset className="space-y-2">
        <legend className="mb-1 font-semibold">Como gerar os atributos</legend>
        <div className="flex flex-wrap gap-2">
          {ABILITY_METHODS.map((m) => {
            const on = rules.abilityMethods.includes(m);
            const last = on && rules.abilityMethods.length === 1;
            return (
              <button
                key={m}
                type="button"
                role="checkbox"
                aria-checked={on}
                aria-disabled={last || undefined}
                title={last ? 'Deixe pelo menos um método' : undefined}
                onClick={() =>
                  !last &&
                  update({
                    abilityMethods: on
                      ? rules.abilityMethods.filter((x) => x !== m)
                      : ABILITY_METHODS.filter((x) => x === m || rules.abilityMethods.includes(x)),
                  })
                }
                className="min-h-11 cursor-pointer rounded-full border border-line-strong px-4 text-sm font-semibold aria-checked:border-seal aria-checked:bg-seal aria-checked:text-on-seal"
              >
                {METHOD_LABEL[m]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Segmented
        legend="PV a cada nível depois do 1º"
        options={[
          { value: 'livre', label: 'À escolha' },
          { value: 'media', label: 'Média' },
          { value: 'rolagem', label: 'Rolados' },
        ]}
        value={rules.hpMethod}
        onChange={(v) => update({ hpMethod: v })}
      />

      <Switch
        label="Permitir conteúdo próprio"
        hint="Opções criadas pelo grupo em Conteúdo próprio."
        checked={rules.allowHomebrew}
        onCheckedChange={(v) => update({ allowHomebrew: v })}
      />

      <Card className="space-y-3">
        <h3 className="text-xl font-semibold">Link da mesa</h3>
        <RulesSummary rules={rules} />
        <input
          readOnly
          aria-label="Link da mesa"
          value={link}
          onFocus={(e) => e.target.select()}
          className="min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 text-sm"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            <Copy aria-hidden className="size-4" /> {copied ? 'Copiado!' : 'Copiar link'}
          </Button>
          <p className="text-sm text-ink-muted">
            Mande no grupo da mesa. As regras vão dentro do próprio link.
          </p>
        </div>
      </Card>
    </section>
  );
}
