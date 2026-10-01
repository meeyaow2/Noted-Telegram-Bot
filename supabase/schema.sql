-- Noted Telegram Bot: database schema (MVP)
-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- It is safe to run more than once.

create table if not exists public.saved_places (
  id                uuid        primary key default gen_random_uuid(),
  telegram_user_id  bigint      not null,          -- Telegram IDs can exceed 32-bit int
  telegram_username text,                          -- null if the user has no @username
  url               text        not null check (char_length(url) between 1 and 2048),
  original_message  text,                          -- full text/caption the link came from
  source            text        not null default 'website', -- tiktok, instagram, google_maps, youtube, website, ...
  domain            text,                          -- e.g. tiktok.com, useful for "website" links
  created_at        timestamptz not null default now()

  -- Planned for later phases (add with ALTER TABLE when needed):
  -- place_name text, city text, country text, category text, subcategory text,
  -- tags text[], collection_id uuid references collections(id),
  -- latitude double precision, longitude double precision,
  -- ai_confidence real, thumbnail_url text,
  -- visited boolean not null default false, notes text
);

-- Powers /saved: "latest N items for this user".
create index if not exists saved_places_user_created_idx
  on public.saved_places (telegram_user_id, created_at desc);

-- Lock the table down. With RLS on and no policies, the public "anon" key
-- cannot read or write anything. The bot uses the server-side service role
-- key, which bypasses RLS, and filters every query by telegram_user_id.
alter table public.saved_places enable row level security;
