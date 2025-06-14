import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely displays a value, returning empty string for null/undefined values
 * instead of showing "null" or "undefined" to users
 */
export function displayValue(value: string | null | undefined, fallback: string = ''): string {
  if (value === null || value === undefined || value === 'null' || value === 'undefined') {
    return fallback;
  }
  return value;
}

/**
 * Safely displays a value with a default fallback for empty/null values
 */
export function displayValueWithFallback(value: string | null | undefined, fallback: string = 'N/A'): string {
  if (value === null || value === undefined || value === 'null' || value === 'undefined' || value === '') {
    return fallback;
  }
  return value;
}
