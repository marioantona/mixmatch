"use client";

import { useEffect, useState } from "react";

/** Two-tap confirm without window.confirm (dialogs freeze some in-app browsers). */
export function LeaveButton({ onLeave, className = "" }: { onLeave: () => Promise<void>; className?: string }) {
  const [armed, setArmed] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  async function click() {
    if (!armed) {
      setArmed(true);
      return;
    }
    setLeaving(true);
    try {
      await onLeave();
    } catch {
      setLeaving(false);
      setArmed(false);
    }
  }

  return (
    <button
      type="button"
      onClick={click}
      disabled={leaving}
      className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition ${
        armed ? "border-pass bg-pass text-night" : "border-foam/12 text-foam/70"
      } ${className}`}
    >
      {leaving ? "Leaving…" : armed ? "Tap again to leave" : "Leave group"}
    </button>
  );
}
