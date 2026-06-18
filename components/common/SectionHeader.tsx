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

/**
 * Cinematic, centred variant — a frost eyebrow, then the title flanked by two
 * tapering frost rules, with any controls (tabs, "view more") centred beneath.
 * Used for the framed glass panels where a symmetrical title reads better than
 * the default left-aligned rhythm.
 */
export function CinematicHeader({
  title,
  eyebrow,
  children,
  titleClassName,
  className,
}: {
  title: string;
  eyebrow?: string;
  /** centred controls rendered below the title */
  children?: ReactNode;
  titleClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-col items-center gap-2.5 text-center", className)}>
      {eyebrow && (
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-frost">
          {eyebrow}
        </span>
      )}
      <div className="flex w-full items-center justify-center gap-3 sm:gap-4">
        <span className="h-px w-20 bg-gradient-to-r from-transparent to-frost/70 sm:w-40" />
        <h2
          className={cn(
            "font-display text-xl font-extrabold leading-tight tracking-tight sm:text-2xl",
            titleClassName,
          )}
        >
          {title}
        </h2>
        <span className="h-px w-20 bg-gradient-to-l from-transparent to-frost/70 sm:w-40" />
      </div>
      {children && <div className="mt-1 flex items-center justify-center gap-2">{children}</div>}
    </div>
  );
}
