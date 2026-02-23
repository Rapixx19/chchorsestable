/**
 * @module services/services
 * @description Service offerings service for IO operations
 * @safety YELLOW
 */

import type { Service, CreateServiceInput, UpdateServiceInput } from '../domain/service.types';

export interface ServiceService {
  getAll(): Promise<Service[]>;
  getById(id: string): Promise<Service | null>;
  getActive(): Promise<Service[]>;
  create(input: CreateServiceInput): Promise<Service>;
  update(id: string, input: UpdateServiceInput): Promise<Service>;
  delete(id: string): Promise<void>;
}

export function createServiceService(): ServiceService {
  return {
    async getAll(): Promise<Service[]> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async getById(_id: string): Promise<Service | null> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async getActive(): Promise<Service[]> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async create(_input: CreateServiceInput): Promise<Service> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async update(_id: string, _input: UpdateServiceInput): Promise<Service> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },

    async delete(_id: string): Promise<void> {
      // TODO: Implement with Supabase
      throw new Error('Not implemented');
    },
  };
}
