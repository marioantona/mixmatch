"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ReviewSignal, TagMentions, Venue } from "@/lib/scoring";

export interface VenueData {
  venues: Venue[];
  mentionsByVenue: Record<string, TagMentions>;
  reviewsByVenue: Record<string, ReviewSignal[]>;
}

interface TagRow {
  venue_id: string;
  tag: string;
  mentions: number;
}

interface ReviewRow {
  venue_id: string;
  thumbs_up: boolean;
  // Supabase types an embedded many-to-one as object or array depending on inference.
  profiles: { taste: number[] } | { taste: number[] }[] | null;
}

// Module-level cache: navigating between screens doesn't refetch.
let cache: VenueData | null = null;
let inflight: Promise<VenueData> | null = null;
const listeners = new Set<(d: VenueData) => void>();

// Supabase caps every response at 1000 rows (project max-rows), so page through.
const PAGE = 1000;

/** Pages need a stable order or rows can be skipped/duplicated between pages. */
async function fetchAll<T>(
  table: string,
  columns: string,
  orderBy: string[],
): Promise<{ data: T[]; error: { message: string } | null }> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from(table).select(columns);
    for (const col of orderBy) q = q.order(col);
    const { data, error } = await q.range(from, from + PAGE - 1);
    if (error) return { data: out, error };
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) return { data: out, error: null };
  }
}

async function load(): Promise<VenueData> {
  const [v, t, r] = await Promise.all([
    fetchAll<Venue>("venues", "id, name, kind, lat, lng, address, price_level, pint_price, tags", ["id"]),
    fetchAll<TagRow>("venue_review_tags", "venue_id, tag, mentions", ["venue_id", "tag"]),
    fetchAll<ReviewRow>("reviews", "id, venue_id, thumbs_up, profiles(taste)", ["id"]),
  ]);
  const err = v.error ?? t.error ?? r.error;
  if (err) throw new Error(err.message);

  const mentionsByVenue: Record<string, TagMentions> = {};
  for (const row of t.data) {
    (mentionsByVenue[row.venue_id] ??= {})[row.tag] = row.mentions;
  }

  const reviewsByVenue: Record<string, ReviewSignal[]> = {};
  for (const row of r.data) {
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    if (!p?.taste) continue;
    (reviewsByVenue[row.venue_id] ??= []).push({ thumbs_up: row.thumbs_up, reviewer_taste: p.taste });
  }

  const venues = v.data.map((x) => ({
    ...x,
    pint_price: x.pint_price === null ? null : Number(x.pint_price), // numeric comes back as string
  }));
  return { venues, mentionsByVenue, reviewsByVenue };
}

function fetchShared(force = false): Promise<VenueData> {
  if (!force && cache) return Promise.resolve(cache);
  if (!force && inflight) return inflight;
  inflight = load()
    .then((d) => {
      cache = d;
      listeners.forEach((fn) => fn(d));
      return d;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useVenueData() {
  const [data, setData] = useState<VenueData | null>(cache);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listeners.add(setData);
    if (!cache) {
      fetchShared()
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false));
    }
    return () => {
      listeners.delete(setData);
    };
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await fetchShared(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  return {
    venues: data?.venues ?? [],
    mentionsByVenue: data?.mentionsByVenue ?? {},
    reviewsByVenue: data?.reviewsByVenue ?? {},
    loading,
    error,
    refresh,
  };
}
