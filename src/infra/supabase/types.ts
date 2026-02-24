/**
 * @module infra/supabase
 * @description Type definitions for Supabase database schema
 * @safety RED
 */

// TODO: Generate proper types from Supabase CLI: npx supabase gen types typescript
// For now, use a permissive type to allow development

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Database = {
  public: {
    Tables: {
      stables: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      clients: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      horses: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      services: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      assignments: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      service_assignments: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      invoices: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      invoice_lines: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      billing_periods: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      payments: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      import_jobs: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */
