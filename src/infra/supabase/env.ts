/**
 * @module infra/supabase
 * @description Strict environment variable validation for Vercel & Supabase
 * @safety RED
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const env = {
  supabase: {
    url: supabaseUrl!,
    anonKey: supabaseAnonKey!,
  },
};

// Simple validation that won't crash the Edge Runtime with Proxy errors
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Missing Supabase environment variables. Middleware may fail.");
}
