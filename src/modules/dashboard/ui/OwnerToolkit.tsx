/**
 * @module dashboard/ui
 * @description Onboarding toolkit card for stable owners
 * @safety GREEN
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wrench, Upload, Palette, Send, Copy, Check } from 'lucide-react';
import { supabase } from '@/infra/supabase/client';

interface StableStatus {
  id: string;
  logo_url: string | null;
  bank_name: string | null;
  owner_telegram_chat_id: string | null;
}

function StatusIndicator({ complete }: { complete: boolean }) {
  if (complete) {
    return (
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stable-emerald/20 text-stable-emerald">
        <Check size={12} strokeWidth={3} />
      </span>
    );
  }
  return (
    <span className="w-5 h-5 rounded-full border-2 border-stable-gold/50" />
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded hover:bg-white/10 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={14} className="text-stable-emerald" />
      ) : (
        <Copy size={14} className="text-zinc-400" />
      )}
    </button>
  );
}

export default function OwnerToolkit() {
  const [status, setStatus] = useState<StableStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStableStatus() {
      const { data } = await supabase
        .from('stables')
        .select('id, logo_url, bank_name, owner_telegram_chat_id')
        .single();

      if (data) {
        setStatus(data as StableStatus);
      }
      setIsLoading(false);
    }

    fetchStableStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="glass-card p-6 rounded-2xl border border-stable-gold/20 mb-8 animate-pulse">
        <div className="h-6 w-48 bg-zinc-700 rounded mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-700/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const brandingComplete = !!(status?.logo_url && status?.bank_name);
  const telegramComplete = !!status?.owner_telegram_chat_id;

  return (
    <div className="glass-card p-6 rounded-2xl border border-stable-gold/20 mb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-stable-gold/10 border border-stable-gold/20">
          <Wrench size={20} className="text-stable-gold" />
        </div>
        <h2 className="text-lg font-semibold text-white">Stable Owner&apos;s Toolkit</h2>
      </div>

      {/* Toolkit Items */}
      <div className="space-y-4">
        {/* Bulk Import Guide */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Upload size={18} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">Service Catalog</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Bulk import your price list via CSV.
              </p>
              <p className="text-xs text-zinc-500 mt-2 font-mono">
                Columns: name, price, unit (monthly/per_session/one_time), description
              </p>
            </div>
          </div>
        </div>

        {/* Branding Check */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Palette size={18} className="text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Professional Branding</h3>
                <StatusIndicator complete={brandingComplete} />
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Upload your logo and bank details for branded PDFs.
              </p>
              <Link
                href="/settings/stable"
                className="inline-block mt-3 px-3 py-1.5 text-xs font-medium text-stable-gold bg-stable-gold/10 border border-stable-gold/20 rounded-lg hover:bg-stable-gold/20 transition-colors"
              >
                Configure Branding
              </Link>
            </div>
          </div>
        </div>

        {/* Telegram Remote */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
              <Send size={18} className="text-sky-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Telegram Manager Mode</h3>
                <StatusIndicator complete={telegramComplete} />
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Manage clients and services from the barn.
              </p>
              <div className="mt-3 p-2 rounded-lg bg-black/20 border border-white/5">
                <p className="text-xs text-zinc-500 mb-1">Send this command to the bot:</p>
                <div className="flex items-center">
                  <code className="text-xs text-sky-400 font-mono">
                    /manager {status?.id || '<STABLE_ID>'}
                  </code>
                  {status?.id && <CopyButton text={`/manager ${status.id}`} />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
