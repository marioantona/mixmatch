# 3-hour plan

Assumes 3–4 people, each running their own Claude Code session on their own branch.
Times are elapsed from kickoff. **Deploy early, deploy often.**

## Timeline

| Time | What | Who |
|---|---|---|
| 0:00–0:25 | Phase 0: scaffold, Supabase, seed, shared hooks, first Vercel deploy | Setup lead drives; others read CLAUDE.md, DESIGN.md, set up Claude Code |
| 0:25–1:40 | Parallel workstreams A–D (below) | Everyone |
| 1:40–2:05 | Integrate: merge to `main` in order D → A → C → B, deploy, fix breakage | Everyone, setup lead merges |
| 2:05–2:35 | Test the demo script on 3 real phones, fix bugs, polish | Everyone |
| 2:35 | **Feature freeze.** Only bug fixes after this | — |
| 2:35–3:00 | Rehearse the pitch twice, prep backup (screen recording of the demo) | Everyone |

If you're behind at 1:40, cut from the bottom of the cut list, don't extend.

## Phase 0 output (the contract everyone builds on)

Setup lead produces these on `main` before workstreams branch off:

- App scaffolded, deps installed, `npm run seed` has populated Supabase.
- `src/hooks/useProfile.ts` → `{ profile, loading, saveTaste(taste), createProfile(...) }`
- `src/hooks/useVenueData.ts` → `{ venues, mentionsByVenue, reviewsByVenue, loading, error, refresh }`
- `src/hooks/useOrigin.ts` → `{ origin, isDemo }`
- `src/app/layout.tsx` with fonts, tokens and an empty bottom nav; placeholder routes for every screen.
- Deployed to Vercel with env vars set.

Changes to these files after Phase 0 must be announced to the team.

## Workstreams and file ownership

Only edit files you own. Shared files (`src/lib/*`, `src/hooks/*`, `layout.tsx`,
`globals.css`) → ask the owner (setup lead for lib/hooks, D for layout/css).

**A — Discover deck** (the core loop)
Owns `src/app/page.tsx`, `src/components/deck/*`, `src/components/filters/*`.
Swipe card stack with motion drag, ✕/✓ buttons, keyboard arrows, card design per
DESIGN.md, "why" line from `reasons`, exploration badge, filter bottom sheet,
Deck/Map/List toggle (renders C's components). Swipe writes + taste update.

**B — Group mode** (the demo centrepiece)
Owns `src/app/group/*`, `src/app/g/[code]/*`, `src/components/group/*`, `src/lib/group.ts`.
Create/join with a 4-letter code, share link, live member list (Realtime on
`group_members`), shared deck (reuse A's `SwipeDeck` component with an `onSwipe` prop —
agree the props early), match overlay (the one big motion moment), matches list.

**C — Map, list, venue, review**
Owns `src/components/map/*`, `src/components/list/*`, `src/app/venue/*`.
`VenueMap` and `VenueList` taking `RankedVenue[]`; venue detail page; review screen
with thumbs + tag chips; show review-added tags distinctly.

**D — Shell, onboarding, design, pitch**
Owns `src/app/start/*`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/ui/*`,
`public/*` (manifest, icons).
Design tokens, fonts, bottom nav, onboarding flow with 18+ confirmation, shared UI
atoms (Button, Chip, Sheet, PriceGlyphs). Web app manifest so it can be added to the
home screen. From 1:15, writes the pitch and demo script.

With 3 people: merge D into the setup lead's role.

## Demo script (≈2 minutes)

1. **Problem (15s):** "It's Friday, five of you, forty messages, and you end up in the same pub."
2. **Onboarding (15s):** one phone, pick budget and three vibes.
3. **Solo deck (20s):** swipe a few; point at the "why" line and "People like you: 88%".
   Say: *the same reviews show 88% to a raver and 19% to a real-ale fan — ratings are
   weighted by taste similarity.*
4. **Group (40s):** create group, two judges scan the code / type it, all three swipe;
   match overlay fires live. Tap through to directions.
5. **Reviews tag venues (15s):** leave a review with tags; show a tag marked "added by
   reviewers" on a venue.
6. **Venues and next (15s):** struggling night economy; next steps are venue-posted
   offers, crowd insights for venues, LLM review tagging.

Say clearly that venues are real (OpenStreetMap) and prices/reviews are simulated.

## Cut list (cut from the bottom first)

1. Group mode + match overlay — **never cut**
2. Solo swipe deck with similarity ratings — **never cut**
3. Venue detail with directions
4. Review flow with tags
5. Map view
6. List view
7. Filters beyond budget
8. Home-screen manifest / icons
