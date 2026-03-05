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

-- ============================================================
-- PHASE 9.3/9.4 MIGRATIONS — AI rate limiting columns
-- ============================================================

-- Track how many times AI task generation has been triggered today per home
alter table homes add column if not exists ai_requests_today   int  not null default 0;
alter table homes add column if not exists ai_requests_reset_at date;

-- ============================================================
-- PHASE 10.2 MIGRATIONS — Tasks grouped by room
-- ============================================================

alter table tasks add column if not exists room text default null;

-- ============================================================
-- PHASE 10.4 MIGRATIONS — Points Over Time Analytics
-- ============================================================

-- point_events: one row per task completion (logs every point-earning event)
create table if not exists point_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  home_id    uuid not null references homes(id) on delete cascade,
  points     int not null,
  task_id    uuid references tasks(id) on delete set null,
  created_at timestamptz not null default now()
);

-- RLS: authenticated users can read/insert events in their home
alter table point_events enable row level security;
create policy "point_events_select" on point_events for select to authenticated using (true);
create policy "point_events_insert" on point_events for insert to authenticated with check (true);

-- Add to Realtime publication
alter publication supabase_realtime add table point_events;

-- Update complete_task RPC to also insert a point_events row
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

  -- Log the point-earning event for analytics
  insert into point_events (user_id, home_id, points, task_id)
  values (p_user_id, v_task.home_id, p_points, p_task_id);

  -- Re-open recurring tasks by inserting a fresh open copy
  if v_task.frequency != 'once' then
    insert into tasks (home_id, title, points, status, frequency, created_by)
    values (v_task.home_id, v_task.title, v_task.points, 'open', v_task.frequency, v_task.created_by);
  end if;
end;
$$;

-- ============================================================
-- PHASE 10.5 MIGRATIONS — Wishlist & Points Redemption
-- ============================================================

create table if not exists wishlist_items (
  id          uuid primary key default gen_random_uuid(),
  home_id     uuid not null references homes(id) on delete cascade,
  title       text not null,
  description text,
  cost        int not null check (cost > 0),
  image_url   text,
  created_by  uuid not null references users(id),
  redeemed_by uuid references users(id),
  redeemed_at timestamptz,
  status      text not null default 'available' check (status in ('available', 'redeemed')),
  created_at  timestamptz not null default now()
);

alter table wishlist_items enable row level security;
create policy "wishlist_select" on wishlist_items for select to authenticated using (true);
create policy "wishlist_insert" on wishlist_items for insert to authenticated with check (true);
create policy "wishlist_update" on wishlist_items for update to authenticated using (true);
create policy "wishlist_delete" on wishlist_items for delete to authenticated using (auth.uid() = created_by);

alter publication supabase_realtime add table wishlist_items;

-- RPC: redeem_item (atomic: check points, deduct, mark redeemed)
create or replace function redeem_item(
  p_item_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_item   wishlist_items%rowtype;
  v_points int;
begin
  select * into v_item
  from wishlist_items
  where id = p_item_id and status = 'available';

  if not found then
    raise exception 'Item not found or already redeemed';
  end if;

  select points into v_points from users where id = p_user_id;

  if v_points < v_item.cost then
    raise exception 'Not enough points. Need % more.', (v_item.cost - v_points);
  end if;

  update users set points = points - v_item.cost where id = p_user_id;

  update wishlist_items
  set status      = 'redeemed',
      redeemed_by = p_user_id,
      redeemed_at = now()
  where id = p_item_id;
end;
$$;

-- ============================================================
-- PHASE 10.6.a MIGRATIONS — Task Assignment
-- ============================================================

alter table tasks add column if not exists assigned_to uuid references users(id) on delete set null;
