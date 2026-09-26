"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { rankVenues, updateTaste, venueVector, type Filters, type RankedVenue } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";
import { useProfile, type Profile } from "@/hooks/useProfile";
import { useVenueData } from "@/hooks/useVenueData";
import { useOrigin } from "@/hooks/useOrigin";
import { SwipeDeck } from "@/components/deck/SwipeDeck";
import { FilterSheet } from "@/components/filters/FilterSheet";
import { VenueList } from "@/components/list/VenueList";
import { VenueMap } from "@/components/map/VenueMap";
import { Button } from "@/components/ui/Button";

type View = "deck" | "map" | "list";
const VIEWS: { id: View; label: string }[] = [
  { id: "deck", label: "Deck" },
  { id: "map", label: "Map" },
  { id: "list", label: "List" },
];

const swipedKey = (profileId: string) => `rounds.swiped.${profileId}`;
// View + filters survive a trip to a venue page and back.
const UI_KEY = "rounds.discoverUi";

function readUi(): { view?: View; filters?: Filters } {
  try {
    return JSON.parse(window.sessionStorage.getItem(UI_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function readSwiped(profileId: string): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(swipedKey(profileId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export default function DiscoverPage() {
  const { profile } = useProfile();
  // ProfileGate only renders pages once a profile exists; this narrows the type.
  if (!profile) return null;
  return <Discover profile={profile} />;
}

function Discover({ profile }: { profile: Profile }) {
  const { saveTaste } = useProfile();
  const { venues, mentionsByVenue, reviewsByVenue, loading, error, refresh } = useVenueData();
  const { origin } = useOrigin();

  const router = useRouter();
  const [view, setView] = useState<View>(() => readUi().view ?? "deck");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(
    () => readUi().filters ?? { maxBudget: profile.budget, maxKm: 1, vibes: [] },
  );

  useEffect(() => {
    try {
      window.sessionStorage.setItem(UI_KEY, JSON.stringify({ view, filters }));
    } catch {
      // Storage unavailable: view resets to the deck.
    }
  }, [view, filters]);

  const openVenue = useCallback((rv: RankedVenue) => router.push(`/venue/${rv.venue.id}`), [router]);
  // Ranking uses a taste snapshot, refreshed when filters are applied, so the
  // deck doesn't reorder under the user's thumb after every swipe.
  const [rankTaste, setRankTaste] = useState(profile.taste);
  const tasteRef = useRef(profile.taste);
  const [swiped, setSwiped] = useState<Set<string>>(() => readSwiped(profile.id));

  useEffect(() => {
    try {
      window.sessionStorage.setItem(swipedKey(profile.id), JSON.stringify([...swiped]));
    } catch {
      // Storage unavailable: swipes just won't survive a reload.
    }
  }, [profile.id, swiped]);

  const ranked = useMemo(
    () => rankVenues({ venues, userTaste: rankTaste, origin, filters, mentionsByVenue, reviewsByVenue }),
    [venues, rankTaste, origin, filters, mentionsByVenue, reviewsByVenue],
  );
  // Filter after ranking so removing a swiped card never reshuffles the rest.
  const remaining = useMemo(() => ranked.filter((r) => !swiped.has(r.venue.id)), [ranked, swiped]);

  const onSwipe = useCallback(
    (rv: RankedVenue, liked: boolean) => {
      const id = rv.venue.id;
      setSwiped((prev) => new Set(prev).add(id));

      supabase
        .from("swipes")
        .upsert(
          { profile_id: profile.id, venue_id: id, group_id: null, liked },
          { onConflict: "profile_id,venue_id,group_id" },
        )
        .then(({ error: e }) => {
          if (e) console.warn("Couldn't save swipe", e.message);
        });

      const next = updateTaste(tasteRef.current, venueVector(rv.venue, mentionsByVenue[id]), liked);
      tasteRef.current = next;
      saveTaste(next);
    },
    [profile.id, mentionsByVenue, saveTaste],
  );

  const applyFilters = useCallback((next: Filters) => {
    setFilters(next);
    setRankTaste(tasteRef.current);
    setFiltersOpen(false);
  }, []);

  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  const vibeCount = filters.vibes.length;

  return (
    <div className="flex min-h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] flex-col gap-4 px-4 pt-4 pb-4">
      <header className="flex items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold" style={{ fontVariationSettings: '"wdth" 75' }}>
          Discover
        </h1>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="ml-auto min-h-11 rounded-full border border-foam/12 px-4 text-sm font-semibold"
        >
          Filters · {filters.maxKm} km{vibeCount ? ` · ${vibeCount} vibe${vibeCount > 1 ? "s" : ""}` : ""}
        </button>
      </header>

      <div role="tablist" aria-label="View" className="grid grid-cols-3 rounded-full bg-kerb p-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            onClick={() => setView(v.id)}
            className={`min-h-10 rounded-full text-sm font-semibold transition ${
              view === v.id ? "bg-sodium text-night" : "text-foam/70"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mx-auto h-[min(62dvh,540px)] w-full max-w-[400px] animate-pulse rounded-[28px] bg-kerb" aria-busy="true">
          <span className="sr-only">Loading venues</span>
        </div>
      ) : error ? (
        <Message text="Couldn't load venues. Check your connection and try again.">
          <Button onClick={refresh}>Try again</Button>
        </Message>
      ) : ranked.length === 0 ? (
        <Message text={`No venues match within ${filters.maxKm} km. Widen your distance or clear some vibes.`}>
          <Button onClick={() => setFiltersOpen(true)}>Change filters</Button>
        </Message>
      ) : view === "deck" ? (
        <SwipeDeck
          venues={remaining}
          onSwipe={onSwipe}
          onOpen={openVenue}
          emptyState={
            <Message text={`Nothing left within ${filters.maxKm} km. Widen your distance.`}>
              <Button onClick={() => setFiltersOpen(true)}>Change filters</Button>
              <Button variant="ghost" onClick={() => setSwiped(new Set())}>
                Start over
              </Button>
            </Message>
          }
        />
      ) : view === "list" ? (
        <VenueList venues={ranked} origin={origin} />
      ) : (
        <VenueMap venues={ranked} origin={origin} height="calc(100dvh - 13rem - env(safe-area-inset-bottom))" />
      )}

      {filtersOpen && <FilterSheet value={filters} onApply={applyFilters} onClose={closeFilters} />}
    </div>
  );
}

function Message({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-foam/70">{text}</p>
      {children && <div className="flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
