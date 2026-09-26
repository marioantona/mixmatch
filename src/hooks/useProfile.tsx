"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { tasteFromOnboarding, type Vec } from "@/lib/scoring";

export const PROFILE_KEY = "rounds.profileId";

export type Budget = 1 | 2 | 3;

export interface Profile {
  id: string;
  display_name: string;
  budget: Budget;
  taste: Vec;
}

export interface CreateProfileInput {
  name: string;
  budget: Budget;
  vibes: string[];
}

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  /** Updates taste immediately in memory; persists to Supabase debounced. */
  saveTaste: (taste: Vec) => void;
  createProfile: (input: CreateProfileInput) => Promise<Profile>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function readStoredId(): string | null {
  try {
    return window.localStorage.getItem(PROFILE_KEY);
  } catch {
    return null;
  }
}

function writeStoredId(id: string | null) {
  try {
    if (id) window.localStorage.setItem(PROFILE_KEY, id);
    else window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    // Private mode etc. — profile just won't survive a reload.
  }
}

// crypto.randomUUID only exists in secure contexts (HTTPS / localhost).
function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const TASTE_SAVE_DELAY_MS = 800;

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = readStoredId();
      const res = id
        ? await supabase.from("profiles").select("id, display_name, budget, taste").eq("id", id).maybeSingle()
        : null;
      if (cancelled) return;
      if (res?.data) setProfile(res.data as Profile);
      // Row gone (e.g. DB was reset): forget it so the user re-onboards.
      else if (res && !res.error) writeStoredId(null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveTaste = useCallback((taste: Vec) => {
    setProfile((p) => (p ? { ...p, taste } : p));
    const id = readStoredId();
    if (!id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      supabase
        .from("profiles")
        .update({ taste })
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Couldn't save taste", error.message);
        });
    }, TASTE_SAVE_DELAY_MS);
  }, []);

  const createProfile = useCallback(async ({ name, budget, vibes }: CreateProfileInput) => {
    const next: Profile = {
      id: uuid(),
      display_name: name.trim(),
      budget,
      taste: tasteFromOnboarding(vibes, budget),
    };
    const { error } = await supabase.from("profiles").insert(next);
    if (error) throw new Error(error.message);
    writeStoredId(next.id);
    setProfile(next);
    return next;
  }, []);

  const value = useMemo(
    () => ({ profile, loading, saveTaste, createProfile }),
    [profile, loading, saveTaste, createProfile],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside <ProfileProvider>");
  return ctx;
}
