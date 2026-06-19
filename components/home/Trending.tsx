"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Flame } from "lucide-react";
import type { AnimeCardModel } from "@/lib/providers/types";
import { RailShell } from "@/components/common/RailShell";
import { SmartImage } from "@/components/ui/SmartImage";
import { EpBadges } from "@/components/anime/Badges";
import { cn } from "@/lib/utils/cn";

/**
 * Trending rail — landscape 16:9 cards (matching the Continue Watching
 * chrome) so the two rails share a visual language for "things in motion".
 *
 * Cards are intentionally smaller than Continue Watching so this rail
 * stays secondary: a poster + title + "EP X" line, with the chart-top
 * entry marked by a "Hot" pill. Episode timing is omitted here because
 * the trending payload doesn't carry per-episode duration (only the
 * user's watch progress does); we surface `episodeNumber` instead so the
 * meta line still tells you where in the run the show is.
 *
 * Rendered inside the shared `RailShell` for the masked snap-scroll
 * behaviour + chevron controls as every other rail on the home page.
 */
export function Trending({ items }: { items: AnimeCardModel[] }) {
  if (!items?.length) return null;

  // Order by provider rank so the chart-top item is always first; nulls go to
  // the tail so unranked fallbacks still render in the order we received them.
  const ordered = [...items].sort((a, b) => {
    const ar = typeof a.rank === "number" ? a.rank : Number.POSITIVE_INFINITY;
    const br = typeof b.rank === "number" ? b.rank : Number.POSITIVE_INFINITY;
    return ar - br;
  });

  return (
    <RailShell title="Trending" eyebrow="Hot right now">
      {ordered.map((s, i) => {
        const isHot = i === 0;
        const epNum = typeof s.episodeNumber === "number" ? s.episodeNumber : null;
        return (
          <Link
            key={s.id}
            href={`/anime/${s.id}`}
            style={{ ["--reveal-delay" as string]: `${Math.min(i, 9) * 60}ms` }}
            className="reveal group block w-[54vw] shrink-0 snap-start sm:w-[215px] md:w-[240px]"
          >
            <div
              className={cn(
                "relative aspect-video overflow-hidden rounded-md bg-surface-2 ring-1 transition-all duration-300 ease-out",
                isHot
                  ? "ring-frost shadow-[var(--shadow-frost)]"
                  : "ring-line group-hover:-translate-y-1 group-hover:ring-frost/40 group-hover:shadow-[var(--shadow-frost)]",
              )}
            >
              {s.poster ? (
                <SmartImage
                  src={s.poster}
                  alt={s.title}
                  fill
                  sizes="(max-width:640px) 50vw, (max-width:1024px) 22vw, 220px"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                />
              ) : (
                <div className="grid h-full place-items-center text-faint">No image</div>
              )}

              {/* Bottom gradient for legible meta over the poster */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base via-base/40 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              {isHot && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-frost/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-base shadow-[var(--shadow-neon)]">
                  <motion.span
                    aria-hidden
                    animate={{ rotate: [0, -10, 10, -6, 0], scale: [1, 1.18, 1] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-flex"
                  >
                    <Flame className="size-2.5 fill-current" />
                  </motion.span>
                  Hot
                </span>
              )}

              {/* Hover play affordance — same as Continue Watching keeps the
                  rail family feeling uniform when the user hovers. */}
              <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="grid size-9 scale-75 place-items-center rounded-full bg-frost/90 text-base shadow-[var(--shadow-neon)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-100">
                  <Play className="size-4 fill-current" />
                </span>
              </span>

              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <h3 className="line-clamp-1 text-sm font-semibold leading-tight tracking-tight text-snow drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)] transition-colors group-hover:text-frost">
                  {s.title}
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-muted">
                  {epNum != null && (
                    <span className="rounded-sm bg-base/70 px-1.5 py-0.5 text-snow">
                      EP {epNum}
                    </span>
                  )}
                  <EpBadges sub={s.episodes.sub} dub={s.episodes.dub} />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </RailShell>
  );
}