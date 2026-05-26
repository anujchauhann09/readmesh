import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges conditional class names and resolves Tailwind conflicts
 * (later utilities win). Used by every UI component.
 *
 * @param {...import('clsx').ClassValue} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
