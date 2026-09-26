-- Pre-demo reset: removes every real (non-seeded) user and everything they created —
-- profiles, groups, memberships, swipes, reviews. Venues and synthetic reviewers are kept.
-- Run in Supabase Dashboard -> SQL Editor, then `npm run seed` to restore the demo auto-tag.
-- IRREVERSIBLE. Do not run on a database with real users.

begin;
delete from groups;                                  -- cascades to group_members and group swipes
delete from profiles where is_synthetic = false;     -- cascades to their swipes and reviews
commit;

select
  (select count(*) from profiles where is_synthetic = false) as real_profiles_left,
  (select count(*) from groups) as groups_left,
  (select count(*) from reviews) as reviews_left;
