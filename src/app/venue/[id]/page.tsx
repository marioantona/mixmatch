"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { useVenueData } from "@/hooks/useVenueData";
import { useProfile } from "@/hooks/useProfile";
import { useOrigin } from "@/hooks/useOrigin";
import { useVenueReviews } from "@/hooks/useVenueReviews";
import { distanceKm, effectiveTags, personalRating, reviewAddedTags } from "@/lib/scoring";
import { Button, buttonClass } from "@/components/ui/Button";
import { VenueHeader, formatKm } from "@/components/venue/VenueHeader";
import { VenueTags } from "@/components/venue/VenueTags";
import { PeopleLikeYou } from "@/components/venue/PeopleLikeYou";
import { RecentReviews } from "@/components/venue/RecentReviews";
import { VenueMap } from "@/components/map/VenueMap";

const WALK_MIN_PER_KM = 12;

export default function VenuePage() {
  const { id } = useParams<{ id: string }>();
  const { venues, mentionsByVenue, reviewsByVenue, loading, error, refresh } = useVenueData();
  const { profile } = useProfile();
  const { origin } = useOrigin();
  const recent = useVenueReviews(id);

  const venue = venues.find((v) => v.id === id);

  const details = useMemo(() => {
    if (!venue || !profile) return null;
    const mentions = mentionsByVenue[venue.id] ?? {};
    return {
      tags: effectiveTags(venue, mentions),
      added: reviewAddedTags(venue, mentions),
      rating: personalRating(profile.taste, reviewsByVenue[venue.id] ?? []),
      km: distanceKm(origin.lat, origin.lng, venue.lat, venue.lng),
    };
  }, [venue, profile, mentionsByVenue, reviewsByVenue, origin]);

  if (loading) return <VenueSkeleton />;

  if (error) {
    return (
      <Message text="Couldn't load this venue. Check your connection and try again.">
        <Button onClick={refresh}>Try again</Button>
      </Message>
    );
  }

  if (!venue || !details) {
    return (
      <Message text="We couldn't find that venue.">
        <Link href="/" className={buttonClass("ghost")}>
          Back to Discover
        </Link>
      </Message>
    );
  }

  const directions = `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}&travelmode=walking`;
  const walkMin = Math.max(1, Math.round(details.km * WALK_MIN_PER_KM));

  return (
    <div className="pb-24">
      <VenueHeader venue={venue} km={details.km} />

      <div className="flex flex-col gap-6 px-5 pt-5">
        <dl className="grid grid-cols-2 gap-3">
          {venue.pint_price !== null && (
            <div className="rounded-[20px] bg-kerb p-4">
              <dt className="text-sm text-foam/70">Typical pint (estimate)</dt>
              <dd className="font-display text-2xl font-extrabold">£{venue.pint_price.toFixed(2)}</dd>
            </div>
          )}
          <div className="rounded-[20px] bg-kerb p-4">
            <dt className="text-sm text-foam/70">Walk</dt>
            <dd className="font-display text-2xl font-extrabold">{walkMin} min</dd>
            <dd className="text-sm text-foam/70">{formatKm(details.km)}</dd>
          </div>
        </dl>
        <p className="-mt-3 text-xs text-foam/70">
          {venue.address ? `${venue.address} · ` : ""}Prices are estimates, not verified.
        </p>

        <PeopleLikeYou rating={details.rating} />

        <VenueTags tags={details.tags} reviewAdded={details.added} />

        <a href={directions} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", true)}>
          Get directions
        </a>

        <VenueMap venues={[{ venue, distanceKm: details.km }]} origin={origin} height="180px" compact />

        <RecentReviews reviews={recent.reviews} loading={recent.loading} error={recent.error} onRetry={recent.reload} />
      </div>

      {/* Sticky CTA just above the bottom nav. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 bg-gradient-to-t from-night via-night/90 to-transparent pb-3 pt-6">
        <div className="mx-auto max-w-md px-5">
          <Link href={`/venue/${venue.id}/review`} className={buttonClass("go", true)}>
            Rate your night
          </Link>
        </div>
      </div>
    </div>
  );
}

function Message({ text, children }: { text: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-5 px-5 text-center">
      <p className="text-lg">{text}</p>
      {children}
    </div>
  );
}

function VenueSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading venue">
      <div className="h-72 animate-pulse rounded-b-[28px] bg-kerb" />
      <div className="flex flex-col gap-4 px-5 pt-5">
        <div className="h-20 animate-pulse rounded-[20px] bg-kerb" />
        <div className="h-24 animate-pulse rounded-[20px] bg-kerb" />
        <div className="h-8 w-2/3 animate-pulse rounded-full bg-kerb" />
      </div>
    </div>
  );
}
