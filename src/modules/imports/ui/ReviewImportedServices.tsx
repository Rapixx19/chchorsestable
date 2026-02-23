/**
 * @module imports/ui
 * @description Review and edit parsed services before saving to catalog
 * @safety GREEN
 */

'use client';

import { useState, useMemo } from 'react';
import type { ParsedServiceCandidate } from '../domain/imports.types';
import type { BillingUnit } from '@/modules/services/domain/service.types';

interface ReviewImportedServicesProps {
  candidates: ParsedServiceCandidate[];
  stableId: string | null;
  onSave: (services: ParsedServiceCandidate[]) => Promise<void>;
  onCancel: () => void;
}

interface EditableCandidate extends ParsedServiceCandidate {
  _id: string;
  _selected: boolean;
}

const BILLING_UNIT_LABELS: Record<BillingUnit, string> = {
  one_time: 'One-time',
  monthly: 'Monthly',
  per_session: 'Per session',
};

function normalizeServiceName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function parsePriceToCents(value: string): number {
  const parsed = parseFloat(value.replace(/[^\d.]/g, ''));
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function ReviewImportedServices({
  candidates,
  stableId,
  onSave,
  onCancel,
}: ReviewImportedServicesProps) {
  const [services, setServices] = useState<EditableCandidate[]>(() =>
    candidates.map((c, i) => ({
      ...c,
      _id: `${i}-${Date.now()}`,
      _selected: true,
    }))
  );
  const [saving, setSaving] = useState(false);

  // Detect duplicates by normalized name
  const duplicateNames = useMemo(() => {
    const nameCounts = new Map<string, number>();
    services.forEach((s) => {
      if (s._selected) {
        const normalized = normalizeServiceName(s.name);
        nameCounts.set(normalized, (nameCounts.get(normalized) || 0) + 1);
      }
    });
    return new Set(
      Array.from(nameCounts.entries())
        .filter(([, count]) => count > 1)
        .map(([name]) => name)
    );
  }, [services]);

  const selectedCount = services.filter((s) => s._selected).length;
  const lowConfidenceCount = services.filter((s) => s._selected && s.confidence < 0.7).length;

  const updateService = (id: string, updates: Partial<EditableCandidate>) => {
    setServices((prev) =>
      prev.map((s) => (s._id === id ? { ...s, ...updates } : s))
    );
  };

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((s) => s._id !== id));
  };

  const handleSave = async () => {
    if (!stableId) return;

    setSaving(true);
    try {
      const toSave = services
        .filter((s) => s._selected)
        .map((s) => ({
          name: s.name,
          price_cents: s.price_cents,
          billing_unit: s.billing_unit,
          notes: s.notes,
          confidence: s.confidence,
        }));
      await onSave(toSave);
    } finally {
      setSaving(false);
    }
  };

  if (services.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-white text-center">
        <p className="text-gray-500">No services were extracted from the PDF.</p>
        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Review Imported Services</h2>
        <p className="text-sm text-gray-500 mt-1">
          {selectedCount} service{selectedCount !== 1 ? 's' : ''} selected
          {lowConfidenceCount > 0 && (
            <span className="text-amber-600 ml-2">
              ({lowConfidenceCount} with low confidence)
            </span>
          )}
          {duplicateNames.size > 0 && (
            <span className="text-orange-600 ml-2">
              ({duplicateNames.size} potential duplicate{duplicateNames.size !== 1 ? 's' : ''})
            </span>
          )}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 w-10">
                <span className="sr-only">Include</span>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 w-32">Price</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 w-36">Billing</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 w-24">Confidence</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 w-20">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {services.map((service) => {
              const isDuplicate = duplicateNames.has(normalizeServiceName(service.name));
              const isLowConfidence = service.confidence < 0.7;

              return (
                <tr
                  key={service._id}
                  className={`
                    ${!service._selected ? 'bg-gray-50 opacity-60' : ''}
                    ${isDuplicate && service._selected ? 'bg-orange-50' : ''}
                    ${isLowConfidence && service._selected && !isDuplicate ? 'bg-amber-50' : ''}
                  `}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={service._selected}
                      onChange={(e) => updateService(service._id, { _selected: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={service.name}
                      onChange={(e) => updateService(service._id, { name: e.target.value })}
                      disabled={!service._selected}
                      className="w-full px-2 py-1 border rounded text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    {isDuplicate && service._selected && (
                      <p className="text-xs text-orange-600 mt-1">Potential duplicate name</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">CHF</span>
                      <input
                        type="text"
                        value={formatPrice(service.price_cents)}
                        onChange={(e) =>
                          updateService(service._id, { price_cents: parsePriceToCents(e.target.value) })
                        }
                        disabled={!service._selected}
                        className="w-full pl-10 pr-2 py-1 border rounded text-sm text-right disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={service.billing_unit}
                      onChange={(e) =>
                        updateService(service._id, { billing_unit: e.target.value as BillingUnit })
                      }
                      disabled={!service._selected}
                      className="w-full px-2 py-1 border rounded text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      {Object.entries(BILLING_UNIT_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`
                          w-12 h-2 rounded-full overflow-hidden bg-gray-200
                        `}
                      >
                        <div
                          className={`
                            h-full transition-all
                            ${service.confidence >= 0.7 ? 'bg-green-500' : ''}
                            ${service.confidence >= 0.4 && service.confidence < 0.7 ? 'bg-amber-500' : ''}
                            ${service.confidence < 0.4 ? 'bg-red-500' : ''}
                          `}
                          style={{ width: `${service.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round(service.confidence * 100)}%
                      </span>
                      {isLowConfidence && (
                        <svg
                          className="w-4 h-4 text-amber-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeService(service._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="Remove"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t flex items-center justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <div className="flex items-center gap-3">
          {!stableId && (
            <span className="text-sm text-amber-600">
              Select a stable to save services
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!stableId || selectedCount === 0 || saving}
            className={`
              px-4 py-2 rounded-md text-sm font-medium
              ${stableId && selectedCount > 0 && !saving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
            `}
          >
            {saving ? 'Saving...' : `Save ${selectedCount} Service${selectedCount !== 1 ? 's' : ''} to Catalog`}
          </button>
        </div>
      </div>
    </div>
  );
}
