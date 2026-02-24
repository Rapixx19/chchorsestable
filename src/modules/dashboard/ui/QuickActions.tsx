/**
 * @module dashboard/ui
 * @description Quick action buttons and navigation tiles
 * @safety GREEN
 */

'use client';

import Link from 'next/link';

const quickActions = [
  {
    label: 'New Client',
    href: '/clients/new',
    color: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    label: 'Assign Service',
    href: '/assignments/new',
    color: 'bg-green-600 hover:bg-green-700',
  },
  {
    label: 'Generate Invoices',
    href: '/invoices/generate',
    color: 'bg-purple-600 hover:bg-purple-700',
  },
];

const navigationTiles = [
  {
    label: 'Clients',
    href: '/clients',
    description: 'Manage client accounts',
    icon: 'C',
    color: 'from-blue-500 to-blue-600',
  },
  {
    label: 'Horses',
    href: '/horses',
    description: 'View and manage horses',
    icon: 'H',
    color: 'from-amber-500 to-orange-600',
  },
  {
    label: 'Services',
    href: '/services',
    description: 'Configure services',
    icon: 'S',
    color: 'from-green-500 to-emerald-600',
  },
  {
    label: 'Assignments',
    href: '/assignments',
    description: 'Service assignments',
    icon: 'A',
    color: 'from-indigo-500 to-violet-600',
  },
  {
    label: 'Invoices',
    href: '/invoices',
    description: 'Billing and invoices',
    icon: 'I',
    color: 'from-pink-500 to-rose-600',
  },
];

export default function QuickActions() {
  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${action.color}`}
            >
              + {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Navigation Tiles */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {navigationTiles.map((tile) => (
            <Link
              key={tile.label}
              href={tile.href}
              className="bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700 hover:border-gray-600 transition-all hover:shadow-xl group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tile.color} flex items-center justify-center text-white text-xl font-bold shrink-0 group-hover:scale-105 transition-transform`}
                >
                  {tile.icon}
                </div>
                <div>
                  <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                    {tile.label}
                  </h3>
                  <p className="text-gray-400 text-sm">{tile.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
