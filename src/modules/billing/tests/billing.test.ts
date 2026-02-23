/**
 * @module billing/tests
 * @description Tests for billing module
 * @safety RED
 */

import { describe, it, expect } from 'vitest';
import {
  validatePaymentAmount,
  validateCreatePaymentInput,
  calculateTotalPayments,
} from '../domain/billing.logic';
import type { Payment } from '../domain/billing.types';

describe('billing.logic', () => {
  describe('validatePaymentAmount', () => {
    it('should return true for positive amount', () => {
      expect(validatePaymentAmount(100)).toBe(true);
      expect(validatePaymentAmount(0.01)).toBe(true);
    });

    it('should return false for zero or negative amount', () => {
      expect(validatePaymentAmount(0)).toBe(false);
      expect(validatePaymentAmount(-10)).toBe(false);
    });
  });

  describe('validateCreatePaymentInput', () => {
    it('should return empty array for valid input', () => {
      expect(
        validateCreatePaymentInput({ invoiceId: '123', amount: 100, method: 'card' })
      ).toEqual([]);
    });

    it('should return errors for invalid input', () => {
      const errors = validateCreatePaymentInput({ invoiceId: '', amount: 0, method: 'card' });
      expect(errors).toHaveLength(2);
    });
  });

  describe('calculateTotalPayments', () => {
    it('should sum completed payments only', () => {
      const payments: Payment[] = [
        { id: '1', invoiceId: '1', amount: 100, status: 'completed', method: 'card', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', invoiceId: '1', amount: 50, status: 'pending', method: 'card', createdAt: new Date(), updatedAt: new Date() },
        { id: '3', invoiceId: '1', amount: 25, status: 'completed', method: 'cash', createdAt: new Date(), updatedAt: new Date() },
      ];
      expect(calculateTotalPayments(payments)).toBe(125);
    });

    it('should return 0 for empty array', () => {
      expect(calculateTotalPayments([])).toBe(0);
    });
  });
});
