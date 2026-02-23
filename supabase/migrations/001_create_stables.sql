-- Migration: Create stables table
-- Description: Stables represent business tenants
-- Safety: RED

create table stables (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id),
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table stables enable row level security;

-- RLS Policy: Users can only see their own stables
create policy "Users can view own stables"
  on stables for select
  using (auth.uid() = owner_id);

-- RLS Policy: Users can insert their own stables
create policy "Users can create own stables"
  on stables for insert
  with check (auth.uid() = owner_id);

-- RLS Policy: Users can update their own stables
create policy "Users can update own stables"
  on stables for update
  using (auth.uid() = owner_id);

-- RLS Policy: Users can delete own stables (protected by RLS)
create policy "Users can delete own stables"
  on stables for delete
  using (auth.uid() = owner_id);

-- Index for faster lookups by owner
create index stables_owner_id_idx on stables(owner_id);
