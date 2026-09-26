import type { Step } from '@/components/ui/Progress';

export const WIZARD_STEPS: Step[] = [
  { id: 'boas-vindas', label: 'Boas-vindas' },
  { id: 'especie', label: 'Espécie' },
  { id: 'classe', label: 'Classe' },
  { id: 'subclasse', label: 'Subclasse' },
  { id: 'antecedente', label: 'Antecedente' },
  { id: 'atributos', label: 'Atributos' },
  { id: 'escolhas', label: 'Perícias, equipamento e magias' },
  { id: 'detalhes', label: 'Detalhes e história' },
  { id: 'revisao', label: 'Revisão' },
];
