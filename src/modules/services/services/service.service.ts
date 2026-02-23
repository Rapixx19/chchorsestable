/**
 * @module services/services
 * @description Service catalog service for IO operations
 * @safety RED
 */

import { supabase } from '@/infra/supabase/client';
import type { Service, CreateServiceInput, UpdateServiceInput } from '../domain/service.types';

export interface ServiceResult {
  success: boolean;
  error?: string;
  service?: Service;
}

export interface ServicesResult {
  success: boolean;
  error?: string;
  services?: Service[];
}

function mapService(data: Record<string, unknown>): Service {
  return {
    id: data.id as string,
    stable_id: data.stable_id as string,
    name: data.name as string,
    description: data.description as string | null,
    price_cents: data.price_cents as number,
    billing_unit: data.billing_unit as Service['billing_unit'],
    archived: data.archived as boolean,
    created_at: new Date(data.created_at as string),
  };
}

export interface ServiceService {
  createService(input: CreateServiceInput): Promise<ServiceResult>;
  getServicesByStable(stableId: string): Promise<ServicesResult>;
  getServiceById(id: string): Promise<ServiceResult>;
  updateService(id: string, input: UpdateServiceInput): Promise<ServiceResult>;
  archiveService(id: string): Promise<ServiceResult>;
  bulkCreateServices(inputs: CreateServiceInput[]): Promise<ServicesResult>;
}

class SupabaseServiceService implements ServiceService {
  async createService(input: CreateServiceInput): Promise<ServiceResult> {
    const { data, error } = await supabase
      .from('services')
      .insert({
        stable_id: input.stable_id,
        name: input.name,
        description: input.description || null,
        price_cents: input.price_cents,
        billing_unit: input.billing_unit,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, service: mapService(data) };
  }

  async getServicesByStable(stableId: string): Promise<ServicesResult> {
    const { data, error } = await supabase
      .from('services')
      .select()
      .eq('stable_id', stableId)
      .eq('archived', false)
      .order('name', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, services: data.map(mapService) };
  }

  async getServiceById(id: string): Promise<ServiceResult> {
    const { data, error } = await supabase
      .from('services')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, service: mapService(data) };
  }

  async updateService(id: string, input: UpdateServiceInput): Promise<ServiceResult> {
    const { data, error } = await supabase
      .from('services')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, service: mapService(data) };
  }

  async archiveService(id: string): Promise<ServiceResult> {
    const { data, error } = await supabase
      .from('services')
      .update({ archived: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, service: mapService(data) };
  }

  /**
   * Bulk create services atomically.
   * Uses a single INSERT statement which is atomic in PostgreSQL:
   * either ALL rows are inserted or NONE (on any error).
   */
  async bulkCreateServices(inputs: CreateServiceInput[]): Promise<ServicesResult> {
    if (inputs.length === 0) {
      return { success: true, services: [] };
    }

    // Pre-validate all inputs before attempting insert
    // This ensures we fail fast with a clear error
    const validBillingUnits = ['one_time', 'monthly', 'per_session'];
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      if (!input.stable_id) {
        return { success: false, error: `Service ${i + 1}: stable_id is required` };
      }
      if (!input.name || input.name.trim().length < 2) {
        return { success: false, error: `Service ${i + 1}: name must be at least 2 characters` };
      }
      if (typeof input.price_cents !== 'number' || input.price_cents < 0) {
        return { success: false, error: `Service ${i + 1}: price_cents must be a non-negative number` };
      }
      if (!validBillingUnits.includes(input.billing_unit)) {
        return { success: false, error: `Service ${i + 1}: invalid billing_unit` };
      }
    }

    const records = inputs.map((input) => ({
      stable_id: input.stable_id,
      name: input.name.trim(),
      description: input.description || null,
      price_cents: input.price_cents,
      billing_unit: input.billing_unit,
    }));

    // Single INSERT with multiple rows is atomic in PostgreSQL
    // If any row fails (e.g., constraint violation), entire insert is rolled back
    const { data, error } = await supabase
      .from('services')
      .insert(records)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, services: data.map(mapService) };
  }
}

export const serviceService: ServiceService = new SupabaseServiceService();
