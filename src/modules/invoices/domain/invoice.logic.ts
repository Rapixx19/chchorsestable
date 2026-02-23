/**
 * @module invoices/domain
 * @description Pure business logic for invoices
 * @safety RED
 */

import type { CreateInvoiceInput, InvoiceLineItem } from './invoice.types';

export function calculateLineItemTotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

export function calculateSubtotal(lineItems: Pick<InvoiceLineItem, 'quantity' | 'unitPrice'>[]): number {
  return lineItems.reduce((sum, item) => sum + calculateLineItemTotal(item.quantity, item.unitPrice), 0);
}

export function calculateTax(subtotal: number, taxRate: number): number {
  return subtotal * (taxRate / 100);
}

export function calculateTotal(subtotal: number, tax: number): number {
  return subtotal + tax;
}

export function validateCreateInvoiceInput(input: CreateInvoiceInput): string[] {
  const errors: string[] = [];

  if (!input.clientId) {
    errors.push('Client ID is required');
  }

  if (!input.lineItems || input.lineItems.length === 0) {
    errors.push('At least one line item is required');
  }

  if (!input.dueDate) {
    errors.push('Due date is required');
  }

  return errors;
}

export function generateInvoiceNumber(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(6, '0')}`;
}
