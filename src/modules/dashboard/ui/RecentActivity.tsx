/**
 * @module dashboard/ui
 * @description Timeline feed for recent stable activity
 * @safety GREEN
 */

'use client';

import { FileText, Plus, UserPlus, CheckCircle2, LucideIcon } from 'lucide-react';

type ActivityType = 'invoice' | 'horse' | 'client' | 'billing';

interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
}

// Mock data - can be replaced with real activity service later
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'invoice',
    description: 'Invoice #1042 sent to Sarah Miller',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '2',
    type: 'horse',
    description: 'New horse "Midnight Star" added',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    id: '3',
    type: 'billing',
    description: 'Payment received from John Davis',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: '4',
    type: 'client',
    description: 'New client "Emily Watson" registered',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: '5',
    type: 'invoice',
    description: 'Invoice #1041 marked as paid',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
];

const activityConfig: Record<ActivityType, { icon: LucideIcon; color: string }> = {
  invoice: {
    icon: FileText,
    color: 'text-stable-gold',
  },
  horse: {
    icon: Plus,
    color: 'text-stable-emerald',
  },
  client: {
    icon: UserPlus,
    color: 'text-blue-400',
  },
  billing: {
    icon: CheckCircle2,
    color: 'text-stable-emerald',
  },
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return '1d ago';
  } else {
    return `${diffDays}d ago`;
  }
}

export default function RecentActivity() {
  return (
    <div className="relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
      <div className="space-y-4">
        {mockActivities.map((activity) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;

          return (
            <div key={activity.id} className="flex items-start gap-4 relative">
              <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center border border-white/10 hover:border-white/20 transition-all duration-300 shrink-0 z-10">
                <Icon size={16} className={config.color} />
              </div>
              <div className="flex-1 pt-1">
                <p className="text-zinc-200 text-sm leading-relaxed">
                  {activity.description}
                </p>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 block">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
