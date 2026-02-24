/**
 * @module assignments/services
 * @description Service assignment service for IO operations
 * @safety RED
 */

import { supabase } from '@/infra/supabase/client';
import type { Assignment, AssignmentWithDetails, CreateAssignmentInput } from '../domain/assignment.types';

export interface AssignmentResult {
  success: boolean;
  error?: string;
  assignment?: Assignment;
}

export interface AssignmentsResult {
  success: boolean;
  error?: string;
  assignments?: AssignmentWithDetails[];
}

function mapAssignment(data: Record<string, unknown>): Assignment {
  return {
    id: data.id as string,
    stable_id: data.stable_id as string,
    client_id: data.client_id as string,
    horse_id: data.horse_id as string | null,
    service_id: data.service_id as string,
    quantity: data.quantity as number,
    start_date: new Date(data.start_date as string),
    end_date: data.end_date ? new Date(data.end_date as string) : null,
    active: data.active as boolean,
    created_at: new Date(data.created_at as string),
  };
}

function mapAssignmentWithDetails(data: Record<string, unknown>): AssignmentWithDetails {
  const clients = data.clients as Record<string, unknown> | null;
  const horses = data.horses as Record<string, unknown> | null;
  const services = data.services as Record<string, unknown> | null;

  return {
    id: data.id as string,
    stable_id: data.stable_id as string,
    client_id: data.client_id as string,
    horse_id: data.horse_id as string | null,
    service_id: data.service_id as string,
    quantity: data.quantity as number,
    start_date: new Date(data.start_date as string),
    end_date: data.end_date ? new Date(data.end_date as string) : null,
    active: data.active as boolean,
    created_at: new Date(data.created_at as string),
    client_name: clients?.name as string | undefined,
    horse_name: horses?.name as string | null | undefined,
    service_name: services?.name as string | undefined,
    service_price_cents: services?.price_cents as number | undefined,
    service_billing_unit: services?.billing_unit as 'one_time' | 'monthly' | 'per_session' | undefined,
  };
}

export interface AssignmentService {
  createAssignment(input: CreateAssignmentInput): Promise<AssignmentResult>;
  getAssignmentsByStable(stableId: string): Promise<AssignmentsResult>;
  getAssignmentsByClient(clientId: string): Promise<AssignmentsResult>;
  setAssignmentActive(id: string, active: boolean): Promise<AssignmentResult>;
  deleteAssignment(id: string): Promise<{ success: boolean; error?: string }>;
}

class SupabaseAssignmentService implements AssignmentService {
  async createAssignment(input: CreateAssignmentInput): Promise<AssignmentResult> {
    const { data, error } = await supabase
      .from('service_assignments')
      .insert({
        stable_id: input.stable_id,
        client_id: input.client_id,
        horse_id: input.horse_id || null,
        service_id: input.service_id,
        quantity: input.quantity ?? 1,
        start_date: input.start_date.toISOString().split('T')[0],
        end_date: input.end_date ? input.end_date.toISOString().split('T')[0] : null,
        active: input.active ?? true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, assignment: mapAssignment(data) };
  }

  async getAssignmentsByStable(stableId: string): Promise<AssignmentsResult> {
    const { data, error } = await supabase
      .from('service_assignments')
      .select(`
        *,
        clients(name),
        horses(name),
        services(name, price_cents, billing_unit)
      `)
      .eq('stable_id', stableId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, assignments: data.map(mapAssignmentWithDetails) };
  }

  async getAssignmentsByClient(clientId: string): Promise<AssignmentsResult> {
    const { data, error } = await supabase
      .from('service_assignments')
      .select(`
        *,
        clients(name),
        horses(name),
        services(name, price_cents, billing_unit)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, assignments: data.map(mapAssignmentWithDetails) };
  }

  async setAssignmentActive(id: string, active: boolean): Promise<AssignmentResult> {
    const { data, error } = await supabase
      .from('service_assignments')
      .update({ active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, assignment: mapAssignment(data) };
  }

  async deleteAssignment(id: string): Promise<{ success: boolean; error?: string }> {
    // Soft delete: deactivate the assignment
    const { error } = await supabase
      .from('service_assignments')
      .update({ active: false })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}

export const assignmentService: AssignmentService = new SupabaseAssignmentService();
