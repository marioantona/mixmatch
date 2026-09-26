"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { rankVenues, type RankedVenue } from "@/lib/scoring";
import { DEMO_ORIGIN } from "@/lib/supabase";
import { fetchMyGroupSwipes, groupTaste, saveGroupSwipe, type Member } from "@/lib/group";
import { useVenueData } from "@/hooks/useVenueData";
import { SwipeDeck } from "@/components/deck/SwipeDeck";
import { Button } from "@/components/ui/Button";

export interface GroupDeckProps {
  groupId: string;
  meId: string;
  /** Members as of "Start swiping". Frozen by the parent so the order never shifts. */
  members: Member[];
}

/**
 * Every phone ranks with the same inputs — members' tastes sorted by id, DEMO_ORIGIN,
 * no exploration picks — so everyone sees the same order. Group swipes don't touch
 * personal taste.
 */
export function GroupDeck({ groupId, meId, members }: GroupDeckProps) {
  const router = useRouter();
  const { venues, mentionsByVenue, reviewsByVenue, loading, error, refresh } = useVenueData();
  const [swiped, setSwiped] = useState<Set<string> | null>(null);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = await fetchMyGroupSwipes(groupId, meId).catch(() => []);
      if (!cancelled) setSwiped(new Set(ids));
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId, meId]);

  const ranked = useMemo(() => {
    const sorted = [...members].sort((a, b) => a.profile_id.localeCompare(b.profile_id));
    const maxBudget = Math.min(3, ...sorted.map((m) => m.budget)) as 1 | 2 | 3;
    return rankVenues({
      venues,
      userTaste: groupTaste(sorted.map((m) => m.taste)),
      origin: DEMO_ORIGIN,
      filters: { maxBudget, maxKm: 1, vibes: [] },
      mentionsByVenue,
      reviewsByVenue,
      exploreEvery: 0,
    });
  }, [venues, members, mentionsByVenue, reviewsByVenue]);

  // Filter after ranking so the order stays identical across phones.
  const remaining = useMemo(() => (swiped ? ranked.filter((r) => !swiped.has(r.venue.id)) : []), [ranked, swiped]);

  const onSwipe = useCallback(
    (rv: RankedVenue, liked: boolean) => {
      setSwiped((prev) => new Set(prev).add(rv.venue.id));
      saveGroupSwipe(groupId, meId, rv.venue.id, liked)
        .then(() => setSaveError(false))
        .catch(() => setSaveError(true));
    },
    [groupId, meId],
  );

  if (loading || swiped === null) {
    return <div className="mx-auto h-[min(62dvh,540px)] w-full max-w-[400px] animate-pulse rounded-[28px] bg-kerb" aria-busy="true" />;
  }
  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-foam/70">Couldn&apos;t load venues. Check your connection and try again.</p>
        <Button onClick={refresh}>Try again</Button>
      </div>
    );
  }

  return (
    <>
      {saveError && (
        <p className="text-center text-sm text-pass" role="alert">
          A swipe didn&apos;t save. Check your connection.
        </p>
      )}
      <SwipeDeck
        venues={remaining}
        onSwipe={onSwipe}
        onOpen={(rv) => router.push(`/venue/${rv.venue.id}`)}
        emptyState={
          <p className="px-6 text-center text-foam/70">
            You&apos;ve been through everything nearby. Waiting on the others — matches will pop up here.
          </p>
        }
      />
    </>
  );
}
