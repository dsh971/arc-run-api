-- Remove unique constraint on profiles.username
-- Usernames are display names only — UUID is the primary identifier.
-- Duplicate callsigns resolved visually via avatar + stats in friend search results.
-- Search uses full callsign (e.g. SilentHunter_4821); 4-digit suffix makes collisions rare.

alter table public.profiles
  drop constraint if exists profiles_username_key;
