-- ============================================================
-- TidyUp — Supabase Setup SQL  (single idempotent script)
-- Safe to run on a fresh DB or re-run on an existing DB.
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists homes (
  id                  uuid primary key default gen_random_uuid(),
  name                text    not null,
  invite_code         text    not null unique,
  members             uuid[]  not null default '{}',
  home_type           text    check (home_type in ('apartment', 'house', 'dorm', 'studio')),
  rooms               text[]  not null default '{}',
  has_pets            boolean not null default false,
  member_count        int     generated always as (coalesce(array_length(members, 1), 0)) stored,
  ai_requests_today   int     not null default 0,
  ai_requests_reset_at date,
  created_at          timestamptz not null default now()
);

create table if not exists users (
  id               uuid primary key references auth.users on delete cascade,
  name             text not null,
  email            text not null,
  home_id          uuid references homes(id) on delete set null,
  points           int  not null default 0,
  streak           int  not null default 0,
  last_streak_date date,
  created_at       timestamptz not null default now()
);

create table if not exists tasks (
  id           uuid primary key default gen_random_uuid(),
  home_id      uuid not null references homes(id) on delete cascade,
  title        text not null,
  points       int  not null default 10,
  status       text not null default 'open'  check (status in ('open', 'completed')),
  frequency    text not null default 'once'  check (frequency in ('once', 'daily', 'weekly')),
  created_by   uuid not null references users(id),
  completed_by uuid references users(id),
  completed_at timestamptz,
  room         text,
  assigned_to  uuid references users(id) on delete set null,
  due_date     date,
  created_at   timestamptz not null default now()
);

create table if not exists point_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  home_id    uuid not null references homes(id) on delete cascade,
  points     int  not null,
  task_id    uuid references tasks(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists wishlist_items (
  id          uuid primary key default gen_random_uuid(),
  home_id     uuid not null references homes(id) on delete cascade,
  title       text not null,
  description text,
  cost        int  not null check (cost > 0),
  image_url   text,
  created_by  uuid not null references users(id),
  redeemed_by uuid references users(id),
  redeemed_at timestamptz,
  status      text not null default 'available' check (status in ('available', 'redeemed')),
  created_at  timestamptz not null default now()
);

-- Columns added after initial launch — safe no-ops on a fresh DB
alter table users  add column if not exists streak              int  not null default 0;
alter table users  add column if not exists last_streak_date    date;
alter table homes  add column if not exists home_type           text check (home_type in ('apartment', 'house', 'dorm', 'studio'));
alter table homes  add column if not exists rooms               text[] not null default '{}';
alter table homes  add column if not exists has_pets            boolean not null default false;
alter table homes  add column if not exists ai_requests_today   int  not null default 0;
alter table homes  add column if not exists ai_requests_reset_at date;
alter table tasks  add column if not exists room                text;
alter table tasks  add column if not exists assigned_to         uuid references users(id) on delete set null;
alter table tasks  add column if not exists due_date            date;

-- member_count generated column (skip if already exists)
do $$ begin
  alter table homes add column member_count int
    generated always as (coalesce(array_length(members, 1), 0)) stored;
exception when duplicate_column then null; end $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table homes          enable row level security;
alter table users          enable row level security;
alter table tasks          enable row level security;
alter table point_events   enable row level security;
alter table wishlist_items enable row level security;

-- Homes
drop policy if exists "homes_select" on homes;
drop policy if exists "homes_insert" on homes;
drop policy if exists "homes_update" on homes;
create policy "homes_select" on homes for select to authenticated using (true);
create policy "homes_insert" on homes for insert to authenticated with check (true);
create policy "homes_update" on homes for update to authenticated using (true);

-- Users
drop policy if exists "users_select" on users;
drop policy if exists "users_insert" on users;
drop policy if exists "users_update" on users;
create policy "users_select" on users for select to authenticated using (true);
create policy "users_insert" on users for insert to authenticated with check (auth.uid() = id);
create policy "users_update" on users for update to authenticated using (auth.uid() = id);

-- Tasks
drop policy if exists "tasks_select" on tasks;
drop policy if exists "tasks_insert" on tasks;
drop policy if exists "tasks_update" on tasks;
create policy "tasks_select" on tasks for select to authenticated using (true);
create policy "tasks_insert" on tasks for insert to authenticated with check (true);
create policy "tasks_update" on tasks for update to authenticated using (true);

-- Point events
drop policy if exists "point_events_select" on point_events;
drop policy if exists "point_events_insert" on point_events;
create policy "point_events_select" on point_events for select to authenticated using (true);
create policy "point_events_insert" on point_events for insert to authenticated with check (true);

-- Wishlist items
drop policy if exists "wishlist_select" on wishlist_items;
drop policy if exists "wishlist_insert" on wishlist_items;
drop policy if exists "wishlist_update" on wishlist_items;
drop policy if exists "wishlist_delete" on wishlist_items;
create policy "wishlist_select" on wishlist_items for select to authenticated using (true);
create policy "wishlist_insert" on wishlist_items for insert to authenticated with check (true);
create policy "wishlist_update" on wishlist_items for update to authenticated using (true);
create policy "wishlist_delete" on wishlist_items for delete to authenticated using (auth.uid() = created_by);

-- ============================================================
-- REALTIME
-- ============================================================

do $$ begin alter publication supabase_realtime add table tasks;          exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table users;          exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table point_events;   exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table wishlist_items; exception when others then null; end $$;

-- ============================================================
-- RPC: complete_task
-- Atomically: mark complete, award points, update streak,
-- log point event, re-create open copy if recurring.
-- ============================================================

create or replace function complete_task(
  p_task_id uuid,
  p_user_id uuid,
  p_points  int
)
returns void
language plpgsql
security definer
as $$
declare
  v_task tasks%rowtype;
begin
  select * into v_task
  from tasks
  where id = p_task_id and status = 'open';

  if not found then
    raise exception 'Task not found or already completed';
  end if;

  update tasks
  set status       = 'completed',
      completed_by = p_user_id,
      completed_at = now()
  where id = p_task_id;

  update users
  set points          = points + p_points,
      streak          = case
                          when last_streak_date = current_date     then streak
                          when last_streak_date = current_date - 1 then streak + 1
                          else 1
                        end,
      last_streak_date = current_date
  where id = p_user_id;

  insert into point_events (user_id, home_id, points, task_id)
  values (p_user_id, v_task.home_id, p_points, p_task_id);

  if v_task.frequency != 'once' then
    insert into tasks (
      home_id, title, points, status, frequency, created_by,
      room, assigned_to, due_date
    )
    values (
      v_task.home_id,
      v_task.title,
      v_task.points,
      'open',
      v_task.frequency,
      v_task.created_by,
      v_task.room,
      v_task.assigned_to,
      case
        when v_task.due_date is not null then
          case v_task.frequency
            when 'daily'  then greatest(v_task.due_date + interval '1 day',  current_date)::date
            when 'weekly' then greatest(v_task.due_date + interval '7 days', current_date)::date
          end
        else null
      end
    );
  end if;
end;
$$;

-- ============================================================
-- RPC: redeem_item
-- Atomically: verify points, deduct, mark item redeemed.
-- ============================================================

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
-- RPC: advance_stale_due_dates
-- Snaps overdue daily tasks to today; advances overdue weekly
-- tasks by the minimum multiple of 7 days to reach today.
-- Scheduled via pg_cron daily at 00:05 UTC.
-- ============================================================

create or replace function advance_stale_due_dates()
returns void
language plpgsql
security definer
as $$
begin
  update tasks
  set due_date = current_date
  where status    = 'open'
    and frequency = 'daily'
    and due_date  is not null
    and due_date  < current_date;

  update tasks
  set due_date = due_date
    + (ceil((current_date - due_date)::numeric / 7) * 7)::int
  where status    = 'open'
    and frequency = 'weekly'
    and due_date  is not null
    and due_date  < current_date;
end;
$$;

-- pg_cron: unschedule old job if present, then (re)schedule
do $$ begin perform cron.unschedule('advance-stale-due-dates'); exception when others then null; end $$;
select cron.schedule(
  'advance-stale-due-dates',
  '5 0 * * *',
  $$select advance_stale_due_dates()$$
);
