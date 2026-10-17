import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Section header for the reference homepage: tiny Japanese micro-label, the
 * serif display heading, a hairline that runs toward the right, and an
 * optional "View All" link.
 */
export function PortalSectionHeader({
  jp,
  title,
  href,
  viewAllLabel = "View All",
  children,
  className,
}: {
  /** Japanese micro-label above the heading (「人気のアニメ」) */
  jp: string;
  title: string;
  /** "View All" destination — rendered only when provided */
  href?: string;
  viewAllLabel?: string;
  /** right-aligned controls rendered after the hairline (arrows, etc.) */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {jp && (
          <span className="font-zen block text-[11px] tracking-[0.22em] text-faint">
            {jp}
          </span>
        )}
        <h2 className="font-display mt-0.5 text-2xl font-semibold leading-tight text-snow sm:text-[26px]">
          {title}
        </h2>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <span aria-hidden className="hidden h-px w-16 bg-line sm:block" />
        {href && (
          <Link
            href={href}
            className="group flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-muted transition-colors hover:text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
          >
            {viewAllLabel}
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        )}
      </div>
    </div>
  );
}
