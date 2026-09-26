"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface VenueReview {
  thumbs_up: boolean;
  tags: string[];
  body: string | null;
  created_at: string;
  display_name: string;
}

interface Row extends Omit<VenueReview, "display_name"> {
  profiles: { display_name: string } | { display_name: string }[] | null;
}

async function fetchReviews(venueId: string, limit: number): Promise<VenueReview[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("thumbs_up, tags, body, created_at, profiles(display_name)")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Row[]).map(({ profiles, ...r }) => {
    const p = Array.isArray(profiles) ? profiles[0] : profiles;
    return { ...r, display_name: p?.display_name ?? "Someone" };
  });
}

/** Most recent reviews for one venue, with reviewer names. */
export function useVenueReviews(venueId: string | undefined, limit = 5) {
  const [reviews, setReviews] = useState<VenueReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!venueId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetchReviews(venueId, limit);
        if (cancelled) return;
        setReviews(r);
        setError(null);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [venueId, limit, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { reviews, loading, error, reload };
}
