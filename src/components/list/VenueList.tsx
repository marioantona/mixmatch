import Link from "next/link";
import type { RankedVenue } from "@/lib/scoring";
import type { Origin } from "@/hooks/useOrigin";
import { KindChip } from "@/components/ui/KindChip";
import { PriceGlyphs } from "@/components/ui/PriceGlyphs";
import { formatKm } from "@/components/deck/bits";

export interface VenueListProps {
  venues: RankedVenue[];
  /** Same props as VenueMap so Discover can swap views freely. */
  origin: Origin;
}

export function VenueList({ venues }: VenueListProps) {
  return (
    <ul className="space-y-2">
      {venues.map((rv) => (
        <li key={rv.venue.id}>
          <Link
            href={`/venue/${rv.venue.id}`}
            className="flex min-h-11 items-center gap-3 rounded-2xl bg-kerb px-4 py-3 transition active:scale-[0.99]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-xl leading-tight font-extrabold" style={{ fontVariationSettings: '"wdth" 70' }}>
                {rv.venue.name}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-foam/70">
                <KindChip kind={rv.venue.kind} />
                <span>{formatKm(rv.distanceKm)}</span>
                <PriceGlyphs level={rv.venue.price_level} />
              </div>
            </div>
            {rv.rating.similarReviewers >= 1 && (
              <p className="shrink-0 text-right text-sm">
                <span className="block text-lg font-semibold text-go">{Math.round(rv.rating.score * 100)}%</span>
                <span className="text-foam/70">people like you</span>
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
