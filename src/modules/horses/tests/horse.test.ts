/**
 * @module horses/tests
 * @description Unit tests for horses domain logic
 * @safety YELLOW
 */

import { describe, it, expect } from 'vitest';
import { validateHorseName, validateBirthYear, validateCreateHorseInput } from '../domain/horse.logic';

describe('horse.logic', () => {
  describe('validateHorseName', () => {
    it('should return true for valid name', () => {
      expect(validateHorseName('Thunder')).toBe(true);
      expect(validateHorseName('AB')).toBe(true);
      expect(validateHorseName('A'.repeat(100))).toBe(true);
    });

    it('should return false for name too short', () => {
      expect(validateHorseName('A')).toBe(false);
      expect(validateHorseName('')).toBe(false);
      expect(validateHorseName('  ')).toBe(false);
    });

    it('should return false for name too long', () => {
      expect(validateHorseName('A'.repeat(101))).toBe(false);
    });
  });

  describe('validateBirthYear', () => {
    it('should return true for valid birth year', () => {
      expect(validateBirthYear(2020)).toBe(true);
      expect(validateBirthYear(1980)).toBe(true);
      expect(validateBirthYear(new Date().getFullYear())).toBe(true);
    });

    it('should return true for null/undefined (optional)', () => {
      expect(validateBirthYear(null)).toBe(true);
      expect(validateBirthYear(undefined)).toBe(true);
    });

    it('should return false for invalid birth year', () => {
      expect(validateBirthYear(1979)).toBe(false);
      expect(validateBirthYear(new Date().getFullYear() + 1)).toBe(false);
    });
  });

  describe('validateCreateHorseInput', () => {
    it('should return empty array for valid input', () => {
      const errors = validateCreateHorseInput({
        stable_id: 'stable-123',
        client_id: 'client-123',
        name: 'Thunder',
      });
      expect(errors).toEqual([]);
    });

    it('should return empty array for valid input with optional fields', () => {
      const errors = validateCreateHorseInput({
        stable_id: 'stable-123',
        client_id: 'client-123',
        name: 'Thunder',
        breed: 'Arabian',
        birth_year: 2018,
      });
      expect(errors).toEqual([]);
    });

    it('should return error for invalid name', () => {
      const errors = validateCreateHorseInput({
        stable_id: 'stable-123',
        client_id: 'client-123',
        name: 'A',
      });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Name');
    });

    it('should return error for missing stable_id', () => {
      const errors = validateCreateHorseInput({
        stable_id: '',
        client_id: 'client-123',
        name: 'Thunder',
      });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Stable ID');
    });

    it('should return error for missing client_id', () => {
      const errors = validateCreateHorseInput({
        stable_id: 'stable-123',
        client_id: '',
        name: 'Thunder',
      });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Client ID');
    });

    it('should return error for invalid birth year', () => {
      const errors = validateCreateHorseInput({
        stable_id: 'stable-123',
        client_id: 'client-123',
        name: 'Thunder',
        birth_year: 1970,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Birth year');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const errors = validateCreateHorseInput({
        stable_id: '',
        client_id: '',
        name: 'A',
        birth_year: 1970,
      });
      expect(errors).toHaveLength(4);
    });
  });
});
