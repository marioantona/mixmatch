import { createClient } from "@supabase/supabase-js";

// Single browser client. MVP mode: no auth, open RLS (see supabase/migrations/0001_init.sql).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

// Demo fallback location (Piccadilly Gardens) when geolocation is denied or unavailable.
export const DEMO_ORIGIN = {
  lat: Number(process.env.NEXT_PUBLIC_DEMO_LAT ?? 53.4808),
  lng: Number(process.env.NEXT_PUBLIC_DEMO_LNG ?? -2.2374),
};
