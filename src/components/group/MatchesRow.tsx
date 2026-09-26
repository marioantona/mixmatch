import Link from "next/link";
import type { Venue } from "@/lib/scoring";

export function MatchesRow({ venues }: { venues: Venue[] }) {
  if (venues.length === 0) return null;
  return (
    <section aria-label="Matches so far" className="-mx-4">
      <ul className="flex gap-2 overflow-x-auto px-4 pb-1">
        <li className="flex shrink-0 items-center text-sm font-semibold text-go">
          {venues.length} {venues.length === 1 ? "match" : "matches"}
        </li>
        {venues.map((v) => (
          <li key={v.id} className="shrink-0">
            <Link
              href={`/venue/${v.id}`}
              className="inline-flex min-h-11 items-center rounded-full border border-go px-4 text-sm font-semibold text-go"
            >
              {v.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
