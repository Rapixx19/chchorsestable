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
  createInvoiceLinesFromAssignments,
  groupLinesByClient,
  createInvoicesFromLines,
} from '../domain/billing.logic';
import type {
  Payment,
  Assignment,
  Service,
  Horse,
  Client,
} from '../domain/billing.types';

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

  describe('createInvoiceLinesFromAssignments', () => {
    const baseService: Service = {
      id: 'service-1',
      name: 'Monthly Boarding',
      billing_unit: 'monthly',
      price_cents: 50000,
    };

    const baseHorse: Horse = {
      id: 'horse-1',
      name: 'Thunder',
    };

    const baseClient: Client = {
      id: 'client-1',
      name: 'John Doe',
    };

    it('should create line from monthly assignment', () => {
      const assignments: Assignment[] = [
        {
          id: 'assign-1',
          stable_id: 'stable-1',
          client_id: 'client-1',
          horse_id: null,
          service_id: 'service-1',
          quantity: 1,
          active: true,
        },
      ];

      const lines = createInvoiceLinesFromAssignments({
        assignments,
        services: [baseService],
        horses: [],
        clients: [baseClient],
      });

      expect(lines).toHaveLength(1);
      expect(lines[0].description).toBe('Monthly Boarding');
      expect(lines[0].billing_unit).toBe('monthly');
      expect(lines[0].quantity).toBe(1);
      expect(lines[0].unit_price_cents).toBe(50000);
      expect(lines[0].line_total_cents).toBe(50000);
      expect(lines[0].client_id).toBe('client-1');
    });

    it('should include horse name in description for horse assignments', () => {
      const assignments: Assignment[] = [
        {
          id: 'assign-1',
          stable_id: 'stable-1',
          client_id: 'client-1',
          horse_id: 'horse-1',
          service_id: 'service-1',
          quantity: 1,
          active: true,
        },
      ];

      const lines = createInvoiceLinesFromAssignments({
        assignments,
        services: [baseService],
        horses: [baseHorse],
        clients: [baseClient],
      });

      expect(lines).toHaveLength(1);
      expect(lines[0].description).toBe('Monthly Boarding — Thunder');
      expect(lines[0].horse_id).toBe('horse-1');
    });

    it('should ignore inactive assignments', () => {
      const assignments: Assignment[] = [
        {
          id: 'assign-1',
          stable_id: 'stable-1',
          client_id: 'client-1',
          horse_id: null,
          service_id: 'service-1',
          quantity: 1,
          active: false,
        },
        {
          id: 'assign-2',
          stable_id: 'stable-1',
          client_id: 'client-1',
          horse_id: null,
          service_id: 'service-1',
          quantity: 2,
          active: true,
        },
      ];

      const lines = createInvoiceLinesFromAssignments({
        assignments,
        services: [baseService],
        horses: [],
        clients: [baseClient],
      });

      expect(lines).toHaveLength(1);
      expect(lines[0].quantity).toBe(2);
    });

    it('should calculate correct totals based on quantity', () => {
      const assignments: Assignment[] = [
        {
          id: 'assign-1',
          stable_id: 'stable-1',
          client_id: 'client-1',
          horse_id: null,
          service_id: 'service-1',
          quantity: 3,
          active: true,
        },
      ];

      const lines = createInvoiceLinesFromAssignments({
        assignments,
        services: [baseService],
        horses: [],
        clients: [baseClient],
      });

      expect(lines[0].line_total_cents).toBe(150000); // 3 * 50000
    });

    it('should throw error when service is not found', () => {
      const assignments: Assignment[] = [
        {
          id: 'assign-1',
          stable_id: 'stable-1',
          client_id: 'client-1',
          horse_id: null,
          service_id: 'unknown-service',
          quantity: 1,
          active: true,
        },
      ];

      expect(() =>
        createInvoiceLinesFromAssignments({
          assignments,
          services: [],
          horses: [],
          clients: [baseClient],
        })
      ).toThrow('Service not found: unknown-service');
    });
  });

  describe('groupLinesByClient', () => {
    it('should group lines by client_id', () => {
      const lines = [
        {
          description: 'Service A',
          billing_unit: 'monthly',
          quantity: 1,
          unit_price_cents: 10000,
          line_total_cents: 10000,
          client_id: 'client-1',
          horse_id: null,
          service_id: 'service-1',
        },
        {
          description: 'Service B',
          billing_unit: 'monthly',
          quantity: 1,
          unit_price_cents: 20000,
          line_total_cents: 20000,
          client_id: 'client-2',
          horse_id: null,
          service_id: 'service-2',
        },
        {
          description: 'Service C',
          billing_unit: 'per_session',
          quantity: 2,
          unit_price_cents: 5000,
          line_total_cents: 10000,
          client_id: 'client-1',
          horse_id: null,
          service_id: 'service-3',
        },
      ];

      const grouped = groupLinesByClient(lines);

      expect(grouped.size).toBe(2);
      expect(grouped.get('client-1')).toHaveLength(2);
      expect(grouped.get('client-2')).toHaveLength(1);
    });
  });

  describe('createInvoicesFromLines', () => {
    it('should create invoices with correct totals', () => {
      const grouped = new Map([
        [
          'client-1',
          [
            {
              description: 'Service A',
              billing_unit: 'monthly',
              quantity: 1,
              unit_price_cents: 10000,
              line_total_cents: 10000,
              client_id: 'client-1',
              horse_id: null,
              service_id: 'service-1',
            },
            {
              description: 'Service B',
              billing_unit: 'per_session',
              quantity: 2,
              unit_price_cents: 5000,
              line_total_cents: 10000,
              client_id: 'client-1',
              horse_id: null,
              service_id: 'service-2',
            },
          ],
        ],
        [
          'client-2',
          [
            {
              description: 'Service C',
              billing_unit: 'monthly',
              quantity: 1,
              unit_price_cents: 30000,
              line_total_cents: 30000,
              client_id: 'client-2',
              horse_id: null,
              service_id: 'service-3',
            },
          ],
        ],
      ]);

      const invoices = createInvoicesFromLines(grouped);

      expect(invoices).toHaveLength(2);

      const client1Invoice = invoices.find((i) => i.client_id === 'client-1');
      expect(client1Invoice?.subtotal_cents).toBe(20000);
      expect(client1Invoice?.total_cents).toBe(20000);
      expect(client1Invoice?.lines).toHaveLength(2);

      const client2Invoice = invoices.find((i) => i.client_id === 'client-2');
      expect(client2Invoice?.subtotal_cents).toBe(30000);
      expect(client2Invoice?.total_cents).toBe(30000);
      expect(client2Invoice?.lines).toHaveLength(1);
    });
  });
});
