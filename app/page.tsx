import { getHome, getSchedule, withTimeout } from "@/lib/api";
import type { Result } from "@/lib/providers/types";
import type { HomeModel, ScheduleModel } from "@/lib/providers/types";
import { Flame, CalendarClock } from "lucide-react";
import { Spotlight } from "@/components/home/Spotlight";
import { ContinueWatching } from "@/components/home/ContinueWatching";
import { Trending } from "@/components/home/Trending";
import { LatestEpisodes } from "@/components/home/LatestEpisodes";
import { QuickLists } from "@/components/home/QuickLists";
import { DiscoverColumns } from "@/components/home/DiscoverColumns";
import { Top10Tabs } from "@/components/home/Top10Tabs";
import { ReleaseSchedule } from "@/components/home/ReleaseSchedule";
import { ErrorState } from "@/components/common/States";
import HomeSkeleton from "./loading";
import { Suspense } from "react";

// Home is statically regenerated on the EDGE with a short ISR window.
//
// SEC-02 / PERF-06 remediation: this route previously used
// `export const dynamic = "force-dynamic"`, which made Next.js emit
// `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` on
// the HTML response. That framework-emitted directive won over the
// `next.config.ts` `headers()` rule in production, so the intended
// `s-maxage`/`stale-while-revalidate` edge cache never took effect and every
// visitor paid a full serverless render + both upstream fetches.
//
// We now use `revalidate = 60` instead. Next.js then emits the correct shared
// cache directive itself (`s-maxage=60, stale-while-revalidate=...`) and the
// edge serves the rendered HTML to all but the first request per window, with
// background revalidation.
//
// The original reason for `force-dynamic` still holds and is preserved: a
// flaky upstream must never bake a bad page into a long-lived static entry.
// The window is deliberately SHORT (60s, not the 900s that was tried before):
// a transient upstream failure can survive for at most 60 seconds, after which
// the next request re-renders. The provider fetch layer additionally carries
// its own `revalidate: 900` + `tags: ["home"]` Data Cache and the `safe()`
// error containment, so a failed upstream hop renders the existing ErrorState
// for one 60s window and self-heals — it does not compound across requests.
//
// `dynamicParams` is irrelevant here (no dynamic segment on "/").
export const revalidate = 60;

/* ── Required vs optional home data ──────────────────────────────────────────
 * The home board is revealed as ONE unit: every section (Spotlight, Trending,
 * Latest Episodes, Discover, Top 10, and the Release calendar) appears together
 * once the data is ready. To make that true, the board waits for BOTH upstream
 * payloads before it renders any section — the schedule is no longer a separate
 * streaming island that pops in late while the rest is already on screen.
 *
 * Home is dynamic per-request (see the note above the export). Both fetches are
 * started CONCURRENTLY, then awaited together. If the schedule is slow, the
 * board waits for it (bounded — see the deadlines below); if it fails or times
 * out, the schedule section is simply omitted and the rest still renders. If
 * the required home payload fails, the page-level ErrorState is shown.
 */
export default function HomePage() {
  // Start BOTH upstream requests immediately, in parallel, at the top of the
  // request, so the board waits on the SLOWER of the two rather than a serial
  // waterfall. `withTimeout` converts each into a promise that always settles
  // (success, error, or explicit timeout) — the render can never hang.
  //
  // The schedule (a slow ~7s cold scrape) and the home payload now share a
  // single reveal: the board is not sent until both settle, so no section ever
  // arrives after the others. Both deadlines are generous enough to let a
  // slow-but-alive upstream finish, while still bounding the worst case.
  const homePromise = withTimeout(getHome(), 20_000, "home");
  const schedulePromise = withTimeout(getSchedule(), 12_000, "schedule");

  return (
    <div>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeBoard homePromise={homePromise} schedulePromise={schedulePromise} />
      </Suspense>
    </div>
  );
}

/**
 * The whole home board, rendered as one unit. Awaits BOTH payloads (home +
 * schedule) before rendering anything, so every section reveals together and a
 * late section never appears after the others.
 */
async function HomeBoard({
  homePromise,
  schedulePromise,
}: {
  homePromise: Promise<Result<HomeModel>>;
  schedulePromise: Promise<Result<ScheduleModel>>;
}) {
  // Await the two payloads together. The board is held until both settle, so
  // the sections below always arrive in a single render.
  const [res, scheduleRes] = await Promise.all([homePromise, schedulePromise]);

  if (!res.ok) {
    return (
      <div>
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
    /* The home hero is full-bleed and slides UNDER the fixed nav, so this
       route neutralises the shared `.page-shell` top inset (it would push
       the hero down by one page-y). Cancelling via the token — not a magic
       pixel value — keeps the home offset tied to the global rhythm. */
    <div style={{ marginTop: "calc(-1 * var(--space-page-y))" }}>
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

      {/* Section stack — ONE coordinated reveal. Every section renders
          directly (no per-section <Reveal>), so the board appears all at
          once: the whole tree is produced by a single server render that
          already awaited BOTH the home and schedule payloads, and the swap
          from the route skeleton to real content is a single crossfade.

          Sections are deliberately NOT wrapped individually in the
          viewport-reveal wrapper — that made below-the-fold sections fade in
          one at a time as the user scrolled, which read as "sections loading
          late". They now share one reveal clock with the rest of the board.

          The fine-grained cascade still lives INSIDE each rail (cards stagger
          in DOM order); nothing is held behind another section. */}
      <div className="section-stack relative z-10">
          <Trending
            items={home.trending}
            title="Trending"
            eyebrow="Hot right now"
            icon={<Flame className="size-3.5 fill-frost/25" />}
            ariaLabelPrefix="Trending"
            id="trending-heading"
            offsetClassName="-mt-48"
          />

          <ContinueWatching />

          {/* Card rails first — posters get room to breathe. Latest Episodes
              gets the cinematic 3D treatment (pointer-tilt floating posters). */}
          <LatestEpisodes items={home.latestEpisodes} />

          <DiscoverColumns
            topAiring={home.topAiring}
            mostPopular={home.mostPopular}
            mostFavorite={home.mostFavorite}
            newReleases={home.newReleases}
            completed={home.completed}
          />

          {/* Release calendar — rendered INLINE from the schedule payload the
              board already awaited above (no Suspense island), so it appears
              together with every other section instead of popping in late. A
              failed / timed-out schedule just omits this section. */}
          {scheduleRes.ok && <ReleaseSchedule data={scheduleRes.data} />}

          {/* Latest Completed (left) and the Top 10 list (right) are two separate
              glass containers side by side. They stretch to a shared height (the
              taller of the two) and the left poster grid distributes its rows to
              fill, so neither panel is left with dead space. Stacks on mobile. */}
          <div className="grid grid-cols-1 items-stretch gap-x-6 gap-y-[var(--space-section)] lg:grid-cols-[minmax(0,1fr)_clamp(300px,24vw,340px)]">
            <QuickLists completed={completed} />

            <Top10Tabs buckets={home.top10} />
          </div>

          {/* Top Upcoming — the last ranked section on the board. Unlike
              Trending (a drifting single-row marquee), it renders the SAME
              ranked cards in a multi-row GRID so the 15 upstream titles land
              as ~3 stacked rows: same cards, same design language, same
              ranking numbers, more of them visible at once. It shares the
              <Trending> shell purely for the section header (eyebrow, icon,
              accent bar) and adopts the grid layout instead of the marquee.
              No "See all" link: the upstream hianime.at has no dedicated
              /upcoming listing page. */}
          <Trending
            items={home.upcoming}
            title="Top Upcoming"
            eyebrow="Premieres"
            icon={<CalendarClock className="size-3.5 text-frost/70" />}
            ariaLabelPrefix="Upcoming"
            id="upcoming-heading"
            offsetClassName="mt-0"
            layout="grid"
          />
        </div>
    </div>
  );
}
