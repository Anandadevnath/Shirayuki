"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";

/** Fade-out mask used at the rail's right edge so a partially-scrolled card
 *  reads as "more to come" instead of being chopped at the panel edge. */
export const RAIL_FADE =
  "linear-gradient(to right, transparent 0, #000 6px, #000 calc(100% - 2.25rem), transparent 100%)";

/**
 * The shared chrome every horizontally-scrolling rail uses: title + chevron
 * buttons + the masked scroll viewport. Pages pass their own children, so
 * each rail controls its card markup (poster, season, episode, …) without
 * duplicating the scroll logic.
 */
export function RailShell({
  title,
  eyebrow,
  href,
  children,
}: {
  title: string;
  eyebrow?: string;
  href?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });

  return (
    <section className="relative">
      <SectionHeader title={title} eyebrow={eyebrow} href={href}>
        <div className="hidden gap-1 sm:flex">
          <button
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="grid size-8 place-items-center rounded-full glass text-muted transition-colors hover:border-frost/40 hover:text-snow"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="grid size-8 place-items-center rounded-full glass text-muted transition-colors hover:border-frost/40 hover:text-snow"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </SectionHeader>

      <div
        ref={ref}
        style={{ maskImage: RAIL_FADE, WebkitMaskImage: RAIL_FADE }}
        className="no-scrollbar snap-x-rail -mx-1 flex gap-4 overflow-x-auto scroll-pl-1 px-1 pb-4 pt-3"
      >
        {children}
      </div>
    </section>
  );
}