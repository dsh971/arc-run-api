-- Arc Run — Seed Data
-- Initial 7 modes: 6 standard difficulty levels + 1 special mode.
-- Run automatically with: supabase db reset
-- Apply to existing DB: psql $DATABASE_URL < supabase/seed.sql

-- Clear existing modes to avoid duplicates on re-seed
truncate public.modes restart identity cascade;

insert into public.modes
  (name, slug, chaser_type, pace_min_secs, pace_max_secs, color_token, descriptor, is_free, is_active, sort_order)
values
  -- Standard difficulty levels (ordered hardest → easiest)
  (
    'EXTINCTION', 'extinction', 'zombie',
    240, 270,       -- 4:00 – 4:30 /mi
    'danger',
    'This is the end.',
    true, true, 1
  ),
  (
    'APEX', 'apex', 'zombie',
    300, 360,       -- 5:00 – 6:00 /mi
    'danger',
    'Top of the chain. No mercy.',
    true, true, 2
  ),
  (
    'SWARM', 'swarm', 'zombie',
    330, 390,       -- 5:30 – 6:30 /mi
    'warning',
    'Overwhelming. No escape.',
    true, true, 3
  ),
  (
    'FERAL', 'feral', 'zombie',
    360, 420,       -- 6:00 – 7:00 /mi
    'warning',
    'Aggressive. Erratic. Uncontrolled.',
    true, true, 4
  ),
  (
    'STALKER', 'stalker', 'zombie',
    480, 600,       -- 8:00 – 10:00 /mi
    'survive',
    'Patient. Relentless. Always watching.',
    true, true, 5
  ),
  (
    'SHAMBLER', 'shambler', 'zombie',
    600, 720,       -- 10:00 – 12:00 /mi
    'survive',
    'Slow. Shambling. But never stopping.',
    true, true, 6
  ),
  -- Special mode
  (
    'Un-Grippable', 'un-grippable', 'human',
    560, 608,       -- 9:20 – 10:08 /mi
    'electric',
    'You can''t shake it. You can''t outrun it.',
    true, true, 7
  );
