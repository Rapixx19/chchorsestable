/**
 * @module infra/supabase/client
 * @description Supabase browser client with SSR cookie support
 * @safety RED
 */

import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
