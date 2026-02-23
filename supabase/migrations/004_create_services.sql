-- Migration: Create services table
-- Description: Service catalog for stables (multi-tenant)
-- Safety: RED

create table services (
  id uuid primary key default gen_random_uuid(),
  stable_id uuid not null references stables(id) on delete cascade,
  name text not null,
  description text,
  price_cents int not null,
  billing_unit text not null check (billing_unit in ('one_time', 'monthly', 'per_session')),
  archived boolean default false,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table services enable row level security;

-- RLS Policy: Users can view services in their own stable
create policy "Users can view own stable services"
  on services for select
  using (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert services in their own stable
create policy "Users can create services in own stable"
  on services for insert
  with check (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- RLS Policy: Users can update services in their own stable
create policy "Users can update own stable services"
  on services for update
  using (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete services in their own stable
create policy "Users can delete own stable services"
  on services for delete
  using (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- Index for faster lookups by stable
create index services_stable_id_idx on services(stable_id);

-- Index for filtering non-archived services
create index services_archived_idx on services(archived) where archived = false;
