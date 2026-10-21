import Link from "next/link";
import { Film, Play } from "lucide-react";
import type { SeasonModel } from "@/lib/providers/types";
import { RailShell } from "@/components/common/RailShell";
import { SmartImage } from "@/components/ui/SmartImage";
import { EpBadges } from "@/components/anime/Badges";
import { revealDelay } from "@/lib/utils/reveal";
import { cn } from "@/lib/utils/cn";

/**
 * Franchise timeline — the provider's ordered seasons + interleaved movies.
 * Rendered as a chronological "watch order" rail: each entry is numbered by
 * its position in the sorted order, movies carry a movie marker, and the
 * current title is flagged. Semantics beyond `isMovie` + `type` + `order`
 * (prequel/sequel/special) are NOT inferred — the API exposes no relation
 * labels, so none are invented.
 *
 * Hidden by the page when the franchise has fewer than two entries (a lone
 * "season" is not a timeline).
 */
export function FranchiseTimeline({
  items,
  currentId,
}: {
  items: SeasonModel[];
  currentId?: string;
}) {
  if (!items?.length) return null;

  const ordered = [...items].sort((a, b) => {
    const ao = a.order ?? (a.season ?? 0) * 10 + (a.part ?? 0);
    const bo = b.order ?? (b.season ?? 0) * 10 + (b.part ?? 0);
    return ao - bo;
  });

  return (
    <RailShell title="Franchise" eyebrow="Watch order">
      {ordered.map((s, i) => {
        const isCurrent = s.isCurrent || s.id === currentId;
        const label =
          s.season != null
            ? `S${s.season}${s.part != null && s.part > 1 ? `·${s.part}` : ""}`
            : s.part != null
              ? `Part ${s.part}`
              : String(i + 1);

        return (
          <Link
            key={s.id}
            href={`/anime/${s.id}`}
            style={revealDelay(Math.min(i, 9) * 60)}
            className="reveal group block w-44 shrink-0 snap-start sm:w-52 md:w-56"
          >
            <div className="relative transform-gpu transition-transform duration-300 ease-out group-hover:-translate-y-1">
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-[0.5rem] shadow-[var(--shadow-frost)] transition-opacity duration-300",
                  isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
              />
              <div
                className={cn(
                  "relative aspect-[3/2] overflow-hidden rounded-[0.5rem] bg-surface-2 ring-1",
                  isCurrent ? "ring-frost/60" : "ring-line",
                )}
              >
                {/* Chronological number chip — the timeline marker */}
                <span className="absolute left-2 top-2 z-10 grid size-6 place-items-center rounded-md bg-base/80 font-accent text-[11px] font-bold text-frost backdrop-blur">
                  {i + 1}
                </span>

                {s.isMovie && (
                  <span className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-base/80 px-1.5 py-0.5 text-[10px] font-bold text-snow backdrop-blur">
                    <Film className="size-2.5" /> Movie
                  </span>
                )}

                {!s.isMovie && s.year && (
                  <span className="absolute right-2 top-2 z-10 rounded-md bg-base/80 px-1.5 py-0.5 text-[10px] font-bold text-snow backdrop-blur">
                    {s.year}
                  </span>
                )}

                {s.poster ? (
                  <SmartImage
                    src={s.poster}
                    alt={s.title}
                    fill
                    sizes="(max-width:640px) 44vw, (max-width:1024px) 24vw, 224px"
                    className="object-cover brightness-[0.9]"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-faint">No image</div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base via-base/40 to-transparent" />

                {isCurrent && (
                  <span className="absolute left-2 bottom-2 z-10 flex items-center gap-1 rounded-md bg-frost/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider on-frost">
                    <Play className="size-2.5 fill-current" /> Now viewing
                  </span>
                )}

                <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="grid size-10 scale-75 place-items-center rounded-full bg-base/70 text-frost ring-1 ring-frost/50 backdrop-blur-sm transition-transform duration-300 group-hover:scale-100">
                    <Play className="size-4 fill-current" />
                  </span>
                </span>

                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-sm bg-base/70 px-1.5 py-0.5 font-accent text-[10px] font-bold text-frost">
                      {label}
                    </span>
                    <EpBadges sub={s.episodes.sub} dub={s.episodes.dub} />
                  </div>
                  <span className="line-clamp-2 text-left text-[11px] font-semibold leading-tight text-snow [text-shadow:0_1px_6px_rgba(0,0,0,0.9)] transition-colors group-hover:text-frost">
                    {s.title}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </RailShell>
  );
}
