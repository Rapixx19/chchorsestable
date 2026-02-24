/**
 * @module dashboard/ui
 * @description Welcome header for dashboard
 * @safety GREEN
 */

'use client';

export default function DashboardHeader() {
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mb-8">
      <p className="text-gray-400 text-sm">{greeting}</p>
      <h1 className="text-3xl font-bold text-white">Welcome to your Stable</h1>
    </div>
  );
}
