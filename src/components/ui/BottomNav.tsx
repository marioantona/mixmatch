"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { getActiveGroup, subscribeActiveGroup } from "@/lib/group";

/** Height of the nav above the safe area — pad page content by this. */
export const NAV_HEIGHT = "4rem";

export function BottomNav() {
  const pathname = usePathname();
  // The group you're in (if any), so "Group" takes you back to it instead of the create/join screen.
  const activeGroup = useSyncExternalStore(subscribeActiveGroup, getActiveGroup, () => null);
  if (pathname.startsWith("/start")) return null;

  const items = [
    { href: "/", label: "Discover", active: pathname === "/" || pathname.startsWith("/venue") },
    { href: "/liked", label: "Liked", active: pathname.startsWith("/liked") },
    {
      href: activeGroup ? `/g/${activeGroup}` : "/group",
      label: "Group",
      active: pathname.startsWith("/group") || pathname.startsWith("/g/"),
    },
  ];

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-foam/12 bg-kerb">
      <ul className="mx-auto flex h-16 max-w-md">
        {items.map((item) => (
          <li key={item.label} className="flex-1">
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={`flex h-full items-center justify-center font-semibold ${item.active ? "text-sodium" : "text-foam/70"}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
