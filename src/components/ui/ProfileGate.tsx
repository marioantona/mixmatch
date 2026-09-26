"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";

/** Redirects to /start when there's no profile. /start itself is always allowed. */
export function ProfileGate({ children }: { children: ReactNode }) {
  const { profile, loading } = useProfile();
  const pathname = usePathname();
  const router = useRouter();
  const open = pathname.startsWith("/start");

  useEffect(() => {
    if (!loading && !profile && !open) {
      // Keep the query too (e.g. ?demo=1) so it survives onboarding.
      const target = pathname + window.location.search;
      const next = target === "/" ? "" : `?next=${encodeURIComponent(target)}`;
      router.replace(`/start${next}`);
    }
  }, [loading, profile, open, pathname, router]);

  if (open || profile) return <>{children}</>;
  return (
    <div className="flex min-h-dvh items-center justify-center text-foam/70" aria-busy="true">
      Loading…
    </div>
  );
}
