/**
 * @module stable/tests
 * @description Unit tests for stable module
 * @safety YELLOW
 */

import { describe, it, expect } from 'vitest';
import { validateStableName, validateCreateStableInput } from '../domain/stable.logic';

describe('stable.logic', () => {
  describe('validateStableName', () => {
    it('should return true for valid name', () => {
      expect(validateStableName('My Stable')).toBe(true);
      expect(validateStableName('AB')).toBe(true);
      expect(validateStableName('A'.repeat(100))).toBe(true);
    });

    it('should return false for name too short', () => {
      expect(validateStableName('A')).toBe(false);
      expect(validateStableName('')).toBe(false);
      expect(validateStableName('  ')).toBe(false);
    });

    it('should return false for name too long', () => {
      expect(validateStableName('A'.repeat(101))).toBe(false);
    });
  });

  describe('validateCreateStableInput', () => {
    it('should return empty array for valid input', () => {
      const errors = validateCreateStableInput({
        name: 'My Stable',
        owner_id: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(errors).toEqual([]);
    });

    it('should return error for invalid name', () => {
      const errors = validateCreateStableInput({
        name: 'A',
        owner_id: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('name');
    });

    it('should return error for missing owner_id', () => {
      const errors = validateCreateStableInput({
        name: 'My Stable',
        owner_id: '',
      });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Owner ID');
    });

    it('should return multiple errors for invalid input', () => {
      const errors = validateCreateStableInput({
        name: 'A',
        owner_id: '',
      });
      expect(errors).toHaveLength(2);
    });
  });
});
