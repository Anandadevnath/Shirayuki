"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, X } from "lucide-react";
import { listProgress, removeProgress, type WatchEntry } from "@/lib/progress/local";
import { formatTime } from "@/lib/utils/format";
import { SmartImage } from "@/components/ui/SmartImage";

/**
 * Client island for the /watchlist page. Renders every in-progress title
 * from localStorage, with a progress bar and a remove button. Same UX as
 * the home-page Continue Watching rail, just un-paginated.
 */
export function WatchlistClient() {
  const [items, setItems] = useState<WatchEntry[] | null>(null);

  useEffect(() => {
    setItems(listProgress());
  }, []);

  if (items === null) {
    // Skeleton matching the empty grid footprint so the page doesn't
    // jump when the list hydrates from localStorage.
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-video rounded-md bg-surface-2 shimmer" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="grid place-items-center gap-3 rounded-md border border-line bg-surface/40 px-6 py-16 text-center">
        <h3 className="text-lg font-semibold">Fresh snow</h3>
        <p className="max-w-sm text-sm text-muted">
          Nothing here yet. Start watching an episode and it will show up here so you can pick up where you left off.
        </p>
        <Link
          href="/"
          className="mt-2 flex items-center gap-2 rounded-sm bg-frost px-4 py-2 text-sm font-semibold text-base shadow-[var(--shadow-neon)] transition-transform hover:scale-[1.04]"
        >
          <Play className="size-4 fill-current" /> Browse anime
        </Link>
      </div>
    );
  }

  function drop(animeId: string) {
    removeProgress(animeId);
    setItems(listProgress());
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((e) => {
        const pct = Math.min(100, Math.round((e.seconds / e.duration) * 100));
        return (
          <div
            key={e.animeId}
            className="group relative overflow-hidden rounded-md ring-1 ring-line"
          >
            <Link
              href={`/watch/${e.animeId}/${encodeURIComponent(e.episodeId)}`}
              className="relative block"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 z-10 rounded-md ring-1 ring-frost/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="relative aspect-video bg-surface-2">
                {e.poster && (
                  <SmartImage
                    src={e.poster}
                    alt=""
                    fill
                    sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 320px"
                    className="object-cover"
                  />
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
              aria-label={`Remove ${e.title} from watchlist`}
              className="absolute right-2 top-2 grid size-7 place-items-center rounded-full glass text-snow opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
