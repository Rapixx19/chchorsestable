/**
 * @module invoices/domain
 * @description Type definitions for invoice preview
 * @safety YELLOW
 */

export interface InvoicePreviewLine {
  description: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  horse_name?: string;
  service_name: string;
}

export interface InvoicePreviewStable {
  id: string;
  name: string;
  logo_url?: string;
  address?: string;
  vat_number?: string;
  bank_name?: string;
  account_number?: string;
  iban?: string;
  swift_bic?: string;
  invoice_default_terms?: string;
  branding_template_locked?: boolean;
}

export interface InvoicePreviewClient {
  id: string;
  name: string;
  email?: string;
  address?: string;
}

export interface InvoicePreviewData {
  client: InvoicePreviewClient;
  stable: InvoicePreviewStable;
  lines: InvoicePreviewLine[];
  subtotal_cents: number;
  total_cents: number;
  generated_at: string;
}

export interface InvoicePreviewResult {
  success: boolean;
  error?: string;
  preview?: InvoicePreviewData;
}
