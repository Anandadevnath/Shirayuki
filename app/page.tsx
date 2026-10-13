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
import { ErrorState } from "@/components/common/States";

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

export default async function HomePage() {
  // The v2 home payload's featured["Latest Completed"] fetches a full 50-title
  // list, so we cap it so the grid fills out to roughly the Top 10 panel's height.
  //
  // Schedule is fetched in parallel: it's an independent endpoint served from
  // the API's own cache (`revalidate: 1800`), so it adds ~0 latency on top of
  // `getHome`. A schedule failure never takes the home down — the section is
  // simply skipped (`scheduleRes.ok` gate below).
  const [res, scheduleRes] = await Promise.all([
    safe(getHome),
    safe(getSchedule),
  ]);

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
      {home.spotlight.length > 0 && (
        <Spotlight items={home.spotlight} />
      )}

      {/* Document-level <h1> for the home page. The spotlight carousel
          surfaces an <h2> per slide (the anime title); screen readers and
          crawlers need a stable page-level heading that summarises the
          page rather than the currently-active slide. Visually hidden so
          the hero art stays uncluttered. */}
      <h1 className="sr-only">Browse, discover and watch anime — Sode no Shirayuki</h1>

      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-screen -translate-x-1/2 bg-gradient-to-b from-base from-5% via-base/55 via-45% to-transparent"
        />

        {/* Section-level cascade — each board section fades up in sequence as
            the page paints, so nothing snaps in. Pure-CSS, runs once on mount
            (no scroll observer, so content is never gated behind hydration). */}
        <div className="relative z-10 flex flex-col gap-12 -translate-y-[5vh] sm:-translate-y-[9vh]">
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
              mostFavorite={home.mostFavorite}
              newReleases={home.newReleases}
              completed={home.completed}
            />
          </div>

          {/* Top Upcoming — the last ranked section on the upstream home. Sits
              between the discovery columns and the Latest Completed / Top 10
              pair, mirroring hianime's own section order. No "See all" link:
              the upstream hianime.at has no dedicated /upcoming listing page. */}
          <div className="reveal" style={{ ["--reveal-delay" as string]: "280ms" }}>
            <Rail title="Top Upcoming" eyebrow="Premieres" items={home.upcoming} />
          </div>

          {/* Release Calendar — the weekly premiere-grid teaser for /schedule.
              Renders only when the schedule endpoint succeeded; a failure
              silently drops this section (see scheduleRes gate above). */}
          {scheduleRes.ok && (
            <div className="reveal" style={{ ["--reveal-delay" as string]: "320ms" }}>
              <ReleaseSchedule data={scheduleRes.data} />
            </div>
          )}

          {/* Latest Completed (left) and the Top 10 list (right) are two separate
              glass containers side by side. They stretch to a shared height (the
              taller of the two) and the left poster grid distributes its rows to
              fill, so neither panel is left with dead space. Stacks on mobile. */}
          <div
            className="reveal grid grid-cols-1 items-stretch gap-x-6 gap-y-12 lg:grid-cols-[minmax(0,1fr)_clamp(300px,24vw,340px)]"
            style={{ ["--reveal-delay" as string]: "360ms" }}
          >
            <QuickLists completed={completed} />

            <Top10Tabs buckets={home.top10} />
          </div>
        </div>
      </div>
    </div>
  );
}