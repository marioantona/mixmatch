"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { CODE_RE, type Member } from "@/lib/group";
import { useProfile } from "@/hooks/useProfile";
import { useGroup } from "@/hooks/useGroup";
import { useGroupMatches } from "@/hooks/useGroupMatches";
import { useVenueData } from "@/hooks/useVenueData";
import { Lobby } from "@/components/group/Lobby";
import { GroupDeck } from "@/components/group/GroupDeck";
import { MatchesRow } from "@/components/group/MatchesRow";
import { MatchOverlay } from "@/components/group/MatchOverlay";
import { Button, buttonClass } from "@/components/ui/Button";

const phaseKey = (groupId: string) => `rounds.groupPhase.${groupId}`;

function readStarted(groupId: string): boolean {
  try {
    return window.sessionStorage.getItem(phaseKey(groupId)) === "deck";
  } catch {
    return false;
  }
}

export default function GroupLobbyPage() {
  const { code: rawCode } = useParams<{ code: string }>();
  const code = rawCode.toUpperCase();
  const { profile } = useProfile();
  const { status, group, members, joinedName, clearJoined, retry } = useGroup(code, profile?.id);
  const { venues } = useVenueData();

  // Members frozen at "Start swiping" so the deck order never shifts under anyone.
  const [deckMembers, setDeckMembers] = useState<Member[] | null>(null);
  const started = deckMembers !== null;
  const { matches, newMatch, dismiss } = useGroupMatches(group?.id, started);

  const start = useCallback(() => {
    if (!group) return;
    try {
      window.sessionStorage.setItem(phaseKey(group.id), "deck");
    } catch {
      // Reload will just land in the lobby again.
    }
    setDeckMembers(members);
  }, [group, members]);

  // Resume the deck after a reload (state adjusted during render; group is null on the server).
  if (group && !started && members.length >= 2 && readStarted(group.id)) setDeckMembers(members);

  useEffect(() => {
    if (!joinedName) return;
    const t = setTimeout(clearJoined, 3000);
    return () => clearTimeout(t);
  }, [joinedName, clearJoined]);

  const byId = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues]);
  const matchedVenues = matches.flatMap((id) => byId.get(id) ?? []);
  const overlayVenue = newMatch ? byId.get(newMatch) : undefined;

  if (!CODE_RE.test(code)) return <NotFound code={code} />;
  if (!profile || status === "loading") return <LobbySkeleton />;
  if (status === "not-found") return <NotFound code={code} />;
  if (status === "error" || !group) {
    return (
      <Centered text="Couldn't load this group. Check your connection and try again.">
        <Button onClick={retry}>Try again</Button>
      </Centered>
    );
  }

  return (
    <>
      {joinedName && (
        <p role="status" className="fixed inset-x-0 top-3 z-40 mx-auto w-fit rounded-full bg-kerb px-4 py-2 text-sm font-semibold shadow-lg">
          {joinedName} joined
        </p>
      )}

      {!started ? (
        <Lobby code={group.code} members={members} meId={profile.id} onStart={start} />
      ) : (
        <div className="flex min-h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] flex-col gap-4 px-4 pb-4 pt-4">
          <header className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold" style={{ fontVariationSettings: '"wdth" 75' }}>
              Group {group.code}
            </h1>
            <span className="ml-auto text-sm text-foam/70">
              {members.length} {members.length === 1 ? "person" : "people"}
            </span>
          </header>
          <MatchesRow venues={matchedVenues} />
          <GroupDeck groupId={group.id} meId={profile.id} members={deckMembers} />
        </div>
      )}

      {overlayVenue && <MatchOverlay venue={overlayVenue} members={members} onClose={dismiss} />}
    </>
  );
}

function NotFound({ code }: { code: string }) {
  return (
    <Centered text={`No group with code ${code}. Check the code and try again.`}>
      <Link href="/group" className={buttonClass("ghost")}>
        Back to groups
      </Link>
    </Centered>
  );
}

function Centered({ text, children }: { text: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-5 px-5 text-center">
      <p className="text-lg">{text}</p>
      {children}
    </div>
  );
}

function LobbySkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 px-5 pt-14" aria-busy="true" aria-label="Loading group">
      <div className="h-20 w-56 animate-pulse rounded-2xl bg-kerb" />
      <div className="h-14 w-full animate-pulse rounded-2xl bg-kerb" />
      <div className="h-14 w-full animate-pulse rounded-2xl bg-kerb" />
    </div>
  );
}
