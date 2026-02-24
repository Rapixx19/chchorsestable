/**
 * @module services/services
 * @description CSV import service for bulk service catalog uploads
 * @safety RED
 */

import type { BillingUnit, CreateServiceInput } from '../domain/service.types';
import { serviceService } from './service.service';

export interface ParsedRow {
  row: number;
  name: string;
  price: string;
  unit: string;
  description: string;
}

export interface RowError {
  row: number;
  field: string;
  message: string;
}

export interface ValidRow {
  name: string;
  price_cents: number;
  billing_unit: BillingUnit;
  description: string | null;
}

export interface ValidationResult {
  validRows: ValidRow[];
  errors: RowError[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: RowError[];
}

const VALID_BILLING_UNITS: BillingUnit[] = ['monthly', 'per_session', 'one_time'];
const DEFAULT_BILLING_UNIT: BillingUnit = 'per_session';

/**
 * Parse CSV content into structured rows.
 * Expects headers: name, price, unit, description (description optional)
 */
export function parseCSV(content: string): ParsedRow[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return [];
  }

  // Parse header row
  const headerLine = lines[0].toLowerCase();
  const headers = parseCSVLine(headerLine);

  const nameIdx = headers.findIndex(h => h === 'name');
  const priceIdx = headers.findIndex(h => h === 'price');
  const unitIdx = headers.findIndex(h => h === 'unit');
  const descIdx = headers.findIndex(h => h === 'description');

  if (nameIdx === -1 || priceIdx === -1) {
    return [];
  }

  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);

    rows.push({
      row: i + 1,
      name: values[nameIdx]?.trim() ?? '',
      price: values[priceIdx]?.trim() ?? '',
      unit: unitIdx !== -1 ? values[unitIdx]?.trim() ?? '' : '',
      description: descIdx !== -1 ? values[descIdx]?.trim() ?? '' : '',
    });
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Validate parsed rows and convert to valid service inputs.
 */
export function validateRows(rows: ParsedRow[]): ValidationResult {
  const validRows: ValidRow[] = [];
  const errors: RowError[] = [];

  for (const row of rows) {
    let hasError = false;

    // Validate name
    if (!row.name || row.name.length < 2) {
      errors.push({
        row: row.row,
        field: 'name',
        message: 'Name is required and must be at least 2 characters',
      });
      hasError = true;
    }

    // Validate and convert price
    const priceValue = parsePrice(row.price);
    if (priceValue === null) {
      errors.push({
        row: row.row,
        field: 'price',
        message: 'Price must be a valid number',
      });
      hasError = true;
    }

    // Validate billing unit
    const normalizedUnit = row.unit.toLowerCase().replace(/[_-\s]/g, '_');
    let billingUnit: BillingUnit = DEFAULT_BILLING_UNIT;

    if (row.unit) {
      if (normalizedUnit === 'monthly' || normalizedUnit === 'month') {
        billingUnit = 'monthly';
      } else if (normalizedUnit === 'per_session' || normalizedUnit === 'session' || normalizedUnit === 'persession') {
        billingUnit = 'per_session';
      } else if (normalizedUnit === 'one_time' || normalizedUnit === 'onetime' || normalizedUnit === 'once') {
        billingUnit = 'one_time';
      } else if (!VALID_BILLING_UNITS.includes(normalizedUnit as BillingUnit)) {
        errors.push({
          row: row.row,
          field: 'unit',
          message: `Invalid unit "${row.unit}". Must be: monthly, per_session, or one_time`,
        });
        hasError = true;
      }
    }

    if (!hasError && priceValue !== null) {
      validRows.push({
        name: row.name,
        price_cents: priceValue,
        billing_unit: billingUnit,
        description: row.description || null,
      });
    }
  }

  return { validRows, errors };
}

/**
 * Parse price string to cents.
 * Accepts: "650", "650.00", "6.50", "CHF 650"
 * Multiplies by 100 to convert to cents
 */
function parsePrice(priceStr: string): number | null {
  if (!priceStr) return null;

  // Remove currency symbols and whitespace
  const cleaned = priceStr
    .replace(/[CHF€$£]/gi, '')
    .replace(/\s/g, '')
    .replace(/'/g, '') // Swiss thousand separator
    .replace(/,/g, '.'); // European decimal separator

  const value = parseFloat(cleaned);

  if (isNaN(value) || value < 0) {
    return null;
  }

  // Convert to cents (multiply by 100)
  return Math.round(value * 100);
}

/**
 * Import valid rows into the database.
 */
export async function importServices(
  validRows: ValidRow[],
  stableId: string
): Promise<ImportResult> {
  if (validRows.length === 0) {
    return { success: true, imported: 0, errors: [] };
  }

  const inputs: CreateServiceInput[] = validRows.map(row => ({
    stable_id: stableId,
    name: row.name,
    description: row.description,
    price_cents: row.price_cents,
    billing_unit: row.billing_unit,
  }));

  const result = await serviceService.bulkCreateServices(inputs);

  if (!result.success) {
    return {
      success: false,
      imported: 0,
      errors: [{
        row: 0,
        field: 'database',
        message: result.error || 'Failed to import services',
      }],
    };
  }

  return {
    success: true,
    imported: result.services?.length || 0,
    errors: [],
  };
}

export const importService = {
  parseCSV,
  validateRows,
  importServices,
};
