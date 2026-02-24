/**
 * @module assignments/ui
 * @description List component for service assignments
 * @safety GREEN
 */

'use client';

import { useEffect, useState } from 'react';
import { assignmentService } from '../services/assignment.service';
import { AssignmentTable } from './AssignmentTable';
import type { AssignmentWithDetails } from '../domain/assignment.types';

interface AssignmentsListProps {
  stableId: string;
  refreshKey?: number;
}

export function AssignmentsList({ stableId, refreshKey }: AssignmentsListProps) {
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssignments() {
      setIsLoading(true);
      setError(null);

      const result = await assignmentService.getAssignmentsByStable(stableId);

      setIsLoading(false);

      if (!result.success) {
        setError(result.error ?? 'Failed to load assignments');
        return;
      }

      setAssignments(result.assignments ?? []);
    }

    fetchAssignments();
  }, [stableId, refreshKey]);

  const handleToggleActive = async (id: string, active: boolean) => {
    const result = await assignmentService.setAssignmentActive(id, active);
    if (result.success) {
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, active } : a))
      );
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-v-card p-8">
        <p className="text-zinc-500 text-sm">Loading assignments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-v-card p-8">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="glass-card rounded-v-card p-8">
        <p className="text-zinc-500 text-sm">No assignments yet.</p>
      </div>
    );
  }

  return (
    <AssignmentTable
      assignments={assignments}
      onToggleActive={handleToggleActive}
    />
  );
}
