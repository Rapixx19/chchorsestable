/**
 * @module assignments/tests
 * @description Unit tests for assignment logic
 * @safety GREEN
 */

import { describe, it, expect } from 'vitest';
import {
  validateQuantity,
  validateDates,
  validateCreateAssignmentInput,
} from '../domain/assignment.logic';

describe('assignment.logic', () => {
  describe('validateQuantity', () => {
    it('should return true for positive integers', () => {
      expect(validateQuantity(1)).toBe(true);
      expect(validateQuantity(10)).toBe(true);
      expect(validateQuantity(100)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(validateQuantity(0)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(validateQuantity(-1)).toBe(false);
      expect(validateQuantity(-10)).toBe(false);
    });

    it('should return false for non-integers', () => {
      expect(validateQuantity(1.5)).toBe(false);
      expect(validateQuantity(0.5)).toBe(false);
    });
  });

  describe('validateDates', () => {
    it('should return true when end date is null', () => {
      expect(validateDates(new Date('2024-01-01'), null)).toBe(true);
    });

    it('should return true when end date is undefined', () => {
      expect(validateDates(new Date('2024-01-01'), undefined)).toBe(true);
    });

    it('should return true when end date is after start date', () => {
      expect(
        validateDates(new Date('2024-01-01'), new Date('2024-12-31'))
      ).toBe(true);
    });

    it('should return false when end date is before start date', () => {
      expect(
        validateDates(new Date('2024-12-31'), new Date('2024-01-01'))
      ).toBe(false);
    });

    it('should return false when end date equals start date', () => {
      expect(
        validateDates(new Date('2024-01-01'), new Date('2024-01-01'))
      ).toBe(false);
    });
  });

  describe('validateCreateAssignmentInput', () => {
    it('should return empty array for valid input', () => {
      expect(
        validateCreateAssignmentInput({
          stable_id: 'stable-123',
          client_id: 'client-123',
          service_id: 'service-123',
          start_date: new Date('2024-01-01'),
        })
      ).toEqual([]);
    });

    it('should return empty array for valid input with optional fields', () => {
      expect(
        validateCreateAssignmentInput({
          stable_id: 'stable-123',
          client_id: 'client-123',
          horse_id: 'horse-123',
          service_id: 'service-123',
          quantity: 2,
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-12-31'),
          active: true,
        })
      ).toEqual([]);
    });

    it('should validate stable_id is required', () => {
      const errors = validateCreateAssignmentInput({
        stable_id: '',
        client_id: 'client-123',
        service_id: 'service-123',
        start_date: new Date('2024-01-01'),
      });
      expect(errors).toContain('Stable ID is required');
    });

    it('should validate client_id is required', () => {
      const errors = validateCreateAssignmentInput({
        stable_id: 'stable-123',
        client_id: '',
        service_id: 'service-123',
        start_date: new Date('2024-01-01'),
      });
      expect(errors).toContain('Client ID is required');
    });

    it('should validate service_id is required', () => {
      const errors = validateCreateAssignmentInput({
        stable_id: 'stable-123',
        client_id: 'client-123',
        service_id: '',
        start_date: new Date('2024-01-01'),
      });
      expect(errors).toContain('Service ID is required');
    });

    it('should validate quantity is positive', () => {
      const errors = validateCreateAssignmentInput({
        stable_id: 'stable-123',
        client_id: 'client-123',
        service_id: 'service-123',
        quantity: 0,
        start_date: new Date('2024-01-01'),
      });
      expect(errors).toContain('Quantity must be a positive integer');
    });

    it('should validate end date is after start date', () => {
      const errors = validateCreateAssignmentInput({
        stable_id: 'stable-123',
        client_id: 'client-123',
        service_id: 'service-123',
        start_date: new Date('2024-12-31'),
        end_date: new Date('2024-01-01'),
      });
      expect(errors).toContain('End date must be after start date');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const errors = validateCreateAssignmentInput({
        stable_id: '',
        client_id: '',
        service_id: '',
        quantity: -1,
        start_date: new Date('2024-12-31'),
        end_date: new Date('2024-01-01'),
      });
      expect(errors).toHaveLength(5);
    });
  });
});
