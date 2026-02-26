/**
 * @module horses/ui
 * @description Slide-over drawer showing detailed horse information
 * @safety GREEN
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Rabbit, ChevronRight, FileText, User } from 'lucide-react';
import type { Horse } from '../domain/horse.types';
import type { Client } from '@/modules/clients/domain/client.types';
import type { AssignmentWithDetails } from '@/modules/assignments/domain/assignment.types';
import { clientService } from '@/modules/clients/services/client.service';
import { assignmentService } from '@/modules/assignments/services/assignment.service';
import type { BillingUnit } from '@/modules/services/domain/service.types';

interface HorseDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  horse: Horse | null;
  stableId: string;
}

const BILLING_UNIT_LABELS: Record<BillingUnit, string> = {
  one_time: 'One-time',
  monthly: 'Monthly',
  per_session: 'Per Session',
};

function formatPrice(cents: number): string {
  return `CHF ${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('de-CH', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function HorseDetailDrawer({
  isOpen,
  onClose,
  horse,
  stableId,
}: HorseDetailDrawerProps) {
  const [owner, setOwner] = useState<Client | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      if (!horse || !isOpen) return;

      setIsLoading(true);
      setOwner(null);
      setAssignments([]);

      // Fetch owner details if assigned
      if (horse.client_id) {
        const ownerResult = await clientService.getClientById(horse.client_id);
        if (ownerResult.success && ownerResult.client) {
          setOwner(ownerResult.client);
        }
      }

      // Fetch service assignments for this horse
      const assignmentsResult = await assignmentService.getAssignmentsByStable(stableId);
      if (assignmentsResult.success && assignmentsResult.assignments) {
        const horseAssignments = assignmentsResult.assignments.filter(
          (a) => a.horse_id === horse.id && a.active
        );
        setAssignments(horseAssignments);
      }

      setIsLoading(false);
    }

    fetchDetails();
  }, [horse, isOpen, stableId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg h-full bg-zinc-950 border-l border-white/10 p-8 shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <Rabbit className="text-[#D4AF37]" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">
              {horse?.name ?? 'Horse Details'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-zinc-500">Loading...</p>
          </div>
        ) : horse ? (
          <div className="space-y-8">
            {/* Physical Details Section */}
            <section>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                Physical Details
              </h3>
              <div className="glass-card rounded-v-card p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Breed</span>
                  <span className="text-white">{horse.breed ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Birth Year</span>
                  <span className="text-white">{horse.birth_year ?? '—'}</span>
                </div>
                {horse.notes && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-zinc-400 text-sm block mb-1">Notes</span>
                    <p className="text-white text-sm">{horse.notes}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Owner Information Section */}
            <section>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                Owner Information
              </h3>
              {owner ? (
                <Link
                  href={`/clients/${owner.id}`}
                  className="glass-card rounded-v-card p-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {owner.avatar_url ? (
                      <Image
                        src={owner.avatar_url}
                        alt={owner.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-sm">
                        {getInitials(owner.name)}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium group-hover:text-[#D4AF37] transition-colors">
                        {owner.name}
                      </p>
                      <div className="text-xs text-zinc-500 space-x-2">
                        {owner.email && <span>{owner.email}</span>}
                        {owner.email && owner.phone && <span>|</span>}
                        {owner.phone && <span>{owner.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-500 group-hover:text-[#D4AF37] transition-colors" />
                </Link>
              ) : (
                <div className="glass-card rounded-v-card p-4 text-center">
                  <User className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                  <p className="text-zinc-500 text-sm">No owner assigned</p>
                  <p className="text-zinc-600 text-xs mt-1">
                    Use the dropdown on the horse card to assign an owner
                  </p>
                </div>
              )}
            </section>

            {/* Service History Section */}
            <section>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                Service History
              </h3>
              {assignments.length > 0 ? (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="glass-card rounded-v-card p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white font-medium">
                          {assignment.service_name ?? 'Unknown Service'}
                        </span>
                        <span className="font-finance text-[#D4AF37]">
                          {assignment.service_price_cents
                            ? formatPrice(assignment.service_price_cents)
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-zinc-500">
                        <span>
                          {assignment.service_billing_unit
                            ? BILLING_UNIT_LABELS[assignment.service_billing_unit]
                            : '—'}
                        </span>
                        <span>Since: {formatDate(assignment.start_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-v-card p-4 text-center">
                  <p className="text-zinc-500 text-sm">No services assigned</p>
                </div>
              )}
            </section>

            {/* Documents Section (Placeholder) */}
            <section>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                Documents
              </h3>
              <div className="glass-card rounded-v-card p-4 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                <p className="text-zinc-500 text-sm">No documents</p>
                <p className="text-zinc-600 text-xs mt-1">
                  Document uploads coming soon
                </p>
              </div>
            </section>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-zinc-500">No horse selected</p>
          </div>
        )}
      </div>
    </div>
  );
}
