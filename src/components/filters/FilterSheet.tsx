"use client";

import { useState } from "react";
import type { Filters } from "@/lib/scoring";
import { tagLabel, VIBE_TAGS } from "@/lib/tags";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

export const DISTANCES = [0.5, 1, 2] as const;
const BUDGETS = [1, 2, 3] as const;

export interface FilterSheetProps {
  /** Mount only while open, so the draft starts from `value` each time. */
  value: Filters;
  onApply: (next: Filters) => void;
  onClose: () => void;
}

export function FilterSheet({ value, onApply, onClose }: FilterSheetProps) {
  const [draft, setDraft] = useState<Filters>(value);

  const toggleVibe = (t: string) =>
    setDraft((d) => ({ ...d, vibes: d.vibes.includes(t) ? d.vibes.filter((v) => v !== t) : [...d.vibes, t] }));

  return (
    <BottomSheet open onClose={onClose} title="Filters">
      <section aria-labelledby="f-budget">
        <h3 id="f-budget" className="mb-2 font-semibold">
          Budget
        </h3>
        <div className="flex gap-2">
          {BUDGETS.map((b) => (
            <Chip key={b} selected={draft.maxBudget === b} onClick={() => setDraft((d) => ({ ...d, maxBudget: b }))}>
              <span aria-label={`Up to ${"£".repeat(b)}`}>{"£".repeat(b)}</span>
            </Chip>
          ))}
        </div>
      </section>

      <section aria-labelledby="f-distance" className="mt-5">
        <h3 id="f-distance" className="mb-2 font-semibold">
          Distance
        </h3>
        <div className="flex gap-2">
          {DISTANCES.map((km) => (
            <Chip key={km} selected={draft.maxKm === km} onClick={() => setDraft((d) => ({ ...d, maxKm: km }))}>
              {km} km
            </Chip>
          ))}
        </div>
      </section>

      <section aria-labelledby="f-vibes" className="mt-5">
        <h3 id="f-vibes" className="mb-1 font-semibold">
          Vibes
        </h3>
        <p className="mb-2 text-sm text-foam/70">Show places with any of these. None picked shows everything.</p>
        <div className="flex flex-wrap gap-2">
          {VIBE_TAGS.map((t) => (
            <Chip key={t} selected={draft.vibes.includes(t)} onClick={() => toggleVibe(t)}>
              {tagLabel(t)}
            </Chip>
          ))}
        </div>
      </section>

      <div className="mt-6 flex gap-3">
        <Button variant="ghost" onClick={() => setDraft((d) => ({ ...d, vibes: [] }))}>
          Clear vibes
        </Button>
        <Button full onClick={() => onApply(draft)}>
          Show venues
        </Button>
      </div>
    </BottomSheet>
  );
}
