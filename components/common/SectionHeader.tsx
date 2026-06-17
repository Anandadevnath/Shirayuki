import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The single section header used across the home page (and beyond) so every
 * rail / grid / panel shares one rhythm: a small frost eyebrow, a display
 * title, then an optional "See all" link and/or controls on the right.
 */
export function SectionHeader({
  title,
  eyebrow,
  href,
  seeAllLabel = "See all",
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  href?: string;
  seeAllLabel?: string;
  /** right-aligned controls (e.g. carousel arrows, period tabs) */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-frost">
            {eyebrow}
          </span>
        )}
        <h2 className="font-display text-xl font-extrabold leading-tight sm:text-2xl">{title}</h2>
      </div>
      {(href || children) && (
        <div className="flex shrink-0 items-center gap-2">
          {href && (
            <Link
              href={href}
              className="text-sm text-muted transition-colors hover:text-frost"
            >
              {seeAllLabel}
            </Link>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
