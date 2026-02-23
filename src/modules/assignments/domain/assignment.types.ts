/**
 * @module assignments/domain
 * @description Type definitions for service assignments
 * @safety YELLOW
 */

export interface Assignment {
  id: string;
  stable_id: string;
  client_id: string;
  horse_id: string | null;
  service_id: string;
  quantity: number;
  start_date: Date;
  end_date: Date | null;
  active: boolean;
  created_at: Date;
}

export interface AssignmentWithDetails extends Assignment {
  client_name?: string;
  horse_name?: string | null;
  service_name?: string;
  service_price_cents?: number;
  service_billing_unit?: 'one_time' | 'monthly' | 'per_session';
}

export interface CreateAssignmentInput {
  stable_id: string;
  client_id: string;
  horse_id?: string | null;
  service_id: string;
  quantity?: number;
  start_date: Date;
  end_date?: Date | null;
  active?: boolean;
}
