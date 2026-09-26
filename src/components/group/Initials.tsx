export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-sodium font-semibold text-night ${className}`}
    >
      {initials(name)}
    </span>
  );
}
