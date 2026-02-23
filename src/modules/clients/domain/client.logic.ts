/**
 * @module clients/domain
 * @description Pure business logic for client management
 * @safety YELLOW
 */

import type { CreateClientInput } from './client.types';

export function validateClientName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

export function validateClientEmail(email: string | null | undefined): boolean {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateCreateClientInput(input: CreateClientInput): string[] {
  const errors: string[] = [];

  if (!validateClientName(input.name)) {
    errors.push('Name must be between 2 and 100 characters');
  }

  if (!input.stable_id || input.stable_id.trim() === '') {
    errors.push('Stable ID is required');
  }

  if (input.email && !validateClientEmail(input.email)) {
    errors.push('Invalid email format');
  }

  return errors;
}
