import { ImageResponse } from "next/og";

// The Rounds app icon, drawn for next/og: a stack of venue cards (club, bar,
// sodium) on the night background. Content stays inside the central 60% so it
// survives Android's maskable-icon crop.
export function appIcon(size: number): ImageResponse {
  const card = size * 0.34;
  const r = size * 0.06;
  const base = {
    position: "absolute" as const,
    width: card,
    height: card * 1.3,
    borderRadius: r,
    left: (size - card) / 2,
    top: (size - card * 1.3) / 2,
  };
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, background: "#16142E", display: "flex", position: "relative" }}>
        <div style={{ ...base, background: "#4B1F5A", transform: `rotate(-14deg) translateX(${-size * 0.05}px)` }} />
        <div style={{ ...base, background: "#1F4A5A", transform: `rotate(8deg) translateX(${size * 0.05}px)` }} />
        <div
          style={{
            ...base,
            background: "#FFB23F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#16142E",
            fontSize: card * 0.7,
            fontWeight: 800,
          }}
        >
          R
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
