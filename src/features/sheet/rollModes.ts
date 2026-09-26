import type { RollMode } from '@/rules/dice';

export const MODE_OPTIONS: { value: RollMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'vantagem', label: 'Vantagem' },
  { value: 'desvantagem', label: 'Desvantagem' },
];
