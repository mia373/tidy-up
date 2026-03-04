-- ============================================================
-- TidyUp — Supabase Setup SQL
-- Run once in the Supabase SQL Editor
-- ============================================================

-- 1. HOMES TABLE
create table if not exists homes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text not null unique,
  members     uuid[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- 2. USERS TABLE (extends auth.users)
create table if not exists users (
  id         uuid primary key references auth.users on delete cascade,
  name       text not null,
  email      text not null,
  home_id    uuid references homes(id) on delete set null,
  points     int not null default 0,
  created_at timestamptz not null default now()
);

-- 3. TASKS TABLE
create table if not exists tasks (
  id           uuid primary key default gen_random_uuid(),
  home_id      uuid not null references homes(id) on delete cascade,
  title        text not null,
  points       int not null default 10,
  status       text not null default 'open' check (status in ('open', 'completed')),
  created_by   uuid not null references users(id),
  completed_by uuid references users(id),
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

-- 4. RPC: complete_task (atomic update of task + user points)
create or replace function complete_task(
  p_task_id  uuid,
  p_user_id  uuid,
  p_points   int
)
returns void
language plpgsql
security definer
as $$
begin
  update tasks
  set status       = 'completed',
      completed_by = p_user_id,
      completed_at = now()
  where id = p_task_id and status = 'open';

  if not found then
    raise exception 'Task not found or already completed';
  end if;

  update users
  set points = points + p_points
  where id = p_user_id;
end;
$$;

-- 5. ENABLE REALTIME on tasks and users tables
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table users;

-- 6. ROW LEVEL SECURITY
alter table homes  enable row level security;
alter table users  enable row level security;
alter table tasks  enable row level security;

-- Homes: any authenticated user can read; members can update
create policy "homes_select" on homes for select to authenticated using (true);
create policy "homes_insert" on homes for insert to authenticated with check (true);
create policy "homes_update" on homes for update to authenticated using (true);

-- Users: authenticated users can read all; can only update own row
create policy "users_select" on users for select to authenticated using (true);
create policy "users_insert" on users for insert to authenticated with check (auth.uid() = id);
create policy "users_update" on users for update to authenticated using (auth.uid() = id);

-- Tasks: home members can read/insert/update tasks in their home
create policy "tasks_select" on tasks for select to authenticated using (true);
create policy "tasks_insert" on tasks for insert to authenticated with check (true);
create policy "tasks_update" on tasks for update to authenticated using (true);
