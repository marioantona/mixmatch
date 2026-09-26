import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "ghost" | "go" | "pass";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-sodium text-night",
  ghost: "border border-foam/12 text-foam hover:bg-foam/5",
  go: "bg-go text-night",
  pass: "bg-pass text-night",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  full?: boolean;
}

export function Button({ variant = "primary", full, className = "", type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold transition active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 ${VARIANTS[variant]} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    />
  );
}

/** Same styles for links (e.g. "Get directions"). */
export function buttonClass(variant: ButtonVariant = "primary", full = false): string {
  return `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold transition active:scale-[0.97] ${VARIANTS[variant]} ${full ? "w-full" : ""}`;
}
