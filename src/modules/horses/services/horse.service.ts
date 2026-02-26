/**
 * @module horses/services
 * @description Horse service for IO operations
 * @safety RED
 */

import { supabase } from '@/infra/supabase/client';
import type { Horse, CreateHorseInput, UpdateHorseInput, HorseWithClient } from '../domain/horse.types';

export interface HorseResult {
  success: boolean;
  error?: string;
  horse?: Horse;
}

export interface HorsesResult {
  success: boolean;
  error?: string;
  horses?: Horse[];
}

export interface HorsesWithClientsResult {
  success: boolean;
  error?: string;
  horses?: HorseWithClient[];
}

function mapHorse(data: Record<string, unknown>): Horse {
  return {
    id: data.id as string,
    stable_id: data.stable_id as string,
    client_id: data.client_id as string,
    name: data.name as string,
    breed: data.breed as string | null,
    birth_year: data.birth_year as number | null,
    notes: data.notes as string | null,
    archived: data.archived as boolean,
    created_at: new Date(data.created_at as string),
  };
}

function mapHorseWithClient(data: Record<string, unknown>): HorseWithClient {
  const clients = data.clients as Record<string, unknown> | null;
  return {
    id: data.id as string,
    stable_id: data.stable_id as string,
    client_id: data.client_id as string,
    name: data.name as string,
    breed: data.breed as string | null,
    birth_year: data.birth_year as number | null,
    notes: data.notes as string | null,
    archived: data.archived as boolean,
    created_at: new Date(data.created_at as string),
    client_name: clients?.name as string | null ?? null,
  };
}

export interface HorseService {
  createHorse(input: CreateHorseInput): Promise<HorseResult>;
  getHorsesByStable(stableId: string): Promise<HorsesResult>;
  getHorsesWithClients(stableId: string): Promise<HorsesWithClientsResult>;
  getHorsesByClient(clientId: string): Promise<HorsesResult>;
  getHorseById(id: string): Promise<HorseResult>;
  updateHorse(id: string, input: UpdateHorseInput): Promise<HorseResult>;
  archiveHorse(id: string): Promise<HorseResult>;
}

class SupabaseHorseService implements HorseService {
  async createHorse(input: CreateHorseInput): Promise<HorseResult> {
    const { data, error } = await supabase
      .from('horses')
      .insert({
        stable_id: input.stable_id,
        client_id: input.client_id,
        name: input.name,
        breed: input.breed || null,
        birth_year: input.birth_year || null,
        notes: input.notes || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, horse: mapHorse(data) };
  }

  async getHorsesByStable(stableId: string): Promise<HorsesResult> {
    const { data, error } = await supabase
      .from('horses')
      .select()
      .eq('stable_id', stableId)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, horses: data.map(mapHorse) };
  }

  async getHorsesWithClients(stableId: string): Promise<HorsesWithClientsResult> {
    const { data, error } = await supabase
      .from('horses')
      .select(`*, clients(name)`)
      .eq('stable_id', stableId)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, horses: data.map(mapHorseWithClient) };
  }

  async getHorsesByClient(clientId: string): Promise<HorsesResult> {
    const { data, error } = await supabase
      .from('horses')
      .select()
      .eq('client_id', clientId)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, horses: data.map(mapHorse) };
  }

  async getHorseById(id: string): Promise<HorseResult> {
    const { data, error } = await supabase
      .from('horses')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, horse: mapHorse(data) };
  }

  async updateHorse(id: string, input: UpdateHorseInput): Promise<HorseResult> {
    const { data, error } = await supabase
      .from('horses')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, horse: mapHorse(data) };
  }

  async archiveHorse(id: string): Promise<HorseResult> {
    const { data, error } = await supabase
      .from('horses')
      .update({ archived: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, horse: mapHorse(data) };
  }
}

export const horseService: HorseService = new SupabaseHorseService();
