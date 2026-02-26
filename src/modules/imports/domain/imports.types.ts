/**
 * @module imports/domain
 * @description Type definitions for PDF import jobs
 * @safety YELLOW
 */

import type { BillingUnit } from '@/modules/services/domain/service.types';

export type ImportJobStatus = 'uploaded' | 'parsed' | 'needs_review' | 'completed' | 'failed';
export type ImportJobType = 'service_catalog_pdf';

export interface ImportJob {
  id: string;
  stable_id: string;
  type: ImportJobType;
  file_path: string;
  status: ImportJobStatus;
  result_json: ParsedServicesResult | null;
  error: string | null;
  created_at: Date;
}

export interface CreateImportJobInput {
  stable_id: string;
  type: ImportJobType;
  file_path: string;
}

export interface ParsedServiceCandidate {
  name: string;
  price_cents: number;
  billing_unit: BillingUnit;
  notes: string | null;
  confidence: number; // 0.0 - 1.0
  tax_rate: number | null; // 0.081 for 8.1%, 0.026 for 2.6%, etc.
  duration_text: string | null; // Original duration text (e.g., "al mese", "pro Monat")
}

export interface ParsedServicesResult {
  candidates: ParsedServiceCandidate[];
  raw_text: string;
  parsed_at: string;
}

export interface PdfExtractionResult {
  success: boolean;
  text?: string;
  needsOcr?: boolean;
  error?: string;
}
