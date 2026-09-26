# Rounds — setup (≈20 minutes, setup lead only)

Commands are for PowerShell on Windows; they also work in bash/zsh except where noted.

## 1. Supabase (5 min)
Create a free project at supabase.com. Open **SQL Editor**, paste the whole of
`supabase/migrations/0001_init.sql`, click **Run**. Then copy the Project URL,
publishable (anon) key and secret (service role) key from **Project Settings → API**.

## 2. Scaffold the app (3 min)
```powershell
npx create-next-app@latest rounds --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
cd rounds
Expand-Archive ..\rounds-starter.zip -DestinationPath . -Force   # bash: unzip -o ../rounds-starter.zip
```

## 3. Dependencies (2 min)
```powershell
npm i @supabase/supabase-js motion leaflet react-leaflet
npm i -D @types/leaflet tsx dotenv
npm pkg set scripts.seed="tsx scripts/seed.ts"
```

## 4. Environment and seed (3 min)
```powershell
Copy-Item .env.example .env.local     # bash: cp .env.example .env.local
# edit .env.local with your Supabase values (and demo coordinates if not in Manchester)
npm run seed
```
The first seed fetches real venues from OpenStreetMap and caches them in
`scripts/osm-venues.json`. **Commit that file** so the demo never depends on Overpass.

## 5. Git + deploy (5 min)
```powershell
git add -A
git add -f .env.example          # Next's .gitignore ignores .env* files
git commit -m "setup: starter kit"
```
Push to GitHub, import the repo at vercel.com, and add `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_DEMO_LAT`, `NEXT_PUBLIC_DEMO_LNG`.
**Do not** add the service role key to Vercel.

## 6. Start Claude Code
```powershell
claude
```
Paste the Phase 0 prompt from `docs/PROMPTS.md`. When Phase 0 is merged, teammates
pull `main`, create `.env.local`, branch (`git switch -c a-deck`, etc.) and paste their
workstream prompt.

## Files in this kit
- `CLAUDE.md` — context Claude Code loads every session
- `docs/PLAN.md` — timeline, workstreams, file ownership, demo script, cut list
- `docs/DESIGN.md` — visual system
- `docs/PROMPTS.md` — prompts for Phase 0 and each workstream
- `supabase/migrations/0001_init.sql` — schema, views, match function, realtime
- `scripts/seed.ts` — OSM venues + simulated tags, prices and reviewers
- `src/lib/tags.ts`, `src/lib/scoring.ts`, `src/lib/supabase.ts` — shared, tested core logic
- `.claude/commands/` — `/demo-check`, `/polish`
