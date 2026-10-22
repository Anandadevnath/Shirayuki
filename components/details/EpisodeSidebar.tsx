"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, LayoutList, Mic } from "lucide-react";
import type { EpisodeModel } from "@/lib/providers/types";
import { cn } from "@/lib/utils/cn";
import { usePrefs } from "@/lib/stores/prefs";

/** Episodes are windowed in ranges of 100 (same convention as
 *  `EpisodeExplorer` / `EpisodeList`) so a 1000+ title never mounts more than
 *  one range at a time. */
const RANGE = 100;

/**
 * Watch-page episode sidebar. Extracted from the server page so the control
 * row (Find / CC / SUB-DUB / range / layout) can hold client state and read the
 * shared prefs store.
 *
 * Everything that used to live inline in `app/watch/[id]/[ep]/page.tsx` is
 * preserved: the episode order, the `href`s, the `aria-current` on the active
 * row, and the filler flag. The controls only layer on top of that data — they
 * filter it by number/title, page it by range, switch the presentation, or route
 * through the EXISTING mechanisms:
 *   · CC    → `usePrefs` captions (the same store/field the player's `C` key
 *             drives), so the sidebar and the player never disagree.
 *   · mic   → the existing `?cat=sub|dub` navigation (rendered as a plain
 *             `<Link>`), so SUB/DUB keeps using the route contract — no new
 *             fetch or server logic.
 *   · range → local-only windowing state started at the range containing the
 *             current episode.
 *   · layout→ local-only presentational toggle (never persisted).
 */
export function EpisodeSidebar({
  animeId,
  episodes,
  currentEpisodeId,
  category,
  subHref,
  dubHref,
}: {
  animeId: string;
  episodes: EpisodeModel[];
  currentEpisodeId: string;
  category: "sub" | "dub";
  /** Pre-computed hrefs from the server page (built with its `swHref`), so no
   *  URL logic moves into the client. Null when the title has no pool for that
   *  category, which hides the mic toggle. */
  subHref: string | null;
  dubHref: string | null;
}) {
  const ranges = useMemo(() => {
    const out: { label: string; items: EpisodeModel[] }[] = [];
    for (let i = 0; i < episodes.length; i += RANGE) {
      const slice = episodes.slice(i, i + RANGE);
      const lo = slice[0]?.number ?? i + 1;
      const hi = slice[slice.length - 1]?.number ?? lo;
      out.push({ label: `${lo}–${hi}`, items: slice });
    }
    return out.length ? out : [{ label: "—", items: [] }];
  }, [episodes]);

  // Start on the range that contains the episode being watched.
  const [range, setRange] = useState(() => {
    const idx = episodes.findIndex((e) => e.episodeId === currentEpisodeId);
    return idx >= 0 ? Math.floor(idx / RANGE) : 0;
  });
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [rangeOpen, setRangeOpen] = useState(false);
  const captions = usePrefs((s) => s.captions);
  const setPrefs = usePrefs((s) => s.set);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ranges[range]?.items ?? [];
    // Search spans the whole list, not just the current range, but stays
    // capped at one range's worth of nodes.
    return episodes
      .filter(
        (e) =>
          String(e.number).includes(q) ||
          (e.title ?? "").toLowerCase().includes(q),
      )
      .slice(0, RANGE);
  }, [ranges, range, query, episodes]);

  const canSwitch = subHref != null && dubHref != null;
  const otherHref = category === "dub" ? subHref : dubHref;
  const grid = layout === "grid";
  const searching = query.trim().length > 0;
  const hasPrev = range > 0;
  const hasNext = range < ranges.length - 1;

  return (
    <aside className="laser-frame laser-live glass watch-glass flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md">
      {/* ── Header: title + compact control row ─────────────────── */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-surface/40 px-4 py-3 backdrop-blur-sm">
        <h2 className="text-title flex-1 text-snow">Episodes</h2>

        <div className="flex items-center gap-1.5">
          {/* Find */}
          <label className="flex items-center gap-1.5 rounded-[var(--radius-btn)] border border-white/10 bg-base/40 px-2.5 transition-colors focus-within:border-frost/40 hover:border-white/20">
            <span aria-hidden className="text-xs font-semibold text-faint">#</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find"
              className="h-7 w-16 bg-transparent text-xs text-snow outline-none placeholder:text-faint sm:w-20"
              aria-label="Find episode"
            />
          </label>

          {/* CC — captions, synced with the player via the shared prefs store */}
          <button
            type="button"
            onClick={() => setPrefs({ captions: !captions })}
            aria-pressed={captions}
            aria-label={captions ? "Hide captions" : "Show captions"}
            className={cn(
              "font-accent text-xs font-semibold transition-colors",
              captions ? "text-warning" : "text-muted hover:text-snow",
            )}
          >
            CC
          </button>

          {/* mic — SUB/DUB via the existing ?cat= navigation */}
          {canSwitch ? (
            <Link
              href={otherHref!}
              aria-pressed={category === "dub"}
              aria-label={category === "dub" ? "Switch to subtitles" : "Switch to dub"}
              className={cn(
                "grid size-7 place-items-center rounded-[var(--radius-btn)] transition-colors",
                category === "dub"
                  ? "text-success"
                  : "text-muted hover:text-snow",
              )}
            >
              <Mic className="size-4" />
            </Link>
          ) : null}

          {/* layout — local presentation toggle */}
          <button
            type="button"
            onClick={() => setLayout((l) => (l === "list" ? "grid" : "list"))}
            aria-pressed={grid}
            aria-label={grid ? "Show as list" : "Show as grid"}
            className="grid size-7 place-items-center rounded-[var(--radius-btn)] border border-frost/40 text-frost transition-colors hover:border-frost/70"
          >
            <LayoutList className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Range selector ───────────────────────────────────────── */}
      {!searching && ranges.length > 0 && (
        <div className="shrink-0 px-2.5 pb-2.5 pt-2.5">
          <div className="flex items-center gap-1 rounded-[var(--radius-btn)] border border-white/10 bg-base/40">
            <button
              type="button"
              onClick={() => setRange((r) => Math.max(0, r - 1))}
              disabled={!hasPrev}
              aria-label="Previous range"
              className="grid size-8 shrink-0 place-items-center rounded-l-[var(--radius-btn)] text-muted transition-colors hover:text-snow disabled:opacity-30 disabled:hover:text-muted"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setRangeOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={rangeOpen}
                aria-label="Select episode range"
                className="text-meta flex h-8 w-full items-center justify-center gap-1 font-accent text-muted transition-colors hover:text-snow"
              >
                {ranges[range]?.label}
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform",
                    rangeOpen && "rotate-180",
                  )}
                />
              </button>
              {rangeOpen && (
                <>
                  {/* Click-away layer — closes the menu without stealing focus
                      from anything behind it. */}
                  <span
                    aria-hidden
                    onClick={() => setRangeOpen(false)}
                    className="fixed inset-0 z-10"
                  />
                  <ul
                    role="listbox"
                    className="no-scrollbar absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-[var(--radius-btn)] border border-white/10 bg-base/90 p-1 shadow-[var(--shadow-frost)] backdrop-blur-md"
                  >
                    {ranges.map((r, i) => (
                      <li key={r.label}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={i === range}
                          onClick={() => {
                            setRange(i);
                            setRangeOpen(false);
                          }}
                          className={cn(
                            "text-meta grid h-8 w-full place-items-center rounded-sm font-accent transition-colors",
                            i === range
                              ? "bg-frost-soft text-frost"
                              : "text-muted hover:bg-surface-2/70 hover:text-snow",
                          )}
                        >
                          {r.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setRange((r) => Math.min(ranges.length - 1, r + 1))}
              disabled={!hasNext}
              aria-label="Next range"
              className="grid size-8 shrink-0 place-items-center rounded-r-[var(--radius-btn)] text-muted transition-colors hover:text-snow disabled:opacity-30 disabled:hover:text-muted"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Scrollable episode list ──────────────────────────────── */}
      <div
        className={cn(
          "no-scrollbar scroll-frost min-h-0 max-h-[640px] flex-1 overflow-y-auto p-2.5 sm:max-h-[640px] max-sm:max-h-[420px]",
          grid ? "grid grid-cols-6 content-start gap-1" : "flex flex-col gap-0.5",
        )}
      >
        {grid
          ? visible.map((e) => (
              <Link
                key={e.episodeId}
                href={`/watch/${animeId}/${encodeURIComponent(e.episodeId)}`}
                aria-current={e.episodeId === currentEpisodeId ? "true" : undefined}
                aria-label={e.title ?? `Episode ${e.number}`}
                className={cn(
                  "hover-snap text-meta grid h-9 w-full place-items-center rounded-[var(--radius-btn)] border font-accent transition-colors",
                  e.episodeId === currentEpisodeId
                    ? "border-frost/50 bg-frost-soft font-semibold text-frost"
                    : "border-transparent text-muted hover:border-white/10 hover:bg-surface-2/70 hover:text-snow",
                )}
              >
                {e.number}
              </Link>
            ))
          : visible.map((e) => (
              <Link
                key={e.episodeId}
                href={`/watch/${animeId}/${encodeURIComponent(e.episodeId)}`}
                aria-current={e.episodeId === currentEpisodeId ? "true" : undefined}
                className={cn(
                  "hover-snap text-meta flex items-center gap-2.5 rounded-[var(--radius-btn)] border px-3 py-2 transition-colors",
                  e.episodeId === currentEpisodeId
                    ? "border-frost/50 bg-frost-soft font-semibold text-frost"
                    : "border-transparent text-muted hover:border-white/10 hover:bg-surface-2/70 hover:text-snow",
                )}
              >
                <span className="font-accent tabular-nums">{e.number}</span>
                <span className="line-clamp-1 flex-1">
                  {e.title ?? `Episode ${e.number}`}
                </span>
                {e.isFiller && (
                  <span className="shrink-0 rounded-sm bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning">
                    F
                  </span>
                )}
              </Link>
            ))}

        {visible.length === 0 && (
          <p className="text-desc col-span-full rounded-md border border-white/10 bg-base/40 px-4 py-8 text-center text-muted">
            No episodes match “{query}”.
          </p>
        )}
      </div>
    </aside>
  );
}
