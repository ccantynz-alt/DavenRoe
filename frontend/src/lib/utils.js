import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with conflict resolution.
 * Combines clsx conditional logic with tailwind-merge deduplication.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
