"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchMembers, findGroup, joinGroup, type Group, type Member } from "@/lib/group";

type Status = "loading" | "ready" | "not-found" | "error";

/**
 * Looks up a group by code, joins it (idempotent), and keeps the member list
 * live via Realtime on group_members.
 */
export function useGroup(code: string, profileId: string | undefined) {
  const [status, setStatus] = useState<Status>("loading");
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [joinedName, setJoinedName] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const known = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const reloadMembers = async (groupId: string) => {
      const list = await fetchMembers(groupId);
      if (cancelled) return;
      // Announce newcomers after the initial load.
      if (known.current.size) {
        const fresh = list.find((m) => !known.current.has(m.profile_id) && m.profile_id !== profileId);
        if (fresh) setJoinedName(fresh.display_name);
      }
      known.current = new Set(list.map((m) => m.profile_id));
      setMembers(list);
    };

    (async () => {
      try {
        const g = await findGroup(code);
        if (cancelled) return;
        if (!g) {
          setStatus("not-found");
          return;
        }
        await joinGroup(g.id, profileId);
        await reloadMembers(g.id);
        if (cancelled) return;
        setGroup(g);
        setStatus("ready");
        channel = supabase
          .channel(`group-members:${g.id}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "group_members", filter: `group_id=eq.${g.id}` },
            () => void reloadMembers(g.id).catch(() => {}),
          )
          .subscribe();
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [code, profileId, attempt]);

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((a) => a + 1);
  }, []);
  const clearJoined = useCallback(() => setJoinedName(null), []);

  return { status, group, members, joinedName, clearJoined, retry };
}
