/**
 * @module clients/domain
 * @description Type definitions for client management
 * @safety YELLOW
 */

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}
