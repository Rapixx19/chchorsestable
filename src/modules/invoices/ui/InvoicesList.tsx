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
  draft: 'bg-gray-600 text-gray-200',
  sent: 'bg-blue-600 text-blue-100',
  paid: 'bg-green-600 text-green-100',
  overdue: 'bg-red-600 text-red-100',
  cancelled: 'bg-gray-700 text-gray-400',
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
    return <p className="text-zinc-500">Loading invoices...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (invoices.length === 0) {
    return (
      <div className="glass-card rounded-v-card p-12 text-center">
        <p className="text-zinc-500 mb-4">No invoices yet.</p>
        <p className="text-zinc-600 text-sm">
          Generate invoices from your billing periods to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {invoices.map((invoice) => (
        <Link
          key={invoice.id}
          href={`/invoices/${invoice.id}`}
          className="glass-card rounded-v-card p-4 hover:border-white/20 transition-all"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-white">{invoice.clients.name}</p>
              <p className="text-sm text-zinc-400">
                Period: {invoice.billing_period_id.slice(0, 8)}...
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-1 text-xs rounded-full ${statusColors[invoice.status] ?? 'bg-gray-600 text-gray-200'}`}
              >
                {invoice.status}
              </span>
              <span className="font-medium text-white">{formatCents(invoice.total_cents)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
