/**
 * @module services/domain
 * @description Pure business logic for service catalog
 * @safety YELLOW
 */

import type { CreateServiceInput, BillingUnit } from './service.types';

const VALID_BILLING_UNITS: BillingUnit[] = ['one_time', 'monthly', 'per_session'];

export function validateServiceName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

export function validateServicePrice(priceCents: number): boolean {
  return Number.isInteger(priceCents) && priceCents >= 0;
}

export function validateBillingUnit(unit: string): unit is BillingUnit {
  return VALID_BILLING_UNITS.includes(unit as BillingUnit);
}

export function validateCreateServiceInput(input: CreateServiceInput): string[] {
  const errors: string[] = [];

  if (!input.stable_id || input.stable_id.trim() === '') {
    errors.push('Stable ID is required');
  }

  if (!validateServiceName(input.name)) {
    errors.push('Name must be between 2 and 100 characters');
  }

  if (!validateServicePrice(input.price_cents)) {
    errors.push('Price must be a non-negative integer (cents)');
  }

  if (!validateBillingUnit(input.billing_unit)) {
    errors.push('Billing unit must be one_time, monthly, or per_session');
  }

  return errors;
}
