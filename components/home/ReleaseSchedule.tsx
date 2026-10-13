"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { ScheduleItem, ScheduleModel, ScheduleWeekday } from "@/lib/providers/types";
import { SectionHeader } from "@/components/common/SectionHeader";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatDate } from "@/components/schedule/ScheduleCalendar";
import { cn } from "@/lib/utils/cn";

/**
 * Home page schedule section — the weekly premiere calendar as a teaser for
 * the full /schedule page. Renders nothing when the provider has no
 * premiere-dated titles (the API failure path is handled by the caller, which
 * simply skips the section via `safe()`).
 *
 * Layout: a complete Saturday→Friday weekday navigation row on top (each day
 * shows its release count; the active day is a frost-filled pill) with the
 * active day's releases beneath as uniform poster cards. One day at a time
 * means no ragged columns or empty cells when a weekday has zero premieres —
 * the grid is always filled and perfectly even at every breakpoint.
 */
export function ReleaseSchedule({ data }: { data: ScheduleModel }) {
  const week = data.week;
  // Default active day = today (UTC so server + hydration agree), otherwise
  // the next day that actually has premieres.
  const [activeDay, setActiveDay] = useState<DayName>(() => pickInitialDay(week));

  if (!week.some((b) => b.items.length > 0)) return null;

  const items = week.find((b) => b.day === activeDay)?.items ?? [];
  const countOf = (day: DayName) => week.find((b) => b.day === day)?.items.length ?? 0;

  return (
    <section>
      <SectionHeader
        eyebrow="Weekly"
        title="Release Calendar"
        href="/schedule"
        seeAllLabel="Full schedule"
      />
      {/* Weekday navigation row — every day of the week, its count, and the
          active-day pill. Two rows of four on phones, one tidy 7-wide row on
          sm+. */}
      <div
        role="tablist"
        aria-label="Release calendar weekdays"
        className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-1.5"
      >
        {WEEK.map((day) => {
          const count = countOf(day);
          const active = day === activeDay;
          return (
            <button
              key={day}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveDay(day)}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 transition-[background,border-color,color,box-shadow] duration-200",
                active
                  ? "border-transparent bg-gradient-to-br from-frost to-frost-deep text-base shadow-[var(--shadow-neon)]"
                  : "border-line/60 bg-surface/40 text-muted hover:border-frost/40 hover:text-snow",
              )}
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider sm:hidden">
                {day.slice(0, 3)}
              </span>
              <span className="hidden font-mono text-[11px] font-bold uppercase tracking-wider sm:inline">
                {day}
              </span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums",
                  active ? "bg-base/25 text-base" : "bg-base/50 text-frost",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active day's release cards. The fixed 2:3 aspect gives every card the
          same height, and flex-wrap centers rows so a small day never leaves
          trailing whitespace. */}
      <div className="mt-5 flex flex-wrap justify-center gap-4" aria-live="polite">
        {items.length > 0 ? (
          items.map((it) => <ReleaseCard key={it.id} it={it} />)
        ) : (
          <EmptyDay day={activeDay} />
        )}
      </div>
    </section>
  );
}

/* ── Supporting pieces ──────────────────────────────────────────────────── */

/** Weekday order — runs Saturday → Friday. */
const WEEK = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;
type DayName = (typeof WEEK)[number];

/** First day (wrapping forward from today) that has premieres; fall back to
 *  today even when empty. Computed from UTC so SSR and hydration agree. */
function pickInitialDay(week: ScheduleWeekday[]): DayName {
  const today = new Date().toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
  }) as DayName;
  const start = WEEK.indexOf(today) >= 0 ? WEEK.indexOf(today) : 0;
  for (let i = 0; i < WEEK.length; i++) {
    const day = WEEK[(start + i) % WEEK.length];
    if (week.some((b) => b.day === day && b.items.length > 0)) return day;
  }
  return WEEK[start];
}

function ReleaseCard({ it }: { it: ScheduleItem }) {
  const date = it.premiereDate ? formatDate(it.premiereDate) : "Date TBD";
  return (
    <Link
      href={`/anime/${it.id}`}
      className="group block"
      aria-label={`${it.title} — premieres ${date}`}
    >
      {/* The whole card is one poster panel at a fixed 2:3 aspect → every card
          is exactly the same height, whatever the title length. */}
      <div className="relative aspect-[2/3] w-[42vw] overflow-hidden rounded-xl bg-surface-2 ring-1 ring-line/60 transition-shadow duration-300 group-hover:ring-frost/50 sm:w-44 md:w-48 lg:w-52 xl:w-56">
        {/* Poster — gentle cinematic push-in on hover */}
        <div className="absolute inset-0 transform-gpu overflow-hidden transition-transform duration-300 ease-out group-hover:scale-[1.06]">
          {it.poster ? (
            <SmartImage
              src={it.poster}
              alt=""
              fill
              sizes="(max-width:640px) 42vw, (max-width:768px) 25vw, (max-width:1024px) 22vw, 224px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-faint">No image</div>
          )}
        </div>

        {/* Top hairline — the light-catch that reads as glass/premium */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />

        {/* Bottom scrim — deep enough to keep title + date legible over any art */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-base via-base/55 to-transparent"
        />

        {/* COMING badge — always visible, top-right */}
        <span className="absolute right-2 top-2 rounded-md bg-frost-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-frost">
          COMING
        </span>

        {/* Bottom content — title + release date, always readable */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-snow [text-shadow:0_1px_8px_rgba(0,0,0,0.9)] transition-colors group-hover:text-frost">
            {it.title}
          </h3>
          <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold tracking-tight text-frost">
            <CalendarDays className="size-3" />
            {date}
          </p>
        </div>
      </div>
    </Link>
  );
}

function EmptyDay({ day }: { day: string }) {
  return (
    <div className="w-full rounded-xl border border-dashed border-line/60 bg-surface/30 px-6 py-12 text-center">
      <p className="text-sm text-faint">
        No premieres scheduled for <span className="font-semibold text-muted">{day}</span> yet.
      </p>
    </div>
  );
}
