import { getHome, getCategory, getSchedule, safe } from "@/lib/api";
import { Spotlight } from "@/components/home/Spotlight";
import { ContinueWatching } from "@/components/home/ContinueWatching";
import { Trending } from "@/components/home/Trending";
import { LatestEpisodes } from "@/components/home/LatestEpisodes";
import { QuickLists } from "@/components/home/QuickLists";
import { DiscoverColumns } from "@/components/home/DiscoverColumns";
import { Top10Tabs } from "@/components/home/Top10Tabs";
import { Schedule, type ScheduleDay } from "@/components/home/Schedule";
import { ErrorState } from "@/components/common/States";

/** Today + the next 6 days, as deterministic UTC tabs for the schedule panel. */
function upcomingWeek(todayISO: string): ScheduleDay[] {
  const base = new Date(`${todayISO}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    return {
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      day: d.getUTCDate(),
      month: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
    };
  });
}

export default async function HomePage() {
  // The home payload's `completed` list is tiny (~5), which leaves the Latest
  // Completed panel mostly empty. Pull a fuller page from the category endpoint
  // and cap it so the grid fills out to roughly the Top 10 panel's height.
  const today = new Date().toISOString().slice(0, 10);
  const [res, completedRes, scheduleRes] = await Promise.all([
    safe(getHome),
    safe(() => getCategory("completed")),
    safe(() => getSchedule(today)),
  ]);

  if (!res.ok) {
    return (
      <div className="pt-10">
        <ErrorState retryHref="/" />
      </div>
    );
  }

  const home = res.data;
  const completed = (
    completedRes.ok && completedRes.data.results.length
      ? completedRes.data.results
      : home.completed
  ).slice(0, 15);

  const scheduleDays = upcomingWeek(today);
  const scheduleItems = scheduleRes.ok ? scheduleRes.data : [];

  return (
    <div>
      {home.spotlight.length > 0 && (
        <Spotlight items={home.spotlight} />
      )}

      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-screen -translate-x-1/2 bg-gradient-to-b from-base from-5% via-base/55 via-45% to-transparent"
        />

        <div className="relative z-10 flex flex-col gap-12 -translate-y-[8vh] sm:-translate-y-[14vh]">
          <ContinueWatching />

        <Trending items={home.trending} />

        {/* Card rails first — posters get room to breathe. Latest Episodes gets
            the cinematic 3D treatment (pointer-tilt floating posters). */}
        <LatestEpisodes items={home.latestEpisodes} />

        <DiscoverColumns
          topAiring={home.topAiring}
          mostPopular={home.mostPopular}
          newReleases={home.newReleases}
          completed={home.completed}
        />

        {/* Latest Completed (left) and the Top 10 list (right) are two separate
            glass containers side by side. They stretch to a shared height (the
            taller of the two) and the left poster grid distributes its rows to
            fill, so neither panel is left with dead space. Stacks on mobile. */}
        <div className="grid grid-cols-1 items-stretch gap-x-6 gap-y-12 lg:grid-cols-[minmax(0,1fr)_clamp(300px,24vw,340px)]">
          <QuickLists completed={completed} />

          <Top10Tabs buckets={home.top10} />
        </div>

        {/* Estimated airing schedule — cinematic week strip + per-day list. */}
        <Schedule
          days={scheduleDays}
          initial={{ iso: today, items: scheduleItems }}
        />
        </div>
      </div>
    </div>
  );
}
