/**
 * @module horses/tests
 * @description Integration tests for horses service
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
              id: 'horse-123',
              stable_id: 'stable-123',
              client_id: 'client-123',
              name: 'Thunder',
              breed: 'Arabian',
              birth_year: 2018,
              notes: null,
              archived: false,
              created_at: '2024-01-01T00:00:00Z',
            },
            error: null,
          })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: [
                {
                  id: 'horse-123',
                  stable_id: 'stable-123',
                  client_id: 'client-123',
                  name: 'Thunder',
                  breed: 'Arabian',
                  birth_year: 2018,
                  notes: null,
                  archived: false,
                  created_at: '2024-01-01T00:00:00Z',
                },
              ],
              error: null,
            })),
          })),
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'horse-123',
              stable_id: 'stable-123',
              client_id: 'client-123',
              name: 'Thunder',
              breed: 'Arabian',
              birth_year: 2018,
              notes: null,
              archived: false,
              created_at: '2024-01-01T00:00:00Z',
            },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'horse-123',
                stable_id: 'stable-123',
                client_id: 'client-123',
                name: 'Updated Horse',
                breed: 'Arabian',
                birth_year: 2018,
                notes: null,
                archived: false,
                created_at: '2024-01-01T00:00:00Z',
              },
              error: null,
            })),
          })),
        })),
      })),
    })),
  },
}));

import { horseService } from '../services/horse.service';

describe('horseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createHorse', () => {
    it('should create a horse successfully', async () => {
      const result = await horseService.createHorse({
        stable_id: 'stable-123',
        client_id: 'client-123',
        name: 'Thunder',
        breed: 'Arabian',
      });

      expect(result.success).toBe(true);
      expect(result.horse).toBeDefined();
      expect(result.horse?.name).toBe('Thunder');
    });
  });

  describe('getHorsesByStable', () => {
    it('should get horses by stable id', async () => {
      const result = await horseService.getHorsesByStable('stable-123');

      expect(result.success).toBe(true);
      expect(result.horses).toBeDefined();
      expect(result.horses?.length).toBeGreaterThan(0);
    });
  });

  describe('getHorseById', () => {
    it('should get horse by id', async () => {
      const result = await horseService.getHorseById('horse-123');

      expect(result.success).toBe(true);
      expect(result.horse).toBeDefined();
    });
  });

  describe('updateHorse', () => {
    it('should update a horse', async () => {
      const result = await horseService.updateHorse('horse-123', {
        name: 'Updated Horse',
      });

      expect(result.success).toBe(true);
      expect(result.horse?.name).toBe('Updated Horse');
    });
  });

  describe('archiveHorse', () => {
    it('should archive a horse', async () => {
      const result = await horseService.archiveHorse('horse-123');

      expect(result.success).toBe(true);
    });
  });
});
