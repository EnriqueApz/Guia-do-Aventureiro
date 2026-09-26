import { ArrowLeft, Printer } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { usePageTitle } from '@/app/usePageTitle';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { Card } from '@/components/ui/Card';
import { useWizard } from '@/features/wizard/useWizard';
import { PrintSheet } from './PrintSheet';

export default function PrintPage() {
  const { id = '' } = useParams();
  const { character, sheet } = useWizard(id);
  usePageTitle(character ? `${character.name || 'Personagem'} — impressão` : 'Impressão');
  if (!character || !sheet) {
    return (
      <Card className="max-w-xl">
        <h1 className="text-2xl font-semibold">Personagem não encontrado</h1>
        <Link to="/personagens" className={`${buttonClasses('secundario')} mt-4`}>
          Ver meus personagens
        </Link>
      </Card>
    );
  }
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <Link to={`/ficha/${id}`} className={buttonClasses('secundario')}>
          <ArrowLeft aria-hidden className="size-4" /> Voltar à ficha
        </Link>
        <Button onClick={() => window.print()}>
          <Printer aria-hidden className="size-5" /> Imprimir ou salvar PDF
        </Button>
        <p className="text-sm text-ink-muted">
          Na janela de impressão, escolha papel A4 e “Salvar como PDF” para guardar um arquivo.
        </p>
      </div>
      <div className="overflow-x-auto rounded-card border border-line bg-white p-6 shadow-card print:overflow-visible print:border-0 print:p-0 print:shadow-none">
        <PrintSheet character={character} sheet={sheet} />
      </div>
    </>
  );
}
