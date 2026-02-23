/**
 * @module services/domain
 * @description Type definitions for service offerings
 * @safety YELLOW
 */

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration?: number; // in minutes
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  price: number;
  duration?: number;
  active?: boolean;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  active?: boolean;
}
