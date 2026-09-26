"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import type { Venue } from "@/lib/scoring";
import type { Member } from "@/lib/group";
import { KIND_BG, KIND_LABEL } from "@/components/ui/KindChip";
import { Button, buttonClass } from "@/components/ui/Button";
import { nameSize } from "@/components/venue/VenueHeader";
import { Avatar } from "./Initials";

export interface MatchOverlayProps {
  venue: Venue;
  members: Member[];
  onClose: () => void;
}

/** The one orchestrated motion moment (docs/DESIGN.md "Match reveal"), ~900ms. */
export function MatchOverlay({ venue, members, onClose }: MatchOverlayProps) {
  const reduce = useReducedMotion();
  const wdth = useMotionValue(reduce ? 75 : 50);
  const fontVariationSettings = useTransform(wdth, (w) => `"wdth" ${w}`);
  const keepRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    navigator.vibrate?.([80, 60, 160]);
    keepRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const controls = reduce ? null : animate(wdth, 100, { delay: 0.25, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] });
    return () => {
      window.removeEventListener("keydown", onKey);
      controls?.stop();
    };
  }, [onClose, reduce, wdth]);

  const directions = `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}&travelmode=walking`;
  const fade = { initial: { opacity: 0 }, animate: { opacity: 1 } };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`It's a match: ${venue.name}`}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-night/95 px-5 pb-[env(safe-area-inset-bottom)]"
      {...fade}
      transition={{ duration: 0.2 }}
    >
      <motion.p
        className="font-display text-2xl font-extrabold text-go"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        It&apos;s a match!
      </motion.p>

      <motion.div
        className={`${KIND_BG[venue.kind]} flex w-full max-w-sm flex-col gap-4 rounded-[28px] p-6 shadow-2xl shadow-black/50`}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 260, damping: 22 }}
      >
        <span className="self-start rounded-full bg-foam/12 px-3 py-1 text-sm font-semibold">{KIND_LABEL[venue.kind]}</span>
        <motion.h2
          className={`break-words font-display font-extrabold leading-[0.9] ${nameSize(venue.name)}`}
          style={{ fontVariationSettings }}
        >
          {venue.name}
        </motion.h2>
        <ul className="flex -space-x-2" aria-label={`Everyone's in: ${members.map((m) => m.display_name).join(", ")}`}>
          {members.map((m, i) => (
            <motion.li
              key={m.profile_id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: reduce ? 0 : 0.55 + i * 0.07, duration: 0.25 }}
            >
              <Avatar name={m.display_name} className="ring-2 ring-night" />
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        className="flex w-full max-w-sm flex-col gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : 0.75, duration: 0.2 }}
      >
        <a href={directions} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", true)}>
          Get directions
        </a>
        <Button ref={keepRef} variant="ghost" full onClick={onClose}>
          Keep swiping
        </Button>
      </motion.div>
    </motion.div>
  );
}
