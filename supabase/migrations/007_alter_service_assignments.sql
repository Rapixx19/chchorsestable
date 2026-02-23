-- Migration: Alter service_assignments table
-- Description: Add client_id, quantity, change horse_id nullable, replace status with active
-- Safety: RED

-- Add client_id column (initially nullable for migration)
alter table service_assignments add column client_id uuid references clients(id) on delete cascade;

-- Add quantity column with default 1
alter table service_assignments add column quantity integer not null default 1 check (quantity > 0);

-- Add active column (default to true)
alter table service_assignments add column active boolean not null default true;

-- Populate client_id from horse's client_id for existing records
update service_assignments sa
set client_id = h.client_id
from horses h
where sa.horse_id = h.id and sa.client_id is null;

-- Convert status to active boolean for existing records
update service_assignments
set active = (status = 'active');

-- Make horse_id nullable
alter table service_assignments alter column horse_id drop not null;

-- Make client_id required (after population)
alter table service_assignments alter column client_id set not null;

-- Drop the old status column and its check constraint
alter table service_assignments drop column status;

-- Drop the old status index
drop index if exists service_assignments_status_idx;

-- Create new index on active
create index service_assignments_active_idx on service_assignments(active) where active = true;

-- Create index on client_id
create index service_assignments_client_id_idx on service_assignments(client_id);
