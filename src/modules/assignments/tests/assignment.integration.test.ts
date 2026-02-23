/**
 * @module assignments/tests
 * @description Integration tests for assignments service
 * @safety RED
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
vi.mock('@/infra/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                stable_id: 'stable-123',
                client_id: 'client-123',
                horse_id: null,
                service_id: 'service-123',
                quantity: 1,
                start_date: '2024-01-01',
                end_date: null,
                active: true,
                created_at: '2024-01-01T00:00:00Z',
              },
              error: null,
            })
          ),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({
              data: [
                {
                  id: '123e4567-e89b-12d3-a456-426614174000',
                  stable_id: 'stable-123',
                  client_id: 'client-123',
                  horse_id: 'horse-123',
                  service_id: 'service-123',
                  quantity: 2,
                  start_date: '2024-01-01',
                  end_date: '2024-12-31',
                  active: true,
                  created_at: '2024-01-01T00:00:00Z',
                  clients: { name: 'Test Client' },
                  horses: { name: 'Test Horse' },
                  services: {
                    name: 'Test Service',
                    price_cents: 5000,
                    billing_unit: 'monthly',
                  },
                },
              ],
              error: null,
            })
          ),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: {
                  id: '123e4567-e89b-12d3-a456-426614174000',
                  stable_id: 'stable-123',
                  client_id: 'client-123',
                  horse_id: null,
                  service_id: 'service-123',
                  quantity: 1,
                  start_date: '2024-01-01',
                  end_date: null,
                  active: false,
                  created_at: '2024-01-01T00:00:00Z',
                },
                error: null,
              })
            ),
          })),
        })),
      })),
    })),
  },
}));

import { assignmentService } from '../services/assignment.service';

describe('assignmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAssignment', () => {
    it('should create an assignment successfully', async () => {
      const result = await assignmentService.createAssignment({
        stable_id: 'stable-123',
        client_id: 'client-123',
        service_id: 'service-123',
        start_date: new Date('2024-01-01'),
      });

      expect(result.success).toBe(true);
      expect(result.assignment).toBeDefined();
      expect(result.assignment?.client_id).toBe('client-123');
      expect(result.assignment?.active).toBe(true);
    });

    it('should handle optional fields', async () => {
      const result = await assignmentService.createAssignment({
        stable_id: 'stable-123',
        client_id: 'client-123',
        horse_id: 'horse-123',
        service_id: 'service-123',
        quantity: 3,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        active: false,
      });

      expect(result.success).toBe(true);
      expect(result.assignment).toBeDefined();
    });
  });

  describe('getAssignmentsByStable', () => {
    it('should get assignments by stable id', async () => {
      const result = await assignmentService.getAssignmentsByStable('stable-123');

      expect(result.success).toBe(true);
      expect(result.assignments).toBeDefined();
      expect(result.assignments?.length).toBeGreaterThan(0);
    });

    it('should include joined data', async () => {
      const result = await assignmentService.getAssignmentsByStable('stable-123');

      expect(result.success).toBe(true);
      const assignment = result.assignments?.[0];
      expect(assignment?.client_name).toBe('Test Client');
      expect(assignment?.horse_name).toBe('Test Horse');
      expect(assignment?.service_name).toBe('Test Service');
      expect(assignment?.service_price_cents).toBe(5000);
      expect(assignment?.service_billing_unit).toBe('monthly');
    });
  });

  describe('setAssignmentActive', () => {
    it('should deactivate an assignment', async () => {
      const result = await assignmentService.setAssignmentActive(
        '123e4567-e89b-12d3-a456-426614174000',
        false
      );

      expect(result.success).toBe(true);
      expect(result.assignment?.active).toBe(false);
    });

    it('should reactivate an assignment', async () => {
      const result = await assignmentService.setAssignmentActive(
        '123e4567-e89b-12d3-a456-426614174000',
        true
      );

      expect(result.success).toBe(true);
    });
  });
});
