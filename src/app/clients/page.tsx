/**
 * @module app/clients
 * @description Clients management page
 * @safety GREEN
 */

'use client';

import { useState, useEffect } from 'react';
import { CreateClientForm, ClientsList } from '@/modules/clients/ui';
import { supabase } from '@/infra/supabase/client';

export default function ClientsPage() {
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

  const handleClientCreated = () => {
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
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Clients</h1>

      <div className="mb-6">
        <CreateClientForm stableId={stableId} onSuccess={handleClientCreated} />
      </div>

      <ClientsList stableId={stableId} refreshKey={refreshKey} />
    </main>
  );
}
