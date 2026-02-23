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
