/**
 * @module analytics/services
 * @description Analytics and KPI calculation service
 * @safety GREEN
 */

import { createClient } from '@/infra/supabase/server';
import type {
  KpiSummary,
  RevenueByMonth,
  RevenueByClient,
  InvoiceStatusCounts,
  AnalyticsPeriod,
} from '../domain/analytics.types';

export async function getKpiSummary(stableId: string): Promise<KpiSummary> {
  const supabase = await createClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  const [revenueResult, clientsResult, horsesResult, pendingResult] = await Promise.all([
    supabase
      .from('invoices')
      .select('total_cents')
      .eq('stable_id', stableId)
      .eq('status', 'paid')
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth),
    supabase
      .from('clients')
      .select('id', { count: 'exact' })
      .eq('stable_id', stableId)
      .eq('archived', false),
    supabase
      .from('horses')
      .select('id', { count: 'exact' })
      .eq('stable_id', stableId)
      .eq('archived', false),
    supabase
      .from('invoices')
      .select('id', { count: 'exact' })
      .eq('stable_id', stableId)
      .in('status', ['draft', 'approved', 'sent']),
  ]);

  const monthlyRevenue =
    (revenueResult.data as Array<{ total_cents: number }> | null)?.reduce(
      (sum, inv) => sum + inv.total_cents,
      0
    ) ?? 0;

  return {
    monthlyRevenue,
    activeClients: clientsResult.count ?? 0,
    totalHorses: horsesResult.count ?? 0,
    pendingInvoices: pendingResult.count ?? 0,
  };
}

export async function getRevenueByMonth(
  stableId: string,
  months: number = 12
): Promise<RevenueByMonth[]> {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data: invoices } = await supabase
    .from('invoices')
    .select('total_cents, created_at')
    .eq('stable_id', stableId)
    .eq('status', 'paid')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  const revenueMap = new Map<string, number>();

  for (const invoice of (invoices as Array<{ total_cents: number; created_at: string }>) ?? []) {
    const date = new Date(invoice.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const current = revenueMap.get(monthKey) ?? 0;
    revenueMap.set(monthKey, current + invoice.total_cents);
  }

  return Array.from(revenueMap.entries()).map(([month, revenue]) => ({
    month,
    revenue,
  }));
}

export async function getRevenueByClient(
  stableId: string,
  period?: AnalyticsPeriod
): Promise<RevenueByClient[]> {
  const supabase = await createClient();

  let query = supabase
    .from('invoices')
    .select('total_cents, client_id, clients!inner(name)')
    .eq('stable_id', stableId)
    .eq('status', 'paid');

  if (period) {
    query = query
      .gte('created_at', period.startDate.toISOString())
      .lte('created_at', period.endDate.toISOString());
  }

  const { data: invoices } = await query;

  const clientMap = new Map<string, { name: string; total: number }>();

  for (const invoice of (invoices as unknown as Array<{
    total_cents: number;
    client_id: string;
    clients: { name: string };
  }>) ?? []) {
    const existing = clientMap.get(invoice.client_id);
    if (existing) {
      existing.total += invoice.total_cents;
    } else {
      clientMap.set(invoice.client_id, {
        name: invoice.clients.name,
        total: invoice.total_cents,
      });
    }
  }

  return Array.from(clientMap.entries())
    .map(([clientId, { name, total }]) => ({
      clientId,
      clientName: name,
      totalRevenue: total,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export async function getInvoiceStatusCounts(stableId: string): Promise<InvoiceStatusCounts> {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from('invoices')
    .select('status')
    .eq('stable_id', stableId);

  const counts: InvoiceStatusCounts = {
    draft: 0,
    approved: 0,
    sent: 0,
    paid: 0,
    overdue: 0,
    cancelled: 0,
  };

  for (const invoice of (invoices as Array<{ status: string }>) ?? []) {
    const status = invoice.status as keyof InvoiceStatusCounts;
    if (status in counts) {
      counts[status]++;
    }
  }

  return counts;
}

export async function getTotalRevenue(
  stableId: string,
  period?: AnalyticsPeriod
): Promise<number> {
  const supabase = await createClient();

  let query = supabase
    .from('invoices')
    .select('total_cents')
    .eq('stable_id', stableId)
    .eq('status', 'paid');

  if (period) {
    query = query
      .gte('created_at', period.startDate.toISOString())
      .lte('created_at', period.endDate.toISOString());
  }

  const { data: invoices } = await query;

  return (invoices as Array<{ total_cents: number }> | null)?.reduce(
    (sum, inv) => sum + inv.total_cents,
    0
  ) ?? 0;
}
