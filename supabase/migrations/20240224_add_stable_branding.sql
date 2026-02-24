-- Migration: Add branding fields to stables table
-- Description: Adds logo_url and invoice_default_terms columns for stable branding

ALTER TABLE stables ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE stables ADD COLUMN IF NOT EXISTS invoice_default_terms TEXT;

-- Create storage bucket for stable logos (run in Supabase Dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'stable-logos',
--   'stable-logos',
--   true,
--   2097152, -- 2MB
--   ARRAY['image/jpeg', 'image/png', 'image/webp']
-- );

-- Storage policies for stable-logos bucket (run after bucket creation):
-- Policy: Allow authenticated users to upload to their own stable folder
-- CREATE POLICY "Stable owners can upload logos"
--   ON storage.objects
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'stable-logos');

-- Policy: Allow public read access for logos (needed for invoice display)
-- CREATE POLICY "Public can view logos"
--   ON storage.objects
--   FOR SELECT
--   TO public
--   USING (bucket_id = 'stable-logos');

-- Policy: Allow stable owners to delete their logos
-- CREATE POLICY "Stable owners can delete logos"
--   ON storage.objects
--   FOR DELETE
--   TO authenticated
--   USING (bucket_id = 'stable-logos');
