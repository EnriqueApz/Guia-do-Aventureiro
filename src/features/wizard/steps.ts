import type { WizardStep as IssueStep } from '@/rules/validate';

export interface StepDef {
  id: string;
  label: string;
  short: string;
  /** Etapa usada pela validação para mostrar pendências. */
  issueStep?: IssueStep;
  /** Fase do projeto em que a etapa fica pronta (as futuras mostram um aviso). */
  phase: number;
}

export const STEPS: StepDef[] = [
  { id: 'boas-vindas', label: 'Boas-vindas', short: 'Início', phase: 3 },
  { id: 'especie', label: 'Espécie', short: 'Espécie', issueStep: 'especie', phase: 3 },
  { id: 'classe', label: 'Classe', short: 'Classe', issueStep: 'classe', phase: 3 },
  { id: 'subclasse', label: 'Subclasse', short: 'Subclasse', issueStep: 'subclasse', phase: 3 },
  {
    id: 'antecedente',
    label: 'Antecedente',
    short: 'Antecedente',
    issueStep: 'antecedente',
    phase: 3,
  },
  { id: 'atributos', label: 'Atributos', short: 'Atributos', issueStep: 'atributos', phase: 4 },
  {
    id: 'escolhas',
    label: 'Perícias, equipamento e magias',
    short: 'Escolhas',
    issueStep: 'escolhas',
    phase: 4,
  },
  {
    id: 'detalhes',
    label: 'Detalhes e história',
    short: 'Detalhes',
    issueStep: 'detalhes',
    phase: 4,
  },
  { id: 'revisao', label: 'Revisão', short: 'Revisão', phase: 4 },
];

export function stepIndex(id: string | undefined): number {
  const i = STEPS.findIndex((s) => s.id === id);
  return i < 0 ? 0 : i;
}

/** Etapa pelo índice (índices fora da lista caem na primeira). */
export function stepAt(index: number): StepDef {
  return STEPS[index] ?? (STEPS[0] as StepDef);
}
