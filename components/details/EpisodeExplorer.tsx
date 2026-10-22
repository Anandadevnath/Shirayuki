"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Play, Search } from "lucide-react";
import type { EpisodeModel } from "@/lib/providers/types";
import { SectionHeader } from "@/components/common/SectionHeader";
import { cn } from "@/lib/utils/cn";

const RANGE = 100;

/**
 * Episode explorer — range selector (ranges of 100) + search + paged episode
 * cards. Only the CURRENT range is mounted; a 1000+ episode title never
 * renders more than 100 nodes at once. Per-episode thumbnails / durations /
 * sub-dub flags are deliberately absent because the provider does not return
 * them — the card shows the number, the (always "Episode N") title and a play
 * affordance only.
 */
export function EpisodeExplorer({
  animeId,
  episodes,
}: {
  animeId: string;
  episodes: EpisodeModel[];
}) {
  const [query, setQuery] = useState("");
  const [range, setRange] = useState(0);

  const ranges = useMemo(() => {
    const out: { label: string; items: EpisodeModel[] }[] = [];
    for (let i = 0; i < episodes.length; i += RANGE) {
      const slice = episodes.slice(i, i + RANGE);
      out.push({
        label: `${slice[0]?.number}–${slice[slice.length - 1]?.number}`,
        items: slice,
      });
    }
    return out.length ? out : [{ label: "—", items: [] }];
  }, [episodes]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ranges[range]?.items ?? [];
    // Search spans the whole list (not just the current range) and is capped
    // so a broad query can't mount thousands of nodes.
    return episodes
      .filter((e) => String(e.number).includes(q) || (e.title ?? "").toLowerCase().includes(q))
      .slice(0, RANGE);
  }, [ranges, range, query, episodes]);

  return (
    <section>
      <SectionHeader
        title={episodes.length ? `Episodes (${episodes.length})` : "Episodes"}
        eyebrow="Watch"
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {ranges.length > 1 && (
          <div className="no-scrollbar flex gap-1 overflow-x-auto">
            {ranges.map((r, i) => (
              <button
                key={r.label}
                onClick={() => setRange(i)}
                aria-pressed={i === range}
                className={cn(
                  "shrink-0 rounded-[var(--radius-btn)] px-3 py-1.5 font-accent text-xs transition-colors",
                  i === range
                    ? "bg-frost-soft text-frost"
                    : "border border-line text-muted hover:text-snow",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2 rounded-[var(--radius-btn)] border border-line bg-surface/60 px-3">
          <Search className="size-4 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find episode…"
            className="h-9 w-40 bg-transparent text-sm outline-none placeholder:text-faint"
            aria-label="Find episode"
          />
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((e) => (
          <li key={e.episodeId}>
            <Link
              href={`/watch/${animeId}/${encodeURIComponent(e.episodeId)}`}
              className="group flex items-center gap-2.5 rounded-[0.5rem] border border-line bg-surface/40 px-3 py-2.5 transition-colors hover:border-frost/40 hover:bg-surface-2"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-base/60 font-accent text-xs font-bold text-frost">
                {e.number}
              </span>
              <span className="text-meta line-clamp-1 flex-1 text-snow group-hover:text-frost">
                {e.title ?? `Episode ${e.number}`}
              </span>
              <Play className="size-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="text-desc rounded-md border border-line bg-surface/40 px-4 py-8 text-center text-muted">
          No episodes match “{query}”.
        </p>
      )}
    </section>
  );
}
