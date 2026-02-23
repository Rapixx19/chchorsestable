/**
 * @module invoices/ui
 * @description Self-fetching invoice list component
 * @safety RED
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/infra/supabase/client';

interface InvoicesListProps {
  stableId: string;
  refreshKey?: number;
}

interface InvoiceRow {
  id: string;
  client_id: string;
  billing_period_id: string;
  subtotal_cents: number;
  total_cents: number;
  status: string;
  created_at: string;
  clients: { name: string };
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function InvoicesList({ stableId, refreshKey }: InvoicesListProps) {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          id,
          client_id,
          billing_period_id,
          subtotal_cents,
          total_cents,
          status,
          created_at,
          clients!inner(name)
        `)
        .eq('stable_id', stableId)
        .order('created_at', { ascending: false });

      setIsLoading(false);

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setInvoices((data as unknown as InvoiceRow[]) ?? []);
    }

    fetchInvoices();
  }, [stableId, refreshKey]);

  if (isLoading) {
    return <p className="text-gray-500">Loading invoices...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (invoices.length === 0) {
    return <p className="text-gray-500">No invoices yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {invoices.map((invoice) => (
        <Link
          key={invoice.id}
          href={`/invoices/${invoice.id}`}
          className="p-3 border rounded hover:bg-gray-50"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{invoice.clients.name}</p>
              <p className="text-sm text-gray-600">
                Period: {invoice.billing_period_id.slice(0, 8)}...
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-1 text-xs rounded ${statusColors[invoice.status] ?? 'bg-gray-100 text-gray-800'}`}
              >
                {invoice.status}
              </span>
              <span className="font-medium">{formatCents(invoice.total_cents)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
