/**
 * @module imports/domain
 * @description Pure parsing logic for service extraction from PDF text
 * @safety YELLOW
 */

import type { ParsedServiceCandidate } from './imports.types';
import type { BillingUnit } from '@/modules/services/domain/service.types';

interface ParsedLine {
  name: string;
  price: number;
  currency: string;
  billingUnit: BillingUnit;
  confidence: number;
}

// Price limits (in cents)
const MAX_REASONABLE_PRICE_CENTS = 10_000_000; // 100,000 CHF/EUR/$

// Currency patterns - ONLY match when explicit currency symbol is present
// Never assume currency from bare numbers
// Pattern explanation: matches numbers with optional thousands separators and decimals
const PRICE_NUMBER = '\\d+(?:[.,]\\d{3})*(?:[.,]\\d{1,2})?|\\d+';

const CURRENCY_PATTERNS = [
  // EUR patterns
  { symbol: '€', regex: new RegExp(`(${PRICE_NUMBER})\\s*€`) },
  { symbol: '€', regex: new RegExp(`€\\s*(${PRICE_NUMBER})`) },
  // CHF patterns
  { symbol: 'CHF', regex: new RegExp(`(${PRICE_NUMBER})\\s*CHF`, 'i') },
  { symbol: 'CHF', regex: new RegExp(`CHF\\s*(${PRICE_NUMBER})`, 'i') },
  // USD patterns
  { symbol: '$', regex: new RegExp(`\\$\\s*(${PRICE_NUMBER})`) },
  { symbol: '$', regex: new RegExp(`(${PRICE_NUMBER})\\s*\\$`) },
];

// Billing unit patterns
const BILLING_UNIT_PATTERNS: { pattern: RegExp; unit: BillingUnit }[] = [
  { pattern: /\/month|per month|monthly|monat|pro monat/i, unit: 'monthly' },
  { pattern: /\/session|per session|\/lesson|per lesson|pro stunde/i, unit: 'per_session' },
];

/**
 * Normalize price string handling European (1.234,56) and US (1,234.56) formats
 */
function normalizePriceString(priceStr: string): number | null {
  // Remove whitespace
  const cleaned = priceStr.replace(/\s/g, '');

  // Detect format by looking at the last separator
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  let normalized: string;

  if (lastComma > lastDot) {
    // European format: 1.234,56 → comma is decimal separator
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // US format: 1,234.56 → dot is decimal separator
    normalized = cleaned.replace(/,/g, '');
  } else if (lastComma !== -1) {
    // Only comma present: could be 1,50 (European decimal) or 1,000 (US thousands)
    // If 1-2 digits after comma, treat as decimal
    const afterComma = cleaned.split(',')[1];
    if (afterComma && afterComma.length <= 2) {
      normalized = cleaned.replace(',', '.');
    } else {
      normalized = cleaned.replace(',', '');
    }
  } else if (lastDot !== -1) {
    // Only dot present: could be 1.50 (decimal) or 1.000 (European thousands)
    // If 1-2 digits after dot, treat as decimal
    const afterDot = cleaned.split('.')[1];
    if (afterDot && afterDot.length <= 2) {
      normalized = cleaned;
    } else {
      normalized = cleaned.replace('.', '');
    }
  } else {
    // No separators
    normalized = cleaned;
  }

  const price = parseFloat(normalized);
  return isNaN(price) ? null : price;
}

function parsePrice(text: string): { price: number; currency: string } | null {
  for (const { symbol, regex } of CURRENCY_PATTERNS) {
    const match = text.match(regex);
    if (match) {
      const price = normalizePriceString(match[1]);
      if (price !== null && price > 0) {
        return { price, currency: symbol };
      }
    }
  }
  return null;
}

function parseBillingUnit(text: string): BillingUnit {
  for (const { pattern, unit } of BILLING_UNIT_PATTERNS) {
    if (pattern.test(text)) {
      return unit;
    }
  }
  return 'one_time';
}

function extractServiceName(line: string, priceMatch: string): string {
  // Remove price portion and clean up
  let name = line.replace(priceMatch, '').trim();
  // Remove common separators at the end
  name = name.replace(/[-–—:]+$/, '').trim();
  // Remove billing unit text
  name = name.replace(/\/month|per month|monthly|monat|pro monat/gi, '').trim();
  name = name.replace(/\/session|per session|\/lesson|per lesson|pro stunde/gi, '').trim();
  return name;
}

export function parseLine(line: string): ParsedLine | null {
  const trimmed = line.trim();
  if (trimmed.length < 3) return null;

  const priceResult = parsePrice(trimmed);
  if (!priceResult) return null;

  const billingUnit = parseBillingUnit(trimmed);

  // Find the full price match to extract service name
  let priceMatchStr = '';
  for (const { regex } of CURRENCY_PATTERNS) {
    const match = trimmed.match(regex);
    if (match) {
      priceMatchStr = match[0];
      break;
    }
  }

  const name = extractServiceName(trimmed, priceMatchStr);
  if (name.length < 2) return null;

  const priceCents = Math.round(priceResult.price * 100);

  // Calculate confidence based on how well-formed the line is
  let confidence = 0.8;
  if (name.length > 50) confidence -= 0.2; // Long names are suspicious
  if (priceResult.price < 1) confidence -= 0.3; // Very low prices
  if (priceResult.price > 5000) confidence -= 0.1; // High prices get slight penalty
  if (priceCents > MAX_REASONABLE_PRICE_CENTS) confidence -= 0.5; // Absurd prices get major penalty
  if (!/^[A-Za-zÀ-ÿ]/.test(name)) confidence -= 0.2; // Doesn't start with letter

  return {
    name,
    price: priceResult.price,
    currency: priceResult.currency,
    billingUnit,
    confidence: Math.max(0.1, Math.min(1.0, confidence)),
  };
}

export function parseServicesFromText(text: string): ParsedServiceCandidate[] {
  const lines = text.split('\n');
  const candidates: ParsedServiceCandidate[] = [];
  const seenNames = new Set<string>();

  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) continue;

    // Normalize name for duplicate detection
    const normalizedName = parsed.name.toLowerCase().trim();
    if (seenNames.has(normalizedName)) continue;
    seenNames.add(normalizedName);

    const priceCents = Math.round(parsed.price * 100);

    // Build notes with warnings
    let notes = `Extracted from PDF (${parsed.currency})`;
    if (priceCents > MAX_REASONABLE_PRICE_CENTS) {
      notes += ' — WARNING: Price exceeds 100,000, may be parsing error';
    }

    candidates.push({
      name: parsed.name,
      price_cents: priceCents,
      billing_unit: parsed.billingUnit,
      notes,
      confidence: parsed.confidence,
    });
  }

  return candidates;
}

export function validateImportJobInput(stableId: string, filePath: string): string[] {
  const errors: string[] = [];

  if (!stableId || stableId.trim() === '') {
    errors.push('Stable ID is required');
  }

  if (!filePath || filePath.trim() === '') {
    errors.push('File path is required');
  }

  return errors;
}

export function hasLowConfidenceCandidates(candidates: ParsedServiceCandidate[]): boolean {
  return candidates.some((c) => c.confidence < 0.7);
}

export function hasAbsurdPrices(candidates: ParsedServiceCandidate[]): boolean {
  return candidates.some((c) => c.price_cents > MAX_REASONABLE_PRICE_CENTS);
}

export { MAX_REASONABLE_PRICE_CENTS };
