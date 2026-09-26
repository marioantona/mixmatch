# Rounds — hackathon MVP

**One-liner:** the fastest way for a group of friends to decide where to go out tonight.
Everyone swipes on the same deck of nearby bars, pubs and clubs; when the whole group
swipes right on a venue, it's a match. Ratings are weighted towards reviewers with
similar taste, and reviewers' tap-tags automatically tag venues.

**Deadline: 3 hours total. The goal is a demo that works flawlessly on 3 phones,
not a complete product.** When in doubt, cut scope and polish what exists.

Read `docs/PLAN.md` (timeline, workstreams, file ownership, demo script) and
`docs/DESIGN.md` (visual system) before starting any task.

## Stack

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS. Check the installed
  versions in `package.json` before using version-specific APIs (e.g. Tailwind v4
  uses `@theme` in `globals.css`, not `tailwind.config.js`).
- Supabase: Postgres + Realtime. Schema: `supabase/migrations/0001_init.sql`.
- `motion` (Framer Motion) for the swipe gesture and the match reveal: `import { motion } from "motion/react"`.
- `react-leaflet` + `leaflet` for the map, with CARTO dark tiles (include attribution).
- Deployed on Vercel. Test on real phones via the Vercel URL (geolocation needs HTTPS).

## Commands

- `npm run dev` — local dev server
- `npm run build` — must pass before every merge to `main`
- `npm run lint`
- `npx tsc --noEmit` — typecheck
- `npm run seed` — (re)load venues from OSM cache + synthetic reviewers. `-- --refresh` re-fetches OSM.

## Already written — use, don't rewrite

- `src/lib/tags.ts` — the fixed tag vocabulary. Its order defines vector dimensions.
- `src/lib/scoring.ts` — taste vectors, `updateTaste`, `personalRating` (similarity-
  weighted, shrunk rating), `effectiveTags` (review auto-tagging), `rankVenues`
  (filters + ranking + exploration picks). Tested. Tune `WEIGHTS` here if needed.
- `src/lib/supabase.ts` — browser client and `DEMO_ORIGIN`.
- `scripts/seed.ts` — seeds real OSM venues + simulated prices/tags/reviews.

If you think one of these has a bug, say so and explain before changing it.
They are shared by every workstream.

## Data model (see the SQL for details)

- `venues` (id, name, kind: pub|bar|nightclub, lat, lng, address, price_level 1–3, pint_price, tags[])
- `profiles` (id = device-generated UUID, display_name, budget, taste real[], is_synthetic)
- `groups` (id, code: 4 uppercase letters), `group_members` (group_id, profile_id)
- `swipes` (profile_id, venue_id, group_id nullable, liked) — unique per profile/venue/group
- `reviews` (profile_id, venue_id, thumbs_up, tags[], body) — unique per profile/venue
- view `venue_review_tags` (venue_id, tag, mentions) → feeds `effectiveTags`
- view `venue_review_stats` (venue_id, n_reviews, up_ratio)
- rpc `group_matches(p_group_id)` → venue ids every member liked (needs ≥2 members)
- Realtime is enabled on `swipes` and `group_members`.

Load reviews for scoring with:
`supabase.from("reviews").select("venue_id, thumbs_up, profiles(taste)")`
and map to `ReviewSignal { thumbs_up, reviewer_taste }`.

## Screens (mobile first, 390px wide target)

1. `/start` — onboarding: name, budget (£/££/£££), pick 3+ vibes (`VIBE_TAGS`).
   Creates profile with `tasteFromOnboarding`; store its id in localStorage key `rounds.profileId`.
   Every other route redirects here if there's no profile.
2. `/` — Discover: swipe deck (solo). Filter sheet (budget, distance, vibes).
   Toggle to Map and List views of the same ranked results.
3. `/group` — create a group (shows code + share link `/g/CODE`) or join with a code.
   `/g/[code]` — group lobby → shared deck → live match overlay.
4. `/venue/[id]` — detail: tags (mark review-added tags as "added by reviewers"),
   "People like you: 86% thumbs up (12 similar reviewers)", pint price, map pin,
   walking directions link, recent reviews, "Rate your night" button.
5. `/venue/[id]/review` — thumbs up/down, tap tag chips (`REVIEW_TAGS`), optional text. Upsert.

Bottom nav: Discover · Group · (Map/List live inside Discover as a toggle).

## Behaviour rules

- Swipe right = like, left = pass. Always also provide ✕ / ✓ buttons (accessibility,
  and laptops during judging). Keyboard arrows on desktop.
- After each swipe: insert into `swipes`, then `updateTaste` and save `profiles.taste`
  (debounced; don't block the UI on it).
- Group deck: rank with the **normalised average of members' tastes** and the group
  creator's origin, so every member sees the **same order**. Subscribe to `swipes`
  INSERTs filtered by `group_id`; on each, call `group_matches` and reveal new matches.
- Location: try `navigator.geolocation` with a 5s timeout; fall back to `DEMO_ORIGIN`
  silently. For the demo, prefer `DEMO_ORIGIN` via `?demo=1`.
- Directions: `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&travelmode=walking`.
- Seeded prices and most tags are simulated. Never present them as verified.
- `lgbtq_friendly` and other crowd tags describe venues, never users. Do not add any
  feature that infers or asks for users' protected characteristics.
- The app is 18+: onboarding has a one-tap "I'm 18 or over" confirmation.

## Conventions

- Client components only where needed (`"use client"`); data fetching in hooks under `src/hooks/`.
- Leaflet must not render on the server: load the map with `next/dynamic` and `ssr: false`.
  Use `CircleMarker` or `divIcon` (default marker icons break with bundlers).
- Import `leaflet/dist/leaflet.css` once, in the map component.
- Components in `src/components/<area>/`, small and typed. No `any` in new code.
- Styling: Tailwind utilities using the tokens in `docs/DESIGN.md`. No component libraries.
- Handle loading, empty ("No venues match — widen your distance"), and error states on every screen.
- Keep commits small; commit message format: `area: what changed`.

## Out of scope (do not build)

Real auth, LLM tagging, photos/uploads, venue dashboard, payments, push notifications,
opening-hours logic, native app packaging. Mention them in the pitch as "next".

## Definition of done for any task

`npx tsc --noEmit` and `npm run build` pass, the screen works at 390px width in both
touch and mouse input, and it's been clicked through once in the browser.

## Next.js 16

This is Next.js 16 — read @AGENTS.md; version docs live in `node_modules/next/dist/docs/`.
