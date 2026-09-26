import { Dices, Download, Pencil, ScrollText, Swords } from 'lucide-react';
import { MotionConfig } from 'motion/react';
import { useId, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { usePageTitle } from '@/app/usePageTitle';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { Card } from '@/components/ui/Card';
import { Drawer } from '@/components/ui/Drawer';
import { Segmented } from '@/components/ui/Segmented';
import { downloadText } from '@/lib/download';
import type { Character } from '@/model/character';
import { setOverride } from '@/model/edits';
import { exportCharacters, exportFileName } from '@/model/transfer';
import type { Sheet } from '@/rules/derive';
import { useWizard } from '@/features/wizard/useWizard';
import { useSettings } from '@/state/settings';
import { DiceRoller } from './DiceRoller';
import { PlayPanel } from './PlayPanel';
import { SheetDetails } from './SheetDetails';

type Mode = 'ficha' | 'jogo';

export default function SheetPage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { character, sheet, issues, edit } = useWizard(id);
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const [rollerOpen, setRollerOpen] = useState(false);
  usePageTitle(character ? character.name || 'Personagem sem nome' : 'Personagem não encontrado');
  const mode: Mode = params.get('modo') === 'jogo' ? 'jogo' : 'ficha';

  if (!character || !sheet) {
    return (
      <Card className="max-w-xl">
        <h1 className="text-2xl font-semibold">Personagem não encontrado</h1>
        <p className="mt-2 text-ink-muted">
          Talvez ele tenha sido criado em outro aparelho. Exporte lá e importe aqui.
        </p>
        <Link to="/personagens" className={`${buttonClasses('secundario')} mt-4`}>
          Ver meus personagens
        </Link>
      </Card>
    );
  }

  const pending = issues.filter((i) => i.severity === 'erro').length;
  const identity = [
    sheet.species?.name,
    sheet.classDef && `${sheet.classDef.name} ${sheet.level}`,
    sheet.subclass?.name,
    sheet.background?.name,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <header className="mb-6 space-y-3">
        <p className="font-display text-sm font-semibold tracking-[0.2em] text-gold uppercase">
          Ficha
        </p>
        <h1 className="text-4xl font-semibold">{character.name || 'Personagem sem nome'}</h1>
        {identity && <p className="text-lg text-ink-muted">{identity}</p>}
        <div className="flex flex-wrap gap-2">
          <Link to={`/criar/${character.id}`} className={buttonClasses('secundario')}>
            <Pencil aria-hidden className="size-4" /> Editar no assistente
          </Link>
          <Button
            variant="secundario"
            onClick={() => downloadText(exportFileName([character]), exportCharacters([character]))}
          >
            <Download aria-hidden className="size-4" /> Exportar
          </Button>
          <Button variant="secundario" onClick={() => setRollerOpen(true)}>
            <Dices aria-hidden className="size-4" /> Rolador de dados
          </Button>
        </div>
      </header>

      {pending > 0 && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-gold-soft py-3">
          <p>
            Ficha incompleta: {pending === 1 ? 'falta 1 coisa' : `faltam ${pending} coisas`} no
            assistente.
          </p>
          <Link to={`/criar/${character.id}/revisao`} className={buttonClasses('secundario')}>
            Ver o que falta
          </Link>
        </Card>
      )}

      <div className="mb-6 max-w-md">
        <Segmented
          legend="Como ver a ficha"
          options={[
            { value: 'ficha', label: 'Ficha', icon: <ScrollText aria-hidden className="size-4" /> },
            { value: 'jogo', label: 'Modo jogo', icon: <Swords aria-hidden className="size-4" /> },
          ]}
          value={mode}
          onChange={(m) => setParams(m === 'jogo' ? { modo: 'jogo' } : {}, { replace: true })}
        />
      </div>

      {mode === 'jogo' ? (
        <PlayPanel character={character} sheet={sheet} edit={edit} />
      ) : (
        <div className="space-y-8">
          <SheetDetails character={character} sheet={sheet} />
          <Overrides character={character} sheet={sheet} edit={edit} />
        </div>
      )}

      <Drawer
        open={rollerOpen}
        onOpenChange={setRollerOpen}
        title="Rolador de dados"
        description="Os resultados ficam no histórico."
      >
        <DiceRoller />
      </Drawer>
    </MotionConfig>
  );
}

const OVERRIDES: {
  path: string;
  label: string;
  value: (s: Sheet) => number;
  auto: (s: Sheet) => boolean;
}[] = [
  {
    path: 'ca',
    label: 'Classe de Armadura',
    value: (s) => s.ac.value,
    auto: (s) => !s.ac.overridden,
  },
  { path: 'pvMax', label: 'PV máximos', value: (s) => s.hp.max, auto: (s) => !s.hp.overridden },
  {
    path: 'iniciativa',
    label: 'Iniciativa',
    value: (s) => s.initiative.value,
    auto: (s) => !s.initiative.overridden,
  },
];

function Overrides({
  character,
  sheet,
  edit,
}: {
  character: Character;
  sheet: Sheet;
  edit: (fn: (c: Character) => Character) => void;
}) {
  const baseId = useId();
  return (
    <Card className="space-y-3">
      <h2 className="text-xl font-semibold">Ajustes manuais</h2>
      <p className="text-sm text-ink-muted">
        Se o Mestre deu um item mágico ou uma regra da mesa mudou algum número, ajuste aqui. Deixe
        em branco para voltar ao valor calculado.
      </p>
      <div className="flex flex-wrap gap-4">
        {OVERRIDES.map((o) => {
          const id = `${baseId}-${o.path}`;
          const current = character.overrides[o.path];
          return (
            <div key={o.path}>
              <label htmlFor={id} className="mb-1 block text-sm font-semibold">
                {o.label}{' '}
                {o.auto(sheet) ? (
                  <span className="font-normal text-ink-muted">(automático)</span>
                ) : (
                  <span className="font-normal text-gold">(ajustado à mão)</span>
                )}
              </label>
              <input
                id={id}
                type="number"
                inputMode="numeric"
                placeholder={String(o.value(sheet))}
                value={typeof current === 'number' ? current : ''}
                onChange={(e) =>
                  edit((c) =>
                    setOverride(
                      c,
                      o.path,
                      e.target.value === '' ? undefined : e.target.valueAsNumber,
                    ),
                  )
                }
                className="num min-h-11 w-28 rounded-lg border border-line-strong bg-bg px-3 text-lg"
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
