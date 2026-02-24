/**
 * @module dashboard/ui
 * @description Upcoming and overdue invoices list
 * @safety GREEN
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/infra/supabase/client';

interface InvoiceRow {
  id: string;
  total_cents: number;
  status: string;
  created_at: string;
  clients: { name: string };
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-600 text-gray-200',
  approved: 'bg-yellow-600 text-yellow-100',
  sent: 'bg-blue-600 text-blue-100',
  overdue: 'bg-red-600 text-red-100',
};

export default function UpcomingInvoices() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      setIsLoading(true);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data } = await supabase
        .from('invoices')
        .select(`id, total_cents, status, created_at, clients!inner(name)`)
        .in('status', ['draft', 'approved', 'sent', 'overdue'])
        .order('created_at', { ascending: false })
        .limit(5);

      setInvoices((data as unknown as InvoiceRow[]) ?? []);
      setIsLoading(false);
    }

    fetchInvoices();
  }, []);

  return (
    <div className="bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Pending Invoices</h2>
        <Link href="/invoices" className="text-sm text-blue-400 hover:text-blue-300">
          View all
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <p className="text-gray-400 text-sm py-4 text-center">No pending invoices</p>
      ) : (
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/invoices/${invoice.id}`}
              className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div>
                <p className="text-white font-medium">{invoice.clients.name}</p>
                <p className="text-gray-400 text-sm">
                  {new Date(invoice.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${statusStyles[invoice.status] ?? 'bg-gray-600 text-gray-200'}`}
                >
                  {invoice.status}
                </span>
                <span className="text-white font-semibold">
                  {formatCurrency(invoice.total_cents)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
