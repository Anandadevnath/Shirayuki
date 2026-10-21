import Link from "next/link";
import { Images } from "lucide-react";
import type { ArtItem } from "@/lib/providers/types";
import { RailShell } from "@/components/common/RailShell";
import { SmartImage } from "@/components/ui/SmartImage";
import { revealDelay } from "@/lib/utils/reveal";
import { cn } from "@/lib/utils/cn";

/**
 * Franchise art gallery — every poster in the franchise (detail poster +
 * sibling seasons/movies), deduped server-side. Shares the visual rhythm of
 * the FranchiseTimeline (frost ring on the current entry) but drops the
 * numbers, so the strip reads as the pure art companion to the chronological
 * timeline. The rail is a poster-strip, not a list of poster links.
 */
export function ArtGallery({
  items,
  currentId,
  title = "Art",
}: {
  items: ArtItem[];
  currentId?: string;
  title?: string;
}) {
  if (!items?.length) return null;

  const isCurrent = (a: ArtItem) =>
    a.id === currentId || (a.slug != null && Boolean(currentId?.startsWith(a.slug)));

  return (
    <RailShell title={title} eyebrow="Visuals">
      {items.map((a, i) => (
        <Link
          key={`${a.id}-${i}`}
          href={`/anime/${a.id}`}
          style={revealDelay(Math.min(i, 9) * 60)}
          className="reveal group block w-36 shrink-0 snap-start sm:w-40 md:w-44"
        >
          <div
            className={cn(
              "relative aspect-[3/4] transform-gpu overflow-hidden rounded-xl bg-surface-2 ring-1 transition-transform duration-300 ease-out group-hover:-translate-y-1",
              isCurrent(a) ? "ring-frost" : "ring-line",
            )}
          >
            {a.poster ? (
              <SmartImage
                src={a.poster}
                alt={a.title ?? "Artwork"}
                fill
                sizes="(max-width:640px) 36vw, (max-width:1024px) 18vw, 176px"
                className="object-cover brightness-[0.9]"
              />
            ) : (
              <div className="grid h-full place-items-center text-faint">
                <Images className="size-6" />
              </div>
            )}

            {/* Bottom scrim seats the title without drowning the art */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base via-base/10 to-transparent" />

            {/* Current marker */}
            {isCurrent(a) && (
              <span className="absolute left-1.5 top-1.5 rounded-sm bg-frost/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-base">
                Current
              </span>
            )}

            <span className="pointer-events-none absolute inset-x-1.5 bottom-1.5 line-clamp-1 text-left text-[11px] font-semibold text-snow [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
              {a.title}
            </span>
          </div>
        </Link>
      ))}
    </RailShell>
  );
}
