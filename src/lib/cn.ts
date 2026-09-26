import { clsx, type ClassValue } from 'clsx';

/** Junta classes condicionais. */
export function cn(...values: ClassValue[]): string {
  return clsx(values);
}
