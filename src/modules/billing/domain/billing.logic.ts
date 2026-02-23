/**
 * @module billing/domain
 * @description Pure business logic for billing
 * @safety RED
 */

import type {
  CreatePaymentInput,
  Payment,
  CreateInvoiceLinesParams,
  InvoiceLineDraft,
  InvoiceDraft,
} from './billing.types';

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

// Invoice Generation Functions

export function createInvoiceLinesFromAssignments(
  params: CreateInvoiceLinesParams
): InvoiceLineDraft[] {
  const { assignments, services, horses } = params;

  // Create lookup maps
  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const horseMap = new Map(horses.map((h) => [h.id, h]));

  // Filter active assignments and map to lines
  return assignments
    .filter((a) => a.active)
    .map((assignment) => {
      const service = serviceMap.get(assignment.service_id);
      if (!service) {
        throw new Error(`Service not found: ${assignment.service_id}`);
      }

      const horse = assignment.horse_id
        ? horseMap.get(assignment.horse_id)
        : null;

      const description = horse
        ? `${service.name} — ${horse.name}`
        : service.name;

      const line_total_cents = assignment.quantity * service.price_cents;

      return {
        description,
        billing_unit: service.billing_unit,
        quantity: assignment.quantity,
        unit_price_cents: service.price_cents,
        line_total_cents,
        client_id: assignment.client_id,
        horse_id: assignment.horse_id ?? null,
        service_id: assignment.service_id,
      };
    });
}

export function groupLinesByClient(
  lines: InvoiceLineDraft[]
): Map<string, InvoiceLineDraft[]> {
  const grouped = new Map<string, InvoiceLineDraft[]>();

  for (const line of lines) {
    const existing = grouped.get(line.client_id) ?? [];
    grouped.set(line.client_id, [...existing, line]);
  }

  return grouped;
}

export function createInvoicesFromLines(
  groupedLines: Map<string, InvoiceLineDraft[]>
): InvoiceDraft[] {
  const invoices: InvoiceDraft[] = [];

  for (const [client_id, lines] of groupedLines) {
    const subtotal_cents = lines.reduce(
      (sum, line) => sum + line.line_total_cents,
      0
    );

    invoices.push({
      client_id,
      lines,
      subtotal_cents,
      total_cents: subtotal_cents, // No tax yet
    });
  }

  return invoices;
}
