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
      expect(validateCreateServiceInput({ name: 'Haircut', price: 25 })).toEqual([]);
    });

    it('should return errors for invalid input', () => {
      const errors = validateCreateServiceInput({ name: 'A', price: -10 });
      expect(errors).toHaveLength(2);
    });
  });
});
