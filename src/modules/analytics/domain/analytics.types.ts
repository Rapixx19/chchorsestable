/**
 * @module analytics/domain
 * @description Type definitions for analytics and KPIs
 * @safety GREEN
 */

export interface KpiSummary {
  monthlyRevenue: number;
  activeClients: number;
  totalHorses: number;
  pendingInvoices: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
}

export interface RevenueByClient {
  clientId: string;
  clientName: string;
  totalRevenue: number;
}

export interface InvoiceStatusCounts {
  draft: number;
  approved: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
}

export interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
}
