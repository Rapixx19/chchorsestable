/**
 * @module assignments/ui
 * @description List component for service assignments
 * @safety GREEN
 */

'use client';

import { useEffect, useState } from 'react';
import { assignmentService } from '../services/assignment.service';
import type { AssignmentWithDetails } from '../domain/assignment.types';

interface AssignmentsListProps {
  stableId: string;
  refreshKey?: number;
}

const BILLING_UNIT_LABELS: Record<string, string> = {
  one_time: 'One-time',
  monthly: '/month',
  per_session: '/session',
};

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-CH');
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
    return <p className="text-gray-500">Loading assignments...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (assignments.length === 0) {
    return <p className="text-gray-500">No assignments yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {assignments.map((assignment) => (
        <li
          key={assignment.id}
          className={`p-3 border rounded ${assignment.active ? 'bg-white' : 'bg-gray-100 opacity-75'}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">
                {assignment.service_name}
                {assignment.quantity > 1 && ` x${assignment.quantity}`}
              </div>
              <div className="text-sm text-gray-600">
                {assignment.client_name}
                {assignment.horse_name && ` - ${assignment.horse_name}`}
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(assignment.start_date)}
                {assignment.end_date && ` - ${formatDate(assignment.end_date)}`}
              </div>
              {assignment.service_price_cents !== undefined && (
                <div className="text-sm text-gray-500">
                  CHF {formatPrice(assignment.service_price_cents * assignment.quantity)}
                  {assignment.service_billing_unit !== 'one_time' &&
                    ` ${BILLING_UNIT_LABELS[assignment.service_billing_unit || 'one_time']}`}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!assignment.active && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                  Inactive
                </span>
              )}
              <button
                onClick={() => handleToggleActive(assignment.id, !assignment.active)}
                className={`text-sm px-3 py-1 rounded ${
                  assignment.active
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {assignment.active ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
