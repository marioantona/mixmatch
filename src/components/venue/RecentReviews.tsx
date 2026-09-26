import type { VenueReview } from "@/hooks/useVenueReviews";
import { tagLabel } from "@/lib/tags";

function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} ${d === 1 ? "day" : "days"} ago`;
}

export interface RecentReviewsProps {
  reviews: VenueReview[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function RecentReviews({ reviews, loading, error, onRetry }: RecentReviewsProps) {
  return (
    <section aria-labelledby="reviews-h">
      <h2 id="reviews-h" className="mb-3 font-semibold">Recent reviews</h2>
      {loading ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-kerb" />
          ))}
        </div>
      ) : error ? (
        <p className="text-foam/70">
          Couldn&apos;t load reviews.{" "}
          <button type="button" onClick={onRetry} className="min-h-11 font-semibold text-sodium underline">
            Try again
          </button>
        </p>
      ) : reviews.length === 0 ? (
        <p className="text-foam/70">No reviews yet. Been here? Rate your night below.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((r, i) => (
            <li key={i} className="rounded-2xl bg-kerb p-4">
              <div className="flex items-center gap-2 text-sm">
                <span aria-label={r.thumbs_up ? "Thumbs up" : "Thumbs down"}>{r.thumbs_up ? "👍" : "👎"}</span>
                <span className="font-semibold">{r.display_name}</span>
                <span className="ml-auto text-foam/70">{ago(r.created_at)}</span>
              </div>
              {r.body && <p className="mt-2">{r.body}</p>}
              {r.tags.length > 0 && (
                <p className="mt-2 text-sm text-foam/70">{r.tags.slice(0, 3).map(tagLabel).join(" · ")}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
