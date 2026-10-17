import { getHome, getSchedule, safe } from "@/lib/api";
import { Spotlight } from "@/components/home/Spotlight";
import { ContinueWatching } from "@/components/home/ContinueWatching";
import { Trending } from "@/components/home/Trending";
import { LatestEpisodes } from "@/components/home/LatestEpisodes";
import { QuickLists } from "@/components/home/QuickLists";
import { DiscoverColumns } from "@/components/home/DiscoverColumns";
import { Top10Tabs } from "@/components/home/Top10Tabs";
import { ReleaseSchedule } from "@/components/home/ReleaseSchedule";
import { Rail } from "@/components/anime/Rail";
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
// Trade-off: the page no longer participates in route-level HTTP caching /
// back-forward cache, since the provider fetch cache carries the 15-min window.
export const dynamic = "force-dynamic";

/**
 * The home board: everything except the schedule hangs off the single
 * `getHome()` payload, so those sections resolve together and stream in as
 * one Suspense unit (route-level `app/loading.tsx` renders their skeleton
 * while the shell has already flushed).
 *
 * The release calendar is an INDEPENDENT endpoint (`getSchedule`), so it
 * streams as its own island: when the schedule endpoint trails the home
 * payload (or vice versa), each top slot fills in the moment its own data
 * lands instead of the whole page waiting on the slowest endpoint — with an
 * in-place <ScheduleSkeleton /> meanwhile.
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
  const completed = home.completed.slice(0, 15);

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
      {home.spotlight.length > 0 && <Spotlight items={home.spotlight} />}

      {/* Document-level <h1> for the home page. The spotlight carousel
          surfaces an <h2> per slide (the anime title); screen readers and
          crawlers need a stable page-level heading that summarises the
          page rather than the currently-active slide. Visually hidden so
          the hero art stays uncluttered. */}
      <h1 className="sr-only">Browse, discover and watch anime — Sode no Shirayuki</h1>

      {/* Section-level cascade — a SINGLE coordinated reveal strategy.

          Above-the-fold sections (Trending, Continue Watching, Latest
          Episodes) render DIRECTLY, with no reveal wrapper: they occupy the
          exact pixels the route-level skeleton (app/loading.tsx) was already
          painting, so an entrance here would blink the section out and replay
          — the skeleton→content flash. Their "entrance" is the load-driven
          crossfade of their inner content (SmartImage posters, the Spotlight
          key art), which keeps one reveal clock for the whole board.

          Below-the-fold sections use the shared IntersectionObserver via
          <Reveal> (one-shot, so scrolling back up never replays) and reveal
          as the user actually reaches them — no arbitrary per-section delays,
          no section held behind another.

          The fine-grained cascade lives inside each rail (cards stagger in
          DOM order); the section wrappers stay at delay 0. */}
      <div className="relative z-10 flex flex-col gap-12">
          {/* Trending keeps its hero-overlap position (v0 layout) so the home
              page stays stable whether or not the user has watch history:
              when Continue Watching has no items it returns null and Trending
              simply rides below the hero — when it does have items, Continue
              Watching renders AFTER Trending so Trending never shifts.

              These above-the-fold sections are rendered WITHOUT a reveal
              wrapper: they replace pixels the route skeleton was already
              painting, so any wrapper would either re-hide them or add a
              phantom flex-gap slot when a client child (Continue Watching)
              renders null. Rendering the sections directly keeps the stack
              rhythm exact and the skeleton→content handoff a pure crossfade. */}
          <Trending items={home.trending} />

          <ContinueWatching />

          {/* Card rails first — posters get room to breathe. Latest Episodes
              gets the cinematic 3D treatment (pointer-tilt floating posters). */}
          <LatestEpisodes items={home.latestEpisodes} />

          <Reveal>
            <DiscoverColumns
              topAiring={home.topAiring}
              mostPopular={home.mostPopular}
              mostFavorite={home.mostFavorite}
              newReleases={home.newReleases}
              completed={home.completed}
            />
          </Reveal>

          {/* Top Upcoming — the last ranked section on the upstream home. Sits
              between the discovery columns and the Latest Completed / Top 10
              pair, mirroring hianime's own section order. No "See all" link:
              the upstream hianime.at has no dedicated /upcoming listing page. */}
          <Reveal>
            <Rail title="Top Upcoming" eyebrow="Premieres" items={home.upcoming} />
          </Reveal>

          <Suspense fallback={<ReleaseScheduleFallback />}>
            <ReleaseScheduleSlot />
          </Suspense>

          {/* Latest Completed (left) and the Top 10 list (right) are two separate
              glass containers side by side. They stretch to a shared height (the
              taller of the two) and the left poster grid distributes its rows to
              fill, so neither panel is left with dead space. Stacks on mobile. */}
          <Reveal
            className="grid grid-cols-1 items-stretch gap-x-6 gap-y-12 lg:grid-cols-[minmax(0,1fr)_clamp(300px,24vw,340px)]"
          >
            <QuickLists completed={completed} />

            <Top10Tabs buckets={home.top10} />
          </Reveal>
        </div>
    </div>
  );
}

/**
 * Release calendar island — independent `getSchedule()` endpoint.
 *
 * As its own Suspense island it streams in whenever it's ready: a fast
 * schedule paints early, a slow one shows an in-place skeleton while the rest
 * of the board has already landed. A schedule failure drops just this section.
 */
async function ReleaseScheduleSlot() {
  const scheduleRes = await safe(getSchedule);
  if (!scheduleRes.ok) return null;
  return <ReleaseSchedule data={scheduleRes.data} />;
}

/** In-place placeholder for the calendar island while its endpoint streams. */
function ReleaseScheduleFallback() {
  return <ScheduleSkeleton />;
}
