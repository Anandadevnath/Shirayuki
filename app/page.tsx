import { getHome, getSchedule, safe } from "@/lib/api";
import { Spotlight } from "@/components/home/Spotlight";
import { ContinueWatching } from "@/components/home/ContinueWatching";
import { TrendingRail } from "@/components/home/TrendingRail";
import {
  LatestEpisodesPanel,
  SeasonalPicksPanel,
} from "@/components/home/EpisodePanels";
import { ReleaseCalendarPanel } from "@/components/home/ReleaseCalendarPanel";
import { Reveal } from "@/components/ui/Reveal";
import { ErrorState } from "@/components/common/States";
import { ScheduleSkeleton } from "@/components/ui/Skeleton";
import HomeSkeleton from "./loading";
import { Suspense } from "react";

// Home is rendered dynamically (not statically prerendered) on purpose.
//
// Data caching lives in the provider's `getHome()` which fetches with
// `revalidate: 900` + `tags: ["home"]` — Next's data-layer fetch cache is what
// keeps this fast across visits. The ROUTE itself is dynamic so a build-time
// fetch outcome is never baked into a static page.
//
// Why: hianime.at is a fragile upstream and intermittently responds 402
// ("Payment required" bot-gate) to the API's scrapes. With `revalidate = 900`
// at the route level, a single bad response at build time was frozen into the
// ISR page for a full 15-minute window — every build during a flaky spell baked
// an ErrorState home. Dynamic rendering means a failed fetch simply
// falls through to the next request and self-heals the moment the API recovers.
export const dynamic = "force-dynamic";

/**
 * The homepage mirrors the "A Winter Anime Portal" reference exactly:
 * cinematic hero → Trending Anime → Latest Episodes + Seasonal Picks →
 * Release Calendar (with the winter promo panel). Continue Watching slots in
 * only when the viewer actually has progress. All data streams: the route
 * shell + skeleton flush instantly (app/loading.tsx), the schedule remains
 * its own island, and section entrances rise once as they enter the viewport.
 */
export default function HomePage() {
  return (
    <div>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeBoard />
      </Suspense>
    </div>
  );
}

/** The whole getHome()-driven board, streamed as one unit. */
async function HomeBoard() {
  const res = await safe(getHome);

  if (!res.ok) {
    return (
      <div className="pt-10">
        <ErrorState retryHref="/" />
      </div>
    );
  }

  const home = res.data;

  // The first spotlight slide is the LCP candidate. Spotlight is a client
  // component (carousel + autoplay), so its `<Image priority>` only registers
  // the preload AFTER hydration — too late to win the LCP race on slow
  // connections. Render the preload directly server-side so the network
  // fetch starts during HTML parse, in parallel with the JS bundle download.
  // Next.js hoists server-rendered <link> tags into the document head.
  const lcpPoster = home.spotlight[0]?.poster ?? null;

  return (
    <div>
      {lcpPoster && (
        <link rel="preload" as="image" href={lcpPoster} fetchPriority="high" />
      )}

      {home.spotlight.length > 0 && <Spotlight items={home.spotlight} />}

      {/* Document-level <h1> for the home page. The hero surfaces an <h2>
          per slide (the anime title); crawlers and screen readers need a
          stable page-level heading. Visually hidden. */}
      <h1 className="sr-only">Browse, discover and watch anime — Sode no Shirayuki</h1>

      {/* The reference composition, top to bottom. Section entrance =
          one viewport-gated rise (shared IntersectionObserver); the schedule
          stays its own island so a trailing endpoint can never hold the
          board hostage. */}
      <div className="relative z-10 flex flex-col gap-8 pb-2 pt-9 sm:gap-9">
        <Reveal>
          <TrendingRail items={home.trending} />
        </Reveal>

        {/* Personal, zero-wait: reads localStorage, renders null when empty. */}
        <ContinueWatching />

        <Reveal delay={120}>
          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <LatestEpisodesPanel items={home.latestEpisodes} />
            <SeasonalPicksPanel items={home.upcoming} />
          </div>
        </Reveal>

        <Reveal delay={200}>
          <Suspense
            fallback={
              <div className="rounded-2xl border border-line/60 bg-surface/45 p-4 sm:p-5">
                <ScheduleSkeleton />
              </div>
            }
          >
            <ReleaseCalendarSlot />
          </Suspense>
        </Reveal>
      </div>
    </div>
  );
}

/**
 * Release calendar island — independent `getSchedule()` endpoint. Streams in
 * whenever it's ready: fast → paints with the rest of the board; slow → the
 * in-place skeleton holds the slot. Failure drops just this section.
 */
async function ReleaseCalendarSlot() {
  const scheduleRes = await safe(getSchedule);
  if (!scheduleRes.ok) return null;
  return <ReleaseCalendarPanel data={scheduleRes.data} />;
}
