/**
 * @module app/settings/stable
 * @description Stable settings page with branding and invoice defaults
 * @safety GREEN
 */

'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, Save } from 'lucide-react';

export default function StableSettingsPage() {
  // Branding fields
  const [stableName, setStableName] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Invoice defaults fields
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  // UI states
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const url = URL.createObjectURL(file);
    setLogoPreview(url);

    // Reset input for re-selection
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage(null);

    // Mock save action
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSaving(false);
    setSuccessMessage('Settings saved successfully');

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Stable Settings</h1>
        <p className="text-zinc-400 mt-1">
          Configure your stable branding and invoice defaults.
        </p>
      </div>

      {/* 2-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Branding */}
        <div className="glass-card rounded-v-card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-zinc-100 border-b border-zinc-700/50 pb-3">
            Branding
          </h2>

          {/* Stable Name */}
          <div>
            <label
              htmlFor="stable-name"
              className="block text-sm font-medium text-zinc-400 mb-2"
            >
              Stable Name
            </label>
            <input
              id="stable-name"
              type="text"
              value={stableName}
              onChange={(e) => setStableName(e.target.value)}
              placeholder="Enter your stable name"
              className="w-full px-4 py-2.5 bg-surface border border-zinc-700 rounded-v-card text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-stable-gold/50 transition-colors"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Stable Logo
            </label>
            <div
              onClick={handleLogoClick}
              className="relative w-32 h-32 rounded-v-card bg-surface border-2 border-dashed border-zinc-700 hover:border-stable-gold/50 cursor-pointer transition-colors overflow-hidden group"
            >
              {logoPreview ? (
                <>
                  <img
                    src={logoPreview}
                    alt="Stable logo preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 group-hover:text-stable-gold/70 transition-colors">
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-xs">Upload Logo</span>
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
        </div>

        {/* Column 2: Invoice Defaults */}
        <div className="glass-card rounded-v-card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-zinc-100 border-b border-zinc-700/50 pb-3">
            Invoice Defaults
          </h2>

          {/* Bank Name */}
          <div>
            <label
              htmlFor="bank-name"
              className="block text-sm font-medium text-zinc-400 mb-2"
            >
              Bank Name
            </label>
            <input
              id="bank-name"
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Enter bank name"
              className="w-full px-4 py-2.5 bg-surface border border-zinc-700 rounded-v-card text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-stable-gold/50 transition-colors"
            />
          </div>

          {/* Account Number */}
          <div>
            <label
              htmlFor="account-number"
              className="block text-sm font-medium text-zinc-400 mb-2"
            >
              Account Number
            </label>
            <input
              id="account-number"
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter account number"
              className="w-full px-4 py-2.5 bg-surface border border-zinc-700 rounded-v-card text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-stable-gold/50 transition-colors"
            />
          </div>

          {/* IBAN */}
          <div>
            <label
              htmlFor="iban"
              className="block text-sm font-medium text-zinc-400 mb-2"
            >
              IBAN
            </label>
            <input
              id="iban"
              type="text"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="Enter IBAN"
              className="w-full px-4 py-2.5 bg-surface border border-zinc-700 rounded-v-card text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-stable-gold/50 transition-colors"
            />
          </div>

          {/* Terms & Conditions */}
          <div>
            <label
              htmlFor="terms"
              className="block text-sm font-medium text-zinc-400 mb-2"
            >
              Terms & Conditions
            </label>
            <textarea
              id="terms"
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              placeholder="Payment terms, policies, notes..."
              rows={4}
              className="w-full px-4 py-2.5 bg-surface border border-zinc-700 rounded-v-card text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-stable-gold/50 transition-colors resize-none"
            />
            <p className="text-xs text-zinc-500 mt-1">
              These terms will appear at the bottom of your invoices.
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-stable-emerald/10 border border-stable-emerald/30 rounded-v-card text-stable-emerald text-sm">
          {successMessage}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="flex items-center justify-center gap-2 w-full lg:w-auto lg:px-8 py-3 bg-stable-gold text-black font-semibold rounded-v-card hover:bg-stable-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
  );
}
