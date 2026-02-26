/**
 * @module app/settings/stable
 * @description Stable settings page with branding and invoice defaults
 * @safety GREEN
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Loader2, Save, Lock, Unlock } from 'lucide-react';

export default function StableSettingsPage() {
  // Stable ID
  const [stableId, setStableId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Branding fields
  const [stableName, setStableName] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [stableAddress, setStableAddress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Invoice defaults fields
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [swiftBic, setSwiftBic] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [templateLocked, setTemplateLocked] = useState(false);

  // UI states
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch stable data on mount
  const fetchStableData = useCallback(async () => {
    try {
      // First get the current user's stable
      const userResponse = await fetch('/api/auth/me');
      if (!userResponse.ok) return;
      const userData = await userResponse.json();
      const id = userData.stable_id;
      if (!id) return;

      setStableId(id);

      // Fetch branding data
      const response = await fetch(`/api/stable/branding?stableId=${id}`);
      if (!response.ok) return;

      const data = await response.json();
      if (data.stable) {
        setStableName(data.stable.name || '');
        setLogoPreview(data.stable.logo_url || null);
        setTermsAndConditions(data.stable.invoice_default_terms || '');
        setBankName(data.stable.bank_name || '');
        setAccountNumber(data.stable.account_number || '');
        setIban(data.stable.iban || '');
        setVatNumber(data.stable.vat_number || '');
        setSwiftBic(data.stable.swift_bic || '');
        setStableAddress(data.stable.address || '');
        setTemplateLocked(data.stable.branding_template_locked || false);
      }
    } catch {
      // Failed to fetch stable data
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStableData();
  }, [fetchStableData]);

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
    if (!stableId) return;

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/stable/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stableId,
          name: stableName,
          invoice_default_terms: termsAndConditions,
          bank_name: bankName,
          account_number: accountNumber,
          iban,
          vat_number: vatNumber,
          swift_bic: swiftBic,
          address: stableAddress,
          branding_template_locked: templateLocked,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to save settings');
        return;
      }

      setSuccessMessage('Settings saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setErrorMessage('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Stable Settings</h1>
          <p className="text-zinc-400 mt-1">Loading...</p>
        </div>
      </div>
    );
  }

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

          {/* Business Address */}
          <div>
            <label
              htmlFor="stable-address"
              className="block text-sm font-medium text-zinc-400 mb-2"
            >
              Business Address
            </label>
            <textarea
              id="stable-address"
              value={stableAddress}
              onChange={(e) => setStableAddress(e.target.value)}
              placeholder="Your business address for invoices"
              rows={3}
              className="w-full px-4 py-2.5 bg-surface border border-zinc-700 rounded-v-card text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-stable-gold/50 transition-colors resize-none"
            />
          </div>

          {/* VAT Number */}
          <div>
            <label
              htmlFor="vat-number"
              className="block text-sm font-medium text-zinc-400 mb-2"
            >
              VAT Number
            </label>
            <input
              id="vat-number"
              type="text"
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
              placeholder="CHE-xxx.xxx.xxx"
              className="w-full px-4 py-2.5 bg-surface border border-zinc-700 rounded-v-card text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-stable-gold/50 transition-colors"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Swiss VAT format: CHE-xxx.xxx.xxx
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

          {/* Swift/BIC */}
          <div>
            <label
              htmlFor="swift-bic"
              className="block text-sm font-medium text-zinc-400 mb-2"
            >
              Swift/BIC
            </label>
            <input
              id="swift-bic"
              type="text"
              value={swiftBic}
              onChange={(e) => setSwiftBic(e.target.value)}
              placeholder="Enter Swift/BIC code"
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

          {/* Template Lock Toggle */}
          <div className="pt-2 border-t border-zinc-700/50">
            <button
              type="button"
              onClick={() => setTemplateLocked(!templateLocked)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-v-card border transition-all ${
                templateLocked
                  ? 'border-stable-gold/50 bg-stable-gold/10'
                  : 'border-zinc-700 bg-surface hover:border-zinc-600'
              }`}
            >
              {templateLocked ? (
                <Lock className="w-5 h-5 text-stable-gold" />
              ) : (
                <Unlock className="w-5 h-5 text-zinc-500" />
              )}
              <div className="text-left">
                <p className="text-sm font-medium text-zinc-100">
                  Lock Invoice Template
                </p>
                <p className="text-xs text-zinc-500">
                  {templateLocked
                    ? 'Invoice preview is skipped - invoices generate directly'
                    : 'Preview invoices before generating'}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-stable-emerald/10 border border-stable-emerald/30 rounded-v-card text-stable-emerald text-sm">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-v-card text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving || !stableId}
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
