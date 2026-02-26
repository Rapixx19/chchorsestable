/**
 * @module app/dashboard
 * @description Dashboard page with KPIs and navigation
 * @safety GREEN
 */

import DashboardHeader from '@/modules/dashboard/ui/DashboardHeader';
import OwnerToolkit from '@/modules/dashboard/ui/OwnerToolkit';
import KpiCards from '@/modules/dashboard/ui/KpiCards';
import UpcomingInvoices from '@/modules/dashboard/ui/UpcomingInvoices';
import QuickActions from '@/modules/dashboard/ui/QuickActions';
import RecentActivity from '@/modules/dashboard/ui/RecentActivity';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-900 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader />
        <OwnerToolkit />
        <KpiCards />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <QuickActions />
          </div>
          <div>
            <UpcomingInvoices />
            <div className="mt-8">
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Recent Activity</h2>
              <RecentActivity />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
