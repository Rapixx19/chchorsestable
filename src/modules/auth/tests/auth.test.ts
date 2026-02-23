/**
 * @module auth/tests
 * @description Tests for authentication module
 * @safety RED
 */

import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateCredentials } from '../domain/auth.logic';

describe('auth.logic', () => {
  describe('validateEmail', () => {
    it('should return true for valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should return true for password >= 8 characters', () => {
      expect(validatePassword('12345678')).toBe(true);
      expect(validatePassword('longerpassword')).toBe(true);
    });

    it('should return false for password < 8 characters', () => {
      expect(validatePassword('1234567')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('validateCredentials', () => {
    it('should return empty array for valid credentials', () => {
      expect(validateCredentials({ email: 'test@example.com', password: '12345678' })).toEqual([]);
    });

    it('should return errors for invalid credentials', () => {
      const errors = validateCredentials({ email: 'invalid', password: '123' });
      expect(errors).toHaveLength(2);
    });
  });
});
