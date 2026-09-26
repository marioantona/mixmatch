"use client";

import { useEffect, type ReactNode } from "react";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-night/70" onClick={onClose} />
      <div className="pb-safe relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-kerb px-5 pt-3">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-foam/30" />
        <h2 className="mb-4 font-display text-2xl font-extrabold">{title}</h2>
        <div className="pb-6">{children}</div>
      </div>
    </div>
  );
}
