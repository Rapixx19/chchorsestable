/**
 * @module services/domain
 * @description Type definitions for service catalog
 * @safety YELLOW
 */

export type BillingUnit = 'one_time' | 'monthly' | 'per_session';

export interface Service {
  id: string;
  stable_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  billing_unit: BillingUnit;
  archived: boolean;
  created_at: Date;
}

export interface CreateServiceInput {
  stable_id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  billing_unit: BillingUnit;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string | null;
  price_cents?: number;
  billing_unit?: BillingUnit;
}
