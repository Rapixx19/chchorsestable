/**
 * @module clients/domain
 * @description Pure business logic for client management
 * @safety YELLOW
 */

import type { CreateClientInput } from './client.types';

export function validateClientName(name: string): boolean {
  return name.trim().length >= 2;
}

export function validateClientEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateCreateClientInput(input: CreateClientInput): string[] {
  const errors: string[] = [];

  if (!validateClientName(input.name)) {
    errors.push('Name must be at least 2 characters');
  }

  if (!validateClientEmail(input.email)) {
    errors.push('Invalid email format');
  }

  return errors;
}
