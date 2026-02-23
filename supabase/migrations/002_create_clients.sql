-- Migration: Create clients table
-- Description: Clients belong to a stable (multi-tenant)
-- Safety: RED

create table clients (
  id uuid primary key default gen_random_uuid(),
  stable_id uuid not null references stables(id),
  name text not null,
  email text,
  phone text,
  notes text,
  archived boolean default false,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table clients enable row level security;

-- RLS Policy: Users can view clients in their own stable
create policy "Users can view own stable clients"
  on clients for select
  using (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert clients in their own stable
create policy "Users can create clients in own stable"
  on clients for insert
  with check (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- RLS Policy: Users can update clients in their own stable
create policy "Users can update own stable clients"
  on clients for update
  using (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete (soft) clients in their own stable
create policy "Users can delete own stable clients"
  on clients for delete
  using (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- Index for faster lookups by stable
create index clients_stable_id_idx on clients(stable_id);

-- Index for filtering non-archived clients
create index clients_archived_idx on clients(archived) where archived = false;
