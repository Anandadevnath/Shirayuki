import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Page-level header used by every browse / grid route (search, genre,
 * category, A–Z, watchlist, schedule). Consolidates the eyebrow + title +
 * optional lede rhythm that was previously hand-rolled per page, so the
 * header-to-content gap is one value everywhere (`--space-header`).
 *
 * `eyebrow` renders the small frost label; `lede` is an optional muted
 * paragraph under the title. Both are optional — a bare title is valid.
 *
 * `icon` (optional) leads the eyebrow line. The palette has no distinct
 * semantic accent hues, so per-page identity is expressed by icon *choice*
 * rather than by inventing new colors.
 */
export function PageHeader({
  title,
  eyebrow,
  lede,
  icon: Icon,
  children,
  className,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  lede?: ReactNode;
  /** decorative leading icon for the eyebrow line */
  icon?: LucideIcon;
  /** right-aligned controls (rare on page headers) */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-1.5", className)}>
      {(eyebrow || Icon) && (
        <p className="text-sm font-medium text-frost">
          {Icon && (
            <Icon className="mr-1.5 inline size-3.5 -translate-y-px" aria-hidden />
          )}
          {eyebrow}
        </p>
      )}
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-page">{title}</h1>
        {children}
      </div>
      {lede && <p className="max-w-2xl text-desc text-muted">{lede}</p>}
    </header>
  );
}

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
          <span className="text-label block text-frost">{eyebrow}</span>
        )}
        <h2 className="text-section">{title}</h2>
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
        <span className="text-label text-frost">{eyebrow}</span>
      )}
      <div className="flex w-full items-center justify-center gap-4 sm:gap-6">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-frost/40 to-frost/70" />
        <h2 className={cn("text-section shrink-0", titleClassName)}>
          {title}
        </h2>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent via-frost/40 to-frost/70" />
      </div>
      {children && <div className="mt-1 flex items-center justify-center gap-2">{children}</div>}
    </div>
  );
}
