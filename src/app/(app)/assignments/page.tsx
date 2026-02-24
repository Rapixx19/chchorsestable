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
      <main className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card rounded-v-card p-8">
            <p className="text-zinc-500 text-sm">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!stableId) {
    return (
      <main className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card rounded-v-card p-8">
            <p className="text-zinc-500 text-sm">No stable found.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Service Assignments</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage recurring and one-time services for your clients.
          </p>
        </div>

        {/* Create Form */}
        <div className="mb-8">
          <CreateAssignmentForm stableId={stableId} onSuccess={handleAssignmentCreated} />
        </div>

        {/* Table Section */}
        <div>
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
            Active Assignments
          </h2>
          <AssignmentsList stableId={stableId} refreshKey={refreshKey} />
        </div>
      </div>
    </main>
  );
}
