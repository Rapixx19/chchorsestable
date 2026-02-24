/**
 * @module invoices/ui
 * @description Invoice detail component with line items
 * @safety RED
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/infra/supabase/client';
import DispatchControls from './DispatchControls';

interface InvoiceDetailProps {
  invoiceId: string;
}

interface InvoiceRow {
  id: string;
  client_id: string;
  billing_period_id: string;
  subtotal_cents: number;
  total_cents: number;
  status: string;
  created_at: string;
  clients: { name: string; telegram_chat_id: string | null };
}

interface InvoiceLineRow {
  id: string;
  invoice_id: string;
  description: string;
  billing_unit: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  horse_id: string | null;
  service_id: string | null;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  approved: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const [invoice, setInvoice] = useState<InvoiceRow | null>(null);
  const [lines, setLines] = useState<InvoiceLineRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
      setIsLoading(true);
      setError(null);

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`*, clients!inner(name, telegram_chat_id)`)
        .eq('id', invoiceId)
        .single();

      if (invoiceError) {
        setIsLoading(false);
        setError(invoiceError.message);
        return;
      }

      const { data: linesData, error: linesError } = await supabase
        .from('invoice_lines')
        .select('*')
        .eq('invoice_id', invoiceId);

      setIsLoading(false);

      if (linesError) {
        setError(linesError.message);
        return;
      }

      setInvoice(invoiceData as unknown as InvoiceRow);
      setLines((linesData as unknown as InvoiceLineRow[]) ?? []);
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  if (isLoading) {
    return <p className="text-gray-500">Loading invoice...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!invoice) {
    return <p className="text-gray-500">Invoice not found.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <Link href="/invoices" className="text-blue-600 hover:underline text-sm">
            &larr; Back to Invoices
          </Link>
          <h2 className="text-xl font-bold mt-2">{invoice.clients.name}</h2>
          <p className="text-sm text-gray-600">
            Period: {invoice.billing_period_id.slice(0, 8)}...
          </p>
          <p className="text-sm text-gray-600">
            Created: {new Date(invoice.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <span
            className={`px-2 py-1 text-xs rounded ${statusColors[invoice.status] ?? 'bg-gray-100 text-gray-800'}`}
          >
            {invoice.status}
          </span>
          <p className="text-2xl font-bold">{formatCents(invoice.total_cents)}</p>
          <DispatchControls
            invoiceId={invoiceId}
            status={invoice.status as 'draft' | 'approved' | 'sent' | 'paid' | 'overdue' | 'cancelled'}
            isLinked={!!invoice.clients.telegram_chat_id}
            onStatusChange={fetchInvoice}
          />
        </div>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium">Description</th>
              <th className="text-right p-3 font-medium">Qty</th>
              <th className="text-right p-3 font-medium">Unit Price</th>
              <th className="text-right p-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-t">
                <td className="p-3">{line.description}</td>
                <td className="p-3 text-right">{line.quantity}</td>
                <td className="p-3 text-right">{formatCents(line.unit_price_cents)}</td>
                <td className="p-3 text-right">{formatCents(line.line_total_cents)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr className="border-t">
              <td colSpan={3} className="p-3 text-right font-medium">
                Subtotal
              </td>
              <td className="p-3 text-right">{formatCents(invoice.subtotal_cents)}</td>
            </tr>
            <tr className="border-t">
              <td colSpan={3} className="p-3 text-right font-bold">
                Total
              </td>
              <td className="p-3 text-right font-bold">
                {formatCents(invoice.total_cents)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
