/**
 * @module stable/tests
 * @description Integration tests for stable service
 * @safety RED
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
vi.mock('@/infra/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Test Stable',
              owner_id: 'owner-123',
              created_at: '2024-01-01T00:00:00Z',
            },
            error: null,
          })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Test Stable',
              owner_id: 'owner-123',
              created_at: '2024-01-01T00:00:00Z',
            },
            error: null,
          })),
        })),
      })),
    })),
  },
}));

import { stableService } from '../services/stable.service';

describe('stableService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createStable', () => {
    it('should create a stable successfully', async () => {
      const result = await stableService.createStable('Test Stable', 'owner-123');

      expect(result.success).toBe(true);
      expect(result.stable).toBeDefined();
      expect(result.stable?.name).toBe('Test Stable');
    });
  });

  describe('getStableByOwnerId', () => {
    it('should get stable by owner id', async () => {
      const result = await stableService.getStableByOwnerId('owner-123');

      expect(result.success).toBe(true);
      expect(result.stable).toBeDefined();
      expect(result.stable?.owner_id).toBe('owner-123');
    });
  });
});
