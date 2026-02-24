/**
 * @module invoices/ui
 * @description Invoice dispatch controls for finalization, PDF download, and Telegram sending
 * @safety RED
 */

'use client';

import { useState } from 'react';

type InvoiceStatus = 'draft' | 'approved' | 'sent' | 'paid' | 'overdue' | 'cancelled';

interface DispatchControlsProps {
  invoiceId: string;
  status: InvoiceStatus;
  isLinked: boolean;
  onStatusChange?: () => void;
}

export default function DispatchControls({
  invoiceId,
  status,
  isLinked,
  onStatusChange,
}: DispatchControlsProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDraft = status === 'draft';
  const isApproved = status === 'approved';
  const canSendTelegram = isApproved && isLinked;

  async function handleDownloadPdf() {
    setIsDownloading(true);
    setError(null);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleFinalize() {
    setIsApproving(true);
    setError(null);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/approve`, {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Finalization failed');
      }
      onStatusChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Finalization failed');
    } finally {
      setIsApproving(false);
    }
  }

  async function handleSendTelegram() {
    setIsSendingTelegram(true);
    setError(null);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send-telegram`, {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send via Telegram');
      }
      onStatusChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send via Telegram');
    } finally {
      setIsSendingTelegram(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {isDraft ? (
          <button
            onClick={handleFinalize}
            disabled={isApproving}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isApproving ? 'Finalizing...' : 'Finalize & Lock'}
          </button>
        ) : (
          <span className="px-3 py-1 text-sm bg-gray-200 text-gray-600 rounded">
            Locked
          </span>
        )}

        <button
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isDownloading ? 'Downloading...' : 'PDF'}
        </button>

        {canSendTelegram && (
          <button
            onClick={handleSendTelegram}
            disabled={isSendingTelegram}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSendingTelegram ? 'Sending...' : 'Telegram'}
          </button>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
