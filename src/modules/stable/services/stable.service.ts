/**
 * @module stable/services
 * @description Stable service for IO operations
 * @safety RED
 */

import { supabase } from '@/infra/supabase/client';
import type { Stable, CreateStableInput, UpdateStableBrandingInput } from '../domain/stable.types';

export interface StableResult {
  success: boolean;
  error?: string;
  stable?: Stable;
}

export interface StableService {
  createStable(name: string, ownerId: string): Promise<StableResult>;
  getStableByOwnerId(ownerId: string): Promise<StableResult>;
  getStableById(stableId: string): Promise<StableResult>;
  updateStableBranding(stableId: string, input: UpdateStableBrandingInput): Promise<StableResult>;
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
      stable: this.mapRowToStable(data as Record<string, unknown>),
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
      stable: this.mapRowToStable(data as Record<string, unknown>),
    };
  }

  async getStableById(stableId: string): Promise<StableResult> {
    const { data, error } = await supabase
      .from('stables')
      .select()
      .eq('id', stableId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, stable: undefined };
      }
      return { success: false, error: error.message };
    }

    return {
      success: true,
      stable: this.mapRowToStable(data as Record<string, unknown>),
    };
  }

  async updateStableBranding(stableId: string, input: UpdateStableBrandingInput): Promise<StableResult> {
    const { data, error } = await supabase
      .from('stables')
      .update(input)
      .eq('id', stableId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      stable: this.mapRowToStable(data as Record<string, unknown>),
    };
  }

  private mapRowToStable(row: Record<string, unknown>): Stable {
    return {
      id: row.id as string,
      name: row.name as string,
      owner_id: row.owner_id as string,
      created_at: new Date(row.created_at as string),
      logo_url: row.logo_url as string | undefined,
      invoice_default_terms: row.invoice_default_terms as string | undefined,
    };
  }
}

export const stableService: StableService = new SupabaseStableService();
