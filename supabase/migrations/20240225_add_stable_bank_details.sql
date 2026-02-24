-- Migration: Add bank details to stables table
-- Description: Adds bank_name, account_number, and iban columns for invoice branding

ALTER TABLE stables ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE stables ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE stables ADD COLUMN IF NOT EXISTS iban TEXT;
