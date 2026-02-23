-- Migration: Create import_jobs table
-- Description: Tracks PDF import jobs for service catalog
-- Safety: RED

create table import_jobs (
  id uuid primary key default gen_random_uuid(),
  stable_id uuid not null references stables(id) on delete cascade,
  type text not null,
  file_path text not null,
  status text not null check (status in ('uploaded', 'parsed', 'needs_review', 'completed', 'failed')),
  result_json jsonb,
  error text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table import_jobs enable row level security;

-- RLS Policy: Users can view import jobs in their own stable
create policy "Users can view own stable import jobs"
  on import_jobs for select
  using (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert import jobs in their own stable
create policy "Users can create import jobs in own stable"
  on import_jobs for insert
  with check (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- RLS Policy: Users can update import jobs in their own stable
create policy "Users can update own stable import jobs"
  on import_jobs for update
  using (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete import jobs in their own stable
create policy "Users can delete own stable import jobs"
  on import_jobs for delete
  using (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- Indexes
create index import_jobs_stable_id_idx on import_jobs(stable_id);
create index import_jobs_created_at_idx on import_jobs(created_at);
create index import_jobs_status_idx on import_jobs(status);
