'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Rabbit,
  Database,
  Receipt,
  FileText,
  Settings,
} from 'lucide-react';

const navGroups = [
  {
    label: 'Operations',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { name: 'Clients', icon: Users, href: '/clients' },
      { name: 'Horses', icon: Rabbit, href: '/horses' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Services', icon: Database, href: '/services' },
      { name: 'Billing', icon: Receipt, href: '/billing' },
      { name: 'Invoices', icon: FileText, href: '/invoices' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { name: 'Settings', icon: Settings, href: '/settings' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-surface border-r border-zinc-800 p-4 flex flex-col">
      {/* Logo/Brand */}
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-stable-gold">CHC</h1>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <h2 className="px-2 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {group.label}
            </h2>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-2 py-2 rounded-v-card transition-colors ${
                        isActive
                          ? 'bg-surface-hover text-stable-gold'
                          : 'text-zinc-400 hover:bg-surface-hover hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
