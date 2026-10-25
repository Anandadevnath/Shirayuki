"use client";

import { useMemo } from "react";
import type { ScheduleModel, ScheduleWeekday } from "@/lib/providers/types";
import { Grid } from "@/components/anime/Grid";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ScheduleCalendar, ScheduleItemRow } from "@/components/schedule/ScheduleCalendar";
import { scheduleItemToCard } from "@/lib/utils/detail";

/**
 * Client presentation layer for /schedule.
 *
 * The schedule has three independent surfaces — the weekly calendar, the
 * upcoming list and the currently-airing grid. The weekday buckets themselves
 * are pre-computed server-side (canonical order + empty-bucket fill); this
 * component renders them as-is. The airing grid reuses the shared <Grid> and
 * the shared `scheduleItemToCard` adapter so it matches every other surface.
 */
export function ScheduleBoard({
  schedule,
  orderedWeek,
}: {
  schedule: ScheduleModel;
  orderedWeek: ScheduleWeekday[];
}) {
  const week = orderedWeek.map((b) => ({ day: b.day, items: b.items }));
  const upcoming = schedule.upcoming;
  const airing = schedule.airing;

  const airingCards = useMemo(() => airing.map(scheduleItemToCard), [airing]);

  const hasWeek = schedule.week.some((b) => b.items.length > 0);
  const hasUpcoming = schedule.upcoming.length > 0;
  const hasAiring = schedule.airing.length > 0;

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {hasWeek && (
        <section>
          <SectionHeader eyebrow="Weekly" title="Premieres by weekday" />
          <ScheduleCalendar days={week} />
        </section>
      )}

      {hasUpcoming && (
        <section>
          <SectionHeader eyebrow="Up next" title="Upcoming premieres" />
          <div className="rounded-xl border border-line/70 bg-surface/40 p-4">
            <ul className="-mx-2 flex flex-col gap-0.5">
              {upcoming.map((it) => (
                <ScheduleItemRow key={it.id} it={it} showComing />
              ))}
            </ul>
          </div>
        </section>
      )}

      {hasAiring && (
        <section>
          {/* Airing titles have no weekday upstream (their Aired window has
              started), so they read as a poster grid rather than calendar
              rows — same card language as the rest of the site. */}
          <SectionHeader
            eyebrow="Now airing"
            title="Currently airing"
            href="/category/top-airing"
            seeAllLabel="More"
          />
          <Grid items={airingCards} />
        </section>
      )}
    </div>
  );
}
