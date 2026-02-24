/**
 * @module clients/ui
 * @description Premium drawer for assigning new services to a client
 * @safety GREEN
 */

'use client';

import { useState, useMemo } from 'react';
import { X, Search, Zap } from 'lucide-react';
import type { Service, BillingUnit } from '@/modules/services/domain/service.types';

interface AddServiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: Service[];
  onSelect: (serviceId: string) => void;
}

const BILLING_UNIT_LABELS: Record<BillingUnit, string> = {
  one_time: 'One-time',
  monthly: 'Monthly',
  per_session: 'Per Session',
};

function formatPrice(cents: number): string {
  return `CHF ${(cents / 100).toFixed(2)}`;
}

export function AddServiceDrawer({ isOpen, onClose, catalog, onSelect }: AddServiceDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return catalog;
    const query = searchQuery.toLowerCase();
    return catalog.filter(
      (service) =>
        service.name.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query)
    );
  }, [catalog, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md h-full bg-zinc-950 border-l border-white/10 p-8 shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="text-stable-gold" size={20} />
            Assign Service
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Search Catalog */}
        <div className="relative mb-6">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Search catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-stable-gold/50 transition-all"
          />
        </div>

        {/* Catalog List */}
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-2">
          {filteredCatalog.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">
              {searchQuery ? 'No services match your search.' : 'No services available.'}
            </p>
          ) : (
            filteredCatalog.map((service) => (
              <button
                key={service.id}
                onClick={() => onSelect(service.id)}
                className="w-full text-left p-4 rounded-xl border border-white/5 hover:border-stable-gold/30 hover:bg-stable-gold/5 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-zinc-200 group-hover:text-white transition-colors">
                    {service.name}
                  </span>
                  <span className="font-finance text-stable-gold">
                    {formatPrice(service.price_cents)}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {BILLING_UNIT_LABELS[service.billing_unit]}
                </p>
                {service.description && (
                  <p className="text-xs text-zinc-600 mt-1 line-clamp-1">
                    {service.description}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
