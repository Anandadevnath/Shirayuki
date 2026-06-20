import { Suspense } from "react";
import { getHome, getCategory, getSchedule, safe } from "@/lib/api";
import type { ScheduleItem } from "@/lib/providers/hianime";
import { Spotlight } from "@/components/home/Spotlight";
import { ContinueWatching } from "@/components/home/ContinueWatching";
import { Trending } from "@/components/home/Trending";
import { LatestEpisodes } from "@/components/home/LatestEpisodes";
import { QuickLists } from "@/components/home/QuickLists";
import { DiscoverColumns } from "@/components/home/DiscoverColumns";
import { Top10Tabs } from "@/components/home/Top10Tabs";
import { Schedule, type ScheduleDay } from "@/components/home/Schedule";
import { ErrorState } from "@/components/common/States";
import { ScheduleSkeleton } from "@/components/ui/Skeleton";

// ISR cadence for the home page response. Matches the `revalidate: 900` used
// inside `getHome()` so the upstream and the page-level cache share the same
// 15-minute window — when the upstream revalidates, this re-renders in the
// same pass.
//
// Without this, the page is treated as fully dynamic (it `await`s uncached
// `safe(getHome)`), Next.js sends `Cache-Control: private, no-store`,
// and the browser refuses to put the page into the back/forward cache.
// That shows up in Lighthouse as "Page prevented back/forward cache
// restoration" and adds a full network round-trip to every back-nav.
export const revalidate = 900;

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

/**
 * Schedule streams independently: the main board never blocks on the schedule
 * endpoint. Suspense shows ScheduleSkeleton until this resolves, then swaps it
 * in with no layout shift (the skeleton matches the panel's footprint).
 *
 * All 7 days are pre-fetched server-side in parallel — each `/api/schedule`
 * hit shares the data cache, so the upstream call is a single deduped read
 * for the whole week. Tab switching on the client is then instant (no HTTP).
 */
async function ScheduleSection({ days, today }: { days: ScheduleDay[]; today: string }) {
  const results = await Promise.all(
    days.map((d) => safe(() => getSchedule(d.iso))),
  );
  const initialByDay: Record<string, ScheduleItem[]> = {};
  days.forEach((d, i) => {
    initialByDay[d.iso] = results[i].ok ? results[i].data : [];
  });
  return (
    <Schedule
      days={days}
      initialByDay={initialByDay}
      initialIso={today}
    />
  );
}

export default async function HomePage() {
  // The home payload's `completed` list is tiny (~5), which leaves the Latest
  // Completed panel mostly empty. Pull a fuller page from the category endpoint
  // and cap it so the grid fills out to roughly the Top 10 panel's height.
  const today = new Date().toISOString().slice(0, 10);
  const [res, completedRes] = await Promise.all([
    safe(getHome),
    safe(() => getCategory("completed")),
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

  // The first spotlight slide is the LCP candidate. Spotlight is a client
  // component (carousel + autoplay), so its `<Image priority>` only registers
  // the preload AFTER hydration — too late to win the LCP race on slow
  // connections. Render the preload directly server-side so the network
  // fetch starts during HTML parse, in parallel with the JS bundle download.
  // Next.js hoists server-rendered <link> tags into the document head.
  //
  // Note on URL: we point the preload at the raw upstream CDN URL (not the
  // next/image optimizer URL) because we don't know the optimized variant
  // at SSR time without making an extra request. The two responses share
  // the upstream cache, so even if the browser later swaps in an optimized
  // variant, the raw bytes from the preload are reused for the same source
  // image — no double download on the LCP path.
  const lcpPoster = home.spotlight[0]?.poster ?? null;

  return (
    <div>
      {lcpPoster && (
        <link
          rel="preload"
          as="image"
          href={lcpPoster}
          // Hint the browser to fetch this at the highest priority, ahead of
          // the JS bundle. Lighthouse treats this as a positive LCP signal.
          // The exact srcset is owned by next/image's optimizer at runtime;
          // the bare URL fetch hits the same upstream anyway.
          fetchPriority="high"
        />
      )}
      {home.spotlight.length > 0 && (
        <Spotlight items={home.spotlight} />
      )}

      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-screen -translate-x-1/2 bg-gradient-to-b from-base from-5% via-base/55 via-45% to-transparent"
        />

        {/* Section-level cascade — each board section fades up in sequence as
            the page paints, so nothing snaps in. Pure-CSS, runs once on mount
            (no scroll observer, so content is never gated behind hydration). */}
        <div className="relative z-10 flex flex-col gap-12 -translate-y-[8vh] sm:-translate-y-[14vh]">
          <div className="reveal" style={{ ["--reveal-delay" as string]: "0ms" }}>
            <ContinueWatching />
          </div>

          <div className="reveal" style={{ ["--reveal-delay" as string]: "80ms" }}>
            <Trending items={home.trending} />
          </div>

          {/* Card rails first — posters get room to breathe. Latest Episodes
              gets the cinematic 3D treatment (pointer-tilt floating posters). */}
          <div className="reveal" style={{ ["--reveal-delay" as string]: "160ms" }}>
            <LatestEpisodes items={home.latestEpisodes} />
          </div>

          <div className="reveal" style={{ ["--reveal-delay" as string]: "240ms" }}>
            <DiscoverColumns
              topAiring={home.topAiring}
              mostPopular={home.mostPopular}
              newReleases={home.newReleases}
              completed={home.completed}
            />
          </div>

          {/* Latest Completed (left) and the Top 10 list (right) are two separate
              glass containers side by side. They stretch to a shared height (the
              taller of the two) and the left poster grid distributes its rows to
              fill, so neither panel is left with dead space. Stacks on mobile. */}
          <div
            className="reveal grid grid-cols-1 items-stretch gap-x-6 gap-y-12 lg:grid-cols-[minmax(0,1fr)_clamp(300px,24vw,340px)]"
            style={{ ["--reveal-delay" as string]: "320ms" }}
          >
            <QuickLists completed={completed} />

            <Top10Tabs buckets={home.top10} />
          </div>

          {/* Estimated airing schedule — streamed independently so it never
              blocks the board above; shows its own skeleton until ready. */}
          <Suspense fallback={<ScheduleSkeleton />}>
            <ScheduleSection days={scheduleDays} today={today} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}