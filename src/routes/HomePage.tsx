import {
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  Dices,
  ScrollText,
  Sparkles,
  Users,
} from 'lucide-react';
import { Link } from 'react-router';
import { Ornament } from '@/components/art/Ornament';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { Card } from '@/components/ui/Card';
import { usePageTitle } from '@/app/usePageTitle';
import { sortByRecent, useCharacters } from '@/state/characters';
import { useStartCharacter } from './useStartCharacter';

const steps = [
  {
    icon: Sparkles,
    title: 'Escolha com calma',
    text: 'Cada opção vem explicada em linguagem simples, com um selo quando é boa para quem está começando.',
  },
  {
    icon: ScrollText,
    title: 'Veja a ficha se montar',
    text: 'Enquanto você escolhe, a ficha se preenche sozinha. Nada de fazer conta de cabeça.',
  },
  {
    icon: Dices,
    title: 'Leve para a mesa',
    text: 'Use a ficha no celular durante o jogo, imprima em PDF ou mande o link para o grupo.',
  },
];

export default function HomePage() {
  usePageTitle();
  const start = useStartCharacter();
  const latest = useCharacters((s) => sortByRecent(s.characters)[0]);

  return (
    <div className="space-y-14">
      <section className="relative grid gap-8 pt-4 md:grid-cols-[1.2fr_1fr] md:items-center md:pt-12">
        <div className="animate-[rise_500ms_ease-out_both]">
          <p className="mb-3 font-display text-sm font-semibold tracking-[0.2em] text-gold uppercase">
            D&amp;D 5e · regras de 2024
          </p>
          <h1 className="text-[2.4rem] font-semibold sm:text-5xl md:text-6xl">
            Seu primeiro herói, sem precisar ler o livro inteiro.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-muted">
            Um passo a passo acolhedor para você e seu grupo criarem personagens de Dungeons &amp;
            Dragons, entendendo cada escolha e saindo com a ficha pronta para jogar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={start}>
              Criar meu personagem
              <ArrowRight aria-hidden className="size-5" />
            </Button>
            {latest && (
              <Link to={`/criar/${latest.id}`} className={buttonClasses('secundario', 'lg')}>
                Continuar {latest.name ? `“${latest.name}”` : 'de onde parei'}
              </Link>
            )}
          </div>
        </div>

        <div
          aria-hidden
          className="relative mx-auto hidden w-full max-w-sm -rotate-2 animate-[settle_700ms_100ms_ease-out_both] md:block"
        >
          <SheetPreview />
        </div>
      </section>

      <Ornament />

      <section aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="mb-6 text-3xl font-semibold">
          Como funciona
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <Card className="h-full">
                <div className="mb-3 flex items-center gap-3">
                  <span className="num flex size-9 items-center justify-center rounded-full border border-gold-soft text-gold">
                    {i + 1}
                  </span>
                  <Icon aria-hidden className="size-5 text-gold" />
                </div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-ink-muted">{text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="apoio" className="grid gap-4 md:grid-cols-2">
        <h2 id="apoio" className="sr-only">
          Material de apoio
        </h2>
        <ShortcutCard
          to="/guia-rapido"
          icon={<ScrollText aria-hidden className="size-6" />}
          title="Guia rápido de jogo"
          text="Como funcionam testes, ataques, descanso e morte, em uma página."
        />
        <ShortcutCard
          to="/glossario"
          icon={<BookOpen aria-hidden className="size-6" />}
          title="Glossário"
          text="CA, salvaguarda, vantagem… cada termo explicado em uma linha."
        />
        <ShortcutCard
          to="/comparar"
          icon={<ArrowLeftRight aria-hidden className="size-6" />}
          title="Comparador"
          text="Em dúvida entre duas classes ou espécies? Veja lado a lado."
        />
        <ShortcutCard
          to="/mesa"
          icon={<Users aria-hidden className="size-6" />}
          title="Sou o Mestre"
          text="Crie um link com as regras da sua mesa para o grupo todo usar."
        />
      </section>
    </div>
  );
}

function ShortcutCard(props: { to: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link
      to={props.to}
      className="group flex gap-4 rounded-card border border-line bg-surface/60 p-5 transition-colors hover:border-gold-soft hover:bg-surface"
    >
      <span className="mt-0.5 text-gold">{props.icon}</span>
      <span>
        <span className="flex items-center gap-1 font-display text-lg font-semibold">
          {props.title}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform group-hover:translate-x-0.5"
          />
        </span>
        <span className="mt-1 block text-ink-muted">{props.text}</span>
      </span>
    </Link>
  );
}

/** Miniatura decorativa de ficha, para a primeira dobra da página inicial. */
function SheetPreview() {
  const abilities = [
    ['FOR', '8', '−1'],
    ['DES', '14', '+2'],
    ['CON', '13', '+1'],
    ['INT', '15', '+2'],
    ['SAB', '12', '+1'],
    ['CAR', '10', '+0'],
  ];
  return (
    <div className="rounded-card border border-line-strong bg-surface p-5 shadow-card">
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <div>
          <p className="font-display text-2xl font-semibold">Lira Vento-Sul</p>
          <p className="text-sm text-ink-muted">Elfa · Maga 1 · Sábia</p>
        </div>
        <span className="num text-sm text-gold">Nível 1</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {abilities.map(([name, score, mod]) => (
          <div key={name} className="rounded-lg border border-line bg-sunken/60 py-2 text-center">
            <p className="text-[0.65rem] font-semibold tracking-widest text-ink-muted">{name}</p>
            <p className="num text-2xl leading-tight font-semibold">{mod}</p>
            <p className="num text-xs text-ink-muted">{score}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ['CA', '12'],
          ['PV', '7'],
          ['Desloc.', '9 m'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-gold-soft/60 py-2">
            <p className="text-[0.65rem] font-semibold tracking-widest text-gold uppercase">
              {label}
            </p>
            <p className="num text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
