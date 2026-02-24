/**
 * @module invoices/services
 * @description Invoice service for IO operations
 * @safety RED
 */

import type { Invoice, CreateInvoiceInput, UpdateInvoiceInput } from '../domain/invoice.types';
import { createClient } from '@/infra/supabase/server';

export interface InvoiceService {
  getAll(): Promise<Invoice[]>;
  getById(id: string): Promise<Invoice | null>;
  getByClientId(clientId: string): Promise<Invoice[]>;
  create(input: CreateInvoiceInput): Promise<Invoice>;
  update(id: string, input: UpdateInvoiceInput): Promise<Invoice>;
  delete(id: string): Promise<void>;
  send(id: string): Promise<Invoice>;
  markAsPaid(id: string): Promise<Invoice>;
  approveInvoice(id: string): Promise<void>;
}

export function createInvoiceService(): InvoiceService {
  return {
    async getAll(): Promise<Invoice[]> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async getById(_id: string): Promise<Invoice | null> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async getByClientId(_clientId: string): Promise<Invoice[]> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async create(_input: CreateInvoiceInput): Promise<Invoice> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async update(_id: string, _input: UpdateInvoiceInput): Promise<Invoice> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async delete(_id: string): Promise<void> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async send(_id: string): Promise<Invoice> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async markAsPaid(_id: string): Promise<Invoice> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async approveInvoice(_id: string): Promise<void> {
      // Use standalone function
      throw new Error('Use standalone approveInvoice function');
    },
  };
}

export async function approveInvoice(invoiceId: string): Promise<void> {
  const supabase = await createClient();

  // Check current status
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('status')
    .eq('id', invoiceId)
    .single();

  if (fetchError || !invoice) {
    throw new Error('Invoice not found');
  }

  const invoiceData = invoice as { status: string };
  if (invoiceData.status !== 'draft') {
    throw new Error('Invoice can only be approved from draft status');
  }

  // Update to approved
  const { error: updateError } = await (supabase
    .from('invoices') as ReturnType<typeof supabase.from>)
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', invoiceId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}
