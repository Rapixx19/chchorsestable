/**
 * @module assignments/domain
 * @description Pure business logic for service assignments
 * @safety YELLOW
 */

import type { CreateAssignmentInput } from './assignment.types';

export function validateQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0;
}

export function validateDates(startDate: Date, endDate: Date | null | undefined): boolean {
  if (!endDate) {
    return true;
  }
  return endDate > startDate;
}

export function validateCreateAssignmentInput(input: CreateAssignmentInput): string[] {
  const errors: string[] = [];

  if (!input.stable_id || input.stable_id.trim() === '') {
    errors.push('Stable ID is required');
  }

  if (!input.client_id || input.client_id.trim() === '') {
    errors.push('Client ID is required');
  }

  if (!input.service_id || input.service_id.trim() === '') {
    errors.push('Service ID is required');
  }

  if (input.quantity !== undefined && !validateQuantity(input.quantity)) {
    errors.push('Quantity must be a positive integer');
  }

  if (!input.start_date) {
    errors.push('Start date is required');
  }

  if (input.start_date && input.end_date && !validateDates(input.start_date, input.end_date)) {
    errors.push('End date must be after start date');
  }

  return errors;
}
