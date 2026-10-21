"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { listProgress, removeProgress, type WatchEntry } from "@/lib/progress/local";
import { formatTime } from "@/lib/utils/format";
import { revealDelay } from "@/lib/utils/reveal";
import { SectionHeader } from "@/components/common/SectionHeader";
import { SmartImage } from "@/components/ui/SmartImage";

// Cap the on-screen rail so a long backlog doesn't paint dozens of posters +
// progress bars at once. The full list still lives in localStorage; a "Show
// all" link below the rail reveals overflow if the user wants more.
const RAIL_LIMIT = 12;

/**
 * localStorage reads are synchronous, so hydrate the rail in a LAYOUT effect:
 * the rows land in the same pre-paint commit as the rest of the board, which
 * keeps this section from inserting itself mid-page AFTER the first paint and
 * shoving every section below it downward (the vertical jump that read as
 * "sections loading late"). SSR renders null — useLayoutEffect is avoided on
 * the server via the isomorphic alias so no hydration warning is emitted.
 */
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ContinueWatching() {
  const [items, setItems] = useState<WatchEntry[]>([]);
  const railRef = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    setItems(listProgress());
  }, []);

  if (!items.length) return null;

  function drop(animeId: string) {
    removeProgress(animeId);
    setItems(listProgress());
  }

  const scrollRail = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const visible = items.slice(0, RAIL_LIMIT);
  const overflow = items.length - visible.length;

  return (
    <section>
      <SectionHeader title="Continue Watching" eyebrow="Jump back in">
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => scrollRail(-1)}
            aria-label="Scroll Continue Watching left"
            className="grid size-9 place-items-center rounded-full glass text-muted transition-[color,border-color,transform] duration-200 hover:border-frost/40 hover:text-snow active:scale-90"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scrollRail(1)}
            aria-label="Scroll Continue Watching right"
            className="grid size-9 place-items-center rounded-full bg-frost text-base transition-transform duration-200 hover:scale-105 active:scale-90"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </SectionHeader>
      <div ref={railRef} className="no-scrollbar flex gap-3 overflow-x-auto px-0.5 py-1">
        {visible.map((e, i) => {
          const pct = Math.min(100, Math.round((e.seconds / e.duration) * 100));
          return (
            <div
              key={e.animeId}
              style={revealDelay(i * 70)}
              className="reveal group relative w-[62vw] shrink-0 sm:w-[280px]"
            >
              <Link
                href={`/watch/${e.animeId}/${encodeURIComponent(e.episodeId)}`}
                className="relative block overflow-hidden rounded-md ring-1 ring-line"
              >
                {/* Frost ring on hover/focus — opacity crossfade, no box-shadow repaint */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-10 rounded-md ring-1 ring-frost/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                />
                <div className="relative aspect-video bg-surface-2">
                  {e.poster && (
                    /* sizes mirrors the card's responsive width: on small
                       viewports the card spans 62vw (so 124vw capped at the
                       viewport), on ≥sm it's a fixed 280px. The sizes hint
                       picks the smallest variant that still covers the box
                       at 2x DPR. */
                    <SmartImage
                      src={e.poster}
                      alt=""
                      fill
                      sizes="(max-width:640px) 62vw, 280px"
                      className="object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-base/95 to-transparent" />
                  <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
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
                  <div className="absolute inset-x-0 bottom-0 h-1.5 bg-base/70">
                    <div className="h-full bg-frost" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </Link>
              <button
                onClick={() => drop(e.animeId)}
                aria-label={`Remove ${e.title} from continue watching`}
                // H14 fix: always visible on touch devices (no hover), hover-only on devices that support it. The [@media(hover:none)] query targets touch.
                className="absolute right-2 top-2 grid size-7 place-items-center rounded-full glass text-snow opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"
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