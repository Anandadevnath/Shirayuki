import { withTimeout, getSchedule } from "@/lib/api";
import type { ScheduleItem } from "@/lib/providers/types";
import { NextEpisodeCard } from "./NextEpisodeCard";

/**
 * Async island for the conditional "Next episode" card.
 *
 * The schedule is a heavy upstream scrape (cold cache ~20s), so it must never
 * block the detail page's first paint. The page renders this inside a
 * `<Suspense>` boundary with a skeleton fallback; the suspend resolves once the
 * (8s-capped) schedule settles, and the card streams in afterwards. When the
 * title is not airing, the section is not rendered at all.
 *
 * The match uses the ROUTE id (the slug-id, e.g. "one-piece-1") — it equals the
 * schedule item ids exactly, unlike the model's bare numeric id.
 */
export async function NextEpisodeSection({ animeId }: { animeId: string }) {
  const scheduleRes = await withTimeout(getSchedule(), 8_000, "schedule");
  if (!scheduleRes.ok) return null; // non-fatal: card simply hidden

  const schedule = scheduleRes.data;
  const match: ScheduleItem | null =
    schedule.week.flatMap((w) => w.items).find((i) => i.id === animeId) ??
    schedule.airing.find((i) => i.id === animeId) ??
    null;

  return <NextEpisodeCard item={match} />;
}
