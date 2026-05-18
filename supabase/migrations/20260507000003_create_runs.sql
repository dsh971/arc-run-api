-- Runs table
-- Stores non-location run detail data synced from iOS clients.
-- GPS coordinates are NEVER stored here — on-device only per privacy architecture.
-- Rolling 10-run window enforced on client; server mirrors the purge.

create table public.runs (
  id                uuid primary key,                      -- UUID set by iOS client (idempotent sync)
  user_id           uuid not null references public.profiles(id) on delete cascade,

  -- Run timing
  started_at        timestamptz not null,
  ended_at          timestamptz not null,

  -- Performance data
  distance_miles    float not null check (distance_miles > 0),
  duration_secs     integer not null check (duration_secs > 0),
  avg_pace_secs     integer not null check (avg_pace_secs > 0), -- seconds/mile

  -- Mode context
  difficulty_slug   text not null,                         -- references modes.slug

  -- Outcome
  caught_flag       boolean not null default false,
  outcome           text not null check (outcome in ('survived', 'caught')),

  -- Sync metadata
  synced_at         timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

-- Index for fast per-user queries
create index runs_user_id_started_at on public.runs (user_id, started_at desc);

-- Row Level Security
alter table public.runs enable row level security;

-- Users can only read their own runs
create policy "users can read own runs"
  on public.runs for select
  using (auth.uid() = user_id);

-- Users can insert their own runs (sync from device)
create policy "users can insert own runs"
  on public.runs for insert
  with check (auth.uid() = user_id);

-- Users can delete their own runs (10-run window purge)
create policy "users can delete own runs"
  on public.runs for delete
  using (auth.uid() = user_id);
