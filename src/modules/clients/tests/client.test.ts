/**
 * @module clients/tests
 * @description Tests for clients module
 * @safety YELLOW
 */

import { describe, it, expect } from 'vitest';
import { validateClientName, validateClientEmail, validateCreateClientInput } from '../domain/client.logic';

describe('client.logic', () => {
  describe('validateClientName', () => {
    it('should return true for valid name', () => {
      expect(validateClientName('John Doe')).toBe(true);
      expect(validateClientName('AB')).toBe(true);
    });

    it('should return false for invalid name', () => {
      expect(validateClientName('A')).toBe(false);
      expect(validateClientName('')).toBe(false);
      expect(validateClientName('  ')).toBe(false);
    });
  });

  describe('validateClientEmail', () => {
    it('should return true for valid email', () => {
      expect(validateClientEmail('test@example.com')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(validateClientEmail('invalid')).toBe(false);
    });
  });

  describe('validateCreateClientInput', () => {
    it('should return empty array for valid input', () => {
      expect(validateCreateClientInput({ name: 'John Doe', email: 'john@example.com' })).toEqual([]);
    });

    it('should return errors for invalid input', () => {
      const errors = validateCreateClientInput({ name: 'A', email: 'invalid' });
      expect(errors).toHaveLength(2);
    });
  });
});
