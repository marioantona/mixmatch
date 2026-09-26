import type { VenueKind } from "@/lib/scoring";

export const KIND_LABEL: Record<VenueKind, string> = { pub: "Pub", bar: "Bar", nightclub: "Club" };
/** Tailwind bg class for each kind's card field. */
export const KIND_BG: Record<VenueKind, string> = { pub: "bg-pub", bar: "bg-bar", nightclub: "bg-club" };
/** Hex values (for Leaflet, inline styles). Keep in sync with globals.css. */
export const KIND_HEX: Record<VenueKind, string> = { pub: "#5A2E1F", bar: "#1F4A5A", nightclub: "#4B1F5A" };

export function KindChip({ kind, className = "" }: { kind: VenueKind; className?: string }) {
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full bg-foam/12 px-3 text-sm font-semibold ${className}`}>
      {KIND_LABEL[kind]}
    </span>
  );
}
