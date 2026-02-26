-- Migration: Expand stable branding fields for Swiss invoicing
-- Description: Adds VAT number, Swift/BIC, address, and template lock columns

ALTER TABLE stables ADD COLUMN IF NOT EXISTS vat_number TEXT;
ALTER TABLE stables ADD COLUMN IF NOT EXISTS swift_bic TEXT;
ALTER TABLE stables ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE stables ADD COLUMN IF NOT EXISTS branding_template_locked BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN stables.vat_number IS 'Swiss VAT: CHE-xxx.xxx.xxx';
COMMENT ON COLUMN stables.swift_bic IS 'SWIFT/BIC code';
COMMENT ON COLUMN stables.address IS 'Business address for invoices';
COMMENT ON COLUMN stables.branding_template_locked IS 'Skip preview when true';
