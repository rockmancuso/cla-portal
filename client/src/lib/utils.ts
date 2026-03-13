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

/**
 * Allowlist of HubSpot member_status values that indicate an active membership.
 * HubSpot uses 'current' for active members and 'lapsed' for inactive.
 * Any unknown, null, or new status safely defaults to non-member.
 */
const ACTIVE_MEMBER_STATUSES = ['current'];

/**
 * Checks whether a contact is an active CLA member based on their HubSpot member_status.
 * Returns true only for known active statuses (case-insensitive).
 */
export function isMember(memberStatus: string | null | undefined): boolean {
  if (!memberStatus || memberStatus === 'null' || memberStatus === 'undefined') {
    return false;
  }
  return ACTIVE_MEMBER_STATUSES.includes(memberStatus.toLowerCase().trim());
}
