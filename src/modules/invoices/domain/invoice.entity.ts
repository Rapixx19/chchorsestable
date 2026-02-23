/**
 * @module invoices/domain
 * @description Entity classes for invoices
 * @safety RED
 */

import type { Invoice, InvoiceLineItem, InvoiceStatus } from './invoice.types';

export class InvoiceEntity implements Invoice {
  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly invoiceNumber: string,
    public readonly status: InvoiceStatus,
    public readonly lineItems: InvoiceLineItem[],
    public readonly subtotal: number,
    public readonly tax: number,
    public readonly total: number,
    public readonly dueDate: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly issuedAt?: Date,
    public readonly paidAt?: Date
  ) {}

  isDraft(): boolean {
    return this.status === 'draft';
  }

  isPaid(): boolean {
    return this.status === 'paid';
  }

  isOverdue(): boolean {
    return this.status === 'overdue' || (this.status === 'sent' && new Date() > this.dueDate);
  }

  static create(data: Invoice): InvoiceEntity {
    return new InvoiceEntity(
      data.id,
      data.clientId,
      data.invoiceNumber,
      data.status,
      data.lineItems,
      data.subtotal,
      data.tax,
      data.total,
      data.dueDate,
      data.createdAt,
      data.updatedAt,
      data.issuedAt,
      data.paidAt
    );
  }
}
