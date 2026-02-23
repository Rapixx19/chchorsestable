/**
 * @module infra/supabase
 * @description Supabase client for browser/client-side usage
 * @safety RED
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';
import { env } from './env';

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
