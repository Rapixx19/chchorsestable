/**
 * @module billing/domain
 * @description Entity classes for billing
 * @safety RED
 */

import type { Payment, PaymentStatus, PaymentMethod } from './billing.types';

export class PaymentEntity implements Payment {
  constructor(
    public readonly id: string,
    public readonly invoiceId: string,
    public readonly amount: number,
    public readonly status: PaymentStatus,
    public readonly method: PaymentMethod,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly paidAt?: Date
  ) {}

  isPending(): boolean {
    return this.status === 'pending';
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  static create(data: Payment): PaymentEntity {
    return new PaymentEntity(
      data.id,
      data.invoiceId,
      data.amount,
      data.status,
      data.method,
      data.createdAt,
      data.updatedAt,
      data.paidAt
    );
  }
}
