/**
 * @module app/services
 * @description Services catalog management page
 * @safety GREEN
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Upload, Trash2 } from 'lucide-react';
import { supabase } from '@/infra/supabase/client';
import { BulkUploadDrawer } from '@/modules/services/ui';
import { serviceService } from '@/modules/services/services/service.service';
import type { Service, BillingUnit, CreateServiceInput } from '@/modules/services/domain/service.types';

const BILLING_UNIT_OPTIONS: { value: BillingUnit; label: string }[] = [
  { value: 'per_session', label: 'Per Session' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'one_time', label: 'One-time' },
];

export default function ServicesPage() {
  const [stableId, setStableId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    billing_unit: 'per_session' as BillingUnit,
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadServices = useCallback(async (stableId: string) => {
    const result = await serviceService.getServicesByStable(stableId);
    if (result.success && result.services) {
      setServices(result.services);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: stable } = await supabase
        .from('stables')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (stable) {
        setStableId(stable.id);
        await loadServices(stable.id);
      }
      setIsLoading(false);
    }

    init();
  }, [loadServices]);

  const handleRefresh = useCallback(() => {
    if (stableId) {
      loadServices(stableId);
    }
  }, [stableId, loadServices]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stableId) return;

    setIsSubmitting(true);

    const input: CreateServiceInput = {
      stable_id: stableId,
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price_cents: Math.round(parseFloat(formData.price) * 100),
      billing_unit: formData.billing_unit,
    };

    const result = await serviceService.createService(input);

    if (result.success) {
      setFormData({ name: '', price: '', billing_unit: 'per_session', description: '' });
      setIsAddFormOpen(false);
      handleRefresh();
    }

    setIsSubmitting(false);
  };

  const handleArchiveService = async (service: Service) => {
    if (!confirm(`Archive "${service.name}"? This cannot be undone.`)) return;

    const result = await serviceService.archiveService(service.id);
    if (result.success) {
      handleRefresh();
    }
  };

  if (isLoading) {
    return (
      <main className="p-6">
        <p className="text-zinc-500">Loading...</p>
      </main>
    );
  }

  if (!stableId) {
    return (
      <main className="p-6">
        <p className="text-zinc-500">No stable found.</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Services</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage your service catalog</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsBulkUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-white/10 rounded-v-card text-zinc-300 hover:bg-white/5 transition-colors"
          >
            <Upload size={16} />
            Bulk Import
          </button>
          <button
            onClick={() => setIsAddFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-stable-gold text-black font-semibold rounded-v-card hover:bg-stable-gold/90 transition-colors"
          >
            <Plus size={16} />
            Add Service
          </button>
        </div>
      </div>

      {/* Add Service Form */}
      {isAddFormOpen && (
        <div className="glass-card rounded-v-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Add New Service</h2>
          <form onSubmit={handleAddService} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  minLength={2}
                  className="w-full px-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-v-card text-white placeholder-zinc-500 focus:outline-none focus:border-stable-gold/50 transition-all"
                  placeholder="Service name"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Price (CHF)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-v-card text-white placeholder-zinc-500 focus:outline-none focus:border-stable-gold/50 transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Billing Unit</label>
                <select
                  value={formData.billing_unit}
                  onChange={(e) => setFormData({ ...formData, billing_unit: e.target.value as BillingUnit })}
                  className="w-full px-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-v-card text-white focus:outline-none focus:border-stable-gold/50 transition-all"
                >
                  {BILLING_UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-v-card text-white placeholder-zinc-500 focus:outline-none focus:border-stable-gold/50 transition-all"
                  placeholder="Brief description"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-stable-gold text-black font-semibold rounded-v-card hover:bg-stable-gold/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Service'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      {services.length === 0 ? (
        <div className="glass-card rounded-v-card p-12 text-center">
          <p className="text-zinc-500 mb-4">No services in your catalog yet.</p>
          <p className="text-zinc-600 text-sm">
            Add services individually or use bulk import to get started.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-v-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800/50">
              <tr className="text-left text-zinc-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4">Billing</th>
                <th className="px-6 py-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">
                    {service.name}
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {service.description || '—'}
                  </td>
                  <td className="px-6 py-4 text-right text-stable-gold font-finance">
                    CHF {(service.price_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {service.billing_unit === 'monthly' && 'Monthly'}
                    {service.billing_unit === 'per_session' && 'Per Session'}
                    {service.billing_unit === 'one_time' && 'One-time'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleArchiveService(service)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Archive service"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Upload Drawer */}
      <BulkUploadDrawer
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onSuccess={handleRefresh}
      />
    </main>
  );
}
