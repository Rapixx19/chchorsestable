/**
 * @module services/tests
 * @description Tests for services module
 * @safety YELLOW
 */

import { describe, it, expect } from 'vitest';
import { validateServiceName, validateServicePrice, validateCreateServiceInput } from '../domain/service.logic';

describe('service.logic', () => {
  describe('validateServiceName', () => {
    it('should return true for valid name', () => {
      expect(validateServiceName('Haircut')).toBe(true);
      expect(validateServiceName('AB')).toBe(true);
    });

    it('should return false for invalid name', () => {
      expect(validateServiceName('A')).toBe(false);
      expect(validateServiceName('')).toBe(false);
    });
  });

  describe('validateServicePrice', () => {
    it('should return true for non-negative price', () => {
      expect(validateServicePrice(0)).toBe(true);
      expect(validateServicePrice(100)).toBe(true);
    });

    it('should return false for negative price', () => {
      expect(validateServicePrice(-1)).toBe(false);
    });
  });

  describe('validateCreateServiceInput', () => {
    it('should return empty array for valid input', () => {
      expect(validateCreateServiceInput({
        stable_id: 'stable-123',
        name: 'Haircut',
        price_cents: 2500,
        billing_unit: 'one_time',
      })).toEqual([]);
    });

    it('should return errors for invalid input', () => {
      const errors = validateCreateServiceInput({
        stable_id: '',
        name: 'A',
        price_cents: -10,
        billing_unit: 'invalid' as 'one_time',
      });
      expect(errors).toHaveLength(4);
    });

    it('should validate stable_id is required', () => {
      const errors = validateCreateServiceInput({
        stable_id: '',
        name: 'Valid Service',
        price_cents: 1000,
        billing_unit: 'monthly',
      });
      expect(errors).toContain('Stable ID is required');
    });

    it('should validate billing_unit enum', () => {
      const errors = validateCreateServiceInput({
        stable_id: 'stable-123',
        name: 'Valid Service',
        price_cents: 1000,
        billing_unit: 'weekly' as 'one_time',
      });
      expect(errors).toContain('Billing unit must be one_time, monthly, or per_session');
    });
  });
});
