/**
 * @module stable/services
 * @description Stable service for IO operations
 * @safety RED
 */

import { supabase } from '@/infra/supabase/client';
import type { Stable, CreateStableInput } from '../domain/stable.types';

export interface StableResult {
  success: boolean;
  error?: string;
  stable?: Stable;
}

export interface StableService {
  createStable(name: string, ownerId: string): Promise<StableResult>;
  getStableByOwnerId(ownerId: string): Promise<StableResult>;
}

class SupabaseStableService implements StableService {
  async createStable(name: string, ownerId: string): Promise<StableResult> {
    const input: CreateStableInput = { name, owner_id: ownerId };

    const { data, error } = await supabase
      .from('stables')
      .insert(input)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      stable: {
        id: data.id,
        name: data.name,
        owner_id: data.owner_id,
        created_at: new Date(data.created_at),
      },
    };
  }

  async getStableByOwnerId(ownerId: string): Promise<StableResult> {
    const { data, error } = await supabase
      .from('stables')
      .select()
      .eq('owner_id', ownerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, stable: undefined };
      }
      return { success: false, error: error.message };
    }

    return {
      success: true,
      stable: {
        id: data.id,
        name: data.name,
        owner_id: data.owner_id,
        created_at: new Date(data.created_at),
      },
    };
  }
}

export const stableService: StableService = new SupabaseStableService();
