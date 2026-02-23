/**
 * @module billing/services
 * @description Billing service for IO operations
 * @safety RED
 */

import { supabase } from '@/infra/supabase/client';
import type { Payment, CreatePaymentInput, PaymentResult } from '../domain/billing.types';
import {
  createInvoiceLinesFromAssignments,
  groupLinesByClient,
  createInvoicesFromLines,
} from '../domain/billing.logic';

export interface GenerateInvoicesParams {
  stable_id: string;
  billing_period_id: string;
}

export interface GenerateInvoicesResult {
  success: boolean;
  invoices_created?: number;
  error?: string;
}

export interface BillingService {
  getByInvoiceId(invoiceId: string): Promise<Payment[]>;
  processPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  refundPayment(paymentId: string): Promise<PaymentResult>;
  generateInvoicesForPeriod(params: GenerateInvoicesParams): Promise<GenerateInvoicesResult>;
}

class SupabaseBillingService implements BillingService {
  async getByInvoiceId(_invoiceId: string): Promise<Payment[]> {
    // TODO: Implement with Supabase
    throw new Error('Not implemented');
  }

  async processPayment(_input: CreatePaymentInput): Promise<PaymentResult> {
    // TODO: Implement with Supabase
    throw new Error('Not implemented');
  }

  async refundPayment(_paymentId: string): Promise<PaymentResult> {
    // TODO: Implement with Supabase
    throw new Error('Not implemented');
  }

  async generateInvoicesForPeriod(
    params: GenerateInvoicesParams
  ): Promise<GenerateInvoicesResult> {
    const { stable_id, billing_period_id } = params;

    // 1. Verify billing period exists and belongs to stable
    const { data: billingPeriod, error: periodError } = await supabase
      .from('billing_periods')
      .select('id, stable_id, status')
      .eq('id', billing_period_id)
      .eq('stable_id', stable_id)
      .single();

    if (periodError || !billingPeriod) {
      return {
        success: false,
        error: 'Billing period not found or does not belong to stable',
      };
    }

    // 2. Fetch active assignments for stable
    const { data: assignments, error: assignmentsError } = await supabase
      .from('service_assignments')
      .select('id, stable_id, client_id, horse_id, service_id, quantity, active')
      .eq('stable_id', stable_id)
      .eq('active', true);

    if (assignmentsError) {
      return { success: false, error: assignmentsError.message };
    }

    // If no assignments, return success with 0 invoices
    if (!assignments || assignments.length === 0) {
      // Update billing period status
      await supabase
        .from('billing_periods')
        .update({ generated_at: new Date().toISOString(), status: 'generated' })
        .eq('id', billing_period_id);

      return { success: true, invoices_created: 0 };
    }

    // 3. Fetch services for stable
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, billing_unit, price_cents')
      .eq('stable_id', stable_id);

    if (servicesError) {
      return { success: false, error: servicesError.message };
    }

    // 4. Fetch horses for stable
    const { data: horses, error: horsesError } = await supabase
      .from('horses')
      .select('id, name')
      .eq('stable_id', stable_id);

    if (horsesError) {
      return { success: false, error: horsesError.message };
    }

    // 5. Fetch clients for stable
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('stable_id', stable_id);

    if (clientsError) {
      return { success: false, error: clientsError.message };
    }

    // 6. Call domain logic
    const lines = createInvoiceLinesFromAssignments({
      assignments: assignments.map((a) => ({
        id: a.id,
        stable_id: a.stable_id,
        client_id: a.client_id,
        horse_id: a.horse_id ?? null,
        service_id: a.service_id,
        quantity: a.quantity,
        active: a.active,
      })),
      services: (services || []).map((s) => ({
        id: s.id,
        name: s.name,
        billing_unit: s.billing_unit,
        price_cents: s.price_cents,
      })),
      horses: (horses || []).map((h) => ({
        id: h.id,
        name: h.name,
      })),
      clients: (clients || []).map((c) => ({
        id: c.id,
        name: c.name,
      })),
    });

    const groupedLines = groupLinesByClient(lines);
    const invoiceDrafts = createInvoicesFromLines(groupedLines);

    // 7. Filter out empty invoices (no lines)
    const nonEmptyInvoices = invoiceDrafts.filter((inv) => inv.lines.length > 0);

    if (nonEmptyInvoices.length === 0) {
      // Update billing period status
      await supabase
        .from('billing_periods')
        .update({ generated_at: new Date().toISOString(), status: 'generated' })
        .eq('id', billing_period_id);

      return { success: true, invoices_created: 0 };
    }

    // Validate no negative totals before insert
    for (const invoice of nonEmptyInvoices) {
      if (invoice.total_cents < 0) {
        return { success: false, error: 'Cannot create invoice with negative total' };
      }
    }

    // 8. Insert invoices into invoices table
    const invoicesToInsert = nonEmptyInvoices.map((inv) => ({
      stable_id,
      client_id: inv.client_id,
      billing_period_id,
      subtotal_cents: inv.subtotal_cents,
      total_cents: inv.total_cents,
      status: 'draft',
    }));

    const { data: insertedInvoices, error: invoiceInsertError } = await supabase
      .from('invoices')
      .insert(invoicesToInsert)
      .select('id, client_id');

    if (invoiceInsertError) {
      return { success: false, error: invoiceInsertError.message };
    }

    // 9. Insert invoice lines
    const invoiceIdMap = new Map(
      (insertedInvoices || []).map((inv) => [inv.client_id, inv.id])
    );

    const linesToInsert = nonEmptyInvoices.flatMap((inv) => {
      const invoiceId = invoiceIdMap.get(inv.client_id);
      if (!invoiceId) return [];

      return inv.lines.map((line) => ({
        invoice_id: invoiceId,
        description: line.description,
        billing_unit: line.billing_unit,
        quantity: line.quantity,
        unit_price_cents: line.unit_price_cents,
        line_total_cents: line.line_total_cents,
        horse_id: line.horse_id ?? null,
        service_id: line.service_id ?? null,
      }));
    });

    const { error: linesInsertError } = await supabase
      .from('invoice_lines')
      .insert(linesToInsert);

    if (linesInsertError) {
      return { success: false, error: linesInsertError.message };
    }

    // 10. Update billing period status
    const { error: updatePeriodError } = await supabase
      .from('billing_periods')
      .update({ generated_at: new Date().toISOString(), status: 'generated' })
      .eq('id', billing_period_id);

    if (updatePeriodError) {
      return { success: false, error: updatePeriodError.message };
    }

    // 11. Return success
    return {
      success: true,
      invoices_created: insertedInvoices?.length ?? 0,
    };
  }
}

export function createBillingService(): BillingService {
  return new SupabaseBillingService();
}

export const billingService: BillingService = new SupabaseBillingService();
