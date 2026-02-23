/**
 * @module stable/domain
 * @description Pure validation logic for stable
 * @safety YELLOW
 */

import type { CreateStableInput } from './stable.types';

export function validateStableName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

export function validateCreateStableInput(input: CreateStableInput): string[] {
  const errors: string[] = [];

  if (!validateStableName(input.name)) {
    errors.push('Stable name must be between 2 and 100 characters');
  }

  if (!input.owner_id || input.owner_id.trim() === '') {
    errors.push('Owner ID is required');
  }

  return errors;
}
