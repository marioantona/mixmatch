"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "motion/react";
import type { RankedVenue } from "@/lib/scoring";
import { VenueCard } from "./VenueCard";

export interface SwipeDeckProps {
  venues: RankedVenue[];
  onSwipe: (venue: RankedVenue, liked: boolean) => void;
  /** Rendered once every card has been swiped (or `venues` is empty). */
  emptyState?: ReactNode;
  /** Tap (not drag) on the top card, or its Details button. */
  onOpen?: (venue: RankedVenue) => void;
}

const SWIPE_OFFSET = 110;
const SWIPE_VELOCITY = 500;
const FLY_DISTANCE = 600;

type Fly = (liked: boolean) => void;

/**
 * Tinder-style stack. Stateless about *what* a swipe means: callers decide via
 * `onSwipe`. The deck resets to the first card whenever the set of venue ids
 * changes (e.g. new filters); a new array with the same ids keeps its place.
 */
export function SwipeDeck({ venues, onSwipe, emptyState, onOpen }: SwipeDeckProps) {
  const deckKey = venues.map((v) => v.venue.id).join(",");
  const [prevKey, setPrevKey] = useState(deckKey);
  const [index, setIndex] = useState(0);
  if (deckKey !== prevKey) {
    setPrevKey(deckKey);
    setIndex(0);
  }

  const busy = useRef(false);
  const flyRef = useRef<Fly | null>(null);
  const current = venues[index];

  const commit = useCallback(
    (liked: boolean) => {
      busy.current = false;
      if (!current) return;
      setIndex((i) => i + 1);
      onSwipe(current, liked);
    },
    [current, onSwipe],
  );

  /** Take the single "a card is leaving" slot; false if one is already in flight. */
  const claim = useCallback(() => {
    if (busy.current) return false;
    busy.current = true;
    return true;
  }, []);

  const trigger = useCallback(
    (liked: boolean) => {
      if (!flyRef.current || !claim()) return;
      flyRef.current(liked);
    },
    [claim],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      // A sheet or overlay is on top of the deck.
      if (document.querySelector('[aria-modal="true"]')) return;
      if (e.key === "ArrowRight") trigger(true);
      else if (e.key === "ArrowLeft") trigger(false);
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [trigger]);

  if (!current) return <div className="flex flex-1 flex-col items-center justify-center">{emptyState}</div>;

  const visible = venues.slice(index, index + 3);

  return (
    <div className="flex flex-1 flex-col items-center gap-5">
      <div className="relative h-[min(62dvh,540px)] w-full max-w-[400px]">
        {/* Render back-to-front so the top card is last in the DOM. */}
        {visible
          .map((rv, pos) => (
            <Card
              key={rv.venue.id}
              rv={rv}
              pos={pos}
              claim={claim}
              flyRef={pos === 0 ? flyRef : undefined}
              onDone={commit}
              onOpen={onOpen}
            />
          ))
          .reverse()}
      </div>

      <p className="sr-only" aria-live="polite">
        {current.venue.name}, {index + 1} of {venues.length}
      </p>

      <div className="flex items-center gap-8 pb-2">
        <button
          type="button"
          onClick={() => trigger(false)}
          aria-label={`Pass on ${current.venue.name}`}
          className="flex size-16 items-center justify-center rounded-full border-2 border-pass text-2xl font-semibold text-pass transition active:scale-95"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={() => trigger(true)}
          aria-label={`I'm in for ${current.venue.name}`}
          className="flex size-16 items-center justify-center rounded-full bg-go text-2xl font-semibold text-night transition active:scale-95"
        >
          ✓
        </button>
      </div>
    </div>
  );
}

interface CardProps {
  rv: RankedVenue;
  /** 0 = top (draggable), 1 = next, 2 = preloaded. */
  pos: number;
  claim: () => boolean;
  flyRef?: React.RefObject<Fly | null>;
  onDone: (liked: boolean) => void;
  onOpen?: (venue: RankedVenue) => void;
}

function Card({ rv, pos, claim, flyRef, onDone, onOpen }: CardProps) {
  // A tap = press and release within 8px and 500ms. Tracked with plain pointer events because
  // motion's onTap on a draggable element stops the drag from starting.
  const press = useRef<{ x: number; y: number; t: number } | null>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const opacity = useMotionValue(1);
  const rotate = useTransform(x, [-200, 200], reduce ? [0, 0] : [-12, 12]);
  const likeOpacity = useTransform(x, [20, SWIPE_OFFSET], [0, 1]);
  const passOpacity = useTransform(x, [-SWIPE_OFFSET, -20], [1, 0]);
  const edge = useTransform(x, (v) => {
    const a = Math.min(1, Math.abs(v) / SWIPE_OFFSET);
    const rgb = v >= 0 ? "87,214,164" : "242,104,92";
    return `inset 0 0 0 ${Math.round(a * 6)}px rgba(${rgb},${a})`;
  });

  const top = pos === 0;

  const fly = useCallback(
    (liked: boolean) => {
      const done = () => onDone(liked);
      if (reduce) {
        animate(opacity, 0, { duration: 0.2 }).then(done);
      } else {
        animate(x, liked ? FLY_DISTANCE : -FLY_DISTANCE, { duration: 0.28, ease: "easeIn" }).then(done);
      }
    },
    [onDone, opacity, reduce, x],
  );

  useEffect(() => {
    if (!flyRef) return;
    flyRef.current = fly;
    return () => {
      if (flyRef.current === fly) flyRef.current = null;
    };
  }, [flyRef, fly]);

  function onDragEnd(_: unknown, info: PanInfo) {
    const { offset, velocity } = info;
    const past = Math.abs(offset.x) > SWIPE_OFFSET || Math.abs(velocity.x) > SWIPE_VELOCITY;
    if (past && claim()) {
      fly(Math.abs(offset.x) > SWIPE_OFFSET ? offset.x > 0 : velocity.x > 0);
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
    }
  }

  return (
    <motion.div
      className="absolute inset-0 touch-pan-y select-none"
      style={{ x, rotate, opacity, zIndex: 10 - pos }}
      initial={false}
      animate={{ scale: pos === 0 ? 1 : pos === 1 ? 0.96 : 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      drag={top ? "x" : false}
      dragMomentum={false}
      onDragEnd={top ? onDragEnd : undefined}
      onPointerDown={(e) => (press.current = { x: e.clientX, y: e.clientY, t: e.timeStamp })}
      onPointerUp={(e) => {
        const p = press.current;
        press.current = null;
        if (!top || !onOpen || !p) return;
        const moved = Math.hypot(e.clientX - p.x, e.clientY - p.y);
        if (moved < 8 && e.timeStamp - p.t < 500) onOpen(rv);
      }}
      aria-hidden={!top}
    >
      <VenueCard rv={rv} />

      {top && onOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(rv);
          }}
          onPointerDownCapture={(e) => e.stopPropagation()}
          className="absolute right-4 top-14 z-10 inline-flex min-h-11 items-center rounded-full bg-night/40 px-4 text-sm font-semibold backdrop-blur-sm"
        >
          Details
        </button>
      )}
      {top && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[28px]"
            style={{ boxShadow: edge }}
          />
          <motion.span
            aria-hidden
            style={{ opacity: likeOpacity }}
            className="pointer-events-none absolute top-16 left-5 -rotate-12 rounded-xl border-4 border-go px-3 py-1 font-display text-3xl font-extrabold text-go"
          >
            I&apos;m in
          </motion.span>
          <motion.span
            aria-hidden
            style={{ opacity: passOpacity }}
            className="pointer-events-none absolute top-16 right-5 rotate-12 rounded-xl border-4 border-pass px-3 py-1 font-display text-3xl font-extrabold text-pass"
          >
            Pass
          </motion.span>
        </>
      )}
    </motion.div>
  );
}
