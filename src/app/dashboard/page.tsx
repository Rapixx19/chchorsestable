/**
 * @module app/dashboard
 * @description Dashboard page
 * @safety GREEN
 */

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <nav className="flex flex-col gap-2">
        <Link href="/clients" className="p-3 border rounded hover:bg-gray-50">
          Clients
        </Link>
        <Link href="/horses" className="p-3 border rounded hover:bg-gray-50">
          Horses
        </Link>
        <Link href="/services" className="p-3 border rounded hover:bg-gray-50">
          Services
        </Link>
        <Link href="/assignments" className="p-3 border rounded hover:bg-gray-50">
          Assignments
        </Link>
      </nav>
    </main>
  );
}
