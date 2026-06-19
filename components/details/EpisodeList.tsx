"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { EpisodeModel } from "@/lib/providers/types";
import { cn } from "@/lib/utils/cn";

const PAGE = 100;

export function EpisodeList({
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
    for (let i = 0; i < episodes.length; i += PAGE) {
      const slice = episodes.slice(i, i + PAGE);
      out.push({
        label: `${slice[0]?.number}–${slice[slice.length - 1]?.number}`,
        items: slice,
      });
    }
    return out.length ? out : [{ label: "—", items: [] }];
  }, [episodes]);

  const visible = useMemo(() => {
    const base = ranges[range]?.items ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return episodes.filter(
      (e) =>
        String(e.number).includes(q) ||
        (e.title ?? "").toLowerCase().includes(q),
    );
  }, [ranges, range, query, episodes]);

  if (!episodes.length) {
    return (
      <p className="rounded-md border border-line bg-surface/40 px-4 py-8 text-center text-sm text-muted">
        No episodes are available yet for this title.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {ranges.length > 1 && (
          <div className="no-scrollbar flex gap-1 overflow-x-auto">
            {ranges.map((r, i) => (
              <button
                key={r.label}
                onClick={() => setRange(i)}
                className={cn(
                  "shrink-0 rounded-sm px-3 py-1.5 font-mono text-xs transition-colors",
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
        <div className="ml-auto flex items-center gap-2 rounded-sm border border-line bg-surface/60 px-3">
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

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {visible.map((e) => (
          <li key={e.episodeId}>
            <Link
              href={`/watch/${animeId}/${encodeURIComponent(e.episodeId)}`}
              className="group flex items-center gap-3 rounded-md border border-line bg-surface/40 px-3 py-2.5 transition-colors hover:border-frost/40 hover:bg-surface-2"
            >
              <span className="line-clamp-1 flex-1 text-sm text-snow group-hover:text-frost">
                {e.title ?? `Episode ${e.number}`}
              </span>
              {e.isFiller && (
                <span className="shrink-0 rounded-sm bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                  FILLER
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
