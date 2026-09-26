"use client";

// 3-step onboarding: name → budget → vibes (+ 18+ confirmation).
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useProfile, type Budget } from "@/hooks/useProfile";
import { VIBE_TAGS, tagLabel } from "@/lib/tags";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

const MIN_VIBES = 3;
const STEPS = ["name", "budget", "vibes"] as const;
type Step = (typeof STEPS)[number];

const BUDGETS: { level: Budget; label: string; hint: string }[] = [
  { level: 1, label: "£", hint: "Cheap and cheerful" },
  { level: 2, label: "££", hint: "Normal night out" },
  { level: 3, label: "£££", hint: "Treating ourselves" },
];

function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  // Only allow in-app paths.
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function StartPage() {
  const { createProfile } = useProfile();
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [budget, setBudget] = useState<Budget>(2);
  const [vibes, setVibes] = useState<string[]>([]);
  const [adult, setAdult] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const index = STEPS.indexOf(step);
  const canContinue =
    step === "name" ? name.trim().length > 0 : step === "budget" ? true : vibes.length >= MIN_VIBES && adult && !saving;

  useEffect(() => {
    if (step === "name") nameRef.current?.focus();
  }, [step]);

  const toggleVibe = (id: string) =>
    setVibes((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canContinue) return;
    if (step !== "vibes") {
      setStep(STEPS[index + 1]);
      return;
    }
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

  const vibesLeft = Math.max(0, MIN_VIBES - vibes.length);

  return (
    // Layout's <main> pads for the bottom nav (hidden here), so fill the rest of the screen exactly.
    <form
      onSubmit={onSubmit}
      className="flex min-h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] flex-col px-5 pt-6 pb-2"
    >
      <div className="flex min-h-11 items-center gap-3">
        {index > 0 ? (
          <button
            type="button"
            onClick={() => setStep(STEPS[index - 1])}
            className="-ml-2 flex size-11 items-center justify-center rounded-full text-xl"
            aria-label="Back"
          >
            ←
          </button>
        ) : (
          <span className="size-11 -ml-2" aria-hidden />
        )}
        <ol className="flex flex-1 gap-1.5" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <li key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= index ? "bg-sodium" : "bg-foam/12"}`} />
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-1 flex-col gap-6" key={step}>
        {step === "name" && (
          <>
            <h1 className="font-display text-5xl leading-[0.9] font-extrabold">Where are we going tonight?</h1>
            <label className="flex flex-col gap-2">
              <span className="font-semibold">Your name</span>
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                autoComplete="given-name"
                enterKeyHint="next"
                className="min-h-12 rounded-2xl border border-foam/12 bg-kerb px-4 text-foam placeholder:text-foam/40"
                placeholder="What your friends call you"
              />
              <span className="text-sm text-foam/70">Your group sees this when you match.</span>
            </label>
          </>
        )}

        {step === "budget" && (
          <>
            <h1 className="font-display text-5xl leading-[0.9] font-extrabold">
              What&apos;s the budget, {name.trim()}?
            </h1>
            <div className="flex flex-col gap-3" role="radiogroup" aria-label="Budget">
              {BUDGETS.map((b) => (
                <button
                  key={b.level}
                  type="button"
                  role="radio"
                  aria-checked={budget === b.level}
                  onClick={() => setBudget(b.level)}
                  className={`flex min-h-16 items-center gap-4 rounded-2xl border px-5 text-left transition ${
                    budget === b.level ? "border-sodium bg-sodium text-night" : "border-foam/12 bg-kerb text-foam"
                  }`}
                >
                  <span className="w-14 font-display text-2xl font-extrabold">{b.label}</span>
                  <span className="font-semibold">{b.hint}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "vibes" && (
          <>
            <div>
              <h1 className="font-display text-5xl leading-[0.9] font-extrabold">What&apos;s your vibe?</h1>
              <p className="mt-3 text-foam/70" aria-live="polite">
                {vibesLeft > 0 ? `Pick ${vibesLeft} more` : `${vibes.length} picked — nice`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {VIBE_TAGS.map((id) => (
                <Chip key={id} selected={vibes.includes(id)} onClick={() => toggleVibe(id)}>
                  {tagLabel(id)}
                </Chip>
              ))}
            </div>
            <button
              type="button"
              role="checkbox"
              aria-checked={adult}
              onClick={() => setAdult((a) => !a)}
              className={`flex min-h-12 items-center gap-3 self-start rounded-full border px-4 font-semibold transition ${
                adult ? "border-go bg-go text-night" : "border-foam/12 text-foam"
              }`}
            >
              <span
                aria-hidden
                className={`flex size-5 items-center justify-center rounded-md border-2 text-xs ${adult ? "border-night" : "border-foam/40"}`}
              >
                {adult ? "✓" : ""}
              </span>
              I&apos;m 18 or over
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="mb-3 text-pass" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" full disabled={!canContinue} className="mt-6">
        {step !== "vibes" ? "Next" : saving ? "Setting up…" : "Start swiping"}
      </Button>
    </form>
  );
}
