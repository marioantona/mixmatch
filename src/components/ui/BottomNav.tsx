"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Discover", match: (p: string) => p === "/" || p.startsWith("/venue") },
  { href: "/group", label: "Group", match: (p: string) => p.startsWith("/group") || p.startsWith("/g/") },
];

/** Height of the nav above the safe area — pad page content by this. */
export const NAV_HEIGHT = "4rem";

export function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/start")) return null;
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-foam/12 bg-kerb">
      <ul className="mx-auto flex h-16 max-w-md">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full items-center justify-center font-semibold ${active ? "text-sodium" : "text-foam/70"}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
