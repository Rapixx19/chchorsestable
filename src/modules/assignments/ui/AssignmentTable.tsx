/**
 * @module assignments/ui
 * @description High-density glassmorphism table for service assignments
 * @safety GREEN
 */

'use client';

import { Calendar, MoreHorizontal } from 'lucide-react';
import type { AssignmentWithDetails } from '../domain/assignment.types';

interface AssignmentTableProps {
  assignments: AssignmentWithDetails[];
  onToggleActive: (id: string, active: boolean) => void;
}

const BILLING_UNIT_LABELS: Record<string, string> = {
  one_time: 'One-time',
  monthly: 'Monthly',
  per_session: 'Per Session',
};

function formatPrice(cents: number): string {
  return `CHF ${(cents / 100).toFixed(2)}`;
}

export function AssignmentTable({ assignments, onToggleActive }: AssignmentTableProps) {
  return (
    <div className="glass-card rounded-v-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Client / Horse
              </th>
              <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Service
              </th>
              <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Frequency
              </th>
              <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Rate
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr
                key={assignment.id}
                className={`border-b border-white/5 last:border-0 transition-colors duration-200 hover:bg-white/[0.02] ${
                  !assignment.active ? 'opacity-50' : ''
                }`}
              >
                {/* Client / Horse */}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">
                      {assignment.client_name}
                    </span>
                    {assignment.horse_name && (
                      <span className="text-xs text-zinc-500">
                        {assignment.horse_name}
                      </span>
                    )}
                  </div>
                </td>

                {/* Service */}
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-stable-gold">
                    {assignment.service_name}
                    {assignment.quantity > 1 && (
                      <span className="text-zinc-500 ml-1">×{assignment.quantity}</span>
                    )}
                  </span>
                </td>

                {/* Frequency */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-zinc-500" />
                    <span className="text-sm text-zinc-400">
                      {BILLING_UNIT_LABELS[assignment.service_billing_unit || 'one_time']}
                    </span>
                  </div>
                </td>

                {/* Rate */}
                <td className="px-6 py-4 text-right">
                  {assignment.service_price_cents !== undefined && (
                    <span className="text-sm font-medium text-white font-finance">
                      {formatPrice(assignment.service_price_cents * assignment.quantity)}
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {!assignment.active && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                    <button
                      onClick={() => onToggleActive(assignment.id, !assignment.active)}
                      className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors duration-200"
                      title={assignment.active ? 'Deactivate' : 'Reactivate'}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
