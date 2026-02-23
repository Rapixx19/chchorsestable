/**
 * @module invoices/domain
 * @description Type definitions for invoices
 * @safety RED
 */

export type InvoiceStatus = 'draft' | 'approved' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceLineItem {
  id: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  dueDate: Date;
  issuedAt?: Date;
  paidAt?: Date;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceInput {
  clientId: string;
  lineItems: Omit<InvoiceLineItem, 'id' | 'total'>[];
  taxRate?: number;
  dueDate: Date;
}

export interface UpdateInvoiceInput {
  lineItems?: Omit<InvoiceLineItem, 'id' | 'total'>[];
  taxRate?: number;
  dueDate?: Date;
  status?: InvoiceStatus;
}
