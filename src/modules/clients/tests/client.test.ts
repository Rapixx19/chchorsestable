/**
 * @module clients/tests
 * @description Unit tests for clients domain logic
 * @safety YELLOW
 */

import { describe, it, expect } from 'vitest';
import { validateClientName, validateClientEmail, validateCreateClientInput } from '../domain/client.logic';

describe('client.logic', () => {
  describe('validateClientName', () => {
    it('should return true for valid name', () => {
      expect(validateClientName('John Doe')).toBe(true);
      expect(validateClientName('AB')).toBe(true);
      expect(validateClientName('A'.repeat(100))).toBe(true);
    });

    it('should return false for name too short', () => {
      expect(validateClientName('A')).toBe(false);
      expect(validateClientName('')).toBe(false);
      expect(validateClientName('  ')).toBe(false);
    });

    it('should return false for name too long', () => {
      expect(validateClientName('A'.repeat(101))).toBe(false);
    });
  });

  describe('validateClientEmail', () => {
    it('should return true for valid email', () => {
      expect(validateClientEmail('test@example.com')).toBe(true);
      expect(validateClientEmail('user.name@domain.co')).toBe(true);
    });

    it('should return true for null/undefined email (optional)', () => {
      expect(validateClientEmail(null)).toBe(true);
      expect(validateClientEmail(undefined)).toBe(true);
      expect(validateClientEmail('')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(validateClientEmail('invalid')).toBe(false);
      expect(validateClientEmail('no-at-sign.com')).toBe(false);
    });
  });

  describe('validateCreateClientInput', () => {
    it('should return empty array for valid input', () => {
      const errors = validateCreateClientInput({
        stable_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
      });
      expect(errors).toEqual([]);
    });

    it('should return empty array for valid input with optional fields', () => {
      const errors = validateCreateClientInput({
        stable_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      });
      expect(errors).toEqual([]);
    });

    it('should return error for invalid name', () => {
      const errors = validateCreateClientInput({
        stable_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'A',
      });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Name');
    });

    it('should return error for missing stable_id', () => {
      const errors = validateCreateClientInput({
        stable_id: '',
        name: 'John Doe',
      });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Stable ID');
    });

    it('should return error for invalid email', () => {
      const errors = validateCreateClientInput({
        stable_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'invalid-email',
      });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('email');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const errors = validateCreateClientInput({
        stable_id: '',
        name: 'A',
        email: 'invalid',
      });
      expect(errors).toHaveLength(3);
    });
  });
});
