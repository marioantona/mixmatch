// Deck/list-specific bits. Shared atoms (KindChip, PriceGlyphs, Chip toggle) live in src/components/ui.

export function formatKm(km: number): string {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/** Static label chip on a coloured card field (bolder than ui/Chip's static variant). */
export function CardChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-foam/12 px-3 py-1 text-sm font-semibold whitespace-nowrap">
      {children}
    </span>
  );
}
