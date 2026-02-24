/**
 * @module dashboard/ui
 * @description Premium KPI display card for the Dashboard Bento Grid
 * @safety GREEN
 */

import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: 'emerald' | 'gold' | 'zinc';
}

export function KpiCard({ label, value, icon: Icon, trend, variant = 'zinc' }: KpiCardProps) {
  const variantStyles = {
    emerald: 'bg-stable-emerald/10 text-stable-emerald border-stable-emerald/20',
    gold: 'bg-stable-gold/10 text-stable-gold border-stable-gold/20',
    zinc: 'bg-zinc-500/10 text-zinc-400 border-white/10'
  };

  return (
    <div className="glass-card p-6 rounded-v-card group hover:border-white/20 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg border ${variantStyles[variant]}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-stable-emerald bg-stable-emerald/10 px-2 py-1 rounded-full uppercase tracking-wider">
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</p>
        <h3 className="text-2xl font-bold text-white mt-1 font-finance">{value}</h3>
      </div>
    </div>
  );
}
