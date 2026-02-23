/**
 * @module imports/ui
 * @description PDF upload component for importing services
 * @safety GREEN
 */

'use client';

import { useState, useCallback } from 'react';
import type { ImportJob, ParsedServicesResult } from '../domain/imports.types';
import { pdfTextExtractService } from '../services/pdfTextExtract.service';
import { aiParseService } from '../services/aiParse.service';
import { importsService } from '../services/imports.service';

interface ImportServicesFromPdfProps {
  stableId: string;
  onImportComplete: (job: ImportJob, result: ParsedServicesResult) => void;
}

type UploadState = 'idle' | 'uploading' | 'extracting' | 'parsing' | 'complete' | 'error';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function ImportServicesFromPdf({ stableId, onImportComplete }: ImportServicesFromPdfProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setFileName(file.name);
    setError(null);

    try {
      // Step 1: Create import job record
      setState('uploading');
      const jobResult = await importsService.createJob({
        stable_id: stableId,
        type: 'service_catalog_pdf',
        file_path: file.name, // In production, upload to storage and use URL
      });

      if (!jobResult.success || !jobResult.job) {
        throw new Error(jobResult.error || 'Failed to create import job');
      }

      const job = jobResult.job;

      // Step 2: Extract text from PDF
      setState('extracting');
      const buffer = await file.arrayBuffer();
      const extractResult = await pdfTextExtractService.extractText(buffer);

      if (!extractResult.success || !extractResult.text) {
        await importsService.updateJobStatus(job.id, 'failed', extractResult.error);
        throw new Error(extractResult.error || 'PDF text extraction failed');
      }

      // Step 3: Parse services from text
      setState('parsing');
      const parseResult = await aiParseService.parseServices(extractResult.text);

      if (!parseResult.success || !parseResult.candidates) {
        await importsService.updateJobStatus(job.id, 'failed', parseResult.error);
        throw new Error(parseResult.error || 'Service parsing failed');
      }

      // Step 4: Save parsed result
      const parsedResult: ParsedServicesResult = {
        candidates: parseResult.candidates,
        raw_text: extractResult.text,
        parsed_at: new Date().toISOString(),
      };

      const updateResult = await importsService.updateJobResult(job.id, parsedResult);

      if (!updateResult.success || !updateResult.job) {
        throw new Error(updateResult.error || 'Failed to save parsed result');
      }

      setState('complete');
      onImportComplete(updateResult.job, parsedResult);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Import failed');
    }

    // Reset file input
    event.target.value = '';
  }, [stableId, onImportComplete]);

  const stateMessages: Record<UploadState, string> = {
    idle: 'Select a PDF file to import services',
    uploading: 'Creating import job...',
    extracting: 'Extracting text from PDF...',
    parsing: 'Parsing services from text...',
    complete: 'Import complete! Review the extracted services below.',
    error: 'Import failed',
  };

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h2 className="text-lg font-semibold mb-4">Import Services from PDF</h2>

      <div className="mb-4">
        <label
          htmlFor="pdf-upload"
          className={`
            flex flex-col items-center justify-center w-full h-32
            border-2 border-dashed rounded-lg cursor-pointer
            ${state === 'idle' ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50' : 'border-gray-200 bg-gray-50'}
            ${state === 'error' ? 'border-red-300 bg-red-50' : ''}
            ${state === 'complete' ? 'border-green-300 bg-green-50' : ''}
          `}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {state === 'idle' && (
              <>
                <svg className="w-8 h-8 mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PDF files only (max {MAX_FILE_SIZE_MB}MB)</p>
              </>
            )}
            {(state === 'uploading' || state === 'extracting' || state === 'parsing') && (
              <>
                <svg className="animate-spin w-8 h-8 mb-2 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm text-blue-600">{stateMessages[state]}</p>
                {fileName && <p className="text-xs text-gray-500 mt-1">{fileName}</p>}
              </>
            )}
            {state === 'complete' && (
              <>
                <svg className="w-8 h-8 mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-600">{stateMessages[state]}</p>
              </>
            )}
            {state === 'error' && (
              <>
                <svg className="w-8 h-8 mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </>
            )}
          </div>
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileSelect}
            disabled={state !== 'idle' && state !== 'error' && state !== 'complete'}
          />
        </label>
      </div>

      {state === 'error' && (
        <button
          onClick={() => { setState('idle'); setError(null); }}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Try again
        </button>
      )}

      {state === 'complete' && (
        <button
          onClick={() => { setState('idle'); setFileName(null); }}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Import another file
        </button>
      )}
    </div>
  );
}
