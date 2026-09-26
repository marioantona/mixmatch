// Small presentational pieces used by the deck and list. Swap for
// src/components/ui/* atoms if the setup lead ships them.

import type { VenueKind } from "@/lib/scoring";

export const KIND_LABEL: Record<VenueKind, string> = {
  pub: "Pub",
  bar: "Bar",
  nightclub: "Club",
};

export const KIND_BG: Record<VenueKind, string> = {
  pub: "bg-pub",
  bar: "bg-bar",
  nightclub: "bg-club",
};

export function formatKm(km: number): string {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-foam/12 px-3 py-1 text-sm font-semibold whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

export function PriceGlyphs({ level, className = "" }: { level: 1 | 2 | 3; className?: string }) {
  return (
    <span className={`font-semibold tracking-wide ${className}`} aria-label={`Price ${"£".repeat(level)}`}>
      {[1, 2, 3].map((n) => (
        <span key={n} aria-hidden className={n > level ? "opacity-30" : undefined}>
          £
        </span>
      ))}
    </span>
  );
}
