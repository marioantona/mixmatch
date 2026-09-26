// Group mode data access. Plain async functions; hooks in src/hooks wrap them.

import { supabase } from "./supabase";
import { normalize, zeros, type Vec } from "./scoring";

export interface Group {
  id: string;
  code: string;
  created_by: string | null;
}

export interface Member {
  profile_id: string;
  display_name: string;
  taste: Vec;
  budget: 1 | 2 | 3;
}

// No I or O: codes get read aloud across a noisy bar.
const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export const CODE_RE = /^[A-Z]{4}$/;

function randomCode(): string {
  let s = "";
  for (let i = 0; i < 4; i++) s += CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)];
  return s;
}

export async function createGroup(profileId: string): Promise<Group> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("groups")
      .insert({ code: randomCode(), created_by: profileId })
      .select("id, code, created_by")
      .single();
    if (error?.code === "23505") continue; // code clash, try another
    if (error || !data) throw new Error(error?.message ?? "Couldn't create group");
    await joinGroup(data.id, profileId);
    return data as Group;
  }
  throw new Error("Couldn't find a free group code");
}

export async function findGroup(code: string): Promise<Group | null> {
  const { data, error } = await supabase
    .from("groups")
    .select("id, code, created_by")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Group | null) ?? null;
}

/** Idempotent: re-joining is a no-op. */
export async function joinGroup(groupId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from("group_members")
    .upsert({ group_id: groupId, profile_id: profileId }, { onConflict: "group_id,profile_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

interface MemberRow {
  profile_id: string;
  profiles: Omit<Member, "profile_id"> | Omit<Member, "profile_id">[] | null;
}

export async function fetchMembers(groupId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from("group_members")
    .select("profile_id, joined_at, profiles(display_name, taste, budget)")
    .eq("group_id", groupId)
    .order("joined_at");
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as MemberRow[]).flatMap((row) => {
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return p ? [{ profile_id: row.profile_id, ...p }] : [];
  });
}

/** Normalised average of members' normalised tastes. Order-independent. */
export function groupTaste(tastes: Vec[]): Vec {
  const sum = zeros();
  for (const t of tastes) normalize(t).forEach((x, i) => (sum[i] += x));
  return normalize(sum);
}

/** Venue ids every member has liked (rpc needs >= 2 members). */
export async function fetchMatches(groupId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc("group_matches", { p_group_id: groupId });
  if (error) throw new Error(error.message);
  return ((data ?? []) as { venue_id: string }[]).map((r) => r.venue_id);
}

export async function fetchMyGroupSwipes(groupId: string, profileId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("swipes")
    .select("venue_id")
    .eq("group_id", groupId)
    .eq("profile_id", profileId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.venue_id as string);
}

export async function saveGroupSwipe(groupId: string, profileId: string, venueId: string, liked: boolean) {
  const { error } = await supabase
    .from("swipes")
    .upsert(
      { profile_id: profileId, venue_id: venueId, group_id: groupId, liked },
      { onConflict: "profile_id,venue_id,group_id" },
    );
  if (error) throw new Error(error.message);
}
