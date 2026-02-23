/**
 * @module billing/services
 * @description Billing service for IO operations
 * @safety RED
 */

import type { Payment, CreatePaymentInput, PaymentResult } from '../domain/billing.types';

export interface BillingService {
  getByInvoiceId(invoiceId: string): Promise<Payment[]>;
  processPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  refundPayment(paymentId: string): Promise<PaymentResult>;
}

export function createBillingService(): BillingService {
  return {
    async getByInvoiceId(_invoiceId: string): Promise<Payment[]> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async processPayment(_input: CreatePaymentInput): Promise<PaymentResult> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async refundPayment(_paymentId: string): Promise<PaymentResult> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },
  };
}
