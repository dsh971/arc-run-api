-- Profiles table
-- Extends Supabase Auth users with Arc Run specific fields.
-- One row per user, created automatically on sign-up via trigger.

create extension if not exists "uuid-ossp";

create table public.profiles (
  -- Identity
  id                          uuid primary key references auth.users(id) on delete cascade,
  username                    text unique,
  avatar_url                  text,

  -- Legal acceptance (GDPR Article 8 + ToS)
  age_declaration_confirmed   boolean not null default false,
  age_declaration_at          timestamptz,
  tos_accepted_at             timestamptz,
  tos_version                 text,
  health_briefing_accepted    boolean not null default false,

  -- Permanent aggregate stats (never purged)
  total_runs_completed        integer not null default 0,
  total_challenges_survived   integer not null default 0,
  total_miles_run             float not null default 0,
  personal_best_pace_secs     integer,           -- fastest pace in seconds/mile
  consecutive_survival_streak integer not null default 0,
  trophies_earned             text[] not null default '{}',
  completed_difficulty_levels text[] not null default '{}',

  -- Timestamps
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- Auto-update updated_at on row change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Profile is auto-created by trigger (no manual insert needed)
-- Service role can do everything (for admin operations)
