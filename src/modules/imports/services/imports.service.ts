/**
 * @module imports/services
 * @description Import jobs service for IO operations
 * @safety RED
 */

import { supabase } from '@/infra/supabase/client';
import type { ImportJob, CreateImportJobInput, ParsedServicesResult } from '../domain/imports.types';

export interface ImportJobResult {
  success: boolean;
  error?: string;
  job?: ImportJob;
}

export interface ImportJobsResult {
  success: boolean;
  error?: string;
  jobs?: ImportJob[];
}

function mapImportJob(data: Record<string, unknown>): ImportJob {
  return {
    id: data.id as string,
    stable_id: data.stable_id as string,
    type: data.type as ImportJob['type'],
    file_path: data.file_path as string,
    status: data.status as ImportJob['status'],
    result_json: data.result_json as ParsedServicesResult | null,
    error: data.error as string | null,
    created_at: new Date(data.created_at as string),
  };
}

export interface ImportsService {
  createJob(input: CreateImportJobInput): Promise<ImportJobResult>;
  getJobById(id: string): Promise<ImportJobResult>;
  getJobsByStable(stableId: string): Promise<ImportJobsResult>;
  updateJobStatus(id: string, status: ImportJob['status'], error?: string): Promise<ImportJobResult>;
  updateJobResult(id: string, result: ParsedServicesResult): Promise<ImportJobResult>;
}

class SupabaseImportsService implements ImportsService {
  async createJob(input: CreateImportJobInput): Promise<ImportJobResult> {
    const { data, error } = await supabase
      .from('import_jobs')
      .insert({
        stable_id: input.stable_id,
        type: input.type,
        file_path: input.file_path,
        status: 'uploaded',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, job: mapImportJob(data) };
  }

  async getJobById(id: string): Promise<ImportJobResult> {
    const { data, error } = await supabase
      .from('import_jobs')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, job: mapImportJob(data) };
  }

  async getJobsByStable(stableId: string): Promise<ImportJobsResult> {
    const { data, error } = await supabase
      .from('import_jobs')
      .select()
      .eq('stable_id', stableId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, jobs: data.map(mapImportJob) };
  }

  async updateJobStatus(id: string, status: ImportJob['status'], errorMsg?: string): Promise<ImportJobResult> {
    const updateData: Record<string, unknown> = { status };
    if (errorMsg) {
      updateData.error = errorMsg;
    }

    const { data, error } = await supabase
      .from('import_jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, job: mapImportJob(data) };
  }

  async updateJobResult(id: string, result: ParsedServicesResult): Promise<ImportJobResult> {
    const { data, error } = await supabase
      .from('import_jobs')
      .update({
        result_json: result,
        status: 'needs_review',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, job: mapImportJob(data) };
  }
}

export const importsService: ImportsService = new SupabaseImportsService();
