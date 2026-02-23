/**
 * @module infra/supabase
 * @description Type definitions for Supabase database schema
 * @safety RED
 */

export type Database = {
  public: {
    Tables: Record<string, never>; // TODO: Generate from Supabase CLI
    Views: Record<string, never>; // TODO: Generate from Supabase CLI
    Functions: Record<string, never>; // TODO: Generate from Supabase CLI
    Enums: Record<string, never>; // TODO: Generate from Supabase CLI
  };
};
