import type { TagId } from "@/lib/tags";
import { tagLabel } from "@/lib/tags";

/** Venue's public tags; tags that came from reviews are outlined and captioned. */
export function VenueTags({ tags, reviewAdded }: { tags: TagId[]; reviewAdded: TagId[] }) {
  if (tags.length === 0) return null;
  const added = new Set(reviewAdded);
  return (
    <section aria-labelledby="tags-h">
      <h2 id="tags-h" className="mb-3 font-semibold">What it&apos;s like</h2>
      <ul className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <li
            key={t}
            className={`inline-flex min-h-8 items-center rounded-full px-3 text-sm ${
              added.has(t) ? "border border-sodium text-sodium" : "bg-foam/12"
            }`}
          >
            {added.has(t) && <span aria-hidden="true" className="mr-1">✦</span>}
            {tagLabel(t)}
            {added.has(t) && <span className="sr-only"> (added by reviewers)</span>}
          </li>
        ))}
      </ul>
      {added.size > 0 && (
        <p className="mt-2 text-sm text-sodium">✦ Added by reviewers — tagged by 3 or more people</p>
      )}
    </section>
  );
}
