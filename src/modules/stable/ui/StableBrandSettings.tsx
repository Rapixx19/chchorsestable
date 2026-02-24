/**
 * @module stable/ui
 * @description Settings component for stable branding customization
 * @safety GREEN
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Loader2, Save } from 'lucide-react';
import type { Stable } from '../domain/stable.types';

interface StableBrandSettingsProps {
  stable: Stable;
}

export default function StableBrandSettings({ stable }: StableBrandSettingsProps) {
  const [name, setName] = useState(stable.name);
  const [invoiceTerms, setInvoiceTerms] = useState(stable.invoice_default_terms || '');
  const [logoUrl, setLogoUrl] = useState(stable.logo_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMessage(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('logo', file);
    formData.append('stableId', stable.id);

    try {
      const response = await fetch('/api/stable/branding', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setLogoUrl(data.logo_url);
      setSuccessMessage('Logo uploaded successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [stable.id]);

  const handleSave = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch('/api/stable/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stableId: stable.id,
          name,
          invoice_default_terms: invoiceTerms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Save failed');
      }

      setSuccessMessage('Settings saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    name !== stable.name ||
    invoiceTerms !== (stable.invoice_default_terms || '');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Settings Form */}
      <div className="glass-card rounded-v-card p-6 space-y-6">
        <h2 className="text-xl font-semibold text-zinc-100">Brand Settings</h2>

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Stable Logo
          </label>
          <div
            onClick={handleLogoClick}
            className="relative w-32 h-32 rounded-v-card bg-surface border-2 border-dashed border-zinc-700 hover:border-stable-gold cursor-pointer transition-colors overflow-hidden group"
          >
            {logoUrl ? (
              <>
                <img
                  src={logoUrl}
                  alt="Stable logo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 group-hover:text-stable-gold transition-colors">
                <Camera className="w-8 h-8 mb-2" />
                <span className="text-xs">Upload Logo</span>
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-stable-gold animate-spin" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-xs text-zinc-500 mt-2">
            JPG, PNG or WebP. Max 2MB.
          </p>
        </div>

        {/* Stable Name */}
        <div>
          <label htmlFor="stable-name" className="block text-sm font-medium text-zinc-400 mb-2">
            Stable Name
          </label>
          <input
            id="stable-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter stable name"
            className="w-full px-4 py-2 bg-surface border border-zinc-700 rounded-v-card text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-stable-gold transition-colors"
            maxLength={100}
          />
        </div>

        {/* Invoice Terms */}
        <div>
          <label htmlFor="invoice-terms" className="block text-sm font-medium text-zinc-400 mb-2">
            Default Invoice Terms
          </label>
          <textarea
            id="invoice-terms"
            value={invoiceTerms}
            onChange={(e) => setInvoiceTerms(e.target.value)}
            placeholder="Payment terms, bank details, notes..."
            rows={4}
            className="w-full px-4 py-2 bg-surface border border-zinc-700 rounded-v-card text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-stable-gold transition-colors resize-none"
          />
          <p className="text-xs text-zinc-500 mt-1">
            These terms will appear at the bottom of your invoices.
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-v-card text-red-400 text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-stable-emerald/10 border border-stable-emerald/30 rounded-v-card text-stable-emerald text-sm">
            {successMessage}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="flex items-center justify-center gap-2 w-full py-3 bg-stable-gold text-black font-semibold rounded-v-card hover:bg-stable-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Live Preview */}
      <div className="glass-card rounded-v-card p-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-6">Invoice Preview</h2>

        <div className="bg-white rounded-lg p-6 text-black">
          {/* Invoice Header Preview */}
          <div className="flex items-start justify-between border-b border-gray-200 pb-4 mb-4">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                  <Camera className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg">{name || 'Your Stable Name'}</h3>
                <p className="text-sm text-gray-500">Invoice #INV-001</p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Date: {new Date().toLocaleDateString()}</p>
              <p>Due: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Sample Invoice Lines */}
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span>Horse boarding - Thunder</span>
              <span className="font-finance">$500.00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span>Training session x4</span>
              <span className="font-finance">$200.00</span>
            </div>
            <div className="flex justify-between py-2 font-bold">
              <span>Total</span>
              <span className="font-finance">$700.00</span>
            </div>
          </div>

          {/* Invoice Terms Preview */}
          {invoiceTerms && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-xs text-gray-500 font-medium mb-1">Terms & Conditions</p>
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{invoiceTerms}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
