import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { getSchedule, withTimeout } from "@/lib/api";
import type { ScheduleWeekday } from "@/lib/providers/types";
import { ErrorState } from "@/components/common/States";
import { PageHeader } from "@/components/common/SectionHeader";
import { ScheduleBoard } from "@/components/discovery/ScheduleBoard";
import { WEEK_ORDER } from "@/lib/utils/schedule";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Weekly release calendar, upcoming premieres and currently airing anime.",
};

export default async function SchedulePage() {
  // The schedule is a heavy scrape (~7s cold). Bound it so the route always
  // settles: on a stalled upstream the deadline resolves to a typed failure and
  // the page renders its ErrorState instead of holding the skeleton forever.
  const res = await withTimeout(getSchedule(), 20_000, "schedule");

  if (!res.ok) {
    return (
      <div>
        <ErrorState retryHref="/schedule" />
      </div>
    );
  }

  const s = res.data;
  const hasWeek = s.week.some((b) => b.items.length > 0);
  const hasUpcoming = s.upcoming.length > 0;
  const hasAiring = s.airing.length > 0;

  // Present the calendar in canonical Sat→Fri order (the provider does not
  // guarantee bucket ordering), filling any missing weekday with an empty
  // bucket so the marquee loop is always complete and balanced.
  const byDay = new Map(s.week.map((b) => [b.day, b.items]));
  const orderedWeek: ScheduleWeekday[] = WEEK_ORDER.map((day) => ({
    day,
    items: byDay.get(day) ?? [],
  }));

  if (!hasWeek && !hasUpcoming && !hasAiring) {
    return (
      <div>
        <ErrorState
          retryHref="/schedule"
          message="No schedule data could be fetched right now — the provider may not have published any for this season."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      <PageHeader
        eyebrow={
          <span className="text-label flex items-center gap-2 text-frost">
            <CalendarDays className="size-3.5" /> WEEKLY ANIME GUIDE
          </span>
        }
        title="Anime Release Schedule"
        lede={
          <>
            Keep track of upcoming episodes and discover what&apos;s airing throughout
            the week. Shown as premiere days only, since no broadcast times are
            published upstream.
            {s.updatedAt && (
              <span className="mt-1 block font-accent text-[11px] text-faint">
                Updated {new Date(s.updatedAt).toLocaleString()}
              </span>
            )}
          </>
        }
      />

      <ScheduleBoard schedule={s} orderedWeek={orderedWeek} />
    </div>
  );
}

