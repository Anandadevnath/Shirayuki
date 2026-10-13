"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ScheduleItem, ScheduleWeekday } from "@/lib/providers/types";
import { SmartImage } from "@/components/ui/SmartImage";
import { TypePill } from "@/components/anime/Badges";
import { cn } from "@/lib/utils/cn";

/**
 * Shared release-calendar pieces. Used by both the full /schedule page and the
 * home page section so the two stay visually identical without duplicating
 * markup. Rows render the real theme "Estimated Schedule" fields when present —
 * air time + episode number — plus the premiere date fallback, so a row shows
 * title + type + (air time · episode) + date.
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

/** One fixed-width weekday card in the auto-scrolling calendar. Poster rows
 *  reuse ScheduleItemRow so the card is always aligned: uniform width, header,
 *  and a min height that keeps empty days the same footprint as populated ones. */
export function ScheduleDayCard({
  day,
  items,
}: {
  day: string;
  items: ScheduleItem[];
}) {
  const isEmpty = items.length === 0;
  return (
    <section
      data-schedule-day={day}
      className="flex w-[250px] shrink-0 snap-start flex-col rounded-xl border border-line/70 bg-surface/40 p-3 sm:w-[300px] sm:p-4"
    >
      <header className="mb-2 flex items-center justify-between gap-2 px-1">
        <h3 className="font-display text-base font-bold leading-tight text-snow">{day}</h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums",
            isEmpty ? "bg-base/50 text-faint" : "bg-frost-soft text-frost",
          )}
        >
          {items.length}
        </span>
      </header>
      {isEmpty ? (
        <p className="flex flex-1 items-center justify-center px-2 py-6 font-mono text-[11px] text-faint">
          No premieres scheduled
        </p>
      ) : (
        <ul className="-mx-1 flex flex-col gap-0.5">
          {items.map((it) => (
            <ScheduleItemRow key={it.id} it={it} showComing />
          ))}
        </ul>
      )}
    </section>
  );

}

/** Auto-scrolling horizontal marquee of the seven weekday cards with a
 *  clickable weekday nav (Sat→Fri) showing release counts. The week is rendered
 *  twice so the loop can wrap seamlessly; auto-scroll advances via
 *  requestAnimationFrame, pauses while hovered/focused or while the user drags/
 *  scrolls manually, and never runs under `prefers-reduced-motion`. */
const SPEED = 34; // px/sec while autoplaying
const MANUAL_HOLD = 800; // ms to hold auto-scroll after a jump/wheel/touch

export function ScheduleCalendar({
  days,
  className,
}: {
  days: ScheduleWeekday[];
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  /** Timestamp until which auto-advance holds (manual scroll / nav jump). */
  const manualUntilRef = useRef(0);
  const hoverRef = useRef(false);
  const touchingRef = useRef(false);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [touching, setTouching] = useState(false);

  useEffect(() => {
    hoverRef.current = hovered;
  }, [hovered]);
  useEffect(() => {
    touchingRef.current = touching;
  }, [touching]);

  // Seamless auto-scroll loop; scrollLeft is kept inside [0, weekWidth) so the
  // first copy is always on screen and nav jumps can target the first copy.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!hoverRef.current && !touchingRef.current && now >= manualUntilRef.current) {
        const weekWidth = scroller.scrollWidth / 2;
        if (
          Number.isFinite(weekWidth) &&
          weekWidth > 0 &&
          scroller.scrollWidth > scroller.clientWidth
        ) {
          let next = scroller.scrollLeft + SPEED * dt;
          if (next >= weekWidth) next -= weekWidth;
          else if (next < 0) next += weekWidth;
          scroller.scrollLeft = next;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /** Focus the given weekday's first-copy card and mark it active. The card is
   *  queried by data attribute; the first hit (copy 1) has an offsetLeft that is
   *  an absolute scrollLeft target because the track acts as offset parent. */
  const jumpTo = (i: number) => {
    setActive(i);
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector(
      `[data-schedule-day="${days[i].day}"]`,
    ) as HTMLElement | null;
    if (!card) return;
    const centre = card.offsetLeft - Math.max(0, (scroller.clientWidth - card.offsetWidth) / 2);
    manualUntilRef.current = performance.now() + MANUAL_HOLD;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({ left: Math.max(0, centre), behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div
      className={cn(className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      {/* Weekday navigation (Sat → Fri) with release counts */}
      <nav
        role="tablist"
        aria-label="Select weekday"
        className="no-scrollbar -mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1"
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
              onClick={() => jumpTo(i)}
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

      {/* Auto-scrolling card track — week rendered twice for a seamless loop */}
      <div
        id="schedule-panel"
        role="tabpanel"
        tabIndex={0}
        ref={scrollerRef}
        onPointerDown={() => setTouching(true)}
        onPointerUp={() => {
          setTouching(false);
          manualUntilRef.current = performance.now() + MANUAL_HOLD;
        }}
        onPointerLeave={() => setTouching(false)}
        onTouchStart={() => setTouching(true)}
        onTouchEnd={() => {
          setTouching(false);
          manualUntilRef.current = performance.now() + MANUAL_HOLD;
        }}
        onWheel={() => {
          manualUntilRef.current = performance.now() + MANUAL_HOLD;
        }}
        aria-label="Weekly release calendar, horizontally scrollable"
        className="no-scrollbar overflow-x-auto scroll-pl-4 pb-1 outline-none"
      >
        <div className="relative flex w-max gap-3 px-1 pb-3">
          {[...days, ...days].map((d, i) => (
            <ScheduleDayCard
              key={`${d.day}-${i < days.length ? 1 : 2}`}
              day={d.day}
              items={d.items}
            />
          ))}
        </div>
      </div>

      <p className="mt-1 hidden font-mono text-[11px] text-faint sm:block">
        Hover to pause · click a weekday above to jump
      </p>
    </div>
  );
}
