"use client";

// Minimal onboarding from Phase 0 — Person 2 polishes this into 3 steps later.
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useProfile, type Budget } from "@/hooks/useProfile";
import { VIBE_TAGS, tagLabel } from "@/lib/tags";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

const MIN_VIBES = 3;

function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  // Only allow in-app paths.
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function StartPage() {
  const { createProfile } = useProfile();
  const router = useRouter();
  const [name, setName] = useState("");
  const [budget, setBudget] = useState<Budget>(2);
  const [vibes, setVibes] = useState<string[]>([]);
  const [adult, setAdult] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = name.trim().length > 0 && vibes.length >= MIN_VIBES && adult && !saving;

  const toggleVibe = (id: string) =>
    setVibes((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setSaving(true);
    setError(null);
    try {
      await createProfile({ name, budget, vibes });
      router.replace(nextPath());
    } catch {
      setError("Couldn't create your profile. Check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8 px-5 pb-10 pt-10">
      <h1 className="font-display text-5xl font-extrabold leading-[0.9]">Where are we going tonight?</h1>

      <label className="flex flex-col gap-2">
        <span className="font-semibold">Your name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          autoComplete="given-name"
          className="min-h-12 rounded-2xl border border-foam/12 bg-kerb px-4 text-foam placeholder:text-foam/40"
          placeholder="What your friends call you"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">Budget</legend>
        <div className="flex gap-2">
          {([1, 2, 3] as const).map((b) => (
            <Chip key={b} selected={budget === b} onClick={() => setBudget(b)} className="flex-1 justify-center">
              {"£".repeat(b)}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 font-semibold">Pick at least {MIN_VIBES} vibes</legend>
        <p className="mb-3 text-sm text-foam/70">{vibes.length} picked</p>
        <div className="flex flex-wrap gap-2">
          {VIBE_TAGS.map((id) => (
            <Chip key={id} selected={vibes.includes(id)} onClick={() => toggleVibe(id)}>
              {tagLabel(id)}
            </Chip>
          ))}
        </div>
      </fieldset>

      <Chip selected={adult} onClick={() => setAdult((a) => !a)} className="self-start">
        {adult ? "✓ " : ""}I&apos;m 18 or over
      </Chip>

      {error && <p className="text-pass" role="alert">{error}</p>}

      <Button type="submit" full disabled={!ready}>
        {saving ? "Setting up…" : "Start swiping"}
      </Button>
    </form>
  );
}
