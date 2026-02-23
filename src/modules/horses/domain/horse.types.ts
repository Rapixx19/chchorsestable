/**
 * @module horses/domain
 * @description Type definitions for horse management
 * @safety YELLOW
 */

export interface Horse {
  id: string;
  stable_id: string;
  client_id: string;
  name: string;
  breed: string | null;
  birth_year: number | null;
  notes: string | null;
  archived: boolean;
  created_at: Date;
}

export interface CreateHorseInput {
  stable_id: string;
  client_id: string;
  name: string;
  breed?: string | null;
  birth_year?: number | null;
  notes?: string | null;
}

export interface UpdateHorseInput {
  name?: string;
  breed?: string | null;
  birth_year?: number | null;
  notes?: string | null;
}
