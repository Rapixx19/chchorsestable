/**
 * @module services/ui
 * @description Drawer for bulk CSV service import with preview and progress
 * @safety GREEN
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { BillingUnit } from '../domain/service.types';
import type { RowError, ValidRow } from '../services/import.service';
import { importService } from '../services/import.service';

interface BulkUploadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type DrawerState = 'upload' | 'preview' | 'importing' | 'complete';

interface ParsedData {
  validRows: ValidRow[];
  errors: RowError[];
}

const BILLING_UNIT_LABELS: Record<BillingUnit, string> = {
  one_time: 'One-time',
  monthly: 'Monthly',
  per_session: 'Per Session',
};

function formatPrice(cents: number): string {
  return `CHF ${(cents / 100).toFixed(2)}`;
}

export function BulkUploadDrawer({ isOpen, onClose, onSuccess }: BulkUploadDrawerProps) {
  const [state, setState] = useState<DrawerState>('upload');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<{ imported: number; errors: RowError[] } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setState('upload');
    setParsedData(null);
    setImportProgress({ current: 0, total: 0 });
    setImportResult(null);
    setError(null);
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const processFile = useCallback(async (file: File) => {
    setError(null);

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a CSV file');
      return;
    }

    try {
      const content = await file.text();
      const rows = importService.parseCSV(content);

      if (rows.length === 0) {
        setError('No valid rows found. Ensure CSV has headers: name, price, unit');
        return;
      }

      const { validRows, errors } = importService.validateRows(rows);
      setParsedData({ validRows, errors });
      setState('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleImport = useCallback(async () => {
    if (!parsedData || parsedData.validRows.length === 0) return;

    setState('importing');
    setImportProgress({ current: 0, total: parsedData.validRows.length });

    try {
      // Create FormData with CSV content
      const csvContent = generateCSV(parsedData.validRows);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'import.csv', { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/services/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setImportResult({
        imported: result.imported,
        errors: [...parsedData.errors, ...(result.errors || [])],
      });
      setState('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setState('preview');
    }
  }, [parsedData]);

  const handleComplete = useCallback(() => {
    onSuccess();
    handleClose();
  }, [onSuccess, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg h-full bg-zinc-950 border-l border-white/10 p-8 shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload className="text-stable-gold" size={20} />
            Bulk Import Services
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-v-card">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Upload State */}
        {state === 'upload' && (
          <UploadZone
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            fileInputRef={fileInputRef}
          />
        )}

        {/* Preview State */}
        {state === 'preview' && parsedData && (
          <PreviewTable
            validRows={parsedData.validRows}
            errors={parsedData.errors}
            onImport={handleImport}
            onCancel={resetState}
          />
        )}

        {/* Importing State */}
        {state === 'importing' && (
          <ImportingProgress
            current={importProgress.current}
            total={importProgress.total}
          />
        )}

        {/* Complete State */}
        {state === 'complete' && importResult && (
          <ResultSummary
            imported={importResult.imported}
            errors={importResult.errors}
            onDone={handleComplete}
            onImportMore={resetState}
          />
        )}
      </div>
    </div>
  );
}

interface UploadZoneProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

function UploadZone({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  fileInputRef,
}: UploadZoneProps) {
  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          border-2 border-dashed rounded-v-card p-8 text-center transition-all cursor-pointer
          ${isDragging
            ? 'border-stable-gold bg-stable-gold/10'
            : 'border-white/10 hover:border-stable-gold/30 hover:bg-white/5'
          }
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <FileText className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
        <p className="text-white font-medium mb-2">
          Drop your CSV file here
        </p>
        <p className="text-zinc-500 text-sm mb-4">
          or click to browse
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFileSelect}
          className="hidden"
        />
      </div>

      {/* CSV Format Help */}
      <div className="glass-card p-4 rounded-v-card">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Expected CSV Format</h3>
        <div className="bg-zinc-900/50 rounded-lg p-3 font-mono text-xs text-zinc-400 overflow-x-auto">
          <div className="text-stable-gold">name,price,unit,description</div>
          <div>Bereiter,650,monthly,Full training program</div>
          <div>Einzelstunde,75,per_session,One-on-one lesson</div>
          <div>Sattelanpassung,120,one_time,Saddle fitting</div>
        </div>
        <ul className="mt-3 space-y-1 text-xs text-zinc-500">
          <li>Required: <span className="text-zinc-400">name</span>, <span className="text-zinc-400">price</span></li>
          <li>Optional: <span className="text-zinc-400">unit</span> (monthly, per_session, one_time)</li>
          <li>Optional: <span className="text-zinc-400">description</span></li>
        </ul>
      </div>
    </div>
  );
}

interface PreviewTableProps {
  validRows: ValidRow[];
  errors: RowError[];
  onImport: () => void;
  onCancel: () => void;
}

function PreviewTable({ validRows, errors, onImport, onCancel }: PreviewTableProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex gap-4">
        <div className="flex-1 glass-card p-4 rounded-v-card">
          <div className="text-2xl font-bold text-stable-gold">{validRows.length}</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Ready to import</div>
        </div>
        {errors.length > 0 && (
          <div className="flex-1 glass-card p-4 rounded-v-card">
            <div className="text-2xl font-bold text-red-400">{errors.length}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Errors</div>
          </div>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="glass-card p-4 rounded-v-card max-h-32 overflow-y-auto">
          <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
            <AlertCircle size={14} />
            Validation Errors
          </h4>
          <ul className="space-y-1 text-xs">
            {errors.map((err, i) => (
              <li key={i} className="text-red-300">
                Row {err.row}: {err.field} - {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Valid Rows Preview */}
      <div className="glass-card rounded-v-card overflow-hidden">
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-800/50 sticky top-0">
              <tr className="text-left text-zinc-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3">Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {validRows.map((row, i) => (
                <tr key={i} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-white">{row.name}</td>
                  <td className="px-4 py-3 text-right text-stable-gold font-finance">
                    {formatPrice(row.price_cents)}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {BILLING_UNIT_LABELS[row.billing_unit]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-white/10 rounded-v-card text-zinc-400 hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onImport}
          disabled={validRows.length === 0}
          className="flex-1 px-4 py-2.5 bg-stable-gold text-black font-semibold rounded-v-card hover:bg-stable-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Import {validRows.length} Service{validRows.length !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}

interface ImportingProgressProps {
  current: number;
  total: number;
}

function ImportingProgress({ current, total }: ImportingProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-12 h-12 text-stable-gold animate-spin mb-6" />
      <h3 className="text-lg font-semibold text-white mb-2">Importing Services...</h3>
      <p className="text-zinc-500 text-sm mb-6">
        {current > 0 ? `${current} of ${total} imported` : 'Processing your file...'}
      </p>
      {total > 0 && (
        <div className="w-full max-w-xs h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-stable-gold transition-all duration-300"
            style={{ width: `${Math.max(10, (current / total) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface ResultSummaryProps {
  imported: number;
  errors: RowError[];
  onDone: () => void;
  onImportMore: () => void;
}

function ResultSummary({ imported, errors, onDone, onImportMore }: ResultSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="text-center py-6">
        <CheckCircle2 className="w-16 h-16 text-stable-emerald mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">
          {imported} Service{imported !== 1 ? 's' : ''} Imported
        </h3>
        <p className="text-zinc-400">
          Your services have been added to the catalog.
        </p>
      </div>

      {/* Errors Summary */}
      {errors.length > 0 && (
        <div className="glass-card p-4 rounded-v-card">
          <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
            <AlertCircle size={14} />
            {errors.length} row{errors.length !== 1 ? 's' : ''} skipped due to errors
          </h4>
          <ul className="space-y-1 text-xs max-h-32 overflow-y-auto">
            {errors.map((err, i) => (
              <li key={i} className="text-amber-300">
                Row {err.row}: {err.field} - {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onImportMore}
          className="flex-1 px-4 py-2.5 border border-white/10 rounded-v-card text-zinc-400 hover:bg-white/5 transition-colors"
        >
          Import More
        </button>
        <button
          onClick={onDone}
          className="flex-1 px-4 py-2.5 bg-stable-gold text-black font-semibold rounded-v-card hover:bg-stable-gold/90 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

/**
 * Generate CSV content from valid rows for re-upload
 */
function generateCSV(rows: ValidRow[]): string {
  const header = 'name,price,unit,description';
  const lines = rows.map(row => {
    const price = (row.price_cents / 100).toString();
    const description = row.description ? `"${row.description.replace(/"/g, '""')}"` : '';
    return `"${row.name.replace(/"/g, '""')}",${price},${row.billing_unit},${description}`;
  });
  return [header, ...lines].join('\n');
}
