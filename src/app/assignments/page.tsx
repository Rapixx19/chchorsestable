/**
 * @module app/assignments
 * @description Service assignments management page
 * @safety GREEN
 */

'use client';

import { useState, useEffect } from 'react';
import { CreateAssignmentForm, AssignmentsList } from '@/modules/assignments/ui';
import { supabase } from '@/infra/supabase/client';

export default function AssignmentsPage() {
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

  const handleAssignmentCreated = () => {
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
      <h1 className="text-2xl font-bold mb-6">Service Assignments</h1>

      <div className="mb-6">
        <CreateAssignmentForm stableId={stableId} onSuccess={handleAssignmentCreated} />
      </div>

      <AssignmentsList stableId={stableId} refreshKey={refreshKey} />
    </main>
  );
}
