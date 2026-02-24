/**
 * @module app/settings
 * @description Settings page for stable branding configuration
 * @safety GREEN
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { StableBrandSettings } from '@/modules/stable/ui';
import type { Stable } from '@/modules/stable/domain/stable.types';

async function getStableForUser(): Promise<Stable | null> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only in Server Components
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: stable } = await supabase
    .from('stables')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (!stable) {
    return null;
  }

  return {
    id: stable.id,
    name: stable.name,
    owner_id: stable.owner_id,
    created_at: new Date(stable.created_at),
    logo_url: stable.logo_url || undefined,
    invoice_default_terms: stable.invoice_default_terms || undefined,
  };
}

export default async function SettingsPage() {
  const stable = await getStableForUser();

  if (!stable) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
        <p className="text-zinc-400 mt-1">
          Customize your stable branding and invoice defaults.
        </p>
      </div>

      <StableBrandSettings stable={stable} />
    </div>
  );
}
