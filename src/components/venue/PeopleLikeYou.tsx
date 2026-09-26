import type { PersonalRating } from "@/lib/scoring";

export function PeopleLikeYou({ rating }: { rating: PersonalRating }) {
  const { score, similarReviewers, totalReviews } = rating;
  return (
    <section className="rounded-[20px] bg-kerb p-4" aria-labelledby="ply-h">
      {totalReviews === 0 ? (
        <p id="ply-h" className="font-semibold">No reviews yet — be the first.</p>
      ) : similarReviewers === 0 ? (
        <>
          <p id="ply-h" className="font-semibold">Not enough similar reviewers yet</p>
          <p className="mt-1 text-sm text-foam/70">
            {totalReviews} {totalReviews === 1 ? "review" : "reviews"} overall, from people with different taste to yours.
          </p>
        </>
      ) : (
        <>
          <p id="ply-h" className="text-lg">
            People like you: <span className="font-display text-3xl font-extrabold text-go">{Math.round(score * 100)}%</span>{" "}
            thumbs up
          </p>
          <p className="mt-1 text-sm text-foam/70">
            {similarReviewers} similar {similarReviewers === 1 ? "reviewer" : "reviewers"} · {totalReviews} reviews overall.
            Weighted towards reviewers whose taste matches yours.
          </p>
        </>
      )}
    </section>
  );
}
