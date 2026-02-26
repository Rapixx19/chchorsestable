/**
 * @module invoices/ui
 * @description Invoice preview modal with live branding display
 * @safety GREEN
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Loader2, FileText, Building2, CreditCard } from 'lucide-react';
import Image from 'next/image';
import type { InvoicePreviewData } from '../domain/invoicePreview.types';

interface InvoicePreviewModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isGenerating: boolean;
}

function formatSwissCents(cents: number): string {
  const value = cents / 100;
  const parts = value.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `CHF ${integerPart}.${parts[1]}`;
}

export function InvoicePreviewModal({
  clientId,
  isOpen,
  onClose,
  onConfirm,
  isGenerating,
}: InvoicePreviewModalProps) {
  const [preview, setPreview] = useState<InvoicePreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${clientId}/invoice-preview`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load preview');
        return;
      }

      setPreview(data.preview);
    } catch {
      setError('Failed to load preview');
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (isOpen && clientId) {
      fetchPreview();
    }
  }, [isOpen, clientId, fetchPreview]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-v-card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-stable-gold" />
            Invoice Preview
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-stable-gold" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-v-card text-red-400 text-sm">
            {error}
          </div>
        ) : preview ? (
          <div className="space-y-6">
            {/* Stable Header */}
            <div className="flex items-start justify-between border-b border-zinc-700/50 pb-6">
              <div className="flex items-start gap-4">
                {preview.stable.logo_url && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                    <Image
                      src={preview.stable.logo_url}
                      alt={preview.stable.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">{preview.stable.name}</h3>
                  {preview.stable.address && (
                    <p className="text-sm text-zinc-400 whitespace-pre-line mt-1">
                      {preview.stable.address}
                    </p>
                  )}
                  {preview.stable.vat_number && (
                    <p className="text-sm text-zinc-500 mt-1">
                      VAT: {preview.stable.vat_number}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-500">Invoice Date</p>
                <p className="text-zinc-100">
                  {new Date(preview.generated_at).toLocaleDateString('de-CH')}
                </p>
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-surface/50 rounded-v-card p-4">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Bill To
              </p>
              <p className="text-zinc-100 font-medium">{preview.client.name}</p>
              {preview.client.email && (
                <p className="text-sm text-zinc-400">{preview.client.email}</p>
              )}
              {preview.client.address && (
                <p className="text-sm text-zinc-400 whitespace-pre-line mt-1">
                  {preview.client.address}
                </p>
              )}
            </div>

            {/* Line Items Table */}
            <div className="overflow-hidden rounded-v-card border border-zinc-700/50">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface/50 border-b border-zinc-700/50">
                    <th className="text-left px-4 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      Description
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest w-20">
                      Qty
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest w-32">
                      Unit Price
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest w-32">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700/30">
                  {preview.lines.map((line, index) => (
                    <tr key={index} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <span className="text-zinc-100">{line.description}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-400">
                        {line.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400 font-finance">
                        {formatSwissCents(line.unit_price_cents)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-100 font-finance font-medium">
                        {formatSwissCents(line.line_total_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-700/50 bg-surface/30">
                    <td colSpan={3} className="px-4 py-3 text-right text-zinc-400 font-medium">
                      Subtotal
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-100 font-finance font-medium">
                      {formatSwissCents(preview.subtotal_cents)}
                    </td>
                  </tr>
                  <tr className="bg-stable-gold/10">
                    <td colSpan={3} className="px-4 py-3 text-right text-stable-gold font-bold">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right text-stable-gold font-finance font-bold text-lg">
                      {formatSwissCents(preview.total_cents)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bank Details */}
            {(preview.stable.bank_name || preview.stable.iban) && (
              <div className="bg-surface/50 rounded-v-card p-4">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  Bank Details
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {preview.stable.bank_name && (
                    <div>
                      <p className="text-zinc-500">Bank</p>
                      <p className="text-zinc-100">{preview.stable.bank_name}</p>
                    </div>
                  )}
                  {preview.stable.account_number && (
                    <div>
                      <p className="text-zinc-500">Account</p>
                      <p className="text-zinc-100">{preview.stable.account_number}</p>
                    </div>
                  )}
                  {preview.stable.iban && (
                    <div>
                      <p className="text-zinc-500">IBAN</p>
                      <p className="text-zinc-100 font-mono text-xs">{preview.stable.iban}</p>
                    </div>
                  )}
                  {preview.stable.swift_bic && (
                    <div>
                      <p className="text-zinc-500">Swift/BIC</p>
                      <p className="text-zinc-100 font-mono text-xs">{preview.stable.swift_bic}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Terms */}
            {preview.stable.invoice_default_terms && (
              <div className="border-t border-zinc-700/50 pt-4">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                  Terms & Conditions
                </p>
                <p className="text-sm text-zinc-400 whitespace-pre-line">
                  {preview.stable.invoice_default_terms}
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-zinc-700/50">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-v-card transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || !!error || isGenerating}
            className="flex items-center gap-2 px-6 py-2.5 bg-stable-gold text-black font-semibold rounded-v-card hover:bg-stable-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generate Invoice
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
