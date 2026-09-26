import { Dices } from 'lucide-react';
import { useState } from 'react';
import { Ornament } from '@/components/art/Ornament';
import { Badge, DifficultyBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Drawer } from '@/components/ui/Drawer';
import { StepProgress } from '@/components/ui/Progress';
import { Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { Term } from '@/components/ui/Term';
import { usePageTitle } from '@/app/usePageTitle';
import { PageHeader } from './PageHeader';
import { STEPS as WIZARD_STEPS } from '@/features/wizard/steps';

const swatches = [
  ['bg', 'Fundo'],
  ['surface', 'Superfície'],
  ['sunken', 'Rebaixado'],
  ['ink', 'Tinta'],
  ['ink-muted', 'Tinta suave'],
  ['gold', 'Ouro'],
  ['seal', 'Lacre'],
  ['forest', 'Floresta'],
  ['sky', 'Céu'],
  ['danger', 'Perigo'],
];

/** Vitrine do design system (página interna, não aparece no menu). */
export default function DesignPage() {
  usePageTitle('Design system');
  const [drawer, setDrawer] = useState(false);
  const [step, setStep] = useState(2);
  const [method, setMethod] = useState<'padrao' | 'compra' | 'rolagem'>('padrao');
  const [on, setOn] = useState(true);

  return (
    <>
      <PageHeader eyebrow="Interno" title="Design system">
        <p>Componentes base, cores e tipografia do Guia.</p>
      </PageHeader>

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Cores</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {swatches.map(([token, label]) => (
              <li key={token} className="overflow-hidden rounded-lg border border-line">
                <span className="block h-14" style={{ background: `var(--c-${token})` }} />
                <span className="block bg-surface px-3 py-2 text-sm">
                  {label} <code className="text-ink-muted">{token}</code>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Tipografia</h2>
          <p className="font-display text-5xl font-semibold">Fraunces para títulos</p>
          <p className="prose-guia text-lg">
            Literata para o texto corrido. Um bárbaro em fúria causa dano extra e resiste a golpes;
            uma maga prepara magias depois de um descanso longo. Números de ficha usam algarismos
            tabulares: <span className="num">+5 · 17 · 1d8+3</span>.
          </p>
          <Ornament />
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Botões e selos</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Primário</Button>
            <Button variant="secundario">Secundário</Button>
            <Button variant="fantasma">Fantasma</Button>
            <Button variant="perigo">Excluir</Button>
            <Button size="icone" variant="secundario" aria-label="Rolar dado">
              <Dices aria-hidden className="size-5" />
            </Button>
            <Button disabled>Desabilitado</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <DifficultyBadge level="facil" />
            <DifficultyBadge level="medio" />
            <DifficultyBadge level="avancado" />
            <Badge>Dado de vida d10</Badge>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Controles</h2>
          <Card className="max-w-md space-y-4">
            <Segmented
              legend="Método de atributos"
              value={method}
              onChange={setMethod}
              options={[
                { value: 'padrao', label: 'Padrão' },
                { value: 'compra', label: 'Compra' },
                { value: 'rolagem', label: 'Rolagem' },
              ]}
            />
            <Switch
              label="Exemplo de chave"
              hint="Com texto de apoio."
              checked={on}
              onCheckedChange={setOn}
            />
          </Card>
          <StepProgress steps={WIZARD_STEPS} currentIndex={step} />
          <div className="flex gap-2">
            <Button variant="secundario" onClick={() => setStep((s) => Math.max(0, s - 1))}>
              Voltar
            </Button>
            <Button onClick={() => setStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1))}>
              Avançar
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Glossário e gaveta</h2>
          <p className="prose-guia">
            Sua{' '}
            <Term
              term="Classe de Armadura"
              definition="O número que um ataque precisa alcançar para acertar você."
            >
              CA
            </Term>{' '}
            é 15 e você tem{' '}
            <Term term="Vantagem" definition="Role dois d20 e fique com o maior resultado.">
              vantagem
            </Term>{' '}
            na próxima{' '}
            <Term
              term="Salvaguarda"
              definition="Um teste para resistir a um perigo, como veneno ou uma magia."
            >
              salvaguarda
            </Term>
            .
          </p>
          <Button variant="secundario" onClick={() => setDrawer(true)}>
            Abrir gaveta
          </Button>
          <Drawer
            open={drawer}
            onOpenChange={setDrawer}
            title="Ficha"
            description="Assim a ficha aparece no celular."
          >
            <p className="pb-4 text-ink-muted">Conteúdo da gaveta.</p>
          </Drawer>
        </section>
      </div>
    </>
  );
}
