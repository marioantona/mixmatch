---
description: Pre-merge check — typecheck, lint, build, and walk the demo path
---
Run a pre-merge demo check. Do not add features.

1. Run `npx tsc --noEmit`, `npm run lint` and `npm run build`. Fix any errors in files
   this workstream owns (see docs/PLAN.md); report errors in files owned by others
   instead of editing them.
2. Read the demo script in docs/PLAN.md. For each step that touches code on this branch,
   trace the code path and list anything that could fail live: missing loading/empty/error
   states, unhandled promise rejections, Realtime subscriptions not cleaned up, SSR access
   to window/localStorage/leaflet, layouts overflowing at 360px, tap targets under 44px.
3. Check nothing violates CLAUDE.md "Behaviour rules" or "Out of scope".
4. Output a short checklist: ✅ passing, ⚠️ risky (with file:line), ❌ broken. Then fix the
   ❌ items in files this branch owns, and re-run the build.
