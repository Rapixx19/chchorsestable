/**
 * @module clients/services
 * @description Client service for IO operations
 * @safety RED
 */

import { supabase } from '@/infra/supabase/client';
import type { Client, CreateClientInput, UpdateClientInput } from '../domain/client.types';

export interface ClientResult {
  success: boolean;
  error?: string;
  client?: Client;
}

export interface ClientsResult {
  success: boolean;
  error?: string;
  clients?: Client[];
}

export interface ClientService {
  createClient(input: CreateClientInput): Promise<ClientResult>;
  getClientsByStable(stableId: string): Promise<ClientsResult>;
  getClientById(id: string): Promise<ClientResult>;
  updateClient(id: string, input: UpdateClientInput): Promise<ClientResult>;
  archiveClient(id: string): Promise<ClientResult>;
}

function mapClient(data: Record<string, unknown>): Client {
  return {
    id: data.id as string,
    stable_id: data.stable_id as string,
    name: data.name as string,
    email: data.email as string | null,
    phone: data.phone as string | null,
    notes: data.notes as string | null,
    telegram_chat_id: data.telegram_chat_id as string | null,
    archived: data.archived as boolean,
    created_at: new Date(data.created_at as string),
  };
}

class SupabaseClientService implements ClientService {
  async createClient(input: CreateClientInput): Promise<ClientResult> {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        stable_id: input.stable_id,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        notes: input.notes || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, client: mapClient(data) };
  }

  async getClientsByStable(stableId: string): Promise<ClientsResult> {
    const { data, error } = await supabase
      .from('clients')
      .select()
      .eq('stable_id', stableId)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, clients: data.map(mapClient) };
  }

  async getClientById(id: string): Promise<ClientResult> {
    const { data, error } = await supabase
      .from('clients')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, client: mapClient(data) };
  }

  async updateClient(id: string, input: UpdateClientInput): Promise<ClientResult> {
    const { data, error } = await supabase
      .from('clients')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, client: mapClient(data) };
  }

  async archiveClient(id: string): Promise<ClientResult> {
    const { data, error } = await supabase
      .from('clients')
      .update({ archived: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, client: mapClient(data) };
  }
}

export const clientService: ClientService = new SupabaseClientService();
