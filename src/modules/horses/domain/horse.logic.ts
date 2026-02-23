/**
 * @module horses/domain
 * @description Pure validation logic for horses
 * @safety YELLOW
 */

import type { CreateHorseInput } from './horse.types';

export function validateHorseName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

export function validateBirthYear(year: number | null | undefined): boolean {
  if (year === null || year === undefined) return true;
  const currentYear = new Date().getFullYear();
  return year >= 1980 && year <= currentYear;
}

export function validateCreateHorseInput(input: CreateHorseInput): string[] {
  const errors: string[] = [];

  if (!validateHorseName(input.name)) {
    errors.push('Name must be between 2 and 100 characters');
  }

  if (!input.stable_id || input.stable_id.trim() === '') {
    errors.push('Stable ID is required');
  }

  if (!input.client_id || input.client_id.trim() === '') {
    errors.push('Client ID is required');
  }

  if (!validateBirthYear(input.birth_year)) {
    errors.push('Birth year must be between 1980 and current year');
  }

  return errors;
}
