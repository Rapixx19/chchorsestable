/**
 * @module imports/services
 * @description AI parsing service interface with stub implementation
 * @safety RED
 */

import type { ParsedServiceCandidate } from '../domain/imports.types';
import { parseServicesFromText } from '../domain/imports.logic';

export interface AiParseResult {
  success: boolean;
  candidates?: ParsedServiceCandidate[];
  error?: string;
}

export interface AiParseService {
  parseServices(text: string): Promise<AiParseResult>;
}

/**
 * Stub implementation using heuristic parsing.
 * In production, replace with actual AI/LLM integration.
 */
class HeuristicParseService implements AiParseService {
  async parseServices(text: string): Promise<AiParseResult> {
    try {
      const candidates = parseServicesFromText(text);
      return { success: true, candidates };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Parsing failed',
      };
    }
  }
}

// Export singleton - swap implementation when AI is ready
export const aiParseService: AiParseService = new HeuristicParseService();
