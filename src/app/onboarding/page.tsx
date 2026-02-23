/**
 * @module app/onboarding
 * @description Onboarding page for new users to create a stable
 * @safety GREEN
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { CreateStableForm } from '@/modules/stable/ui';

export default async function OnboardingPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="flex items-center justify-center min-h-screen">
      <CreateStableForm ownerId={user.id} />
    </main>
  );
}
