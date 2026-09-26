"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";
import { latLngBounds } from "leaflet";
import { KIND_HEX, KIND_LABEL } from "@/components/ui/KindChip";
import { PriceGlyphs } from "@/components/ui/PriceGlyphs";
import type { Origin } from "@/hooks/useOrigin";
import type { MapVenue } from "./VenueMap";

// CARTO basemaps now need an API key, so use standard OSM tiles darkened in CSS (.tiles-night in globals.css).
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const SODIUM = "#FFB23F";
const FOAM = "#FAF1DE";

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join(";");
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 16);
    else if (points.length > 1) map.fitBounds(latLngBounds(points), { padding: [32, 32], maxZoom: 17 });
    // Refit only when the set of points changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

export interface VenueMapInnerProps {
  venues: MapVenue[];
  origin: Origin;
  compact?: boolean;
}

export default function VenueMapInner({ venues, origin, compact = false }: VenueMapInnerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = venues.find((v) => v.venue.id === selectedId) ?? null;
  const points = useMemo<[number, number][]>(
    () => [[origin.lat, origin.lng], ...venues.map((v): [number, number] => [v.venue.lat, v.venue.lng])],
    [origin, venues],
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px]">
      <MapContainer
        center={[origin.lat, origin.lng]}
        zoom={15}
        className="h-full w-full bg-night"
        zoomControl={!compact}
        dragging={!compact}
        scrollWheelZoom={!compact}
        doubleClickZoom={!compact}
        touchZoom={!compact}
        keyboard={!compact}
        preferCanvas
      >
        <TileLayer url={TILES} attribution={ATTRIBUTION} className="tiles-night" maxZoom={19} />
        <FitBounds points={points} />
        {venues.map(({ venue }) => (
          <CircleMarker
            key={venue.id}
            center={[venue.lat, venue.lng]}
            radius={compact ? 10 : selectedId === venue.id ? 11 : 8}
            pathOptions={{
              color: selectedId === venue.id ? SODIUM : FOAM,
              weight: 2,
              fillColor: KIND_HEX[venue.kind],
              fillOpacity: 1,
            }}
            eventHandlers={compact ? undefined : { click: () => setSelectedId(venue.id) }}
          />
        ))}
        {/* You are here. */}
        <CircleMarker
          center={[origin.lat, origin.lng]}
          radius={7}
          pathOptions={{ color: "#16142E", weight: 3, fillColor: SODIUM, fillOpacity: 1 }}
          interactive={false}
        />
      </MapContainer>

      {!compact && (
        <ul
          aria-label="Map key"
          className="absolute right-3 top-3 z-[1000] flex gap-3 rounded-full bg-kerb/90 px-3 py-1.5 text-xs font-semibold shadow-lg"
        >
          {(["pub", "bar", "nightclub"] as const).map((k) => (
            <li key={k} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full ring-1 ring-foam" style={{ background: KIND_HEX[k] }} aria-hidden="true" />
              {KIND_LABEL[k]}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-sodium" aria-hidden="true" />
            You
          </li>
        </ul>
      )}

      {selected && !compact && (
        <div className="absolute inset-x-3 bottom-7 z-[1000] flex items-center gap-3 rounded-2xl bg-kerb p-3 shadow-xl">
          <Link href={`/venue/${selected.venue.id}`} className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-extrabold" style={{ fontVariationSettings: '"wdth" 70' }}>
              {selected.venue.name}
            </p>
            <p className="flex items-center gap-2 text-sm text-foam/70">
              {KIND_LABEL[selected.venue.kind]} · {selected.distanceKm.toFixed(1)} km ·{" "}
              <PriceGlyphs level={selected.venue.price_level} />
            </p>
          </Link>
          <Link
            href={`/venue/${selected.venue.id}`}
            className="inline-flex min-h-11 items-center rounded-full bg-sodium px-4 font-semibold text-night"
          >
            View
          </Link>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            aria-label="Close"
            className="flex size-11 items-center justify-center rounded-full text-xl text-foam/70"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
