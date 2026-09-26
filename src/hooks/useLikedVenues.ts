"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { rankVenues, type RankedVenue } from "@/lib/scoring";
import { useProfile } from "@/hooks/useProfile";
import { useVenueData } from "@/hooks/useVenueData";
import { useOrigin } from "@/hooks/useOrigin";

/** Venues this profile liked on the solo deck, newest first, with personal ratings. */
export function useLikedVenues() {
  const { profile } = useProfile();
  const { venues, mentionsByVenue, reviewsByVenue, loading: venuesLoading, error: venuesError } = useVenueData();
  const { origin } = useOrigin();
  const [likedIds, setLikedIds] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      const { data, error: e } = await supabase
        .from("swipes")
        .select("venue_id, created_at")
        .eq("profile_id", profile.id)
        .eq("liked", true)
        .is("group_id", null)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (e) setError(e.message);
      else {
        setError(null);
        setLikedIds((data ?? []).map((r) => r.venue_id as string));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, version]);

  // Rank everything with wide-open filters, then keep only liked venues in liked order,
  // so each row gets the same "people like you" score the deck would show.
  const liked = useMemo<RankedVenue[]>(() => {
    if (!profile || !likedIds?.length || !venues.length) return [];
    const byId = new Map(
      rankVenues({
        venues,
        userTaste: profile.taste,
        origin,
        filters: { maxBudget: 3, maxKm: 50, vibes: [] },
        mentionsByVenue,
        reviewsByVenue,
        exploreEvery: 0,
      }).map((r) => [r.venue.id, r]),
    );
    return likedIds.flatMap((id) => byId.get(id) ?? []);
  }, [profile, likedIds, venues, origin, mentionsByVenue, reviewsByVenue]);

  const unlike = useCallback(
    async (venueId: string) => {
      if (!profile) return;
      setLikedIds((ids) => ids?.filter((id) => id !== venueId) ?? ids); // optimistic
      const { error: e } = await supabase
        .from("swipes")
        .upsert(
          { profile_id: profile.id, venue_id: venueId, group_id: null, liked: false },
          { onConflict: "profile_id,venue_id,group_id" },
        );
      if (e) {
        setError(e.message);
        setVersion((v) => v + 1); // reload the real list
      }
    },
    [profile],
  );

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return {
    liked,
    loading: venuesLoading || likedIds === null,
    error: venuesError ?? error,
    unlike,
    reload,
  };
}
