-- Add approved_at column to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approved_at timestamptz;
