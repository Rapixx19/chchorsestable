/**
 * @module imports/services
 * @description PDF text extraction service
 * @safety RED
 */

import type { PdfExtractionResult } from '../domain/imports.types';

export interface PdfTextExtractService {
  extractText(fileBuffer: ArrayBuffer): Promise<PdfExtractionResult>;
}

class BrowserPdfTextExtractService implements PdfTextExtractService {
  async extractText(fileBuffer: ArrayBuffer): Promise<PdfExtractionResult> {
    try {
      // Dynamic import for pdf-parse (works in Node.js context)
      // In browser, we'll use a simple approach
      const uint8Array = new Uint8Array(fileBuffer);

      // Check if it's a valid PDF by looking at header
      const header = String.fromCharCode(...uint8Array.slice(0, 5));
      if (header !== '%PDF-') {
        return { success: false, error: 'Invalid PDF file' };
      }

      // Try to extract text using pdf-parse if available
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse');
        const buffer = Buffer.from(fileBuffer);
        const data = await pdfParse(buffer);

        const text = data.text?.trim() || '';

        if (text.length < 20) {
          return {
            success: false,
            needsOcr: true,
            error: 'No readable text found — PDF may be scanned',
          };
        }

        return { success: true, text };
      } catch {
        // pdf-parse not available or failed
        return {
          success: false,
          error: 'PDF text extraction failed. Please ensure the PDF contains selectable text.',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during PDF extraction',
      };
    }
  }
}

export const pdfTextExtractService: PdfTextExtractService = new BrowserPdfTextExtractService();
