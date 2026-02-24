/**
 * @module dashboard/ui
 * @description KPI cards showing key metrics
 * @safety GREEN
 */

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/infra/supabase/client';

interface KpiData {
  monthlyRevenue: number;
  activeClients: number;
  totalHorses: number;
  pendingInvoices: number;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export default function KpiCards() {
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchKpis() {
      setIsLoading(true);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const [revenueResult, clientsResult, horsesResult, pendingResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('total_cents')
          .eq('status', 'paid')
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth),
        supabase.from('clients').select('id', { count: 'exact' }).eq('archived', false),
        supabase.from('horses').select('id', { count: 'exact' }).eq('archived', false),
        supabase
          .from('invoices')
          .select('id', { count: 'exact' })
          .in('status', ['draft', 'approved', 'sent']),
      ]);

      const monthlyRevenue =
        revenueResult.data?.reduce((sum, inv) => sum + inv.total_cents, 0) ?? 0;

      setKpis({
        monthlyRevenue,
        activeClients: clientsResult.count ?? 0,
        totalHorses: horsesResult.count ?? 0,
        pendingInvoices: pendingResult.count ?? 0,
      });

      setIsLoading(false);
    }

    fetchKpis();
  }, []);

  const cards = [
    {
      label: 'Monthly Revenue',
      value: kpis ? formatCurrency(kpis.monthlyRevenue) : '-',
      icon: '$',
      color: 'from-green-500 to-emerald-600',
    },
    {
      label: 'Active Clients',
      value: kpis?.activeClients ?? '-',
      icon: 'U',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Horses',
      value: kpis?.totalHorses ?? '-',
      icon: 'H',
      color: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Pending Invoices',
      value: kpis?.pendingInvoices ?? '-',
      icon: 'I',
      color: 'from-purple-500 to-violet-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">{card.label}</span>
            <div
              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-white text-sm font-bold`}
            >
              {card.icon}
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {isLoading ? (
              <span className="inline-block w-16 h-7 bg-gray-700 rounded animate-pulse" />
            ) : (
              card.value
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
