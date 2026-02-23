/**
 * @module imports/tests
 * @description Unit tests for imports parsing logic
 * @safety GREEN
 */

import { describe, expect, it } from 'vitest';
import {
  parseLine,
  parseServicesFromText,
  validateImportJobInput,
  hasLowConfidenceCandidates,
  hasAbsurdPrices,
  MAX_REASONABLE_PRICE_CENTS,
} from '../domain/imports.logic';

describe('parseLine', () => {
  describe('price parsing', () => {
    it('parses EUR price with symbol after', () => {
      const result = parseLine('Full Board 1200€');
      expect(result).not.toBeNull();
      expect(result?.price).toBe(1200);
      expect(result?.currency).toBe('€');
      expect(result?.name).toBe('Full Board');
    });

    it('parses EUR price with symbol before', () => {
      const result = parseLine('€ 450 Half Board');
      expect(result).not.toBeNull();
      expect(result?.price).toBe(450);
      expect(result?.currency).toBe('€');
    });

    it('parses CHF price', () => {
      const result = parseLine('Training Session CHF 85');
      expect(result).not.toBeNull();
      expect(result?.price).toBe(85);
      expect(result?.currency).toBe('CHF');
    });

    it('parses USD price', () => {
      const result = parseLine('Lesson $75');
      expect(result).not.toBeNull();
      expect(result?.price).toBe(75);
      expect(result?.currency).toBe('$');
    });

    it('parses decimal prices with comma', () => {
      const result = parseLine('Grooming 25,50€');
      expect(result).not.toBeNull();
      expect(result?.price).toBe(25.5);
    });

    it('parses decimal prices with period', () => {
      const result = parseLine('Grooming 25.50€');
      expect(result).not.toBeNull();
      expect(result?.price).toBe(25.5);
    });

    it('parses European format with thousands separator (1.200,50€)', () => {
      const result = parseLine('Premium Board 1.200,50€');
      expect(result).not.toBeNull();
      expect(result?.price).toBe(1200.5);
    });

    it('parses US format with thousands separator ($1,200.50)', () => {
      const result = parseLine('Premium Board $1,200.50');
      expect(result).not.toBeNull();
      expect(result?.price).toBe(1200.5);
    });

    it('rejects bare numbers without currency symbol', () => {
      const result = parseLine('Some Service 1200');
      expect(result).toBeNull();
    });

    it('rejects numbers that look like dates or IDs', () => {
      const result = parseLine('Invoice 2024-01-15');
      expect(result).toBeNull();
    });
  });

  describe('absurd price handling', () => {
    it('parses absurd prices but with low confidence', () => {
      const result = parseLine('Luxury Service €500000');
      expect(result).not.toBeNull();
      expect(result?.price).toBe(500000);
      expect(result?.confidence).toBeLessThan(0.5);
    });

    it('adds warning note for absurd prices', () => {
      const text = 'Expensive Thing €150000';
      const results = parseServicesFromText(text);
      expect(results[0].notes).toContain('WARNING');
      expect(results[0].notes).toContain('100,000');
    });
  });

  describe('billing unit parsing', () => {
    it('detects monthly billing', () => {
      const result = parseLine('Box Monthly 800€ per month');
      expect(result?.billingUnit).toBe('monthly');
    });

    it('detects German monthly billing', () => {
      const result = parseLine('Boxenmiete 800€ pro Monat');
      expect(result?.billingUnit).toBe('monthly');
    });

    it('detects per session billing', () => {
      const result = parseLine('Riding Lesson 75€ per session');
      expect(result?.billingUnit).toBe('per_session');
    });

    it('detects per lesson billing', () => {
      const result = parseLine('Dressage Training 95€/lesson');
      expect(result?.billingUnit).toBe('per_session');
    });

    it('defaults to one_time when no billing pattern found', () => {
      const result = parseLine('Saddle Cleaning 45€');
      expect(result?.billingUnit).toBe('one_time');
    });
  });

  describe('confidence scoring', () => {
    it('gives high confidence to well-formed services', () => {
      const result = parseLine('Box Rental 500€');
      expect(result?.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('reduces confidence for very long names', () => {
      const result = parseLine(
        'This is an extremely long service name that goes on and on and on €100'
      );
      expect(result?.confidence).toBeLessThan(0.8);
    });

    it('reduces confidence for very low prices', () => {
      const result = parseLine('Service 0.50€');
      expect(result?.confidence).toBeLessThan(0.7);
    });

    it('reduces confidence for names not starting with letter', () => {
      const result = parseLine('123 Service €50');
      expect(result?.confidence).toBeLessThan(0.8);
    });
  });

  describe('edge cases', () => {
    it('returns null for lines without price', () => {
      const result = parseLine('Just some text without a price');
      expect(result).toBeNull();
    });

    it('returns null for very short lines', () => {
      const result = parseLine('Hi');
      expect(result).toBeNull();
    });

    it('returns null for empty lines', () => {
      const result = parseLine('');
      expect(result).toBeNull();
    });

    it('returns null for whitespace-only lines', () => {
      const result = parseLine('   ');
      expect(result).toBeNull();
    });
  });
});

describe('parseServicesFromText', () => {
  it('parses multiple services from text', () => {
    const text = `
      Full Board 1200€ per month
      Half Board 800€ monthly
      Training Session 75€
      Box Rental CHF 600 per month
    `;

    const results = parseServicesFromText(text);
    expect(results).toHaveLength(4);
  });

  it('converts prices to cents', () => {
    const text = 'Service 45.99€';
    const results = parseServicesFromText(text);
    expect(results[0].price_cents).toBe(4599);
  });

  it('removes duplicates based on normalized name', () => {
    const text = `
      Full Board 1200€
      Full board 1200€
      FULL BOARD 1200€
    `;

    const results = parseServicesFromText(text);
    expect(results).toHaveLength(1);
  });

  it('preserves original case in name', () => {
    const text = 'Full Board Package 1200€';
    const results = parseServicesFromText(text);
    expect(results[0].name).toBe('Full Board Package');
  });

  it('adds notes with currency info', () => {
    const text = 'Box Rental CHF 800';
    const results = parseServicesFromText(text);
    expect(results[0].notes).toContain('CHF');
  });

  it('handles empty text', () => {
    const results = parseServicesFromText('');
    expect(results).toHaveLength(0);
  });

  it('handles text with no valid services', () => {
    const text = `
      This is just some text
      Without any prices
      Or services
    `;
    const results = parseServicesFromText(text);
    expect(results).toHaveLength(0);
  });
});

describe('validateImportJobInput', () => {
  it('returns no errors for valid input', () => {
    const errors = validateImportJobInput('stable-123', '/path/to/file.pdf');
    expect(errors).toHaveLength(0);
  });

  it('returns error for empty stable ID', () => {
    const errors = validateImportJobInput('', '/path/to/file.pdf');
    expect(errors).toContain('Stable ID is required');
  });

  it('returns error for whitespace stable ID', () => {
    const errors = validateImportJobInput('   ', '/path/to/file.pdf');
    expect(errors).toContain('Stable ID is required');
  });

  it('returns error for empty file path', () => {
    const errors = validateImportJobInput('stable-123', '');
    expect(errors).toContain('File path is required');
  });

  it('returns multiple errors when both inputs invalid', () => {
    const errors = validateImportJobInput('', '');
    expect(errors).toHaveLength(2);
  });
});

describe('hasLowConfidenceCandidates', () => {
  it('returns false when all candidates have high confidence', () => {
    const candidates = [
      { name: 'A', price_cents: 100, billing_unit: 'one_time' as const, notes: null, confidence: 0.8 },
      { name: 'B', price_cents: 200, billing_unit: 'monthly' as const, notes: null, confidence: 0.9 },
    ];
    expect(hasLowConfidenceCandidates(candidates)).toBe(false);
  });

  it('returns true when any candidate has low confidence', () => {
    const candidates = [
      { name: 'A', price_cents: 100, billing_unit: 'one_time' as const, notes: null, confidence: 0.8 },
      { name: 'B', price_cents: 200, billing_unit: 'monthly' as const, notes: null, confidence: 0.5 },
    ];
    expect(hasLowConfidenceCandidates(candidates)).toBe(true);
  });

  it('returns false for empty array', () => {
    expect(hasLowConfidenceCandidates([])).toBe(false);
  });

  it('considers exactly 0.7 as not low confidence', () => {
    const candidates = [
      { name: 'A', price_cents: 100, billing_unit: 'one_time' as const, notes: null, confidence: 0.7 },
    ];
    expect(hasLowConfidenceCandidates(candidates)).toBe(false);
  });
});

describe('hasAbsurdPrices', () => {
  it('returns false for reasonable prices', () => {
    const candidates = [
      { name: 'A', price_cents: 100000, billing_unit: 'one_time' as const, notes: null, confidence: 0.8 }, // 1000 CHF
      { name: 'B', price_cents: 500000, billing_unit: 'monthly' as const, notes: null, confidence: 0.8 }, // 5000 CHF
    ];
    expect(hasAbsurdPrices(candidates)).toBe(false);
  });

  it('returns true for prices over 100k', () => {
    const candidates = [
      { name: 'A', price_cents: 100000, billing_unit: 'one_time' as const, notes: null, confidence: 0.8 },
      { name: 'B', price_cents: MAX_REASONABLE_PRICE_CENTS + 1, billing_unit: 'monthly' as const, notes: null, confidence: 0.3 },
    ];
    expect(hasAbsurdPrices(candidates)).toBe(true);
  });

  it('returns false for empty array', () => {
    expect(hasAbsurdPrices([])).toBe(false);
  });

  it('considers exactly MAX_REASONABLE_PRICE_CENTS as not absurd', () => {
    const candidates = [
      { name: 'A', price_cents: MAX_REASONABLE_PRICE_CENTS, billing_unit: 'one_time' as const, notes: null, confidence: 0.5 },
    ];
    expect(hasAbsurdPrices(candidates)).toBe(false);
  });
});
