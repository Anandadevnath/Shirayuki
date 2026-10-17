import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ScheduleModel, ScheduleWeekday } from "@/lib/providers/types";
import { ScheduleCalendar } from "@/components/schedule/ScheduleCalendar";
import { WEEK_ORDER } from "@/lib/utils/schedule";
import { PortalSectionHeader } from "./PortalSectionHeader";

/**
 * "Release Calendar" — the reference's wide glass panel: serif heading with
 * the 放送カレンダー micro-label, the weekday/date selector with a "Today" cell,
 * the horizontally scrolling release rail, and — on the right — the scenic
 * winter illustration panel with the "More Anime, More Stories." message.
 *
 * All data comes through the `ScheduleModel` the page streams; the date
 * labels are derived from the current week (today anchored inside the
 * API's Sat→Fri window), never fabricated.
 */
export function ReleaseCalendarPanel({ data }: { data: ScheduleModel }) {
  const byDay = new Map(data.week.map((b) => [b.day, b.items]));
  if (![...byDay.values()].some((items) => items.length > 0)) return null;

  // Full week in canonical order (Sat → Fri), empty days included so the
  // calendar always reads as one complete week.
  const days: ScheduleWeekday[] = WEEK_ORDER.map((day) => ({
    day,
    items: byDay.get(day) ?? [],
  }));

  // Derive the real dates for the API's week window: find today's index in
  // the Sat→Fri order and walk backwards/forwards from it. Anchoring on
  // today keeps the "Today" cell — and every label — factually correct.
  const weekdayIdx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const todayName = weekdayIdx[today.getDay()];
  const todayIdx = Math.max(0, days.findIndex((d) => d.day === todayName));
  const dates = days.map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + (i - todayIdx));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  return (
    <section aria-label="Release calendar">
      <div className="rounded-2xl border border-line/60 bg-surface/45 p-4 sm:p-5">
        <PortalSectionHeader jp="放送カレンダー" title="Release Calendar" />
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_190px]">
          <ScheduleCalendar
            days={days}
            dates={dates}
            todayIndex={todayIdx}
            className="min-w-0"
          />
          <WinterPromo />
        </div>
      </div>
    </section>
  );
}

/**
 * The reference's right-side illustration panel: a layered CSS winter scene
 * (pagoda silhouette against a cold gradient sky) carrying the short
 * "More Anime, More Stories." message and a crimson seal, linking into the
 * full schedule page.
 */
function WinterPromo() {
  return (
    <Link
      href="/schedule"
      className="group relative block min-h-[150px] overflow-hidden rounded-xl border border-line/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
      aria-label="More anime, more stories — open the release schedule"
    >
      {/* sky gradient */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, #0A1830 0%, #10233F 55%, #1A3050 100%)",
        }}
      />
      {/* moon glow */}
      <div
        aria-hidden
        className="absolute right-5 top-5 size-10 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(242,245,250,0.5), rgba(242,245,250,0.06) 70%)" }}
      />
      {/* far mountain band */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-16 opacity-70"
        style={{
          background: "#0E1D33",
          clipPath:
            "polygon(0 60%, 12% 38%, 26% 58%, 42% 34%, 58% 58%, 74% 40%, 88% 60%, 100% 46%, 100% 100%, 0 100%)",
        }}
      />
      {/* near tree-line ridge */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-9"
        style={{
          background: "#060D18",
          clipPath:
            "polygon(0 76%, 8% 58%, 18% 74%, 30% 52%, 44% 72%, 57% 54%, 70% 76%, 83% 58%, 92% 72%, 100% 60%, 100% 100%, 0 100%)",
        }}
      />
      {/* snow ground */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-6"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(242,245,250,0.14))" }}
      />

      {/* copy + seal */}
      <div className="absolute inset-0 z-10 flex items-end p-4">
        <p className="font-display text-[16px] font-semibold leading-snug text-snow [text-shadow:0_1px_10px_rgba(0,0,0,0.8)]">
          More Anime,
          <br />
          More Stories.
        </p>
        <span className="seal ml-auto mb-0.5 grid size-6 place-items-center text-[11px]">
          紅
        </span>
        <ArrowRight
          className="absolute right-4 top-4 size-4 text-snow/70 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
    </Link>
  );
}
