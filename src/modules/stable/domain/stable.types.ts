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
  logo_url?: string;
  invoice_default_terms?: string;
  bank_name?: string;
  account_number?: string;
  iban?: string;
  owner_telegram_chat_id?: string;
}

export interface CreateStableInput {
  name: string;
  owner_id: string;
}

export interface UpdateStableBrandingInput {
  name?: string;
  logo_url?: string;
  invoice_default_terms?: string;
  bank_name?: string;
  account_number?: string;
  iban?: string;
}
