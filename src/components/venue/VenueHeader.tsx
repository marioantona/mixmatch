"use client";

import { useRouter } from "next/navigation";
import type { Venue } from "@/lib/scoring";
import { KIND_BG, KindChip } from "@/components/ui/KindChip";
import { PriceGlyphs } from "@/components/ui/PriceGlyphs";

/** Font size for a venue name so long names wrap to at most ~3 lines at 390px. */
export function nameSize(name: string): string {
  if (name.length <= 10) return "text-[56px]";
  if (name.length <= 18) return "text-[46px]";
  if (name.length <= 26) return "text-[38px]";
  return "text-[32px]";
}

export function formatKm(km: number): string {
  return `${km.toFixed(1)} km`;
}

export function VenueHeader({ venue, km }: { venue: Venue; km: number }) {
  const router = useRouter();
  const back = () => (window.history.length > 1 ? router.back() : router.push("/"));
  return (
    <header className={`${KIND_BG[venue.kind]} flex min-h-72 flex-col rounded-b-[28px] px-5 pb-6 pt-3`}>
      <button
        type="button"
        onClick={back}
        aria-label="Back"
        className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-2xl hover:bg-foam/10"
      >
        ←
      </button>
      <div className="mt-2 flex items-center gap-2">
        <KindChip kind={venue.kind} />
        <span className="inline-flex min-h-7 items-center rounded-full bg-foam/12 px-3 text-sm font-semibold">
          {formatKm(km)}
        </span>
        <PriceGlyphs level={venue.price_level} className="ml-auto text-lg" />
      </div>
      <h1 className={`venue-name mt-auto pt-8 break-words ${nameSize(venue.name)}`}>{venue.name}</h1>
    </header>
  );
}
