/**
 * @module dashboard/ui
 * @description Welcome header for dashboard
 * @safety GREEN
 */

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/infra/supabase/client';

export default function DashboardHeader() {
  const [stableName, setStableName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    async function fetchStable() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: stable } = await supabase
        .from('stables')
        .select('name')
        .eq('owner_id', user.id)
        .single();

      setStableName(stable?.name ?? null);
      setIsLoading(false);
    }

    fetchStable();
  }, []);

  return (
    <div className="mb-8">
      <p className="text-gray-400 text-sm">{greeting}</p>
      <h1 className="text-3xl font-bold text-white">
        {isLoading ? (
          <span className="inline-block w-48 h-9 bg-gray-700 rounded animate-pulse" />
        ) : stableName ? (
          `Welcome to ${stableName}`
        ) : (
          'Welcome'
        )}
      </h1>
      <p className="text-gray-400 text-sm mt-1">
        Here&apos;s what&apos;s happening in your stable today.
      </p>
    </div>
  );
}
