import type { RankedVenue } from "@/lib/scoring";
import { tagLabel } from "@/lib/tags";
import { Chip, formatKm, KIND_BG, KIND_LABEL, PriceGlyphs } from "./bits";

function nameSize(name: string): string {
  if (name.length <= 12) return "text-[56px]";
  if (name.length <= 22) return "text-[44px]";
  return "text-[36px]";
}

function whyLine(rv: RankedVenue): string | null {
  if (rv.isExploration) return "Something different";
  if (!rv.reasons.length) return null;
  const labels = rv.reasons.slice(0, 2).map((t) => tagLabel(t).toLowerCase());
  return `Because you like ${labels.join(" and ")}`;
}

export function VenueCard({ rv }: { rv: RankedVenue }) {
  const { venue, tags, rating, distanceKm } = rv;
  const shown = tags.slice(0, 3);
  const extra = tags.length - shown.length;
  const why = whyLine(rv);

  return (
    <article
      className={`flex h-full w-full flex-col rounded-[28px] p-5 text-foam shadow-2xl shadow-black/40 ${KIND_BG[venue.kind]}`}
    >
      <div className="flex items-center gap-2">
        <Chip>{KIND_LABEL[venue.kind]}</Chip>
        <Chip>{formatKm(distanceKm)}</Chip>
        <PriceGlyphs level={venue.price_level} className="ml-auto text-lg" />
      </div>

      <h2
        className={`mt-auto line-clamp-3 font-display leading-[0.9] font-extrabold break-words ${nameSize(venue.name)}`}
        style={{ fontVariationSettings: '"wdth" 65' }}
      >
        {venue.name}
      </h2>

      {shown.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {shown.map((t) => (
            <li key={t}>
              <Chip>{tagLabel(t)}</Chip>
            </li>
          ))}
          {extra > 0 && (
            <li>
              <Chip>+{extra}</Chip>
            </li>
          )}
        </ul>
      )}

      <div className="mt-3 space-y-0.5 text-[15px]">
        {why && <p className={rv.isExploration ? "font-semibold text-sodium" : "text-foam/70"}>{why}</p>}
        {rating.similarReviewers >= 1 && (
          <p className="font-semibold">
            People like you: {Math.round(rating.score * 100)}% 👍{" "}
            <span className="font-normal text-foam/70">({rating.similarReviewers})</span>
          </p>
        )}
      </div>
    </article>
  );
}
