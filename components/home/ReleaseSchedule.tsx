import type { ScheduleModel, ScheduleWeekday } from "@/lib/providers/types";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ScheduleDayColumn } from "@/components/schedule/ScheduleCalendar";

/**
 * Home page schedule section — the weekly premiere calendar rendered as a
 * teaser for the full /schedule page.
 *
 * Shows ALL seven weekdays (Saturday → Friday) as a responsive grid of day
 * cards, so the week reads as one complete, balanced calendar rather than a
 * ragged set of whatever days happen to have premieres. Days with no releases
 * render a quiet "No premieres scheduled" placeholder instead of collapsing,
 * which keeps the grid even and avoids dead space. Data comes straight from
 * the provider's `week` buckets (grouped by weekday); nothing is hardcoded.
 *
 * Renders nothing when the provider has no premiere-dated titles at all —
 * the caller (`app/page.tsx`) already gates this section on the schedule
 * fetch succeeding, so an empty data set just hides the section.
 */

/** Canonical weekday order — starts Saturday and runs through Friday. */
const WEEK_ORDER = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

export function ReleaseSchedule({ data }: { data: ScheduleModel }) {
  const byDay = new Map(data.week.map((b) => [b.day, b.items]));

  // Nothing premiere-dated upstream → skip the section entirely.
  if (![...byDay.values()].some((items) => items.length > 0)) return null;

  // Always render the full week in canonical order, filling any missing day
  // with an empty bucket so the grid is always complete and evenly balanced.
  const days: ScheduleWeekday[] = WEEK_ORDER.map((day) => ({
    day,
    items: byDay.get(day) ?? [],
  }));

  return (
    <section>
      <SectionHeader
        eyebrow="Weekly"
        title="Release Calendar"
        href="/schedule"
        seeAllLabel="Full schedule"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {days.map((d) => (
          <ScheduleDayColumn key={d.day} day={d.day} items={d.items} showEmpty />
        ))}
      </div>
    </section>
  );
}
