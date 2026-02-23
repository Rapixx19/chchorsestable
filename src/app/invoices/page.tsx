/**
 * @module app/invoices
 * @description Invoices management page
 * @safety RED
 */

'use client';

import { useState, useEffect } from 'react';
import { InvoicesList } from '@/modules/invoices/ui';
import { supabase } from '@/infra/supabase/client';

export default function InvoicesPage() {
  const [stableId, setStableId] = useState<string | null>(null);
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
      <h1 className="text-2xl font-bold mb-6">Invoices</h1>
      <InvoicesList stableId={stableId} />
    </main>
  );
}
