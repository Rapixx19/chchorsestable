/**
 * @module billing/domain
 * @description Type definitions for billing and payments
 * @safety RED
 */

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer';

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentInput {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
}

export interface PaymentResult {
  success: boolean;
  payment?: Payment;
  error?: string;
}

// Invoice Generation Types
export type BillingUnit = 'monthly' | 'per_session' | 'one_time';

export interface Assignment {
  id: string;
  stable_id: string;
  client_id: string;
  horse_id?: string | null;
  service_id: string;
  quantity: number;
  active: boolean;
}

export interface Service {
  id: string;
  name: string;
  billing_unit: BillingUnit;
  price_cents: number;
}

export interface Horse {
  id: string;
  name: string;
}

export interface Client {
  id: string;
  name: string;
}

export interface InvoiceLineDraft {
  description: string;
  billing_unit: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  client_id: string;
  horse_id?: string | null;
  service_id?: string | null;
}

export interface InvoiceDraft {
  client_id: string;
  lines: InvoiceLineDraft[];
  subtotal_cents: number;
  total_cents: number;
}

export interface CreateInvoiceLinesParams {
  assignments: Assignment[];
  services: Service[];
  horses: Horse[];
  clients: Client[];
}
