/**
 * @module billing/domain
 * @description Pure business logic for billing
 * @safety RED
 */

import type { CreatePaymentInput, Payment } from './billing.types';

export function validatePaymentAmount(amount: number): boolean {
  return amount > 0;
}

export function validateCreatePaymentInput(input: CreatePaymentInput): string[] {
  const errors: string[] = [];

  if (!input.invoiceId) {
    errors.push('Invoice ID is required');
  }

  if (!validatePaymentAmount(input.amount)) {
    errors.push('Amount must be greater than 0');
  }

  return errors;
}

export function calculateTotalPayments(payments: Payment[]): number {
  return payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
}
