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
  frequency    text not null default 'once' check (frequency in ('once', 'daily', 'weekly')),
  created_by   uuid not null references users(id),
  completed_by uuid references users(id),
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

-- 4. RPC: complete_task (atomic: mark complete, award points, update streak, re-open if recurring)
create or replace function complete_task(
  p_task_id  uuid,
  p_user_id  uuid,
  p_points   int
)
returns void
language plpgsql
security definer
as $$
declare
  v_task tasks%rowtype;
begin
  -- Lock and fetch the task
  select * into v_task
  from tasks
  where id = p_task_id and status = 'open';

  if not found then
    raise exception 'Task not found or already completed';
  end if;

  -- Mark the task completed
  update tasks
  set status       = 'completed',
      completed_by = p_user_id,
      completed_at = now()
  where id = p_task_id;

  -- Award points + update streak
  update users
  set points          = points + p_points,
      streak          = case
                          when last_streak_date = current_date     then streak
                          when last_streak_date = current_date - 1 then streak + 1
                          else 1
                        end,
      last_streak_date = current_date
  where id = p_user_id;

  -- Re-open recurring tasks by inserting a fresh open copy
  if v_task.frequency != 'once' then
    insert into tasks (home_id, title, points, status, frequency, created_by)
    values (v_task.home_id, v_task.title, v_task.points, 'open', v_task.frequency, v_task.created_by);
  end if;
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

-- ============================================================
-- PHASE 8 MIGRATIONS — run these if upgrading an existing DB
-- ============================================================

-- Streak tracking columns on users
alter table users add column if not exists streak           int  not null default 0;
alter table users add column if not exists last_streak_date date;

-- Recurring tasks column on tasks
alter table tasks add column if not exists frequency text not null default 'once'
  check (frequency in ('once', 'daily', 'weekly'));

-- Re-run the updated complete_task RPC above to apply streak + recurring logic

-- ============================================================
-- PHASE 9.1 MIGRATIONS — Home Profile columns for AI task generation
-- ============================================================

alter table homes add column if not exists home_type  text    check (home_type in ('apartment', 'house', 'dorm', 'studio'));
alter table homes add column if not exists rooms      text[]  not null default '{}';
alter table homes add column if not exists has_pets   boolean not null default false;

-- member_count: auto-derived from the members array length as a stored generated column
alter table homes add column if not exists member_count int
  generated always as (coalesce(array_length(members, 1), 0)) stored;
