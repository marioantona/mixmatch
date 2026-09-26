"use client";

import { useState } from "react";
import type { Member } from "@/lib/group";
import { Button } from "@/components/ui/Button";
import { Avatar } from "./Initials";
import { LeaveButton } from "./LeaveButton";

export interface LobbyProps {
  code: string;
  members: Member[];
  meId: string;
  onStart: () => void;
  onLeave: () => Promise<void>;
}

export function Lobby({ code, members, meId, onStart, onLeave }: LobbyProps) {
  const [copied, setCopied] = useState(false);
  const ready = members.length >= 2;

  async function share() {
    const url = `${window.location.origin}/g/${code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Join my MixMatch group", text: `Code ${code}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share sheet dismissed or clipboard blocked; the code is on screen anyway.
    }
  }

  return (
    <div className="flex flex-col gap-8 px-5 pt-10">
      <section className="text-center">
        <p className="text-foam/70">Your group code</p>
        <p className="mt-2 font-display text-[clamp(3.5rem,17vw,4.5rem)] font-extrabold tracking-[0.12em]" aria-label={`Code ${code.split("").join(" ")}`}>
          {code}
        </p>
        <Button variant="ghost" onClick={share} className="mt-4">
          {copied ? "Link copied" : "Copy link"}
        </Button>
      </section>

      <section aria-labelledby="members-h">
        <h2 id="members-h" className="mb-3 font-semibold">
          In the group ({members.length})
        </h2>
        <ul className="flex flex-col gap-2" aria-live="polite">
          {members.map((m) => (
            <li key={m.profile_id} className="flex items-center gap-3 rounded-2xl bg-kerb px-4 py-2">
              <Avatar name={m.display_name} />
              <span className="font-semibold">{m.display_name}</span>
              {m.profile_id === meId && <span className="ml-auto text-sm text-foam/70">You</span>}
            </li>
          ))}
        </ul>
      </section>

      <Button full onClick={onStart} disabled={!ready}>
        {ready ? "Start swiping" : "Waiting for friends…"}
      </Button>
      {!ready && <p className="-mt-5 text-center text-sm text-foam/70">Share the code — you need at least 2 people.</p>}
      <LeaveButton onLeave={onLeave} className="self-center" />
    </div>
  );
}
