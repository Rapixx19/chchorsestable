/**
 * @module invoices/tests
 * @description Tests for invoices module
 * @safety RED
 */

import { describe, it, expect } from 'vitest';
import {
  calculateLineItemTotal,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  validateCreateInvoiceInput,
  generateInvoiceNumber,
} from '../domain/invoice.logic';

describe('invoice.logic', () => {
  describe('calculateLineItemTotal', () => {
    it('should calculate line item total', () => {
      expect(calculateLineItemTotal(2, 50)).toBe(100);
      expect(calculateLineItemTotal(3, 33.33)).toBeCloseTo(99.99);
    });
  });

  describe('calculateSubtotal', () => {
    it('should sum all line items', () => {
      const lineItems = [
        { quantity: 2, unitPrice: 50 },
        { quantity: 1, unitPrice: 100 },
      ];
      expect(calculateSubtotal(lineItems)).toBe(200);
    });

    it('should return 0 for empty array', () => {
      expect(calculateSubtotal([])).toBe(0);
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax correctly', () => {
      expect(calculateTax(100, 10)).toBe(10);
      expect(calculateTax(200, 7.5)).toBe(15);
    });
  });

  describe('calculateTotal', () => {
    it('should sum subtotal and tax', () => {
      expect(calculateTotal(100, 10)).toBe(110);
    });
  });

  describe('validateCreateInvoiceInput', () => {
    it('should return empty array for valid input', () => {
      const input = {
        clientId: '123',
        lineItems: [{ serviceId: '1', serviceName: 'Test', quantity: 1, unitPrice: 100 }],
        dueDate: new Date(),
      };
      expect(validateCreateInvoiceInput(input)).toEqual([]);
    });

    it('should return errors for invalid input', () => {
      const input = {
        clientId: '',
        lineItems: [],
        dueDate: undefined as unknown as Date,
      };
      const errors = validateCreateInvoiceInput(input);
      expect(errors).toHaveLength(3);
    });
  });

  describe('generateInvoiceNumber', () => {
    it('should generate padded invoice number', () => {
      expect(generateInvoiceNumber('INV', 1)).toBe('INV-000001');
      expect(generateInvoiceNumber('INV', 12345)).toBe('INV-012345');
    });
  });
});
