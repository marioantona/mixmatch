export function PriceGlyphs({ level, className = "" }: { level: 1 | 2 | 3; className?: string }) {
  return (
    <span className={`font-semibold tracking-wide ${className}`} aria-label={`Price level ${level} of 3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= level ? "" : "opacity-30"}>
          £
        </span>
      ))}
    </span>
  );
}
