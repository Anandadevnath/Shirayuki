"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, X } from "lucide-react";
import { listProgress, removeProgress, type WatchEntry } from "@/lib/progress/local";
import { formatTime } from "@/lib/utils/format";
import { SectionHeader } from "@/components/common/SectionHeader";
import { SmartImage } from "@/components/ui/SmartImage";

// Cap the on-screen rail so a long backlog doesn't paint dozens of posters +
// progress bars at once. The full list still lives in localStorage; a "Show
// all" link below the rail reveals overflow if the user wants more.
const RAIL_LIMIT = 12;

export function ContinueWatching() {
  const [items, setItems] = useState<WatchEntry[]>([]);

  useEffect(() => {
    setItems(listProgress());
  }, []);

  if (!items.length) return null;

  function drop(animeId: string) {
    removeProgress(animeId);
    setItems(listProgress());
  }

  const visible = items.slice(0, RAIL_LIMIT);
  const overflow = items.length - visible.length;

  return (
    <section>
      <SectionHeader title="Continue Watching" eyebrow="Jump back in" />
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-0.5 py-1">
        {visible.map((e, i) => {
          const pct = Math.min(100, Math.round((e.seconds / e.duration) * 100));
          return (
            <div
              key={e.animeId}
              style={{ ["--reveal-delay" as string]: `${i * 70}ms` }}
              className="reveal group relative w-[62vw] shrink-0 sm:w-[280px]"
            >
              <Link
                href={`/watch/${e.animeId}/${encodeURIComponent(e.episodeId)}`}
                className="block overflow-hidden rounded-md ring-1 ring-line transition-all hover:ring-frost/40"
              >
                <div className="relative aspect-video bg-surface-2">
                  {e.poster && (
                    <SmartImage src={e.poster} alt="" fill sizes="320px" className="object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-base/95 to-transparent" />
                  <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="grid size-11 place-items-center rounded-full glass text-frost">
                      <Play className="size-5 translate-x-0.5 fill-current" />
                    </span>
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="line-clamp-1 text-sm font-semibold text-snow">{e.title}</p>
                    <p className="text-xs text-muted">
                      EP {e.episodeNumber} · {formatTime(e.seconds)} / {formatTime(e.duration)}
                    </p>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-base/60">
                    <div className="h-full bg-frost" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </Link>
              <button
                onClick={() => drop(e.animeId)}
                aria-label={`Remove ${e.title} from continue watching`}
                className="absolute right-2 top-2 grid size-7 place-items-center rounded-full glass text-snow opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
      {overflow > 0 && (
        <div className="mt-2 text-right">
          <Link
            href="/watchlist"
            className="text-xs font-medium text-muted transition-colors hover:text-frost"
          >
            Show all ({items.length})
          </Link>
        </div>
      )}
    </section>
  );
}
