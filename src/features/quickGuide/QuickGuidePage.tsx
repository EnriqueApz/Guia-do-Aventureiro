import { Printer } from 'lucide-react';
import { Link } from 'react-router';
import { usePageTitle } from '@/app/usePageTitle';
import { content } from '@/content';
import { Button } from '@/components/ui/Button';
import { RichText } from '@/components/ui/RichText';
import { PageHeader } from '@/routes/PageHeader';
import { GUIDE } from './sections';

const glossary = new Map(content.glossary.map((g) => [g.id, g.term]));

export default function QuickGuidePage() {
  usePageTitle('Guia rápido');
  return (
    <>
      <PageHeader eyebrow="Apoio" title="Guia rápido de jogo">
        <p>
          O essencial para a primeira sessão. Impresso, cabe em duas folhas A4 para deixar na mesa.
        </p>
      </PageHeader>

      <div className="mb-8 flex flex-wrap gap-3 print:hidden">
        <Button onClick={() => window.print()}>
          <Printer aria-hidden className="size-5" /> Imprimir
        </Button>
      </div>

      <nav aria-label="Seções do guia" className="mb-8 print:hidden">
        <ol className="flex flex-wrap gap-2">
          {GUIDE.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line-strong px-3 text-sm font-semibold hover:border-gold"
              >
                <span className="num text-gold">{i + 1}</span> {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid gap-5 md:grid-cols-2 print:block print:columns-2 print:gap-6">
        {GUIDE.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            aria-labelledby={`${s.id}-titulo`}
            className="scroll-mt-24 space-y-2 rounded-card border border-line bg-surface p-5 shadow-card print:mb-4 print:break-inside-avoid print:border-0 print:p-0"
          >
            <h2 id={`${s.id}-titulo`} className="text-2xl font-semibold print:text-[13pt]">
              <span className="num mr-2 text-gold">{i + 1}.</span>
              {s.title}
            </h2>
            <p className="font-semibold">{s.lead}</p>
            <RichText text={s.body} className="space-y-2" />
            <p className="text-sm text-ink-muted print:hidden">
              No glossário:{' '}
              {s.terms.map((t, j) => (
                <span key={t}>
                  {j > 0 && ', '}
                  <Link to={`/glossario#${t}`} className="underline underline-offset-2">
                    {glossary.get(t) ?? t}
                  </Link>
                </span>
              ))}
            </p>
          </section>
        ))}
      </div>
    </>
  );
}
