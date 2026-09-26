// Fixed tag vocabulary. Order matters: it defines the dimensions of every taste
// vector and venue vector. Append new tags at the END only, then re-run the seed.

export type TagGroup = "music" | "vibe" | "drinks" | "crowd" | "price";

export const TAGS = [
  // music
  { id: "live_music", label: "Live music", group: "music" },
  { id: "dj", label: "DJ sets", group: "music" },
  { id: "techno", label: "Techno & house", group: "music" },
  { id: "indie", label: "Indie & rock", group: "music" },
  { id: "rnb_hiphop", label: "R&B & hip-hop", group: "music" },
  { id: "cheesy_pop", label: "Cheesy pop", group: "music" },
  { id: "karaoke", label: "Karaoke", group: "music" },
  // vibe
  { id: "dancing", label: "Dancing", group: "vibe" },
  { id: "quiet_chat", label: "Good for a chat", group: "vibe" },
  { id: "sports", label: "Shows the match", group: "vibe" },
  { id: "beer_garden", label: "Beer garden", group: "vibe" },
  { id: "late_licence", label: "Open late", group: "vibe" },
  // drinks
  { id: "cocktails", label: "Cocktails", group: "drinks" },
  { id: "real_ale", label: "Real ale", group: "drinks" },
  { id: "craft_beer", label: "Craft beer", group: "drinks" },
  // crowd (venue self-description / reviewer consensus; never user traits)
  { id: "student_crowd", label: "Student crowd", group: "crowd" },
  { id: "after_work", label: "After-work crowd", group: "crowd" },
  { id: "lgbtq_friendly", label: "LGBTQ+ friendly", group: "crowd" },
  // price
  { id: "cheap", label: "Cheap drinks", group: "price" },
  { id: "pricey", label: "Splurge", group: "price" },
] as const satisfies ReadonlyArray<{ id: string; label: string; group: TagGroup }>;

export type TagId = (typeof TAGS)[number]["id"];
export const TAG_IDS: readonly TagId[] = TAGS.map((t) => t.id);
export const DIM = TAG_IDS.length;

const INDEX = new Map<string, number>(TAG_IDS.map((id, i) => [id, i]));

export function tagIndex(id: string): number {
  const i = INDEX.get(id);
  if (i === undefined) throw new Error(`Unknown tag: ${id}`);
  return i;
}

export function isTagId(id: string): id is TagId {
  return INDEX.has(id);
}

export function tagLabel(id: string): string {
  return TAGS.find((t) => t.id === id)?.label ?? id;
}

/** Tags a user can pick as "vibes" during onboarding and in filters. */
export const VIBE_TAGS: readonly TagId[] = TAGS.filter(
  (t) => t.group === "music" || t.group === "vibe" || t.group === "drinks",
).map((t) => t.id);

/** Tags offered as one-tap chips on the review screen. */
export const REVIEW_TAGS: readonly TagId[] = TAG_IDS;

/**
 * A review tag becomes part of a venue's public tags once this many
 * independent reviewers have applied it. This is the non-LLM "auto-tagging".
 */
export const AUTO_TAG_MIN_MENTIONS = 3;
