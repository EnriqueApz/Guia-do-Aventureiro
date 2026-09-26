import { Hourglass } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StepHeader } from '../parts/StepHeader';
import type { StepProps } from '../WizardPage';

const NEXT: Record<string, { title: string; text: string }> = {
  atributos: {
    title: 'Atributos',
    text: 'Array padrão, compra de pontos ou rolagem com dados animados, e sugestões de onde colocar cada valor.',
  },
  escolhas: {
    title: 'Perícias, equipamento e magias',
    text: 'Escolhas com contador, kit recomendado para iniciantes e magias iniciais fáceis de usar.',
  },
  detalhes: {
    title: 'Detalhes e história',
    text: 'Nome com gerador por espécie, aparência, alinhamento explicado e gancho de história.',
  },
  revisao: {
    title: 'Revisão',
    text: 'A ficha completa, um checklist do que falta e um resumo do personagem.',
  },
};

export default function ComingStep({ stepId }: StepProps) {
  const id = stepId;
  const info = NEXT[id] ?? { title: 'Em breve', text: 'Esta etapa chega na próxima fase.' };
  return (
    <>
      <StepHeader eyebrow="Em construção" title={info.title}>
        <p>{info.text}</p>
      </StepHeader>
      <Card className="flex max-w-xl items-start gap-4">
        <Hourglass aria-hidden className="mt-1 size-6 shrink-0 text-gold" />
        <p>
          Esta etapa chega na fase 4 do projeto. O que você já escolheu está salvo neste aparelho e
          aparece na ficha.
        </p>
      </Card>
    </>
  );
}
