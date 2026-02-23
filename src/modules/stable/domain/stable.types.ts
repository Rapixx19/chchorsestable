/**
 * @module stable/domain
 * @description Type definitions for stable (tenant) management
 * @safety YELLOW
 */

export interface Stable {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
}

export interface CreateStableInput {
  name: string;
  owner_id: string;
}
