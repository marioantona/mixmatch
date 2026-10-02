# MixMatch design system

**Idea: a city centre at 11pm.** Deep blue-violet night, sodium-orange streetlight,
and each venue card coloured like the inside of that kind of place: mahogany pub,
glass-teal bar, UV-violet club. No stock photos — venue names set huge in a variable-
width display face *are* the imagery. That's the one bold thing; everything else stays quiet.

## Palette

| Token | Hex | Use |
|---|---|---|
| `night` | `#16142E` | App background |
| `kerb` | `#24214A` | Sheets, nav, list rows |
| `foam` | `#FAF1DE` | Primary text |
| `sodium` | `#FFB23F` | Primary actions, active states, focus rings |
| `go` | `#57D6A4` | Like / "I'm in" / match |
| `pass` | `#F2685C` | Pass |
| `pub` | `#5A2E1F` | Pub card field |
| `bar` | `#1F4A5A` | Bar card field |
| `club` | `#4B1F5A` | Nightclub card field |

Secondary text: `foam` at 70% opacity. Borders: `foam` at 12%. The tokens live in
`src/app/globals.css` as Tailwind v4 theme variables (`--color-night`, etc.), so
utilities like `bg-night text-foam` work.

## Type

- **Display: Anybody** (Google Fonts, variable width + weight) via `next/font/google`.
  Venue names at weight 800, width 60–75 (condensed), tight leading (0.9),
  36–56px depending on name length so long names wrap to at most 3 lines.
  Also used for the match reveal and screen titles.
- **UI/body: Figtree** 400/600, 15–17px base, line-height 1.45.
- Sentence case everywhere. No all-caps labels, no eyebrow labels above headings.

## Swipe card

```
┌──────────────────────────────┐   card field = kind colour, radius 28px
│ Pub            0.4 km   £££  │   kind + distance as separate chips; price as £ glyphs,
│                              │   unused £ at 30% opacity
│ The                          │   <- name in Anybody, huge, wraps, bottom-left aligned,
│ Britons                      │      in the venue's own capitalisation
│ Protest                      │
│                              │
│ [Real ale] [Beer garden] [+2]│   tag chips, foam at 12% fill
│ Because you like real ale    │   from `reasons`; exploration cards say
│ People like you: 86% 👍 (12) │   "Something different" instead
└──────────────────────────────┘
      ( ✕ Pass )    ( ✓ I'm in )      big round buttons below the stack
```

While dragging: rotate up to ±12°, tint the edge `go` or `pass`, and fade in a
"Pass" / "I'm in" stamp. Next card sits behind at 96% scale.

## Match reveal (the one orchestrated motion moment)

Full-screen `night` overlay; the matched card scales from the deck to centre; the
venue name expands in width (animate Anybody's `wdth` axis from 50 to 100); member
initials slide in beneath; then two buttons: "Get directions" (sodium) and
"Keep swiping" (ghost). ~900ms total. With `prefers-reduced-motion`, just fade.

## Copy

- Buttons say what happens: "Start a group", "Join group", "I'm in", "Pass", "Rate your night", "Get directions".
- Empty states direct: "Nothing left within 1 km. Widen your distance."
- Errors say what happened and what to do: "Couldn't load venues. Check your connection and pull to refresh."
- Group code shown in Anybody, huge, with letter spacing. Share link copies on tap: "Link copied".

## Quality floor

Tap targets ≥ 44px, visible focus rings (sodium), contrast ≥ 4.5:1 for text,
respects `prefers-reduced-motion`, safe-area insets on iOS (`env(safe-area-inset-bottom)`
under the bottom nav), no horizontal scroll at 360px.
