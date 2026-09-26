/**
 * Seed script.
 *   npm run seed            -> uses scripts/osm-venues.json if present, else fetches OSM
 *   npm run seed -- --refresh   -> always re-fetch from OpenStreetMap
 *
 * Real from OSM: venue names, locations, type, addresses, and tags OSM records
 * (live_music, real_ale, beer_garden, lgbtq). Everything else (price level,
 * pint price, most vibe tags, all reviews and reviewers) is SIMULATED and
 * deterministic, so the demo looks the same every time.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { TAG_IDS, tagIndex, type TagId } from "../src/lib/tags";
import { cosine, normalize, venueVector, zeros, type Venue, type Vec } from "../src/lib/scoring";

config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL and a Supabase key in .env.local");
  process.exit(1);
}
const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const CENTER_LAT = Number(process.env.NEXT_PUBLIC_DEMO_LAT ?? 53.4808); // Piccadilly Gardens
const CENTER_LNG = Number(process.env.NEXT_PUBLIC_DEMO_LNG ?? -2.2374);
const RADIUS_KM = Number(process.env.SEED_RADIUS_KM ?? 1.6);
const CACHE = resolve("scripts/osm-venues.json");
const REFRESH = process.argv.includes("--refresh");

// ---------- deterministic randomness ----------

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pickWeighted<T>(r: () => number, items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let x = r() * total;
  for (let i = 0; i < items.length; i++) if ((x -= weights[i]) <= 0) return items[i];
  return items[items.length - 1];
}

// ---------- OpenStreetMap ----------

interface OsmEl {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

async function fetchOsm(): Promise<OsmEl[]> {
  if (!REFRESH && existsSync(CACHE)) {
    console.log(`Using cached ${CACHE}`);
    return JSON.parse(readFileSync(CACHE, "utf8"));
  }
  const dLat = RADIUS_KM / 111;
  const dLng = RADIUS_KM / (111 * Math.cos((CENTER_LAT * Math.PI) / 180));
  const bbox = [CENTER_LAT - dLat, CENTER_LNG - dLng, CENTER_LAT + dLat, CENTER_LNG + dLng].join(",");
  const q = `[out:json][timeout:60];
(
  node["amenity"~"^(bar|pub|nightclub)$"]["name"](${bbox});
  way["amenity"~"^(bar|pub|nightclub)$"]["name"](${bbox});
);
out center tags;`;
  console.log("Fetching venues from OpenStreetMap (Overpass)...");
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(q),
  });
  if (!res.ok) throw new Error(`Overpass error ${res.status}: ${await res.text()}`);
  const els: OsmEl[] = (await res.json()).elements;
  writeFileSync(CACHE, JSON.stringify(els));
  console.log(`Cached ${els.length} elements to ${CACHE} (commit this file!)`);
  return els;
}

// ---------- simulated venue attributes ----------

type Kind = "pub" | "bar" | "nightclub";

const KIND_TAG_PROBS: Record<Kind, Partial<Record<TagId, number>>> = {
  pub: { real_ale: 0.7, sports: 0.5, quiet_chat: 0.5, beer_garden: 0.25, after_work: 0.3, live_music: 0.2, karaoke: 0.08, craft_beer: 0.2 },
  bar: { cocktails: 0.7, craft_beer: 0.35, dj: 0.4, after_work: 0.45, live_music: 0.2, quiet_chat: 0.25, rnb_hiphop: 0.15, indie: 0.15 },
  nightclub: { dj: 0.9, dancing: 0.95, late_licence: 0.95, student_crowd: 0.5 },
};
const CLUB_GENRES: TagId[] = ["techno", "indie", "rnb_hiphop", "cheesy_pop"];

function buildVenue(el: OsmEl) {
  const t = el.tags ?? {};
  const kind = t.amenity as Kind;
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (!lat || !lng || !t.name) return null;

  const osmId = `${el.type}/${el.id}`;
  const r = rng(hash(osmId));
  const tags = new Set<TagId>();

  for (const [tag, p] of Object.entries(KIND_TAG_PROBS[kind])) if (r() < (p as number)) tags.add(tag as TagId);
  if (kind === "nightclub") tags.add(pickWeighted(r, CLUB_GENRES, [3, 2, 2, 2]));

  // Real signals from OSM where present.
  if (t.live_music === "yes") tags.add("live_music");
  if (t.real_ale === "yes") tags.add("real_ale");
  if (t.beer_garden === "yes" || t.outdoor_seating === "yes") tags.add("beer_garden");
  if (t.karaoke === "yes") tags.add("karaoke");
  if (t.sport || t["screen:sport"]) tags.add("sports");
  // Crowd identity tags ONLY from real OSM data, never simulated.
  if (["primary", "welcome", "only"].includes(t.lgbtq ?? "") || t.gay === "yes") tags.add("lgbtq_friendly");

  const n = t.name.toLowerCase();
  if (/brew|tap|craft|beer/.test(n)) tags.add("craft_beer");
  if (/cocktail|gin|rum|mezcal/.test(n)) tags.add("cocktails");
  if (/karaoke|lucky voice/.test(n)) tags.add("karaoke");

  // Every venue needs at least one tag or it can never match anyone.
  if (tags.size === 0) {
    const best = Object.entries(KIND_TAG_PROBS[kind]).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];
    tags.add(best as TagId);
  }

  const priceWeights: Record<Kind, number[]> = { pub: [5, 4, 1], bar: [2, 5, 3], nightclub: [3, 5, 2] };
  const price_level = pickWeighted<1 | 2 | 3>(r, [1, 2, 3], priceWeights[kind]);
  if (price_level === 1 && r() < 0.6) tags.add("cheap");
  if (price_level === 3 && r() < 0.6) tags.add("pricey");
  const pintRange = { 1: [3.2, 4.2], 2: [4.5, 5.8], 3: [6.0, 7.5] }[price_level];
  const pint_price = Math.round((pintRange[0] + r() * (pintRange[1] - pintRange[0])) * 10) / 10;

  const address = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ") || null;

  return { osm_id: osmId, name: t.name, kind, lat, lng, address, price_level, pint_price, tags: [...tags] };
}

// ---------- synthetic reviewers ----------

const ARCHETYPES: { name: string; tags: TagId[]; budget: 1 | 2 | 3 }[] = [
  { name: "raver", tags: ["techno", "dj", "dancing", "late_licence", "student_crowd", "cheap"], budget: 1 },
  { name: "indie", tags: ["indie", "live_music", "craft_beer", "dancing", "cheap"], budget: 1 },
  { name: "ale", tags: ["real_ale", "quiet_chat", "sports", "beer_garden"], budget: 2 },
  { name: "cocktail", tags: ["cocktails", "after_work", "pricey", "quiet_chat"], budget: 3 },
  { name: "pop", tags: ["cheesy_pop", "karaoke", "dancing", "student_crowd", "cheap"], budget: 1 },
  { name: "rnb", tags: ["rnb_hiphop", "dj", "dancing", "cocktails", "late_licence"], budget: 2 },
  { name: "sports", tags: ["sports", "real_ale", "cheap", "beer_garden"], budget: 1 },
];
const FIRST_NAMES = ["Sam", "Priya", "Tom", "Aisha", "Josh", "Mei", "Callum", "Zara", "Liam", "Chloe", "Dev", "Niamh", "Ollie", "Sofia", "Kwame", "Ellie", "Ravi", "Hannah", "Finn", "Leah", "Jack"];
const UP_LINES = ["Proper good night, would go again", "Great atmosphere", "Loved the music", "Decent prices for town", "Staff were lovely", "Exactly my kind of place"];
const DOWN_LINES = ["Not really my scene", "Too rammed to move", "Pricey for what it is", "Music wasn't for me", "Bit dead when we went"];

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

async function main() {
  const els = await fetchOsm();
  const venueRows = els.map(buildVenue).filter((v): v is NonNullable<typeof v> => v !== null);
  // Dedupe by name+rounded position (OSM sometimes has node + way for one venue).
  const seen = new Set<string>();
  const unique = venueRows.filter((v) => {
    const k = `${v.name.toLowerCase()}|${v.lat.toFixed(3)}|${v.lng.toFixed(3)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  console.log(`Upserting ${unique.length} venues...`);
  for (let i = 0; i < unique.length; i += 200) {
    const { error } = await supabase.from("venues").upsert(unique.slice(i, i + 200), { onConflict: "osm_id" });
    if (error) throw error;
  }

  const { data: venues, error: vErr } = await supabase.from("venues").select("*");
  if (vErr || !venues) throw vErr;

  console.log("Resetting synthetic reviewers...");
  const { error: dErr } = await supabase.from("profiles").delete().eq("is_synthetic", true);
  if (dErr) throw dErr;

  const r = rng(Number(process.env.SEED ?? 42));
  const profiles: { id: string; display_name: string; budget: number; taste: number[]; is_synthetic: boolean }[] = [];
  const reviews: { profile_id: string; venue_id: string; thumbs_up: boolean; tags: string[]; body: string }[] = [];
  const vecs = new Map<string, Vec>(venues.map((v: Venue) => [v.id, venueVector(v)]));

  let n = 0;
  for (const a of ARCHETYPES) {
    for (let j = 0; j < 6; j++) {
      const taste = zeros();
      for (const t of a.tags) taste[tagIndex(t)] = 0.7 + r() * 0.3;
      for (let k = 0; k < 3; k++) taste[Math.floor(r() * TAG_IDS.length)] += r() * 0.35; // personal quirks
      const tv = normalize(taste);
      const id = crypto.randomUUID();
      profiles.push({ id, display_name: FIRST_NAMES[n++ % FIRST_NAMES.length], budget: a.budget, taste: tv, is_synthetic: true });

      // Each reviewer visits ~10 venues, biased toward places they'd pick.
      const pool = venues.map((v: Venue) => ({ v, w: Math.exp(3 * cosine(tv, vecs.get(v.id)!)) }));
      const visited = new Set<string>();
      for (let k = 0; k < Math.min(10, pool.length); k++) {
        const { v } = pickWeighted(r, pool, pool.map((p) => (visited.has(p.v.id) ? 0 : p.w)));
        if (visited.has(v.id)) continue;
        visited.add(v.id);
        const sim = cosine(tv, vecs.get(v.id)!);
        const up = r() < sigmoid(8 * (sim - 0.3));
        const venueTags = (v.tags as TagId[]).slice().sort((x, y) => tv[tagIndex(y)] - tv[tagIndex(x)]);
        const tags = new Set<TagId>(up ? venueTags.slice(0, 1 + Math.floor(r() * 3)) : venueTags.slice(0, Math.floor(r() * 2)));
        // Occasionally reviewers notice something the listing doesn't say -> emergent auto-tags.
        if (up && r() < 0.15) tags.add(a.tags[Math.floor(r() * a.tags.length)]);
        const lines = up ? UP_LINES : DOWN_LINES;
        reviews.push({ profile_id: id, venue_id: v.id, thumbs_up: up, tags: [...tags], body: lines[Math.floor(r() * lines.length)] });
      }
    }
  }

  const { error: pErr } = await supabase.from("profiles").insert(profiles);
  if (pErr) throw pErr;
  for (let i = 0; i < reviews.length; i += 500) {
    const { error } = await supabase.from("reviews").insert(reviews.slice(i, i + 500));
    if (error) throw error;
  }
  const ups = reviews.filter((x) => x.thumbs_up).length;
  console.log(`Done: ${venues.length} venues, ${profiles.length} reviewers, ${reviews.length} reviews (${Math.round((100 * ups) / reviews.length)}% positive).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
