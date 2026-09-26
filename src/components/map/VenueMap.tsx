"use client";

// Leaflet touches `window` on import, so it must never render on the server.
import dynamic from "next/dynamic";
import type { Venue } from "@/lib/scoring";
import type { Origin } from "@/hooks/useOrigin";

/** RankedVenue satisfies this, so Discover can pass its ranked list straight in. */
export interface MapVenue {
  venue: Venue;
  distanceKm: number;
}

export interface VenueMapProps {
  venues: MapVenue[];
  origin: Origin;
  /** CSS height, e.g. "60dvh" or "180px". */
  height?: string;
  /** Small, non-interactive preview (venue page). */
  compact?: boolean;
}

const Inner = dynamic(() => import("./VenueMapInner"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-[28px] bg-kerb" aria-busy="true" />,
});

export function VenueMap({ height = "60dvh", ...props }: VenueMapProps) {
  return (
    <div style={{ height }} className="relative isolate w-full">
      <Inner {...props} />
    </div>
  );
}
