/**
 * @module app/horses
 * @description Horses management page with premium grid layout
 * @safety GREEN
 */

'use client';

import { useState, useEffect } from 'react';
import { CreateHorseForm, HorseGrid } from '@/modules/horses/ui';
import { supabase } from '@/infra/supabase/client';

export default function HorsesPage() {
  const [stableId, setStableId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStable() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: stable } = await supabase
        .from('stables')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (stable) {
        setStableId(stable.id);
      }
      setIsLoading(false);
    }

    fetchStable();
  }, []);

  const handleHorseCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  if (isLoading) {
    return (
      <main className="p-6">
        <p>Loading...</p>
      </main>
    );
  }

  if (!stableId) {
    return (
      <main className="p-6">
        <p>No stable found.</p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Horses</h1>

      <div className="mb-8">
        <CreateHorseForm stableId={stableId} onSuccess={handleHorseCreated} />
      </div>

      <HorseGrid stableId={stableId} refreshKey={refreshKey} />
    </main>
  );
}
