// Core recommendation logic. Pure functions, no I/O, safe on client or server.
// This is the "brain" of the demo — change weights here, not in components.

import { AUTO_TAG_MIN_MENTIONS, DIM, isTagId, tagIndex, type TagId } from "./tags";

export type Vec = number[];

export type VenueKind = "pub" | "bar" | "nightclub";

export interface Venue {
  id: string;
  name: string;
  kind: VenueKind;
  lat: number;
  lng: number;
  address: string | null;
  price_level: 1 | 2 | 3;
  pint_price: number | null;
  tags: string[];
}

/** One review joined with the reviewer's current taste vector. */
export interface ReviewSignal {
  thumbs_up: boolean;
  reviewer_taste: Vec;
}

/** tag id -> number of distinct reviewers who applied it to this venue. */
export type TagMentions = Record<string, number>;

// ---------- vector helpers ----------

export function zeros(): Vec {
  return new Array(DIM).fill(0);
}

export function norm(v: Vec): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

export function normalize(v: Vec): Vec {
  const n = norm(v);
  return n === 0 ? v.slice() : v.map((x) => x / n);
}

export function cosine(a: Vec, b: Vec): number {
  const na = norm(a);
  const nb = norm(b);
  if (na === 0 || nb === 0) return 0;
  let dot = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) dot += a[i] * b[i];
  return dot / (na * nb);
}

// ---------- tags & vectors ----------

/**
 * Public tags for a venue = its seeded tags plus any review tag with
 * at least AUTO_TAG_MIN_MENTIONS independent mentions.
 */
export function effectiveTags(venue: Venue, mentions: TagMentions = {}): TagId[] {
  const out = new Set<TagId>();
  for (const t of venue.tags) if (isTagId(t)) out.add(t);
  for (const [t, n] of Object.entries(mentions)) {
    if (isTagId(t) && n >= AUTO_TAG_MIN_MENTIONS) out.add(t);
  }
  return [...out];
}

/** Tags that reviews have added on top of the venue's seeded tags (for a "new" badge). */
export function reviewAddedTags(venue: Venue, mentions: TagMentions = {}): TagId[] {
  const base = new Set(venue.tags);
  return effectiveTags(venue, mentions).filter((t) => !base.has(t));
}

export function venueVector(venue: Venue, mentions: TagMentions = {}): Vec {
  const v = zeros();
  for (const t of venue.tags) if (isTagId(t)) v[tagIndex(t)] = 1;
  // Review mentions contribute gradually, even below the public-tag threshold.
  for (const [t, n] of Object.entries(mentions)) {
    if (!isTagId(t)) continue;
    const i = tagIndex(t);
    v[i] = Math.max(v[i], Math.min(1, n / 5));
  }
  if (venue.price_level === 1) v[tagIndex("cheap")] = Math.max(v[tagIndex("cheap")], 0.6);
  if (venue.price_level === 3) v[tagIndex("pricey")] = Math.max(v[tagIndex("pricey")], 0.6);
  return normalize(v);
}

/** Initial taste from onboarding choices. budget: 1 = £, 2 = ££, 3 = £££. */
export function tasteFromOnboarding(vibes: string[], budget: 1 | 2 | 3): Vec {
  const v = zeros();
  for (const t of vibes) if (isTagId(t)) v[tagIndex(t)] = 1;
  if (budget === 1) v[tagIndex("cheap")] = 1;
  if (budget === 3) v[tagIndex("pricey")] = 0.5;
  return normalize(v);
}

/** Nudge taste toward (right swipe) or away from (left swipe) a venue. */
export function updateTaste(taste: Vec, venueVec: Vec, liked: boolean): Vec {
  const eta = liked ? 0.15 : 0.08;
  const dir = liked ? 1 : -1;
  const next = taste.map((x, i) => Math.max(0, x + dir * eta * (venueVec[i] ?? 0)));
  // Never let taste collapse to all zeros.
  return norm(next) === 0 ? taste.slice() : normalize(next);
}

// ---------- similarity-weighted ratings ----------

export interface PersonalRating {
  /** 0..1, share of thumbs-up weighted toward people with similar taste. */
  score: number;
  /** Reviewers with cosine similarity >= 0.5 to the user. For UI copy. */
  similarReviewers: number;
  /** Total reviews on the venue. */
  totalReviews: number;
}

/**
 * Similarity-weighted thumbs-up rate with Bayesian shrinkage:
 *   score = (Σ w_v·y_v + k·prior) / (Σ w_v + k),  w_v = max(0, cos(u, v))²
 * With few similar reviewers the score falls back toward `prior`.
 */
export function personalRating(
  userTaste: Vec,
  reviews: ReviewSignal[],
  prior = 0.65,
  k = 2,
): PersonalRating {
  let num = 0;
  let den = 0;
  let similar = 0;
  for (const r of reviews) {
    const sim = cosine(userTaste, r.reviewer_taste);
    if (sim >= 0.5) similar++;
    const w = Math.max(0, sim) ** 2;
    num += w * (r.thumbs_up ? 1 : 0);
    den += w;
  }
  return {
    score: (num + k * prior) / (den + k),
    similarReviewers: similar,
    totalReviews: reviews.length,
  };
}

// ---------- geo ----------

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ---------- ranking ----------

export interface Filters {
  maxBudget: 1 | 2 | 3;
  maxKm: number;
  /** If non-empty, venue must have at least one of these tags. */
  vibes: string[];
  kinds?: VenueKind[];
}

export interface RankInput {
  venues: Venue[];
  userTaste: Vec;
  origin: { lat: number; lng: number };
  filters: Filters;
  mentionsByVenue: Record<string, TagMentions>;
  reviewsByVenue: Record<string, ReviewSignal[]>;
  /** Venue ids to exclude (already swiped in this deck). */
  exclude?: Set<string>;
  /** Every Nth card is an exploration pick from outside the user's profile. 0 disables. */
  exploreEvery?: number;
}

export interface RankedVenue {
  venue: Venue;
  tags: TagId[];
  match: number; // 0..1 taste match
  rating: PersonalRating;
  distanceKm: number;
  finalScore: number;
  /** Up to 3 tags the user and venue share most strongly — use for "why" copy. */
  reasons: TagId[];
  isExploration: boolean;
}

export const WEIGHTS = { match: 0.55, rating: 0.3, proximity: 0.15 } as const;

export function rankVenues(input: RankInput): RankedVenue[] {
  const { venues, userTaste, origin, filters } = input;
  const exploreEvery = input.exploreEvery ?? 5;

  const scored: RankedVenue[] = [];
  for (const venue of venues) {
    if (input.exclude?.has(venue.id)) continue;
    if (venue.price_level > filters.maxBudget) continue;
    if (filters.kinds?.length && !filters.kinds.includes(venue.kind)) continue;

    const d = distanceKm(origin.lat, origin.lng, venue.lat, venue.lng);
    if (d > filters.maxKm) continue;

    const mentions = input.mentionsByVenue[venue.id] ?? {};
    const tags = effectiveTags(venue, mentions);
    if (filters.vibes.length && !filters.vibes.some((v) => (tags as string[]).includes(v))) continue;

    const vv = venueVector(venue, mentions);
    const match = Math.max(0, cosine(userTaste, vv));
    const rating = personalRating(userTaste, input.reviewsByVenue[venue.id] ?? []);
    const proximity = Math.max(0, 1 - d / Math.max(filters.maxKm, 0.1));
    const finalScore =
      WEIGHTS.match * match + WEIGHTS.rating * rating.score + WEIGHTS.proximity * proximity;

    const reasons = tags
      .map((t) => ({ t, w: userTaste[tagIndex(t)] ?? 0 }))
      .filter((x) => x.w > 0)
      .sort((a, b) => b.w - a.w)
      .slice(0, 3)
      .map((x) => x.t);

    scored.push({ venue, tags, match, rating, distanceKm: d, finalScore, reasons, isExploration: false });
  }

  scored.sort((a, b) => b.finalScore - a.finalScore);
  if (!exploreEvery || scored.length < exploreEvery * 2) return scored;

  // Interleave exploration picks from the bottom half so the deck doesn't
  // become a filter bubble. Deterministic so the demo is repeatable.
  const half = Math.ceil(scored.length / 2);
  const top = scored.slice(0, half);
  const bottom = scored.slice(half);
  const out: RankedVenue[] = [];
  let b = Math.floor(bottom.length / 3);
  for (let i = 0; i < top.length; i++) {
    if ((out.length + 1) % exploreEvery === 0 && bottom.length) {
      const pick = bottom.splice(b % bottom.length, 1)[0];
      out.push({ ...pick, isExploration: true });
      b += 7;
    }
    out.push(top[i]);
  }
  return out.concat(bottom);
}
