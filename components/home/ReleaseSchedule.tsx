import type { ScheduleModel, ScheduleWeekday } from "@/lib/providers/types";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ScheduleCalendar } from "@/components/schedule/ScheduleCalendar";
import { WEEK_ORDER } from "@/lib/utils/schedule";

/**
 * Home page schedule section — the weekly premiere calendar rendered as an
 * auto-scrolling marquee teaser for the full /schedule page.
 *
 * Always shows ALL seven weekdays (Saturday → Friday), so the week reads as one
 * complete calendar rather than whatever days happen to have premieres. Days
 * with no releases render a quiet "No premieres scheduled" placeholder instead
 * of collapsing. Data comes straight from the provider's `week` buckets
 * (grouped by weekday); nothing is hardcoded.
 *
 * Renders nothing when the provider has no premiere-dated titles at all —
 * the caller (`app/page.tsx`) already gates this section on the schedule
 * fetch succeeding, so an empty data set just hides the section.
 */
export function ReleaseSchedule({ data }: { data: ScheduleModel }) {
  const byDay = new Map(data.week.map((b) => [b.day, b.items]));

  // Nothing premiere-dated upstream → skip the section entirely.
  if (![...byDay.values()].some((items) => items.length > 0)) return null;

  // Always render the full week in canonical order, filling any missing day
  // with an empty bucket so the marquee is complete and evenly balanced.
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
      <ScheduleCalendar days={days} />
    </section>
  );
}

