/**
 * @module clients/domain
 * @description Type definitions for client management
 * @safety YELLOW
 */

export interface Client {
  id: string;
  stable_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  archived: boolean;
  created_at: Date;
}

export interface CreateClientInput {
  stable_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface UpdateClientInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}
