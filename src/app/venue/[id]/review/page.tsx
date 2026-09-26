"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { REVIEW_TAGS, tagLabel } from "@/lib/tags";
import { useProfile } from "@/hooks/useProfile";
import { useVenueData } from "@/hooks/useVenueData";
import { Button, buttonClass } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { KIND_BG } from "@/components/ui/KindChip";

const MAX_BODY = 500;

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useProfile();
  const { venues, loading, refresh } = useVenueData();
  const venue = venues.find((v) => v.id === id);

  const [thumbsUp, setThumbsUp] = useState<boolean | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill if this person has reviewed the venue before (the save is an upsert).
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("reviews")
        .select("thumbs_up, tags, body")
        .eq("profile_id", profile.id)
        .eq("venue_id", id)
        .maybeSingle();
      if (cancelled || !data) return;
      setThumbsUp(data.thumbs_up as boolean);
      setTags((data.tags as string[]) ?? []);
      setBody((data.body as string | null) ?? "");
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, id]);

  const toggleTag = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile || thumbsUp === null || saving) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("reviews").upsert(
      { profile_id: profile.id, venue_id: id, thumbs_up: thumbsUp, tags, body: body.trim() || null },
      { onConflict: "profile_id,venue_id" },
    );
    if (err) {
      setError("Couldn't save your review. Check your connection and try again.");
      setSaving(false);
      return;
    }
    // Reload shared data so new auto-tags and ratings show on the venue page.
    await refresh();
    router.push(`/venue/${id}`);
  }

  if (loading) return <div className="m-5 h-40 animate-pulse rounded-[28px] bg-kerb" aria-busy="true" />;

  if (!venue) {
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-5 px-5 text-center">
        <p className="text-lg">We couldn&apos;t find that venue.</p>
        <Link href="/" className={buttonClass("ghost")}>
          Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-7 pb-8">
      <header className={`${KIND_BG[venue.kind]} rounded-b-[28px] px-5 pb-6 pt-3`}>
        <button
          type="button"
          onClick={() => router.push(`/venue/${id}`)}
          aria-label="Back to venue"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-2xl hover:bg-foam/10"
        >
          ←
        </button>
        <p className="mt-2 text-foam/70">Rate your night at</p>
        <h1 className="venue-name mt-1 break-words text-[40px]">{venue.name}</h1>
      </header>

      <fieldset className="px-5">
        <legend className="mb-3 font-semibold">How was it?</legend>
        <div className="grid grid-cols-2 gap-3">
          <ThumbButton selected={thumbsUp === true} onClick={() => setThumbsUp(true)} tone="go" label="Good night" icon="👍" />
          <ThumbButton selected={thumbsUp === false} onClick={() => setThumbsUp(false)} tone="pass" label="Not for me" icon="👎" />
        </div>
      </fieldset>

      <fieldset className="px-5">
        <legend className="mb-1 font-semibold">What was it like?</legend>
        <p className="mb-3 text-sm text-foam/70">
          Tap anything that fits. When 3 people agree, it becomes one of the venue&apos;s tags.
        </p>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TAGS.map((t) => (
            <Chip key={t} selected={tags.includes(t)} onClick={() => toggleTag(t)}>
              {tagLabel(t)}
            </Chip>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2 px-5">
        <span className="font-semibold">
          Anything else? <span className="font-normal text-foam/70">(optional)</span>
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
          rows={3}
          maxLength={MAX_BODY}
          placeholder="Great music, bit of a queue after 11"
          className="rounded-2xl border border-foam/12 bg-kerb p-4 text-foam placeholder:text-foam/40"
        />
        <span className="self-end text-xs text-foam/70">
          {body.length}/{MAX_BODY}
        </span>
      </label>

      <div className="flex flex-col gap-3 px-5">
        {error && (
          <p className="text-pass" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" full disabled={thumbsUp === null || saving}>
          {saving ? "Saving…" : thumbsUp === null ? "Pick 👍 or 👎 to post" : "Post review"}
        </Button>
      </div>
    </form>
  );
}

interface ThumbButtonProps {
  selected: boolean;
  onClick: () => void;
  tone: "go" | "pass";
  label: string;
  icon: string;
}

function ThumbButton({ selected, onClick, tone, label, icon }: ThumbButtonProps) {
  const on = tone === "go" ? "border-go bg-go text-night" : "border-pass bg-pass text-night";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-[20px] border-2 font-semibold transition active:scale-[0.97] ${
        selected ? on : "border-foam/12 bg-kerb text-foam"
      }`}
    >
      <span className="text-3xl" aria-hidden="true">
        {icon}
      </span>
      {label}
    </button>
  );
}
