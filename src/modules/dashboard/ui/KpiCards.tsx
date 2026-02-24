/**
 * @module dashboard/ui
 * @description KPI cards showing key metrics
 * @safety GREEN
 */

'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Users, Rabbit, FileText } from 'lucide-react';
import { supabase } from '@/infra/supabase/client';
import { KpiCard } from './KpiCard';

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6 rounded-v-card animate-pulse">
            <div className="w-10 h-10 bg-zinc-700 rounded-lg mb-4" />
            <div className="w-20 h-3 bg-zinc-700 rounded mb-2" />
            <div className="w-16 h-7 bg-zinc-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <KpiCard
        label="Monthly Revenue"
        value={kpis ? formatCurrency(kpis.monthlyRevenue) : '-'}
        icon={DollarSign}
        variant="emerald"
      />
      <KpiCard
        label="Active Clients"
        value={kpis?.activeClients ?? '-'}
        icon={Users}
        variant="zinc"
      />
      <KpiCard
        label="Horses"
        value={kpis?.totalHorses ?? '-'}
        icon={Rabbit}
        variant="gold"
      />
      <KpiCard
        label="Pending Invoices"
        value={kpis?.pendingInvoices ?? '-'}
        icon={FileText}
        variant="zinc"
      />
    </div>
  );
}
