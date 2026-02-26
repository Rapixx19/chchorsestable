/**
 * @module clients/ui
 * @description Client detail view with assignments
 * @safety GREEN
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MessageCircle, Calendar, Plus, Trash2, FileText, Edit2, MapPin, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { clientService } from '../services/client.service';
import { assignmentService } from '@/modules/assignments/services/assignment.service';
import { serviceService } from '@/modules/services/services/service.service';
import { stableService } from '@/modules/stable/services';
import { AddServiceDrawer } from './AddServiceDrawer';
import { EditClientForm } from './EditClientForm';
import { ManagedHorsesSection } from './ManagedHorsesSection';
import { InvoicePreviewModal } from '@/modules/invoices/ui';
import type { Client } from '../domain/client.types';
import type { AssignmentWithDetails } from '@/modules/assignments/domain/assignment.types';
import type { Service } from '@/modules/services/domain/service.types';

interface ClientDetailProps {
  clientId: string;
}

const BILLING_UNIT_LABELS: Record<string, string> = {
  one_time: 'One-time',
  monthly: 'Monthly',
  per_session: 'Per Session',
};

function formatPrice(cents: number): string {
  return `CHF ${(cents / 100).toFixed(2)}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ClientDetail({ clientId }: ClientDetailProps) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [catalog, setCatalog] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTemplateLocked, setIsTemplateLocked] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [clientResult, assignmentsResult] = await Promise.all([
      clientService.getClientById(clientId),
      assignmentService.getAssignmentsByClient(clientId),
    ]);

    if (!clientResult.success) {
      setError(clientResult.error ?? 'Failed to load client');
      setIsLoading(false);
      return;
    }

    setClient(clientResult.client ?? null);
    setAssignments(assignmentsResult.assignments ?? []);

    // Fetch service catalog using the client's stable_id
    if (clientResult.client?.stable_id) {
      const [catalogResult, stableResult] = await Promise.all([
        serviceService.getServicesByStable(clientResult.client.stable_id),
        stableService.getStableById(clientResult.client.stable_id),
      ]);
      if (catalogResult.success) {
        setCatalog(catalogResult.services ?? []);
      }
      if (stableResult.success && stableResult.stable) {
        setIsTemplateLocked(stableResult.stable.branding_template_locked ?? false);
      }
    }

    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddService = async (serviceId: string) => {
    if (!client) return;

    const result = await assignmentService.createAssignment({
      stable_id: client.stable_id,
      client_id: clientId,
      service_id: serviceId,
      start_date: new Date(),
    });

    if (result.success) {
      setIsDrawerOpen(false);
      // Refresh the assignments list
      const assignmentsResult = await assignmentService.getAssignmentsByClient(clientId);
      if (assignmentsResult.success) {
        setAssignments(assignmentsResult.assignments ?? []);
      }
    } else {
      console.error('Failed to assign service:', result.error);
    }
  };

  const handleRemoveService = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this service?')) {
      return;
    }

    const result = await assignmentService.deleteAssignment(assignmentId);

    if (result.success) {
      // Refresh the assignments list
      const assignmentsResult = await assignmentService.getAssignmentsByClient(clientId);
      if (assignmentsResult.success) {
        setAssignments(assignmentsResult.assignments ?? []);
      }
    } else {
      console.error('Failed to remove service:', result.error);
    }
  };

  const handleGenerateInvoiceClick = () => {
    const activeCount = assignments.filter((a) => a.active).length;
    if (activeCount === 0) {
      alert('No active services to invoice.');
      return;
    }

    // If template is locked, skip preview and generate directly
    if (isTemplateLocked) {
      if (!confirm(`Generate an invoice with ${activeCount} active service${activeCount === 1 ? '' : 's'}?`)) {
        return;
      }
      generateInvoice();
    } else {
      // Open preview modal
      setIsPreviewOpen(true);
    }
  };

  const generateInvoice = async () => {
    setIsGeneratingInvoice(true);

    try {
      const response = await fetch(`/api/clients/${clientId}/generate-invoice`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error ?? 'Failed to generate invoice');
        return;
      }

      // Close preview modal if open
      setIsPreviewOpen(false);

      // Navigate to the new invoice
      router.push(`/invoices/${data.invoice_id}`);
    } catch (err) {
      console.error('Failed to generate invoice:', err);
      alert('Failed to generate invoice. Please try again.');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-v-card p-8">
        <p className="text-zinc-500 text-sm">Loading client...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="glass-card rounded-v-card p-8">
        <p className="text-red-400 text-sm">{error ?? 'Client not found'}</p>
      </div>
    );
  }

  const activeAssignments = assignments.filter((a) => a.active);
  const inactiveAssignments = assignments.filter((a) => !a.active);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Back to Clients
      </Link>

      {/* Client Info Card */}
      <div className="glass-card rounded-v-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0">
              {client.avatar_url ? (
                <Image
                  src={client.avatar_url}
                  alt={client.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-lg font-bold text-zinc-400">
                    {getInitials(client.name)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{client.name}</h2>
              <div className="mt-3 space-y-2">
                {client.email && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Mail size={16} />
                    <span className="text-sm">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Phone size={16} />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                )}
                {client.telegram_chat_id && (
                  <div className="flex items-center gap-2 text-stable-emerald">
                    <MessageCircle size={16} />
                    <span className="text-sm">Telegram connected</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-zinc-400 hover:text-stable-gold hover:bg-stable-gold/10 rounded-lg transition-colors"
            title="Edit client"
          >
            <Edit2 size={18} />
          </button>
        </div>

        {/* Address */}
        {client.address && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-start gap-2 text-zinc-400">
              <MapPin size={16} className="mt-0.5 flex-shrink-0" />
              <span className="text-sm whitespace-pre-line">{client.address}</span>
            </div>
          </div>
        )}

        {/* Emergency Contact */}
        {(client.emergency_contact_name || client.emergency_contact_phone) && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <AlertCircle size={12} />
              Emergency Contact
            </p>
            <div className="text-sm text-zinc-300">
              {client.emergency_contact_name && <span>{client.emergency_contact_name}</span>}
              {client.emergency_contact_name && client.emergency_contact_phone && <span className="text-zinc-600"> • </span>}
              {client.emergency_contact_phone && <span>{client.emergency_contact_phone}</span>}
            </div>
          </div>
        )}

        {/* Notes */}
        {client.notes && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Notes</p>
            <p className="text-sm text-zinc-300">{client.notes}</p>
          </div>
        )}
      </div>

      {/* Managed Horses */}
      <ManagedHorsesSection clientId={clientId} stableId={client.stable_id} />

      {/* Active Assignments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
            Active Services ({activeAssignments.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateInvoiceClick}
              disabled={isGeneratingInvoice || activeAssignments.length === 0}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stable-emerald border border-stable-emerald/30 rounded-lg hover:bg-stable-emerald/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText size={16} />
              {isGeneratingInvoice ? 'Generating...' : 'Generate Invoice'}
            </button>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stable-gold border border-stable-gold/30 rounded-lg hover:bg-stable-gold/10 transition-colors"
            >
              <Plus size={16} />
              Add Service
            </button>
          </div>
        </div>
        {activeAssignments.length === 0 ? (
          <div className="glass-card rounded-v-card p-6">
            <p className="text-zinc-500 text-sm">No active services assigned.</p>
          </div>
        ) : (
          <div className="glass-card rounded-v-card overflow-hidden">
            <div className="divide-y divide-white/5">
              {activeAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stable-gold">
                        {assignment.service_name}
                      </span>
                      {assignment.quantity > 1 && (
                        <span className="text-zinc-500 text-sm">×{assignment.quantity}</span>
                      )}
                    </div>
                    {assignment.horse_name && (
                      <p className="text-xs text-zinc-500 mt-1">{assignment.horse_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar size={14} />
                      <span className="text-xs">
                        {BILLING_UNIT_LABELS[assignment.service_billing_unit || 'one_time']}
                      </span>
                    </div>
                    {assignment.service_price_cents !== undefined && (
                      <span className="text-sm font-medium text-white font-finance">
                        {formatPrice(assignment.service_price_cents * assignment.quantity)}
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveService(assignment.id)}
                      className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove service"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inactive Assignments */}
      {inactiveAssignments.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
            Inactive Services ({inactiveAssignments.length})
          </h3>
          <div className="glass-card rounded-v-card overflow-hidden opacity-50">
            <div className="divide-y divide-white/5">
              {inactiveAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <span className="text-sm text-zinc-400">
                      {assignment.service_name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                    Inactive
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Service Drawer */}
      <AddServiceDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        catalog={catalog}
        onSelect={handleAddService}
      />

      {/* Edit Client Form Modal */}
      {isEditing && (
        <EditClientForm
          client={client}
          onSuccess={(updatedClient) => {
            setClient(updatedClient);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        clientId={clientId}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onConfirm={generateInvoice}
        isGenerating={isGeneratingInvoice}
      />
    </div>
  );
}
