import { CalendarClock } from "lucide-react";
import type { ScheduleItem } from "@/lib/providers/types";

/**
 * Compact "Next episode" strip for currently-airing titles. Rendered INSIDE
 * the Anime Info sidecar (a contextual state line, not a full-width banner),
 * so it reads as part of the title's info rather than a stranded section.
 *
 * The provider's schedule has two shapes:
 *  - `week[].items` carry a real `episodeNumber` (e.g. "Episode 164") + airTime;
 *  - `airing[]` carry only a `weekday` (no episode number / air time).
 *
 * We therefore only show what actually exists: the episode number when present,
 * else just "Airs {weekday}". The title's own status is intentionally NOT
 * echoed here — it is already shown as the Status row directly above, so
 * repeating it (the old behaviour) was noise.
 */
export function NextEpisodeCard({ item }: { item: ScheduleItem | null }) {
  if (!item) return null;

  const hasEpisode = item.episodeNumber != null;
  const day = item.weekday ?? null;
  const when = [day, item.airTime].filter(Boolean).join(" · ");

  // Nothing meaningful to say beyond a bare status → render nothing.
  if (!hasEpisode && !when) return null;

  return (
    <div className="mb-4 flex items-start gap-2 rounded-sm border border-frost/25 bg-frost-soft/50 px-3 py-2.5">
      <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-frost" />
      <div className="min-w-0 text-xs">
        <p className="text-eyebrow text-frost">Next episode</p>
        <p className="mt-0.5 text-snow">
          {hasEpisode ? (
            <>
              <span className="font-semibold">{item.episodeNumber}</span>
              {when && <span className="font-accent text-muted"> · {when}</span>}
            </>
          ) : (
            <span className="font-accent text-muted">Airs {day}</span>
          )}
        </p>
      </div>
    </div>
  );
}
