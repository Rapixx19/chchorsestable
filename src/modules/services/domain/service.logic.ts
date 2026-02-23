/**
 * @module services/domain
 * @description Pure business logic for service offerings
 * @safety YELLOW
 */

import type { CreateServiceInput } from './service.types';

export function validateServiceName(name: string): boolean {
  return name.trim().length >= 2;
}

export function validateServicePrice(price: number): boolean {
  return price >= 0;
}

export function validateCreateServiceInput(input: CreateServiceInput): string[] {
  const errors: string[] = [];

  if (!validateServiceName(input.name)) {
    errors.push('Name must be at least 2 characters');
  }

  if (!validateServicePrice(input.price)) {
    errors.push('Price must be non-negative');
  }

  return errors;
}
