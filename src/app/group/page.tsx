"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useProfile } from "@/hooks/useProfile";
import { CODE_RE, createGroup } from "@/lib/group";
import { Button } from "@/components/ui/Button";

export default function GroupPage() {
  const { profile } = useProfile();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (!profile || creating) return;
    setCreating(true);
    setError(null);
    try {
      const g = await createGroup(profile.id);
      router.push(`/g/${g.code}`);
    } catch {
      setError("Couldn't start a group. Check your connection and try again.");
      setCreating(false);
    }
  }

  function join(e: FormEvent) {
    e.preventDefault();
    if (CODE_RE.test(code)) router.push(`/g/${code}`);
  }

  return (
    <div className="flex flex-col gap-10 px-5 pt-10">
      <header>
        <h1 className="font-display text-5xl font-extrabold leading-[0.9]">Decide together</h1>
        <p className="mt-3 text-foam/70">
          Everyone swipes the same deck. When you all say &ldquo;I&apos;m in&rdquo; to the same place, it&apos;s a match.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <Button full onClick={start} disabled={creating}>
          {creating ? "Starting…" : "Start a group"}
        </Button>
        {error && (
          <p className="text-pass" role="alert">
            {error}
          </p>
        )}
      </section>

      <form onSubmit={join} className="flex flex-col gap-3">
        <label htmlFor="code" className="font-semibold">
          Got a code?
        </label>
        <input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="ABCD"
          aria-describedby="code-hint"
          className="min-h-16 rounded-2xl border border-foam/12 bg-kerb px-4 text-center font-display text-4xl font-extrabold tracking-[0.3em] text-foam placeholder:text-foam/25"
        />
        <p id="code-hint" className="text-sm text-foam/70">
          4 letters, from the friend who started the group.
        </p>
        <Button type="submit" variant="ghost" full disabled={!CODE_RE.test(code)}>
          Join group
        </Button>
      </form>
    </div>
  );
}
