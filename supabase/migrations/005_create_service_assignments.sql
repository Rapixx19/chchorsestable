-- Migration: Create service_assignments table
-- Description: Links services to horses (subscriptions/bookings)
-- Safety: RED

create table service_assignments (
  id uuid primary key default gen_random_uuid(),
  stable_id uuid not null references stables(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  horse_id uuid not null references horses(id) on delete cascade,
  start_date date not null,
  end_date date,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  notes text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table service_assignments enable row level security;

-- RLS Policy: Users can view assignments in their own stable
create policy "Users can view own stable assignments"
  on service_assignments for select
  using (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert assignments in their own stable
create policy "Users can create assignments in own stable"
  on service_assignments for insert
  with check (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- RLS Policy: Users can update assignments in their own stable
create policy "Users can update own stable assignments"
  on service_assignments for update
  using (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete assignments in their own stable
create policy "Users can delete own stable assignments"
  on service_assignments for delete
  using (
    stable_id in (
      select id from stables where owner_id = auth.uid()
    )
  );

-- Indexes
create index service_assignments_stable_id_idx on service_assignments(stable_id);
create index service_assignments_service_id_idx on service_assignments(service_id);
create index service_assignments_horse_id_idx on service_assignments(horse_id);
create index service_assignments_status_idx on service_assignments(status) where status = 'active';
