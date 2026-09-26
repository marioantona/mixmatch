# Claude Code prompts

Paste these into Claude Code. For each one, start in **plan mode** (Shift+Tab until it
says plan mode), check the plan in under a minute, then let it run. Run `/demo-check`
before every merge.

---

## Phase 0 — setup lead (after README steps 1–5)

```
Read CLAUDE.md, docs/PLAN.md and docs/DESIGN.md. You are doing Phase 0 from PLAN.md.

1. Confirm `npx tsc --noEmit` passes with the provided src/lib files.
2. Create src/hooks/useProfile.ts, useVenueData.ts and useOrigin.ts exactly matching the
   signatures in PLAN.md "Phase 0 output". useVenueData loads venues, venue_review_tags
   (into mentionsByVenue) and reviews with profiles(taste) (into reviewsByVenue) in parallel.
   useProfile reads/writes localStorage key rounds.profileId and exposes a debounced saveTaste.
3. Set up design tokens in globals.css and the Anybody + Figtree fonts in layout.tsx per
   DESIGN.md, a bottom nav (Discover, Group) with safe-area padding, and placeholder pages
   for /, /start, /group, /g/[code], /venue/[id], /venue/[id]/review. Every route except
   /start redirects to /start when there is no profile.
4. Make /start minimally functional (name, budget, vibes, 18+ confirm) so others can test;
   D will polish it.
5. Run tsc, lint and build. Fix any errors. Then stop and summarise the hook APIs in 10 lines
   so I can paste them to the team.
```

---

## Workstream A — Discover deck

```
Read CLAUDE.md, docs/PLAN.md (workstream A) and docs/DESIGN.md. Only edit files A owns.

Build the Discover screen at src/app/page.tsx:
- A reusable <SwipeDeck venues={RankedVenue[]} onSwipe={(venue, liked) => void} /> in
  src/components/deck/ — workstream B will reuse it, so keep it free of solo-mode logic.
  Motion drag with rotation, edge tint and stamp per DESIGN.md, ✕ / ✓ buttons, arrow keys.
  Render 3 cards max in the DOM.
- VenueCard per the DESIGN.md wireframe: kind colour, huge Anybody name sized by length,
  price glyphs, distance, up to 3 tag chips, reasons line or "Something different" for
  isExploration, "People like you: X% (N)" when rating.similarReviewers >= 1.
- Solo onSwipe: insert into swipes (group_id null), updateTaste, profile.saveTaste.
- Rank with rankVenues using useVenueData, useOrigin and the profile taste; exclude
  venues already swiped this session.
- Filter bottom sheet: budget (£/££/£££), distance (0.5/1/2 km), vibe chips.
- Toggle Deck / Map / List at the top. Until C's components exist, render placeholders
  that import from src/components/map/VenueMap and src/components/list/VenueList.
- Empty and loading states per DESIGN.md copy rules.
Verify at 390px with touch emulation and with a mouse.
```

---

## Workstream B — Group mode

```
Read CLAUDE.md, docs/PLAN.md (workstream B) and docs/DESIGN.md. Only edit files B owns.

Build group mode:
- src/lib/group.ts: createGroup (random 4-letter code, retry on unique clash, add creator
  as member), joinGroup(code), groupTaste(memberTastes) = normalised average.
- /group: "Start a group" and "Join group" (code input, auto-uppercase, 4 letters).
- /g/[code]: joins automatically if not a member. Lobby shows the huge code, a "Copy link"
  button, and live member list via Supabase Realtime on group_members INSERT filtered by
  group_id. "Start swiping" once ≥2 members.
- Shared deck: rank with rankVenues using groupTaste of all members and DEMO_ORIGIN (so
  every phone gets the identical order), exploreEvery: 0. Reuse A's SwipeDeck from
  src/components/deck/SwipeDeck (if it's not merged yet, code against the props
  `venues` and `onSwipe(venue, liked)` and stub it).
- onSwipe inserts into swipes with group_id. Subscribe to swipes INSERT for this group;
  on each event call rpc group_matches and show the match overlay for any venue not
  already shown. Also check once on mount.
- Match overlay per DESIGN.md "Match reveal", with "Get directions" and "Keep swiping".
  A "Matches" row at the top of the deck lists all matches so far.
- Handle a member joining mid-swipe (member count changes) without crashing.
Test with two browser windows (one incognito) side by side.
```

---

## Workstream C — Map, list, venue, review

```
Read CLAUDE.md, docs/PLAN.md (workstream C) and docs/DESIGN.md. Only edit files C owns.

- src/components/map/VenueMap.tsx: props { venues: RankedVenue[], origin }. react-leaflet,
  loaded via next/dynamic with ssr:false from a wrapper. CARTO dark tiles with attribution.
  CircleMarkers coloured by kind; tapping one opens a small bottom card linking to
  /venue/[id]. Show the origin as a sodium dot.
- src/components/list/VenueList.tsx: same props; compact rows (name, kind chip, distance,
  price glyphs, "People like you" score), tapping opens the venue.
- /venue/[id]: header in the kind colour with the huge name; tags, marking reviewAddedTags
  as "added by reviewers"; personal rating with plain-English explanation; pint price
  labelled "typical pint (estimate)"; mini map; "Get directions" (Google Maps walking
  link); 5 most recent reviews; "Rate your night" button.
- /venue/[id]/review: thumbs up / down (required), tag chips from REVIEW_TAGS (multi),
  optional text (500 chars), upsert on (profile_id, venue_id), then return to the venue
  and refresh data so new auto-tags appear.
```

---

## Workstream D — Shell, onboarding, pitch

```
Read CLAUDE.md, docs/PLAN.md (workstream D) and docs/DESIGN.md. Only edit files D owns.

- Polish /start into a 3-step onboarding: name → budget → vibes (min 3, chips from
  VIBE_TAGS), with a one-tap "I'm 18 or over" confirmation before finishing. Uses
  tasteFromOnboarding and useProfile.createProfile.
- Shared UI atoms in src/components/ui/: Button (primary/ghost/go/pass), Chip
  (selectable), BottomSheet, PriceGlyphs, KindChip. Keep them tiny and typed; tell A–C
  their props.
- public/manifest.webmanifest + icons (simple generated SVG/PNG with the sodium colour)
  so the app can be added to a phone home screen; theme-color = night.
- Check every screen at 360px for overflow and safe-area issues.
- At 1:15, stop coding and draft the pitch in docs/PITCH.md following the demo script
  in PLAN.md.
```
