import { withTimeout, getSchedule } from "@/lib/api";
import { airingNow, recentlyAired, scheduleItemToCard } from "@/lib/utils/detail";
import { Rail } from "@/components/anime/Rail";

/**
 * Async island for the two schedule-derived discovery rails (Trending +
 * Ongoing). Rendered by the page ONLY for airing titles (the same gate as the
 * "Next episode" strip), inside a `<Suspense>` boundary, so the heavy schedule
 * scrape never blocks first paint.
 *
 * `getSchedule()` is the facade's React `cache()`-wrapped getter, so this call
 * and `NextEpisodeSection`'s call dedupe to a SINGLE upstream fetch within the
 * request — the page still costs one schedule scrape, not two.
 *
 * Both rails reuse the shared `Rail` → `AnimeCard` language (one card across
 * the site). The current title is excluded from both, and the rails are
 * omitted entirely when their slice is empty, so no empty rails ever render.
 *
 * "Trending" is intentionally labelled "Airing now": the schedule exposes no
 * popularity score, so a "Trending" claim would be dishonest — these are the
 * titles airing in the soonest slots.
 */
export async function DiscoverySections({ animeId }: { animeId: string }) {
  const scheduleRes = await withTimeout(getSchedule(), 8_000, "schedule");
  if (!scheduleRes.ok) return null; // non-fatal: rails simply hidden

  const schedule = scheduleRes.data;
  const ongoing = airingNow(schedule, animeId, 20);
  const trending = recentlyAired(schedule, animeId, 14);

  if (!ongoing.length) return null;

  return (
    <>
      <Rail
        title="Trending"
        eyebrow="Airing now"
        items={trending.map(scheduleItemToCard)}
      />
      {/* Ongoing is the broader airing set; only render it when it adds items
          beyond Trending so the two rails never duplicate each other. */}
      {ongoing.length > trending.length && (
        <Rail
          title="Ongoing"
          eyebrow="Currently airing"
          items={ongoing.map(scheduleItemToCard)}
        />
      )}
    </>
  );
}
