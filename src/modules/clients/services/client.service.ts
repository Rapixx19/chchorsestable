/**
 * @module clients/services
 * @description Client service for IO operations
 * @safety YELLOW
 */

import type { Client, CreateClientInput, UpdateClientInput } from '../domain/client.types';

export interface ClientService {
  getAll(): Promise<Client[]>;
  getById(id: string): Promise<Client | null>;
  create(input: CreateClientInput): Promise<Client>;
  update(id: string, input: UpdateClientInput): Promise<Client>;
  delete(id: string): Promise<void>;
}

export function createClientService(): ClientService {
  return {
    async getAll(): Promise<Client[]> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async getById(_id: string): Promise<Client | null> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async create(_input: CreateClientInput): Promise<Client> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async update(_id: string, _input: UpdateClientInput): Promise<Client> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async delete(_id: string): Promise<void> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },
  };
}
