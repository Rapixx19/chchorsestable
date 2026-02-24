/**
 * @module app/billing
 * @description Billing management page
 * @safety GREEN
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/infra/supabase/client';

interface BillingPeriod {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-600 text-blue-100',
  closed: 'bg-green-600 text-green-100',
  pending: 'bg-yellow-600 text-yellow-100',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

export default function BillingPage() {
  const [stableId, setStableId] = useState<string | null>(null);
  const [periods, setPeriods] = useState<BillingPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const displayedPeriods = selectedPeriod
    ? periods.filter((p) => p.id === selectedPeriod)
    : periods;

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: stable } = await supabase
        .from('stables')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (stable) {
        setStableId(stable.id);

        const { data: billingPeriods } = await supabase
          .from('billing_periods')
          .select('*')
          .eq('stable_id', stable.id)
          .order('start_date', { ascending: false })
          .limit(10);

        setPeriods((billingPeriods ?? []) as unknown as BillingPeriod[]);
      }
      setIsLoading(false);
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-900 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  if (!stableId) {
    return (
      <main className="min-h-screen bg-gray-900 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400">No stable found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Billing</h1>
          <Link
            href="/billing"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate Invoices
          </Link>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-600/20 border border-green-600 rounded-lg text-green-400">
            {successMessage}
          </div>
        )}

        {/* Billing Periods Section */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Billing Periods</h2>
            {/* Period Selector */}
            <select
              value={selectedPeriod ?? ''}
              onChange={(e) => setSelectedPeriod(e.target.value || null)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Periods</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatDate(p.start_date)} - {formatDate(p.end_date)}
                </option>
              ))}
            </select>
          </div>

          {displayedPeriods.length === 0 ? (
            <p className="text-gray-400">No billing periods found.</p>
          ) : (
            <div className="space-y-3">
              {displayedPeriods.map((period) => (
                <div
                  key={period.id}
                  className="p-4 bg-gray-700/50 border border-gray-700 rounded-lg flex justify-between items-center hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-white">
                        {formatDate(period.start_date)} - {formatDate(period.end_date)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${statusColors[period.status] ?? 'bg-gray-600 text-gray-200'}`}
                      >
                        {period.status}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/invoices?period=${period.id}`}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    View Invoices
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex gap-4">
          <Link href="/invoices" className="text-blue-400 hover:text-blue-300 transition-colors">
            All Invoices
          </Link>
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-300 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
