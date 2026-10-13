"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ScheduleItem, ScheduleWeekday } from "@/lib/providers/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { TypePill } from "@/components/anime/Badges";
import { RAIL_FADE } from "@/components/common/RailShell";
import { cn } from "@/lib/utils/cn";

/**
 * Shared release-calendar pieces. Used by both the full /schedule page and the
 * home page section so the two stay visually identical without duplicating
 * markup. The calendar is tabbed: pick a weekday (Sat → Fri) and that day's
 * releases stream out as a horizontal, left→right rail of poster cards — the
 * same card language as the rest of the site's rails. Rows (used by the
 * upcoming list on /schedule) render the real theme "Estimated Schedule"
 * fields when present — air time + episode number — plus the premiere date
 * fallback, so a row shows title + type + (air time · episode) + date.
 */

/** "2026-11-30" → "Nov 30, 2026". Parsed as UTC so the local timezone never
 *  shifts the displayed day (the API emits a bare premiere date). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Compact poster-thumb row: thumbnail, title, type pill + air time/episode/date. */
export function ScheduleItemRow({
  it,
  showComing = false,
}: {
  it: ScheduleItem;
  /** Render the "Coming" chip (used where the whole list is upcoming). */
  showComing?: boolean;
}) {
  return (
    <li>
      <Link
        href={`/anime/${it.id}`}
        className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-surface-2"
      >
        <span className="relative block h-16 w-12 shrink-0 overflow-hidden rounded-md bg-surface-2">
          {it.poster && <SmartImage src={it.poster} alt="" fill sizes="48px" className="object-cover" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-1 line-clamp-2 text-sm font-medium leading-snug text-snow group-hover:text-frost">
            {it.title}
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <TypePill type={it.type} />
            {it.airTime && (
              <span className="rounded bg-base/60 px-1 py-0.5 font-mono text-[11px] font-semibold text-frost">
                {it.airTime}
              </span>
            )}
            {it.episodeNumber && <span className="text-[11px] text-faint">{it.episodeNumber}</span>}
            {it.premiereDate ? (
              <span className="font-mono text-[11px] font-semibold text-frost">
                {formatDate(it.premiereDate)}
              </span>
            ) : (
              <span className="font-mono text-[11px] text-faint">Date TBD</span>
            )}
          </span>
        </span>
        {showComing && it.isUpcoming && (
          <span className="shrink-0 self-start rounded-full bg-frost-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-frost">
            Coming
          </span>
        )}
      </Link>
    </li>
  );
}

/** Portrait schedule card for the horizontal day rail: poster on top, then the
 *  title and the schedule meta (type · air time · episode · premiere date ·
 *  "Coming"). Shares the site's poster-card proportions and hover lift so the
 *  calendar reads as another rail rather than a bespoke widget. */
export function ScheduleItemCard({ it }: { it: ScheduleItem }) {
  return (
    <Link
      href={`/anime/${it.id}`}
      className="group block w-[44vw] shrink-0 snap-start sm:w-[24vw] md:w-[200px]"
    >
      <div className="relative transform-gpu transition-transform duration-300 ease-out group-hover:-translate-y-1.5">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[1.25rem] bg-surface-2 ring-1 ring-line/80">
          <div className="absolute inset-0 transform-gpu transition-transform duration-300 ease-out group-hover:scale-[1.06]">
            {it.poster ? (
              <SmartImage
                src={it.poster}
                alt=""
                fill
                sizes="(max-width:640px) 40vw, 200px"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-faint">No image</div>
            )}
          </div>
          {/* Frosted hover ring — opacity cross-fade, GPU-composited */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[1.25rem] ring-1 ring-frost/50 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
          />
        </div>
      </div>
      <div className="w-full pt-2.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-snow transition-colors group-hover:text-frost">
          {it.title}
        </h3>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <TypePill type={it.type} />
          {it.airTime && (
            <span className="rounded bg-base/60 px-1 py-0.5 font-mono text-[11px] font-semibold text-frost">
              {it.airTime}
            </span>
          )}
          {it.episodeNumber && <span className="text-[11px] text-faint">{it.episodeNumber}</span>}
          {it.premiereDate ? (
            <span className="font-mono text-[11px] font-semibold text-frost">
              {formatDate(it.premiereDate)}
            </span>
          ) : (
            <span className="font-mono text-[11px] text-faint">Date TBD</span>
          )}
          {it.isUpcoming && (
            <span className="rounded-full bg-frost-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-frost">
              Coming
            </span>
          )}
        </span>
      </div>
    </Link>
  );
}

/** Tabbed release calendar: a weekday nav (Sat → Fri) with release counts above
 *  a horizontal rail. Selecting a day swaps the rail to that day's releases,
 *  laid out left→right as poster cards in the same masked, snap-scrolling
 *  viewport the site's other rails use. The rail resets to its start whenever
 *  the day changes so the first release is always in view. */
export function ScheduleCalendar({
  days,
  className,
}: {
  days: ScheduleWeekday[];
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Default to the first weekday that actually has releases (Saturday in the
  // canonical Sat→Fri order) so the calendar opens on something meaningful.
  const [active, setActive] = useState(() => {
    const first = days.findIndex((d) => d.items.length > 0);
    return first === -1 ? 0 : first;
  });

  const select = (i: number) => {
    setActive(i);
    // Day changed → return the rail to the start so the first card is visible.
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({ left: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const nudge = (dir: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: dir * scroller.clientWidth * 0.85, behavior: "smooth" });
  };

  const day = days[active];
  const isEmpty = day.items.length === 0;

  return (
    <div className={cn(className)}>
      {/* Weekday nav (Sat → Fri) with release counts — clicking a day swaps the
          rail below to that day's releases. Scroll chevrons sit at the end. */}
      <div className="mb-3 flex items-center gap-2">
        <nav
          role="tablist"
          aria-label="Select weekday"
          className="no-scrollbar -mx-1 flex flex-1 gap-2 overflow-x-auto px-1 pb-1"
        >
          {days.map((d, i) => {
            const isActive = i === active;
            return (
              <button
                key={d.day}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="schedule-panel"
                onClick={() => select(i)}
                className={cn(
                  "flex shrink-0 flex-col items-start rounded-lg border px-3 py-1.5 text-left transition-colors",
                  isActive
                    ? "border-frost/50 bg-frost-soft text-frost"
                    : "border-line/60 bg-surface/40 text-muted hover:border-frost/30 hover:text-snow",
                )}
              >
                <span className={cn("text-[13px] font-bold leading-none", isActive ? "text-frost" : "text-snow")}>
                  {d.day}
                </span>
                <span className="mt-1 font-mono text-[10px] leading-none opacity-75">
                  {d.items.length} release{d.items.length === 1 ? "" : "s"}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="hidden shrink-0 gap-1 sm:flex">
          <button
            type="button"
            onClick={() => nudge(-1)}
            aria-label="Scroll left"
            className="grid size-8 place-items-center rounded-full glass text-muted transition-colors hover:border-frost/40 hover:text-snow"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            aria-label="Scroll right"
            className="grid size-8 place-items-center rounded-full glass text-muted transition-colors hover:border-frost/40 hover:text-snow"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* The selected day's releases, laid out horizontally (left → right) */}
      <div
        id="schedule-panel"
        role="tabpanel"
        tabIndex={0}
        ref={scrollerRef}
        aria-label={`${day.day} releases, horizontally scrollable`}
        style={{ maskImage: RAIL_FADE, WebkitMaskImage: RAIL_FADE }}
        className="no-scrollbar snap-x-rail -mx-1 flex gap-4 overflow-x-auto scroll-pl-1 px-1 pb-4 pt-1 outline-none"
      >
        {isEmpty ? (
          <p className="flex w-full items-center justify-center rounded-xl border border-line/70 bg-surface/40 px-4 py-10 text-center font-mono text-[11px] text-faint">
            No premieres scheduled for {day.day}
          </p>
        ) : (
          day.items.map((it) => <ScheduleItemCard key={it.id} it={it} />)
        )}
      </div>

      <p className="mt-1 hidden font-mono text-[11px] text-faint sm:block">
        Click a weekday to see its releases
      </p>
    </div>
  );
}
