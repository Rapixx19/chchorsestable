-- Migration: Create horses table
-- Description: Horses belong to a client and stable (multi-tenant)
-- Safety: RED

create table horses (
  id uuid primary key default gen_random_uuid(),
  stable_id uuid not null references stables(id),
  client_id uuid not null references clients(id),
  name text not null,
  breed text,
  birth_year int,
  notes text,
  archived boolean default false,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table horses enable row level security;

-- RLS Policy: Users can view horses in their own stable
create policy "Users can view own stable horses"
  on horses for select
  using (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert horses in their own stable
create policy "Users can create horses in own stable"
  on horses for insert
  with check (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- RLS Policy: Users can update horses in their own stable
create policy "Users can update own stable horses"
  on horses for update
  using (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete (soft) horses in their own stable
create policy "Users can delete own stable horses"
  on horses for delete
  using (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- Index for faster lookups by stable
create index horses_stable_id_idx on horses(stable_id);

-- Index for faster lookups by client
create index horses_client_id_idx on horses(client_id);

-- Index for filtering non-archived horses
create index horses_archived_idx on horses(archived) where archived = false;
