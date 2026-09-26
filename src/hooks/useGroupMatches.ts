"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchMatches } from "@/lib/group";

const POLL_MS = 5000;

/**
 * Venues every member liked. Realtime on swipes triggers a check; a 5s poll is the
 * safety net for flaky wifi. New matches are queued and revealed one at a time.
 */
export function useGroupMatches(groupId: string | undefined, enabled: boolean) {
  const [matches, setMatches] = useState<string[]>([]);
  const [queue, setQueue] = useState<string[]>([]);
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!groupId || !enabled) return;
    let cancelled = false;
    let running = false;

    const check = async () => {
      if (running) return;
      running = true;
      try {
        const ids = await fetchMatches(groupId);
        if (cancelled) return;
        // Matches that existed before this screen opened are listed but not celebrated.
        if (seen.current === null) {
          seen.current = new Set(ids);
          setMatches(ids);
          return;
        }
        const fresh = ids.filter((id) => !seen.current!.has(id));
        if (fresh.length) {
          fresh.forEach((id) => seen.current!.add(id));
          // Accumulate: a match stays listed even if someone joins later and it stops qualifying.
          setMatches((prev) => [...prev, ...fresh]);
          setQueue((q) => [...q, ...fresh]);
        }
      } catch {
        // Next realtime event or poll will retry.
      } finally {
        running = false;
      }
    };

    void check();
    const channel = supabase
      .channel(`group-swipes:${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "swipes", filter: `group_id=eq.${groupId}` },
        () => void check(),
      )
      .subscribe();
    const poll = setInterval(() => void check(), POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [groupId, enabled]);

  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);
  return { matches, newMatch: queue[0] ?? null, dismiss };
}
