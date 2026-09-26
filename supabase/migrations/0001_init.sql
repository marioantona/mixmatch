-- Rounds: hackathon schema.
-- Paste this whole file into Supabase Dashboard -> SQL Editor -> Run.
-- It is safe to re-run: it drops and recreates everything.
--
-- HACKATHON SHORTCUT: there is no auth. Profiles use a client-generated UUID
-- stored on the device, and RLS policies are wide open. Do not ship this as-is.

drop view if exists venue_review_tags cascade;
drop view if exists venue_review_stats cascade;
drop function if exists group_matches(uuid) cascade;
drop table if exists reviews cascade;
drop table if exists swipes cascade;
drop table if exists group_members cascade;
drop table if exists groups cascade;
drop table if exists profiles cascade;
drop table if exists venues cascade;

create extension if not exists pgcrypto;

-- ---------- tables ----------

create table venues (
  id            uuid primary key default gen_random_uuid(),
  osm_id        text unique,
  name          text not null,
  kind          text not null check (kind in ('pub', 'bar', 'nightclub')),
  lat           double precision not null,
  lng           double precision not null,
  address       text,
  price_level   smallint not null check (price_level between 1 and 3),
  pint_price    numeric(4, 2),          -- SIMULATED in seed data; say so in the pitch
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now()
);

create table profiles (
  id            uuid primary key,       -- generated on the device
  display_name  text not null,
  budget        smallint not null default 2 check (budget between 1 and 3),
  taste         real[] not null,        -- length = number of tags in src/lib/tags.ts
  is_synthetic  boolean not null default false,
  created_at    timestamptz not null default now()
);

create table groups (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique check (code ~ '^[A-Z]{4}$'),
  created_by    uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table group_members (
  group_id      uuid not null references groups(id) on delete cascade,
  profile_id    uuid not null references profiles(id) on delete cascade,
  joined_at     timestamptz not null default now(),
  primary key (group_id, profile_id)
);

create table swipes (
  id            bigint generated always as identity primary key,
  profile_id    uuid not null references profiles(id) on delete cascade,
  venue_id      uuid not null references venues(id) on delete cascade,
  group_id      uuid references groups(id) on delete cascade,   -- null = solo swipe
  liked         boolean not null,
  created_at    timestamptz not null default now(),
  unique nulls not distinct (profile_id, venue_id, group_id)
);

create table reviews (
  id            bigint generated always as identity primary key,
  profile_id    uuid not null references profiles(id) on delete cascade,
  venue_id      uuid not null references venues(id) on delete cascade,
  thumbs_up     boolean not null,
  tags          text[] not null default '{}',
  body          text check (char_length(body) <= 500),
  created_at    timestamptz not null default now(),
  unique (profile_id, venue_id)
);

create index swipes_group_idx on swipes (group_id, venue_id) where group_id is not null;
create index reviews_venue_idx on reviews (venue_id);

-- ---------- views ----------

create view venue_review_stats with (security_invoker = on) as
select
  venue_id,
  count(*)::int                                   as n_reviews,
  avg(case when thumbs_up then 1.0 else 0.0 end)  as up_ratio
from reviews
group by venue_id;

-- Distinct reviewers per (venue, tag). Tags with >= 3 mentions become public
-- venue tags in the app (see AUTO_TAG_MIN_MENTIONS in src/lib/tags.ts).
create view venue_review_tags with (security_invoker = on) as
select r.venue_id, t.tag, count(distinct r.profile_id)::int as mentions
from reviews r
cross join lateral unnest(r.tags) as t(tag)
group by r.venue_id, t.tag;

-- ---------- group matching ----------

-- Venues every member of the group has swiped right on (needs >= 2 members).
create function group_matches(p_group_id uuid)
returns table (venue_id uuid)
language sql stable as $$
  with members as (
    select count(*) as n from group_members where group_id = p_group_id
  )
  select s.venue_id
  from swipes s, members m
  where s.group_id = p_group_id and s.liked and m.n >= 2
  group by s.venue_id, m.n
  having count(distinct s.profile_id) = m.n;
$$;

-- ---------- open hackathon policies ----------

do $$
declare t text;
begin
  foreach t in array array['venues','profiles','groups','group_members','swipes','reviews'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "hackathon_open" on %I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on function group_matches(uuid) to anon, authenticated;

-- ---------- realtime ----------
-- Group screens subscribe to INSERTs on swipes and group_members.
do $$
begin
  begin
    alter publication supabase_realtime add table swipes;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table group_members;
  exception when duplicate_object then null;
  end;
end $$;
