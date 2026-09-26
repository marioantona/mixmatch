"use client";

import { useEffect, useState } from "react";
import { DEMO_ORIGIN } from "@/lib/supabase";
import { distanceKm } from "@/lib/scoring";

export interface Origin {
  lat: number;
  lng: number;
}

/** Venues are only seeded around DEMO_ORIGIN; further away than this we'd show an empty deck. */
const MAX_KM_FROM_DEMO = 5;

let resolved: { origin: Origin; isDemo: boolean } | null = null;

/**
 * Starts at DEMO_ORIGIN so ranking never waits. `?demo=1` forces DEMO_ORIGIN;
 * otherwise tries geolocation (5s timeout) and silently falls back.
 */
export function useOrigin(): { origin: Origin; isDemo: boolean } {
  const [state, setState] = useState(resolved ?? { origin: DEMO_ORIGIN, isDemo: true });

  useEffect(() => {
    if (resolved) return;
    const done = (s: { origin: Origin; isDemo: boolean }) => {
      resolved = s;
      setState(s);
    };
    const demo = { origin: DEMO_ORIGIN, isDemo: true };
    if (new URLSearchParams(window.location.search).get("demo") === "1" || !navigator.geolocation) {
      done(demo);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const here = { lat: coords.latitude, lng: coords.longitude };
        const far = distanceKm(here.lat, here.lng, DEMO_ORIGIN.lat, DEMO_ORIGIN.lng) > MAX_KM_FROM_DEMO;
        done(far ? demo : { origin: here, isDemo: false });
      },
      () => done(demo),
      { timeout: 5000, maximumAge: 60_000 },
    );
  }, []);

  return state;
}
