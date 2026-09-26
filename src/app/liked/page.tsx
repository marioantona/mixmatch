"use client";

import Link from "next/link";
import { useLikedVenues } from "@/hooks/useLikedVenues";
import { KindChip } from "@/components/ui/KindChip";
import { PriceGlyphs } from "@/components/ui/PriceGlyphs";
import { Button, buttonClass } from "@/components/ui/Button";
import { formatKm } from "@/components/deck/bits";

export default function LikedPage() {
  const { liked, loading, error, unlike, reload } = useLikedVenues();

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <header>
        <h1 className="font-display text-3xl font-extrabold" style={{ fontVariationSettings: '"wdth" 75' }}>
          Liked
        </h1>
        <p className="text-sm text-foam/70">Places you said &ldquo;I&apos;m in&rdquo; to on Discover. Saved on this phone.</p>
      </header>

      {loading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-kerb" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 pt-16 text-center">
          <p className="text-foam/70">Couldn&apos;t load your liked places. Check your connection and try again.</p>
          <Button onClick={reload}>Try again</Button>
        </div>
      ) : liked.length === 0 ? (
        <div className="flex flex-col items-center gap-4 pt-16 text-center">
          <p className="text-foam/70">Nothing liked yet. Swipe right on places you&apos;d go.</p>
          <Link href="/" className={buttonClass("primary")}>
            Go to Discover
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {liked.map((rv) => (
            <li key={rv.venue.id} className="flex items-center gap-2 rounded-2xl bg-kerb py-2 pl-4 pr-2">
              <Link href={`/venue/${rv.venue.id}`} className="min-w-0 flex-1 py-1">
                <p className="truncate font-display text-xl font-extrabold leading-tight" style={{ fontVariationSettings: '"wdth" 70' }}>
                  {rv.venue.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-foam/70">
                  <KindChip kind={rv.venue.kind} />
                  <span>{formatKm(rv.distanceKm)}</span>
                  <PriceGlyphs level={rv.venue.price_level} />
                  {rv.rating.similarReviewers >= 1 && (
                    <span className="font-semibold text-go">{Math.round(rv.rating.score * 100)}% people like you</span>
                  )}
                </div>
              </Link>
              <button
                type="button"
                onClick={() => void unlike(rv.venue.id)}
                aria-label={`Remove ${rv.venue.name} from liked`}
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-lg text-foam/70 hover:bg-foam/10"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
