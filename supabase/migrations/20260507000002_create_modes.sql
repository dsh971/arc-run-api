-- Modes table
-- Stores all difficulty levels and special modes.
-- Server-driven: set is_active = true to publish a new mode without app update.
-- Pace stored as seconds/mile for precise chaser simulation calculations.

create table public.modes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                    -- "SHAMBLER", "Un-Grippable"
  slug          text unique not null,              -- "shambler", "un-grippable" (app key)
  chaser_type   text not null                      -- "zombie" | "human" | "robot"
                  check (chaser_type in ('zombie', 'human', 'robot')),
  pace_min_secs integer not null,                  -- min pace in seconds/mile
  pace_max_secs integer not null,                  -- max pace in seconds/mile
  color_token   text not null,                     -- design token: "danger" | "warning" | "survive" | "electric"
  descriptor    text,                              -- "Slow. Shambling. But never stopping."
  is_free       boolean not null default true,
  storekit_id   text,                              -- nil if free; Apple IAP product ID if paid
  is_active     boolean not null default false,    -- toggle without deploy
  sort_order    integer not null default 0,        -- display order in UI (ascending)
  created_at    timestamptz not null default now(),

  constraint pace_range_valid check (pace_min_secs < pace_max_secs)
);

-- Row Level Security
alter table public.modes enable row level security;

-- Anyone can read active modes (anon + authenticated)
create policy "modes are publicly readable"
  on public.modes for select
  using (is_active = true);

-- Only service role can insert / update / delete (managed server-side)
-- No additional policies needed — service role bypasses RLS by default
