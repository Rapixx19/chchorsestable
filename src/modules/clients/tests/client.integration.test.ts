/**
 * @module clients/tests
 * @description Integration tests for clients service
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
              stable_id: 'stable-123',
              name: 'Test Client',
              email: 'test@example.com',
              phone: null,
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
                  id: '123e4567-e89b-12d3-a456-426614174000',
                  stable_id: 'stable-123',
                  name: 'Test Client',
                  email: 'test@example.com',
                  phone: null,
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
              id: '123e4567-e89b-12d3-a456-426614174000',
              stable_id: 'stable-123',
              name: 'Test Client',
              email: 'test@example.com',
              phone: null,
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
                id: '123e4567-e89b-12d3-a456-426614174000',
                stable_id: 'stable-123',
                name: 'Updated Client',
                email: 'test@example.com',
                phone: null,
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

import { clientService } from '../services/client.service';

describe('clientService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createClient', () => {
    it('should create a client successfully', async () => {
      const result = await clientService.createClient({
        stable_id: 'stable-123',
        name: 'Test Client',
        email: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.client).toBeDefined();
      expect(result.client?.name).toBe('Test Client');
    });
  });

  describe('getClientsByStable', () => {
    it('should get clients by stable id', async () => {
      const result = await clientService.getClientsByStable('stable-123');

      expect(result.success).toBe(true);
      expect(result.clients).toBeDefined();
      expect(result.clients?.length).toBeGreaterThan(0);
    });
  });

  describe('getClientById', () => {
    it('should get client by id', async () => {
      const result = await clientService.getClientById('123e4567-e89b-12d3-a456-426614174000');

      expect(result.success).toBe(true);
      expect(result.client).toBeDefined();
    });
  });

  describe('updateClient', () => {
    it('should update a client', async () => {
      const result = await clientService.updateClient('123e4567-e89b-12d3-a456-426614174000', {
        name: 'Updated Client',
      });

      expect(result.success).toBe(true);
      expect(result.client?.name).toBe('Updated Client');
    });
  });

  describe('archiveClient', () => {
    it('should archive a client', async () => {
      const result = await clientService.archiveClient('123e4567-e89b-12d3-a456-426614174000');

      expect(result.success).toBe(true);
    });
  });
});
