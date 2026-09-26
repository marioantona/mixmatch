import type { ReactNode } from "react";

export interface ChipProps {
  children: ReactNode;
  /** When provided the chip is a toggle button; otherwise a static label. */
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ children, selected, onClick, className = "" }: ChipProps) {
  const base = "inline-flex items-center rounded-full px-3 text-sm";
  if (!onClick) return <span className={`${base} min-h-7 bg-foam/12 ${className}`}>{children}</span>;
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      onClick={onClick}
      className={`${base} min-h-11 border font-semibold transition ${
        selected ? "border-sodium bg-sodium text-night" : "border-foam/12 bg-foam/5 text-foam"
      } ${className}`}
    >
      {children}
    </button>
  );
}
